import Link from "next/link"
import Image from "next/image"

interface PersonCardProps {
    id: number
    name: string
    slug: string
    imageUrl: string | null
    role?: string
    movies?: {
        title: string
    }[]
}

export default function PersonCard({ id, name, slug, imageUrl, role, movies }: PersonCardProps) {
    return (
        <Link href={`/person/${slug}`} className="block group">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-900 mb-3">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#2a2a2a] p-4 text-center group-hover:bg-[#3a3a3a] transition-colors">
                        <span className="text-xl font-bold text-white/50 group-hover:text-white/80 transition-colors">
                            {name}
                        </span>
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            </div>

            <div className="space-y-1">
                <h3 className="font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                    {name}
                </h3>
                {role && (
                    <p className="text-sm text-gray-400 capitalize">{role}</p>
                )}
                {movies && movies.length > 0 && (
                    <p className="text-xs text-gray-500 line-clamp-1">
                        Known for: {movies.map(m => m.title).join(", ")}
                    </p>
                )}
            </div>
        </Link>
    )
}
