import Image from "next/image"
import Link from "next/link"

interface MovieCardProps {
    id: string
    title: string
    description: string
    imageUrl?: string | null
    year: string
    releaseDate?: string
}

export default function MovieCard({ id, title, description, imageUrl, year, releaseDate }: MovieCardProps) {
    // Format release date if available
    const displayYear = releaseDate
        ? new Date(releaseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : year

    return (
        <Link href={`/movie/${id}`} className="block group">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3 bg-[#1a1a1a]">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#2a2a2a] p-4 text-center group-hover:bg-[#3a3a3a] transition-colors">
                        <span className="text-xl font-bold text-white/50 group-hover:text-white/80 transition-colors">
                            {title}
                        </span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white">
                    {displayYear}
                </div>
            </div>
            <h3 className="font-bold text-white mb-1 truncate group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-gray-400 line-clamp-2">{description}</p>
        </Link>
    )
}
