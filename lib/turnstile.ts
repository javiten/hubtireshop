// Server-side verification for Cloudflare Turnstile tokens.
// Used to block automated/bot submissions on the public contact forms.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export type TurnstileResult = {
  success: boolean
  /** A safe, user-facing reason when verification fails. */
  reason?: string
}

/**
 * Returns true when Turnstile is configured on the server.
 * If it isn't, callers should fail closed rather than silently accepting bots.
 */
export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}

/**
 * Verifies a Turnstile token against Cloudflare's siteverify endpoint.
 * Tokens are single-use and expire after a few minutes.
 */
export async function verifyTurnstileToken(token: unknown, remoteIp?: string | null): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    console.log("[v0] Turnstile secret key is not configured")
    return { success: false, reason: "Verification is temporarily unavailable. Please call us instead." }
  }

  if (typeof token !== "string" || token.trim().length === 0) {
    return { success: false, reason: "Please complete the verification challenge before submitting." }
  }

  const body = new FormData()
  body.append("secret", secret)
  body.append("response", token)
  if (remoteIp) body.append("remoteip", remoteIp)

  try {
    const response = await fetch(VERIFY_URL, { method: "POST", body })

    if (!response.ok) {
      console.log("[v0] Turnstile siteverify HTTP error:", response.status)
      return { success: false, reason: "Could not verify your submission. Please try again." }
    }

    const data = (await response.json()) as {
      success: boolean
      "error-codes"?: string[]
    }

    if (!data.success) {
      console.log("[v0] Turnstile verification failed:", data["error-codes"])
      return {
        success: false,
        reason: "Verification failed. Please refresh the page and try again.",
      }
    }

    return { success: true }
  } catch (error) {
    console.log("[v0] Turnstile verification error:", error instanceof Error ? error.message : error)
    return { success: false, reason: "Could not verify your submission. Please try again." }
  }
}
