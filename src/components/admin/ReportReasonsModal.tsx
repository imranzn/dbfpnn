"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"
import { useToast } from "@/components/ui/Toast"

type ReasonRow = {
  id: number
  reason: string
  createdAt: string
  reporter?: {
    id: number
    username: string | null
    email: string
  } | null
}

type Props = {
  open: boolean
  onClose: () => void
  userId: number
  username: string
}

export default function ReportReasonsModal({ open, onClose, userId, username }: Props) {
  const { showToast } = useToast()
  const boxRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ReasonRow[]>([])

  const title = useMemo(() => {
    const u = username?.trim()
    return u ? `Detail laporan @${u}` : "Detail laporan"
  }, [username])

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

  useEffect(() => {
    if (!open) return
    if (!Number.isInteger(userId) || userId <= 0) return

    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/reports/user/${userId}`, { method: "GET" })
        const data = await res.json().catch(() => null)

        if (!res.ok) {
          showToast(data?.error || "Gagal ambil detail laporan.", "error")
          setRows([])
          return
        }

        setRows(Array.isArray(data?.reports) ? data.reports : [])
      } catch {
        showToast("Network error, gagal ambil detail laporan.", "error")
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [open, userId, showToast])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        ref={boxRef}
        className="w-full max-w-2xl rounded-2xl bg-[#121212] border border-gray-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-lg">{title}</h2>
            <p className="text-gray-400 text-sm">User ID: {userId}</p>
          </div>

          <button
            type="button"
            onClick={() => !loading && onClose()}
            className="text-gray-400 hover:text-white"
            aria-label="Tutup"
            title="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-gray-400">Memuat...</div>
          ) : rows.length === 0 ? (
            <div className="text-gray-500">Belum ada alasan laporan.</div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const reporterName = r.reporter?.username || r.reporter?.email?.split("@")[0] || `User#${r.reporter?.id ?? "?"}`
                return (
                  <div key={r.id} className="rounded-xl border border-gray-800 bg-[#0e0e0e] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-white font-semibold">{r.reason}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(r.createdAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="mt-2 text-gray-500 text-xs">Dilaporkan oleh: {reporterName}</div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="pt-6">
            <button
              type="button"
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="w-full rounded-xl bg-[#252525] hover:bg-[#333] border border-gray-700 text-white font-bold py-3 disabled:opacity-60"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
