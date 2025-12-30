"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/Toast"

type Props = {
  open: boolean
  onClose: () => void
  targetUserId: number
  targetUsername: string
}

const REASONS = [
  "Spam",
  "Penipuan",
  "Ujaran kebencian",
  "Konten tidak pantas",
  "Pelecehan",
  "Other",
] as const

export default function ReportUserModal({ open, onClose, targetUserId, targetUsername }: Props) {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const boxRef = useRef<HTMLDivElement>(null)

  const [reason, setReason] = useState<(typeof REASONS)[number]>("Spam")
  const [otherText, setOtherText] = useState("")
  const [loading, setLoading] = useState(false)

  const reporterId = useMemo(() => {
    const raw = (session?.user as any)?.id
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }, [session])

  useEffect(() => {
    if (!open) return
    setReason("Spam")
    setOtherText("")
    setLoading(false)
  }, [open])

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

  if (!open) return null

  const submit = async () => {
    if (status !== "authenticated" || !reporterId) {
      showToast("Kamu harus login dulu untuk melaporkan.", "error")
      return
    }
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      showToast("Target user tidak valid.", "error")
      return
    }
    if (reporterId === targetUserId) {
      showToast("Kamu tidak bisa melaporkan akun sendiri.", "error")
      return
    }

    const finalReason = reason === "Other" ? otherText.trim() : reason
    if (!finalReason) {
      showToast("Isi alasan laporan.", "error")
      return
    }
    if (finalReason.length > 200) {
      showToast("Alasan kepanjangan (max 200 karakter).", "error")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "user",
          targetId: targetUserId,
          reason: finalReason,
        }),
      })
      
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        showToast(data?.error || data?.message || "Gagal mengirim laporan.", "error")
        return
      }

      showToast("Laporan terkirim. Terima kasih.", "success")
      onClose()
    } catch {
      showToast("Network error, coba lagi.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div ref={boxRef} className="w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg">Laporkan @{targetUsername}</h2>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            className="text-gray-400 hover:text-white"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Alasan</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              disabled={loading}
              className="w-full bg-[#252525] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary disabled:opacity-60"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === "Other" && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tulis alasan</label>
              <textarea
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                disabled={loading}
                className="w-full min-h-[90px] resize-none rounded-xl bg-[#252525] border border-gray-700 p-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary disabled:opacity-60"
                placeholder="Jelaskan singkat..."
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
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
              disabled={loading}
              onClick={submit}
              className="flex-1 rounded-xl bg-primary text-black font-bold py-3 hover:bg-yellow-500 disabled:opacity-50"
            >
              {loading ? "Mengirim..." : "Kirim Laporan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
