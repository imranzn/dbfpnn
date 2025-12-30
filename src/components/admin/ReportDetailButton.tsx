"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import ReportReasonsModal from "@/components/admin/ReportReasonsModal"

type Props = {
  userId: number
  username: string
}

export default function ReportDetailButton({ userId, username }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#252525] hover:bg-[#333] border border-gray-700 text-white"
        title="Detail laporan"
      >
        Detail <ChevronRight size={16} />
      </button>

      <ReportReasonsModal
        open={open}
        onClose={() => setOpen(false)}
        userId={userId}
        username={username}
      />
    </>
  )
}
