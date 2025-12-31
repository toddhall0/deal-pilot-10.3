"use client"

import { useEffect } from "react"

// Skip to main content link
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md"
    >
      Skip to main content
    </a>
  )
}

// Focus trap for modals
export function useFocusTrap(ref: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return

    const element = ref.current
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    element.addEventListener("keydown", handleKeyDown)
    firstElement?.focus()

    return () => {
      element.removeEventListener("keydown", handleKeyDown)
    }
  }, [ref, isActive])
}

// Announce to screen readers
export function useAnnounce() {
  const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div")
    announcement.setAttribute("role", "status")
    announcement.setAttribute("aria-live", priority)
    announcement.setAttribute("aria-atomic", "true")
    announcement.className = "sr-only"
    announcement.textContent = message
    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return announce
}

// Keyboard navigation helper
export function useArrowNavigation(
  ref: React.RefObject<HTMLElement>,
  options: { selector: string; loop?: boolean } = { selector: "[data-nav-item]", loop: true }
) {
  useEffect(() => {
    if (!ref.current) return

    const element = ref.current

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return

      const items = Array.from(element.querySelectorAll(options.selector)) as HTMLElement[]
      const currentIndex = items.findIndex((item) => item === document.activeElement)

      let nextIndex: number

      switch (e.key) {
        case "ArrowDown":
          nextIndex = currentIndex + 1
          if (nextIndex >= items.length) nextIndex = options.loop ? 0 : items.length - 1
          break
        case "ArrowUp":
          nextIndex = currentIndex - 1
          if (nextIndex < 0) nextIndex = options.loop ? items.length - 1 : 0
          break
        case "Home":
          nextIndex = 0
          break
        case "End":
          nextIndex = items.length - 1
          break
        default:
          return
      }

      e.preventDefault()
      items[nextIndex]?.focus()
    }

    element.addEventListener("keydown", handleKeyDown)
    return () => element.removeEventListener("keydown", handleKeyDown)
  }, [ref, options.selector, options.loop])
}
