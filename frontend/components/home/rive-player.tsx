"use client"

import { useEffect, useRef } from "react"

type RivePlayerProps = {
  src: string
  className?: string
  scrub?: boolean
}

type RiveInstance = {
  cleanup: () => void
  play: () => void
  pause: () => void
  stop: () => void
  scrub: (animationNames?: string | string[], value?: number) => void
  resizeDrawingSurfaceToCanvas: () => void
}

export function RivePlayer({ src, className, scrub = false }: RivePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let disposed = false
    let rive: RiveInstance | null = null
    let cleanupScroll: (() => void) | null = null
    let io: IntersectionObserver | null = null

    void (async () => {
      const { Rive, Fit, Alignment, Layout } = await import("@rive-app/canvas")
      if (disposed) return
      const container = containerRef.current
      const canvas = canvasRef.current
      if (!container || !canvas) return

      const instance = new Rive({
        src,
        canvas,
        layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
        autoplay: !scrub,
        onLoad: () => {
          if (disposed) return
          instance.resizeDrawingSurfaceToCanvas()
          if (scrub) {
            instance.stop()
            const update = () => {
              if (disposed) return
              const track = container.closest("section") || container
              const rect = track.getBoundingClientRect()
              const vh = window.innerHeight
              const total = rect.height + vh
              const passed = vh - rect.top
              const progress = Math.min(1, Math.max(0, passed / total))
              instance.scrub(undefined, progress)
            }
            update()
            window.addEventListener("scroll", update, { passive: true })
            window.addEventListener("resize", update)
            cleanupScroll = () => {
              window.removeEventListener("scroll", update)
              window.removeEventListener("resize", update)
            }
          }
        },
        onLoadError: (err) => {
          console.error("Rive load error for", src, err)
        },
      })
      rive = instance

      if (!scrub) {
        io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) instance.play()
              else instance.pause()
            }
          },
          { rootMargin: "15% 0px" }
        )
        io.observe(container)
      }
    })()

    return () => {
      disposed = true
      cleanupScroll?.()
      io?.disconnect()
      rive?.cleanup()
    }
  }, [src, scrub])

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} className="size-full" aria-hidden="true" />
    </div>
  )
}