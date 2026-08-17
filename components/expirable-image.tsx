"use client"

import { useState } from "react"
import Image from "next/image"

type ExpirableImageProps = {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  onClick?: () => void
  priority?: boolean
}

export function ExpirableImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  onClick,
  priority,
}: ExpirableImageProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/50 text-muted-foreground ${className}`}
        style={!fill ? { width, height } : undefined}
        onClick={onClick}
      >
        <div className="flex flex-col items-center gap-1 p-2 text-center">
          <svg className="h-6 w-6 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <span className="text-[10px]">Expired</span>
        </div>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      className={className}
      onClick={onClick}
      priority={priority}
      onError={() => setError(true)}
    />
  )
}
