"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import RatingModal from "@/components/movie/RatingModal"

export default function RatingClient({ movieId }: { movieId: number }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  // Tutup modal setiap pindah halaman
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const userId = useMemo(() => {
    const raw = (session?.user as any)?.id
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }, [session])

  const handleOpen = () => {
    // Kalau belum login, arahkan ke signin
    if (status !== "authenticated" || !userId) {
      router.push("/signin")
      return
    }
    setOpen(true)
  }

  return (
    <div className="my-6">
      <button
        type="button"
        onClick={handleOpen}
        className="px-4 py-2 rounded bg-yellow-400 font-bold hover:bg-yellow-300 transition"
      >
        ⭐ Beri Rating
      </button>

      <RatingModal
        open={open}
        onClose={() => setOpen(false)}
        movieId={movieId}
        userId={userId ?? 0}
      />
    </div>
  )
}
