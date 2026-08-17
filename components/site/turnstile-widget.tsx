"use client"

import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          "expired-callback"?: () => void
          "error-callback"?: () => void
          theme?: "light" | "dark" | "auto"
          size?: "normal" | "flexible" | "compact"
          action?: string
        },
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.turnstile) return Promise.resolve()

  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)

      if (existing) {
        existing.addEventListener("load", () => resolve())
        existing.addEventListener("error", () => reject(new Error("Failed to load Turnstile")))
        return
      }

      const script = document.createElement("script")
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error("Failed to load Turnstile"))
      }
      document.head.appendChild(script)
    })
  }

  return scriptPromise
}

type TurnstileWidgetProps = {
  /** Called with the verification token, or null when it expires or errors. */
  onVerify: (token: string | null) => void
  /** Increment this value to force the widget to issue a fresh token. */
  resetSignal?: number
  /** Distinguishes which form produced the token in Cloudflare analytics. */
  action?: string
  className?: string
}

export function TurnstileWidget({ onVerify, resetSignal = 0, action, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onVerifyRef = useRef(onVerify)
  const [loadFailed, setLoadFailed] = useState(false)

  // Keep the latest callback without re-rendering the widget.
  useEffect(() => {
    onVerifyRef.current = onVerify
  }, [onVerify])

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    let cancelled = false
    const container = containerRef.current

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || widgetIdRef.current) return

        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: siteKey,
          theme: "light",
          size: "flexible",
          action,
          callback: (token) => onVerifyRef.current(token),
          "expired-callback": () => onVerifyRef.current(null),
          "error-callback": () => onVerifyRef.current(null),
        })
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, action])

  // Tokens are single-use, so reset the widget after each submission.
  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
      onVerifyRef.current(null)
    }
  }, [resetSignal])

  if (!siteKey) {
    return (
      <p className="text-sm text-muted-foreground">
        Spam protection is not configured. Please call us to complete your request.
      </p>
    )
  }

  return (
    <div className={className}>
      <div ref={containerRef} />
      {loadFailed && (
        <p className="mt-2 text-sm text-destructive">
          The verification challenge could not load. Please refresh the page and try again.
        </p>
      )}
    </div>
  )
}
