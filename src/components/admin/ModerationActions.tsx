"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/Toast"

type Props = {
  userId: number
  username: string
  disabled?: boolean
}

export default function ModerationActions({ userId, username, disabled }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState<"ban" | "dismiss" | null>(null)

  const call = async (action: "ban" | "dismiss") => {
    if (loading) return
    const ok = confirm(
      action === "ban"
        ? `Ban akun ${username}? Akun ini tidak bisa interaksi lagi.`
        : `Abaikan semua laporan pending untuk ${username}?`
    )
    if (!ok) return

    setLoading(action)
    try {
      const res = await fetch("/api/admin/reports/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        showToast(data?.error || "Gagal menjalankan aksi.", "error")
        return
      }
      showToast(action === "ban" ? "User diban." : "Laporan diabaikan.", "success")
      router.refresh()
    } catch {
      showToast("Network error.", "error")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled || loading !== null}
        onClick={() => call("ban")}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-300 disabled:opacity-50"
        title="Ban akun"
      >
        <Ban size={16} />
        {loading === "ban" ? "Memproses..." : "Ban"}
      </button>

      <button
        type="button"
        disabled={disabled || loading !== null}
        onClick={() => call("dismiss")}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/15 border border-gray-500/20 text-gray-200 disabled:opacity-50"
        title="Abaikan laporan"
      >
        <Trash2 size={16} />
        {loading === "dismiss" ? "Memproses..." : "Abaikan"}
      </button>
    </div>
  )
}
