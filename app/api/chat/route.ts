import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  toUIMessageStream,
  type UIMessage,
} from "ai"
import { z } from "zod"
import { buildSystemPrompt, CHAT_LIMITS } from "@/lib/chat/assistant-config"

export const maxDuration = 30

// Where follow-up requests are delivered (same as the site's lead workflow).
const NOTIFY_TO = "info@hubtireshop.com"
const NOTIFY_FROM = "Hub Tire Shop Assistant <noreply@hubtireshop.com>"

// ---------------------------------------------------------------------------
// Best-effort in-memory rate limiting + daily usage caps.
// Note: resets on cold start; for durable limits across instances, back this
// with Upstash Redis. This protects against casual abuse and runaway cost.
// ---------------------------------------------------------------------------
type IpRecord = { minuteStart: number; minuteCount: number; dayStart: number; dayCount: number }
const ipBuckets = new Map<string, IpRecord>()
const globalDay = { dayStart: 0, count: 0 }

const MINUTE = 60_000
const DAY = 86_400_000

function checkRateLimit(ip: string): { ok: boolean; reason?: string } {
  const now = Date.now()

  // Global daily cap.
  if (now - globalDay.dayStart > DAY) {
    globalDay.dayStart = now
    globalDay.count = 0
  }
  if (globalDay.count >= CHAT_LIMITS.maxMessagesPerDayGlobal) {
    return { ok: false, reason: "global-daily" }
  }

  const rec = ipBuckets.get(ip) ?? { minuteStart: now, minuteCount: 0, dayStart: now, dayCount: 0 }
  if (now - rec.minuteStart > MINUTE) {
    rec.minuteStart = now
    rec.minuteCount = 0
  }
  if (now - rec.dayStart > DAY) {
    rec.dayStart = now
    rec.dayCount = 0
  }

  if (rec.minuteCount >= CHAT_LIMITS.maxMessagesPerMinute) return { ok: false, reason: "per-minute" }
  if (rec.dayCount >= CHAT_LIMITS.maxMessagesPerDayPerIp) return { ok: false, reason: "per-day" }

  rec.minuteCount += 1
  rec.dayCount += 1
  globalDay.count += 1
  ipBuckets.set(ip, rec)
  return { ok: true }
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

// Send the concise conversation summary to the shop via Resend.
async function sendShopEmail(input: {
  name: string
  phone: string
  vehicle?: string
  concern?: string
  preferredContact?: string
  summary: string
  language?: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[v0] RESEND_API_KEY is not set — cannot send chat follow-up email.")
    return false
  }

  const rows = [
    ["Name", input.name],
    ["Phone", input.phone],
    ["Vehicle", input.vehicle],
    ["Concern", input.concern],
    ["Preferred contact", input.preferredContact],
    ["Language", input.language === "es" ? "Spanish" : "English"],
  ]
    .filter(([, v]) => String(v ?? "").trim())
    .map(
      ([label, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#111;white-space:nowrap;vertical-align:top;">${esc(label)}</td><td style="padding:6px 12px;color:#333;">${esc(v)}</td></tr>`,
    )
    .join("")

  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:#1a1a1a;padding:16px 20px;border-radius:8px 8px 0 0;">
      <span style="color:#fff;font-size:18px;font-weight:700;">Hub Tire Shop</span>
      <span style="color:#f97316;font-size:18px;font-weight:700;"> — Chat Follow-up Request</span>
    </div>
    <div style="border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;padding:16px 8px;">
      <p style="margin:0 0 8px 12px;color:#555;font-size:13px;">This request came from the website chat assistant. It is a <strong>request for follow-up</strong>, not a confirmed appointment. The customer consented to service-related contact.</p>
      <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">${rows}</table>
      <div style="padding:8px 12px;">
        <p style="font-weight:600;color:#111;margin:12px 0 4px;">Conversation summary</p>
        <p style="color:#333;white-space:pre-wrap;">${esc(input.summary)}</p>
      </div>
    </div>
  </div>`

  const text = [
    "Hub Tire Shop — Chat Follow-up Request",
    "(Request for follow-up — NOT a confirmed appointment. Customer consented to service-related contact.)",
    "",
    `Name: ${input.name}`,
    `Phone: ${input.phone}`,
    input.vehicle && `Vehicle: ${input.vehicle}`,
    input.concern && `Concern: ${input.concern}`,
    input.preferredContact && `Preferred contact: ${input.preferredContact}`,
    "",
    "Summary:",
    input.summary,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [NOTIFY_TO],
        reply_to: NOTIFY_TO,
        subject: `New Chat Follow-up — ${input.name}`,
        html,
        text,
      }),
    })
    if (!res.ok) {
      console.error("[v0] Resend chat email failed:", res.status, await res.text().catch(() => ""))
      return false
    }
    return true
  } catch (err) {
    console.error("[v0] Resend chat email error:", err)
    return false
  }
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limit = checkRateLimit(ip)
  if (!limit.ok) {
    return new Response(
      JSON.stringify({
        error:
          "You've reached the chat limit for now. Please call us at (305) 615-6286 or text (701) 732-3935 and a team member will help you right away.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    )
  }

  let messages: UIMessage[] = []
  let language: string | undefined
  try {
    const body = await req.json()
    messages = Array.isArray(body?.messages) ? body.messages : []
    language = typeof body?.language === "string" ? body.language : undefined
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (messages.length > CHAT_LIMITS.maxRequestMessages) {
    messages = messages.slice(-CHAT_LIMITS.maxRequestMessages)
  }

  const result = streamText({
    model: "google/gemini-2.5-flash",
    system: buildSystemPrompt(language),
    messages: await convertToModelMessages(messages),
    temperature: 0.4,
    stopWhen: stepCountIs(5),
    tools: {
      sendServiceRequest: tool({
        description:
          "Send the visitor's follow-up request to the shop by email. Only call this after the visitor has agreed to be contacted and you have at least their name and phone number, and after you have shown the required phone consent notice.",
        inputSchema: z.object({
          name: z.string().describe("Customer's name"),
          phone: z.string().describe("Customer's phone number"),
          vehicle: z.string().optional().describe("Year / make / model if provided"),
          concern: z.string().optional().describe("Short description of the issue or request"),
          preferredContact: z.string().optional().describe("Call or text, if stated"),
          summary: z.string().describe("A concise 1-3 sentence summary of the conversation and what the customer needs"),
        }),
        execute: async ({ name, phone, vehicle, concern, preferredContact, summary }) => {
          if (!name?.trim() || !phone?.trim()) {
            return { ok: false, message: "Missing name or phone number." }
          }
          const sent = await sendShopEmail({
            name: name.trim(),
            phone: phone.trim(),
            vehicle,
            concern,
            preferredContact,
            summary,
            language,
          })
          return sent
            ? { ok: true, message: "The shop received the request and will follow up. This is not a confirmed appointment." }
            : {
                ok: false,
                message:
                  "Could not send the request automatically. Please call (305) 615-6286 or text (701) 732-3935 to reach the shop directly.",
              }
        },
      }),
    },
    onError({ error }) {
      console.error("[v0] chat streamText error:", error)
    },
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
