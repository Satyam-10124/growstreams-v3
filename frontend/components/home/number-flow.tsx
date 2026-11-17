"use client"

import { useEffect, useRef } from "react"

type NumberFlowProps = {
  value: number
  prefix?: string
  suffix?: string
  className?: string
}

export function NumberFlow({ value, prefix = "", suffix = "", className }: NumberFlowProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    let disposed = false
    void (async () => {
      await import("number-flow")
      if (disposed) return
      const el = ref.current
      if (!el) return
      el.setAttribute("value", String(value))
      el.setAttribute("prefix", prefix)
      el.setAttribute("suffix", suffix)
      ;(el as unknown as { update?: () => void }).update?.()
    })()
    return () => {
      disposed = true
    }
  }, [value, prefix, suffix])

  return (
    <number-flow ref={ref as unknown as React.RefObject<HTMLElement>} className={className}>
      {prefix}
      {value.toLocaleString("en-US")}
      {suffix}
    </number-flow>
  )
}