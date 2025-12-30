"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Star, X } from "lucide-react"
import { useToast } from "@/components/ui/Toast"

type Props = {
  open: boolean
  onClose: () => void
  movieId: number
  userId: number
  initialRating?: number
  initialComment?: string
  onSuccess?: () => void
}

const clamp = (v: number) => Math.min(5, Math.max(0, Number(v) || 0))

export default function RatingModal({
  open,
  onClose,
  movieId,
  userId,
  initialRating = 0,
  initialComment = "",
  onSuccess,
}: Props) {
  const pathname = usePathname()
  const { showToast } = useToast()
  const boxRef = useRef<HTMLDivElement>(null)

  const [rating, setRating] = useState(clamp(initialRating))
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState(initialComment)
  const [loading, setLoading] = useState(false)

  // Jangan render apa pun kalau modal tertutup
  if (!open) return null

  // Reset state tiap modal dibuka (biar ga nyangkut nilai lama)
  useEffect(() => {
    if (!open) return
    setRating(clamp(initialRating))
    setHover(0)
    setComment(initialComment)
    setLoading(false)
  }, [open, initialRating, initialComment])

  // Auto close saat pindah route, supaya ga ikut ke halaman lain
  useEffect(() => {
    if (!open) return
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Lock scroll + ESC + klik luar
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose()
    }
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current) return
      if (!boxRef.current.contains(e.target as Node) && !loading) onClose()
    }

    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onDown)

    return () => {
      document.body.style.overflow = "unset"
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onDown)
    }
  }, [open, loading, onClose])

  const display = clamp(hover || rating)

  const submit = async () => {
    const r = clamp(rating)

    if (!Number.isInteger(movieId) || movieId <= 0) {
      showToast("movieId tidak valid.", "error")
      return
    }
    if (!Number.isInteger(userId) || userId <= 0) {
      showToast("Kamu harus login dulu.", "error")
      return
    }
    if (r < 1 || r > 5) {
      showToast("Pilih rating 1 sampai 5.", "error")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          userId,
          rating: r,
          comment: comment?.trim() ? comment.trim() : null,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        showToast(data?.error || data?.message || "Gagal submit rating.", "error")
        return
      }

      showToast("Rating berhasil dikirim.", "success")
      onSuccess?.()
      onClose()
    } catch {
      showToast("Network error, coba lagi.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        ref={boxRef}
        className="w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-gray-800 shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg">Beri Rating</h2>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            className="text-gray-400 hover:text-white"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                disabled={loading}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(s)}
                className="disabled:opacity-60"
                aria-label={`Pilih rating ${s}`}
              >
                <Star
                  size={28}
                  className={
                    s <= display ? "text-yellow-500 fill-yellow-500" : "text-gray-600"
                  }
                />
              </button>
            ))}
          </div>

          <div className="text-center mb-5">
            <span className="text-3xl font-bold text-white">{display}</span>
            <span className="text-gray-500 text-lg">/5</span>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Komentar (opsional)"
            disabled={loading}
            className="w-full min-h-[110px] resize-none rounded-xl bg-[#252525] border border-gray-700 p-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary disabled:opacity-60"
          />

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => !loading && onClose()}
              className="flex-1 rounded-xl bg-gray-800 text-white font-bold py-3 hover:bg-gray-700 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={loading || display === 0}
              onClick={submit}
              className="flex-1 rounded-xl bg-primary text-black font-bold py-3 hover:bg-yellow-500 disabled:opacity-50"
            >
              {loading ? "Mengirim..." : "Kirim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
