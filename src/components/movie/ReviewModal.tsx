"use client"

import { useEffect, useRef, useState } from "react"
import { Star, X } from "lucide-react"
import { useToast } from "../ui/Toast"

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  movieId: number
  movieTitle: string
  initialRating?: number
}

const clampRating = (v: number) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.min(5, Math.max(0, n))
}

export default function ReviewModal({
  isOpen,
  onClose,
  movieId,
  movieTitle,
  initialRating = 0,
}: ReviewModalProps) {
  const [rating, setRating] = useState(clampRating(initialRating))
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  // Reset state tiap modal dibuka
  useEffect(() => {
    if (!isOpen) return
    setRating(clampRating(initialRating))
    setHoverRating(0)
    setReview("")
  }, [isOpen, initialRating])

  // Escape + click outside
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === "Escape" && !isSubmitting) onClose()
    }

    const onMouseDown = (e: MouseEvent) => {
      if (!isOpen) return
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        if (!isSubmitting) onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", onKeyDown)
      document.addEventListener("mousedown", onMouseDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", onMouseDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, isSubmitting])

  if (!isOpen) return null

  const displayRating = clampRating(hoverRating || rating)

  const handleSubmit = async () => {
    const safeRating = clampRating(rating)

    if (!movieId || Number.isNaN(movieId)) {
      showToast("movieId tidak valid.", "error")
      return
    }

    if (safeRating < 1 || safeRating > 5) {
      showToast("Pilih rating 1 sampai 5.", "error")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        movieId,
        rating: safeRating,
        comment: review, // kalau API kamu pakai "content", ganti jadi content: review
      }

      console.log("[ReviewModal] submit payload:", payload)

      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const contentType = res.headers.get("content-type") || ""
      const data = contentType.includes("application/json")
        ? await res.json().catch(() => null)
        : await res.text().catch(() => "")

      console.log("[ReviewModal] response:", res.status, data)

      if (res.status === 401) {
        showToast("Kamu harus login dulu.", "error")
        return
      }

      if (!res.ok) {
        const msg =
          (typeof data === "object" && data && ("error" in data || "message" in data)
            ? (data as any).error || (data as any).message
            : null) ||
          (typeof data === "string" && data ? data : null) ||
          "Gagal mengirim ulasan."
        showToast(msg, "error")
        return
      }

      showToast("Ulasan berhasil dikirim!", "success")
      onClose()
    } catch (err) {
      console.error("[ReviewModal] submit error:", err)
      showToast("Network error. Coba lagi.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg border border-gray-800 shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Beri Ulasan</h2>
          <button
            type="button"
            aria-label="Tutup"
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isSubmitting}
            onClick={() => {
              if (!isSubmitting) onClose()
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!isSubmitting) handleSubmit()
            }}
          >
            <p className="text-center text-gray-400 mb-6">
              Bagaimana pendapatmu tentang{" "}
              <span className="text-white font-bold">{movieTitle}</span>?
            </p>

            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={isSubmitting}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label={`Pilih rating ${star}`}
                >
                  <Star
                    size={28}
                    className={`${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-gray-600"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>

            <div className="text-center mb-6">
              <span className="text-3xl font-bold text-white">{displayRating}</span>
              <span className="text-gray-500 text-lg">/5</span>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Ulasan Anda (Opsional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Ceritakan pengalaman menontonmu..."
                disabled={isSubmitting}
                className="w-full bg-[#252525] border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary min-h-[120px] resize-none disabled:opacity-60"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (!isSubmitting) onClose()
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={displayRating === 0 || isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-black font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Ulasan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
