"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion"
import { siteConfig } from "@/lib/site-config"

type Lang = "en" | "es"

const t = {
  en: {
    open: "Chat with us",
    title: "Service Assistant",
    subtitle: "Ask about services, tires, hours & more",
    placeholder: "Type your message…",
    send: "Send",
    greeting:
      "Hi! I'm the Hub Tire Shop assistant. I can help with services, tires, hours, location, or getting a callback. How can I help?",
    call: "Call",
    text: "Text",
    directions: "Directions",
    request: "Request Service",
    close: "Close chat",
    error:
      "Sorry, something went wrong. Please call us at (305) 615-6286 or text (701) 732-3935 and we'll help right away.",
    disclaimer: "AI assistant — not a substitute for a technician. Responses may be inaccurate.",
    thinking: "Thinking…",
    sending: "Sending your request…",
    sent: "Your request was sent to the shop.",
    langLabel: "ES",
  },
  es: {
    open: "Chatea con nosotros",
    title: "Asistente de Servicio",
    subtitle: "Pregunta por servicios, llantas, horario y más",
    placeholder: "Escribe tu mensaje…",
    send: "Enviar",
    greeting:
      "¡Hola! Soy el asistente de Hub Tire Shop. Puedo ayudarte con servicios, llantas, horario, ubicación o coordinar que te llamen. ¿En qué te ayudo?",
    call: "Llamar",
    text: "Texto",
    directions: "Cómo llegar",
    request: "Solicitar Servicio",
    close: "Cerrar chat",
    error:
      "Lo sentimos, ocurrió un error. Llámanos al (305) 615-6286 o envíanos un texto al (701) 732-3935 y te ayudaremos enseguida.",
    disclaimer: "Asistente de IA — no sustituye a un técnico. Las respuestas pueden ser inexactas.",
    thinking: "Pensando…",
    sending: "Enviando tu solicitud…",
    sent: "Tu solicitud fue enviada al taller.",
    langLabel: "EN",
  },
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<Lang>("en")
  const [input, setInput] = useState("")
  const langRef = useRef<Lang>(lang)
  langRef.current = lang
  const reduceMotion = useReducedMotion()

  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ language: langRef.current }),
    }),
  })

  const copy = t[lang]
  const busy = status === "submitted" || status === "streaming"

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open, busy])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = input.trim()
    if (!value || busy) return
    sendMessage({ text: value })
    setInput("")
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Respect CJK/IME composition and submit on plain Enter.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      {/* Floating launcher (single, discreet). Sits above the mobile action bar. */}
      <AnimatePresence>
        {!open && (
          <m.button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={copy.open}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:bottom-6 lg:right-6"
          >
            {/* Soft attention pulse (paused for reduced-motion via global CSS) */}
            <span
              aria-hidden
              className="chat-pulse-ring pointer-events-none absolute inset-0 rounded-full bg-primary"
            />
            <ChatIcon className="relative h-6 w-6" />
          </m.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <m.div
            role="dialog"
            aria-label={copy.title}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-20 right-4 z-50 flex h-[70vh] max-h-[600px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:bottom-6 lg:right-6"
          >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border bg-brand-dark px-4 py-3 text-brand-dark-foreground">
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{copy.title}</p>
              <p className="truncate text-xs text-brand-dark-muted">{copy.subtitle}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLang((l) => (l === "en" ? "es" : "en"))}
                className="rounded-md border border-white/20 px-2 py-1 text-xs font-semibold text-brand-dark-foreground transition-colors hover:bg-white/10"
                aria-label={lang === "en" ? "Cambiar a español" : "Switch to English"}
              >
                {copy.langLabel}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={copy.close}
                className="flex h-8 w-8 items-center justify-center rounded-md text-brand-dark-foreground transition-colors hover:bg-white/10"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-1 border-b border-border bg-secondary p-2">
            <QuickAction href={siteConfig.phone.href} label={copy.call}>
              <PhoneIcon className="h-4 w-4" />
            </QuickAction>
            <QuickAction href={siteConfig.phone.sms} label={copy.text}>
              <TextIcon className="h-4 w-4" />
            </QuickAction>
            <QuickAction href={siteConfig.address.mapsUrl} label={copy.directions} external>
              <MapIcon className="h-4 w-4" />
            </QuickAction>
            <QuickAction href="/contact" label={copy.request}>
              <WrenchIcon className="h-4 w-4" />
            </QuickAction>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {/* Greeting bubble */}
            <Bubble role="assistant">{copy.greeting}</Bubble>

            {messages.map((m) => (
              <div key={m.id}>
                {m.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <Bubble key={i} role={m.role === "user" ? "user" : "assistant"}>
                        {part.text}
                      </Bubble>
                    )
                  }
                  if (part.type === "tool-sendServiceRequest") {
                    if (part.state === "output-available") {
                      const out = part.output as { ok?: boolean; message?: string }
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground"
                        >
                          {out?.message ?? copy.sent}
                        </div>
                      )
                    }
                    return (
                      <div key={i} className="px-1 text-xs italic text-muted-foreground">
                        {copy.sending}
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            ))}

            {status === "submitted" && (
              <div className="px-1 text-xs italic text-muted-foreground">{copy.thinking}</div>
            )}
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-foreground">
                {copy.error}
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder={copy.placeholder}
                className="max-h-28 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label={copy.send}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] leading-tight text-muted-foreground">{copy.disclaimer}</p>
          </form>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  )
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const isUser = role === "user"
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
            : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-secondary px-3 py-2 text-sm text-foreground"
        }
      >
        {children}
      </div>
    </div>
  )
}

function QuickAction({
  href,
  label,
  external,
  children,
}: {
  href: string
  label: string
  external?: boolean
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-background"
    >
      <span className="text-primary">{children}</span>
      {label}
    </a>
  )
}

function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
      />
    </svg>
  )
}
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
    </svg>
  )
}
function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  )
}
function TextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
      />
    </svg>
  )
}
function MapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </svg>
  )
}
function WrenchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
      />
    </svg>
  )
}
