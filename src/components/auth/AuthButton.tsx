"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"

type Props = {
  className?: string
}

export default function AuthButton({ className }: Props) {
  const { data: session, status } = useSession()

  // biar tidak “kedip” saat loading
  if (status === "loading") {
    return (
      <span className={className ?? "text-gray-400"} aria-label="Loading">
        ...
      </span>
    )
  }

  // SUDAH LOGIN: tampilkan Keluar
  if (session?.user) {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className={
          className ??
          "px-3 py-2 rounded-lg border border-gray-700 text-white hover:bg-[#252525] transition-colors"
        }
      >
        Keluar
      </button>
    )
  }

  // BELUM LOGIN: tampilkan Masuk
  return (
    <Link
      href="/api/auth/signin"
      className={
        className ??
        "px-3 py-2 rounded-lg border border-gray-700 text-white hover:bg-[#252525] transition-colors"
      }
    >
      Masuk
    </Link>
  )
}
