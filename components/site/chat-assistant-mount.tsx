"use client"

import { usePathname } from "next/navigation"
import { ChatAssistant } from "@/components/site/chat-assistant"

// Mounts exactly one chat assistant across the entire public site.
// Hidden on admin routes (internal tooling, not part of the public site).
export function ChatAssistantMount() {
  const pathname = usePathname()

  if (pathname?.startsWith("/admin")) return null

  return <ChatAssistant />
}
