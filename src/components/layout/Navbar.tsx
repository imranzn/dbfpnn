"use client"

import Link from "next/link"
import { Search, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"

export default function Navbar() {
  const { data: session, status } = useSession()

  const [searchType, setSearchType] = useState("Semua")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem("q") as HTMLInputElement | null
    const q = input?.value?.trim() ?? ""

    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(searchType)}`)
    }
  }

  const searchOptions = ["Semua", "Film", "Sutradara", "Aktor"]

  const isLoggedIn = !!session?.user

  return (
    <nav className="bg-[#121212] text-white py-3 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 border-b border-gray-800">
      <div className="flex items-center gap-4 w-full max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="bg-primary text-black font-bold px-3 py-1 rounded-md text-sm md:text-base tracking-tighter shrink-0"
        >
          DBFPN
        </Link>

        {/* Search Bar */}
        <div className="flex-1 flex items-center mx-4">
          <div className="relative flex items-center w-full">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((v) => !v)}
                className="h-8 bg-white text-black px-3 rounded-l-sm text-sm font-medium flex items-center gap-1 hover:bg-gray-200 transition-colors shrink-0 border-r border-gray-300"
              >
                {searchType} <ChevronDown size={14} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-white text-black rounded-md shadow-lg py-1 z-50">
                  {searchOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSearchType(option)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSearch} className="flex-1 flex">
              <input
                name="q"
                type="text"
                placeholder="Cari"
                className="w-full h-8 bg-white text-black px-3 text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="h-8 bg-white text-gray-500 px-3 rounded-r-sm hover:text-black transition-colors shrink-0 flex items-center justify-center"
              >
                <Search size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300 shrink-0">
          <Link href="/news" className="hover:text-white transition-colors">
            Berita
          </Link>
          <Link href="/top-100" className="hover:text-white transition-colors">
            Top 100
          </Link>
          <Link href="/dashboard/user" className="hover:text-white transition-colors">
            Dasbor
          </Link>

          {status === "loading" ? (
            <span className="text-gray-500">...</span>
          ) : isLoggedIn ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="hover:text-white transition-colors"
            >
              Keluar
            </button>
          ) : (
            <Link href="/api/auth/signin" className="hover:text-white transition-colors">
              Masuk
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
