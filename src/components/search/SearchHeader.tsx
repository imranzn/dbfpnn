"use client"

import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, type FormEvent, useRef } from "react"

export default function SearchHeader() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [showAdvanced, setShowAdvanced] = useState(false)
    const [query, setQuery] = useState(searchParams.get("q") || "")
    const [searchType, setSearchType] = useState(searchParams.get("type") || "Semua")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const searchOptions = ["Semua", "Film", "Sutradara", "Aktor"]

    const [filters, setFilters] = useState({
        status: searchParams.get("status") || "",
        genre: searchParams.get("genre") || "",
        yearFrom: searchParams.get("yearFrom") || "",
        yearTo: searchParams.get("yearTo") || "",
        sortBy: searchParams.get("sortBy") || "latest",
        directorSort: searchParams.get("directorSort") || "popularity",
        actorSort: searchParams.get("actorSort") || "popularity"
    })

    // Sync state with URL params
    useEffect(() => {
        setQuery(searchParams.get("q") || "")
        setSearchType(searchParams.get("type") || "Semua")
        setFilters({
            status: searchParams.get("status") || "",
            genre: searchParams.get("genre") || "",
            yearFrom: searchParams.get("yearFrom") || "",
            yearTo: searchParams.get("yearTo") || "",
            sortBy: searchParams.get("sortBy") || "latest",
            directorSort: searchParams.get("directorSort") || "popularity",
            actorSort: searchParams.get("actorSort") || "popularity"
        })
    }, [searchParams])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        updateUrl(query, filters, searchType)
    }

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
        updateUrl(query, newFilters, searchType)
    }

    const handleTypeChange = (type: string) => {
        setSearchType(type)
        setIsDropdownOpen(false)
        // Reset sortBy to relevant default
        const newFilters = { ...filters, sortBy: (type === 'Film' || type === 'Semua') ? 'latest' : 'name_asc' }
        setFilters(newFilters)
        updateUrl(query, newFilters, type)
    }

    const updateUrl = (currentQuery: string, currentFilters: typeof filters, currentType: string) => {
        const params = new URLSearchParams()

        if (currentQuery) params.set("q", currentQuery)
        if (currentType && currentType !== "Semua") params.set("type", currentType)

        // Only add advanced filters if search type supports them (Film or Everyone/Default)
        // Actually, strictly speaking 'Semua' might not support generic filters well, but let's keep them enabled for 'Semua' 
        // as it basically defaults to listing Movies first.
        // However, if type is 'Sutradara' or 'Aktor', we generally shouldn't apply movie filters.

        const isMovieSearch = currentType === "Film" || currentType === "Semua"

        if (isMovieSearch) {
            if (currentFilters.status) params.set("status", currentFilters.status)
            if (currentFilters.genre) params.set("genre", currentFilters.genre)
            if (currentFilters.yearFrom) params.set("yearFrom", currentFilters.yearFrom)
            if (currentFilters.yearTo) params.set("yearTo", currentFilters.yearTo)
            if (currentFilters.sortBy) params.set("sortBy", currentFilters.sortBy)
        }

        if (currentType === "Semua") {
            if (currentFilters.directorSort) params.set("directorSort", currentFilters.directorSort)
            if (currentFilters.actorSort) params.set("actorSort", currentFilters.actorSort)
        } else if (currentType === "Sutradara" || currentType === "Aktor") {
            if (currentFilters.sortBy) params.set("sortBy", currentFilters.sortBy)
        }

        router.push(`/search?${params.toString()}`)
    }

    // Determine if filters should be visible (now visible for all)
    const showFiltersButton = true

    useEffect(() => {
        if (!showFiltersButton && showAdvanced) {
            setShowAdvanced(false)
        }
    }, [showFiltersButton, showAdvanced])


    return (
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-6">Pencarian {searchType}</h1>
            <div className="flex gap-4">
                <div className="flex-1 flex gap-2">
                    {/* Search Type Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="h-full px-4 bg-[#1a1a1a] border border-gray-800 rounded-xl flex items-center gap-2 text-gray-300 hover:border-gray-600 transition-colors min-w-[120px] justify-between"
                        >
                            <span>{searchType}</span>
                            <ChevronDown size={14} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-40 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                                {searchOptions.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => handleTypeChange(option)}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-800 ${searchType === option ? "text-primary font-medium" : "text-gray-300"
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
                        <form onSubmit={handleSearch} className="h-full">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`Cari ${searchType.toLowerCase()}...`}
                                className="w-full h-full bg-[#1a1a1a] border border-gray-800 rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-primary text-lg"
                            />
                        </form>
                    </div>
                </div>

                {showFiltersButton && (
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`px-6 py-3 rounded-xl border flex items-center gap-2 font-medium transition-colors shrink-0 ${showAdvanced
                            ? "bg-primary text-black border-primary"
                            : "bg-[#1a1a1a] text-gray-300 border-gray-800 hover:border-gray-600"
                            }`}
                    >
                        <Filter size={20} />
                        Filter Lanjutan
                        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                )}
            </div>

            {/* Filters Panel - Rendered below the flex row */}
            {showAdvanced && showFiltersButton && (
                <div className="mt-6 p-6 bg-[#1a1a1a] rounded-xl border border-gray-800 animate-in fade-in slide-in-from-top-4">
                    {searchType === "Semua" ? (
                        <div className="space-y-6">
                            {/* Film Section */}
                            <div>
                                <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Filter Film</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Status Rilis</label>
                                        <select
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange("status", e.target.value)}
                                            className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="">Semua Status</option>
                                            <option value="released">Sudah Tayang</option>
                                            <option value="coming_soon">Segera Tayang</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Genre</label>
                                        <select
                                            value={filters.genre}
                                            onChange={(e) => handleFilterChange("genre", e.target.value)}
                                            className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="">Semua Genre</option>
                                            <option value="action">Action</option>
                                            <option value="drama">Drama</option>
                                            <option value="horror">Horror</option>
                                            <option value="comedy">Comedy</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Rentang Tahun</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Dari"
                                                value={filters.yearFrom}
                                                onChange={(e) => handleFilterChange("yearFrom", e.target.value)}
                                                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Sampai"
                                                value={filters.yearTo}
                                                onChange={(e) => handleFilterChange("yearTo", e.target.value)}
                                                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Urutkan Film</label>
                                        <select
                                            value={filters.sortBy}
                                            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                                            className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="latest">Terbaru</option>
                                            <option value="popularity">Terpopuler</option>
                                            <option value="rating">Rating Tertinggi</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-800" />

                            {/* Person Sorts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Filter Sutradara</h3>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Urutkan Sutradara</label>
                                        <select
                                            value={filters.directorSort}
                                            onChange={(e) => handleFilterChange("directorSort", e.target.value)}
                                            className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="popularity">Terpopuler</option>
                                            <option value="name_asc">Nama (A-Z)</option>
                                            <option value="name_desc">Nama (Z-A)</option>
                                            <option value="youngest">Termuda</option>
                                            <option value="oldest">Tertua</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Filter Aktor</h3>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Urutkan Aktor</label>
                                        <select
                                            value={filters.actorSort}
                                            onChange={(e) => handleFilterChange("actorSort", e.target.value)}
                                            className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="popularity">Terpopuler</option>
                                            <option value="name_asc">Nama (A-Z)</option>
                                            <option value="name_desc">Nama (Z-A)</option>
                                            <option value="youngest">Termuda</option>
                                            <option value="oldest">Tertua</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (searchType === "Film" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Status Rilis</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange("status", e.target.value)}
                                    className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="released">Sudah Tayang</option>
                                    <option value="coming_soon">Segera Tayang</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Genre</label>
                                <select
                                    value={filters.genre}
                                    onChange={(e) => handleFilterChange("genre", e.target.value)}
                                    className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="">Semua Genre</option>
                                    <option value="action">Action</option>
                                    <option value="drama">Drama</option>
                                    <option value="horror">Horror</option>
                                    <option value="comedy">Comedy</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Rentang Tahun</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Dari"
                                        value={filters.yearFrom}
                                        onChange={(e) => handleFilterChange("yearFrom", e.target.value)}
                                        className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Sampai"
                                        value={filters.yearTo}
                                        onChange={(e) => handleFilterChange("yearTo", e.target.value)}
                                        className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Urutkan Film</label>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                                    className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="latest">Terbaru</option>
                                    <option value="popularity">Terpopuler</option>
                                    <option value="rating">Rating Tertinggi</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Urutkan {searchType}</label>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                                    className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="name_asc">Nama (A-Z)</option>
                                    <option value="name_desc">Nama (Z-A)</option>
                                    <option value="popularity">Terpopuler (Jumlah Film)</option>
                                    <option value="youngest">Termuda</option>
                                    <option value="oldest">Tertua</option>
                                </select>
                            </div>
                            <div className="flex items-end text-sm text-gray-500 pb-2">
                                *Menampilkan hasil berdasarkan kriteria yang dipilih
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
