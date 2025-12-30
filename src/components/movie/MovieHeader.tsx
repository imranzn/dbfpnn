"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Play, Star, User } from "lucide-react"
import ReviewModal from "./ReviewModal"

interface MovieHeaderProps {
  id: number
  title: string
  year: string
  rating: number
  posterUrl?: string | null
  bannerUrl?: string | null
  trailerUrl?: string | null
  videoUrl?: string | null
  synopsis: string
  director: string
  directorId?: number | null
  directorUsername?: string | null
  writer: string
  writerId?: number | null
  writerUsername?: string | null
  cast: { name: string; role: string; userId?: number | null; username?: string | null }[]
  genres: string[]
  duration: string
  language: string
  releaseDate: string
}

function clampRating(v: number) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.min(5, Math.max(0, n))
}

function getYoutubeId(url: string) {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2]?.length === 11 ? match[2] : null
}

function CastList({
  cast,
}: {
  cast: { name: string; role: string; userId?: number | null; username?: string | null }[]
}) {
  const [page, setPage] = useState(0)
  const itemsPerPage = 6
  const totalPages = Math.ceil(cast.length / itemsPerPage)
  const currentCast = cast.slice(page * itemsPerPage, (page + 1) * itemsPerPage)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentCast.map((actor, idx) => (
          <div
            key={idx}
            className="bg-[#1a1a1a] border border-gray-800 p-3 rounded-lg flex justify-between items-center group hover:border-primary/50 transition-colors"
          >
            {actor.username ? (
              <Link
                href={`/user/${actor.username}`}
                className="flex items-center gap-2 text-white font-medium hover:text-primary transition-colors"
              >
                <User size={14} className="text-primary" />
                {actor.name}
              </Link>
            ) : (
              <span className="text-white font-medium">{actor.name}</span>
            )}
            <span className="text-gray-500 text-xs">{actor.role}</span>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 rounded bg-[#252525] text-white disabled:opacity-30 hover:bg-primary hover:text-black transition-colors"
          >
            &lt;
          </button>
          <span className="text-sm text-gray-400 py-1">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-1 rounded bg-[#252525] text-white disabled:opacity-30 hover:bg-primary hover:text-black transition-colors"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  )
}

export default function MovieHeader({
  id,
  title,
  year,
  rating: ratingFromServer,
  posterUrl,
  bannerUrl,
  trailerUrl,
  videoUrl,
  synopsis,
  director,
  directorUsername,
  writer,
  writerUsername,
  cast,
  genres,
  duration,
  language,
  releaseDate,
}: MovieHeaderProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false)

  const [rating, setRating] = useState(clampRating(ratingFromServer))
  useEffect(() => {
    setRating(clampRating(ratingFromServer))
  }, [ratingFromServer])

  const trailerId = useMemo(() => {
    return trailerUrl ? getYoutubeId(trailerUrl) : null
  }, [trailerUrl])

  const safeRating = clampRating(rating)
  const safeHover = clampRating(hoverRating)

  const hasPoster = !!posterUrl
  const hasBanner = !!bannerUrl || !!trailerId
  const isSingleMedia = (hasPoster && !hasBanner) || (!hasPoster && hasBanner)
  const hasNoMedia = !hasPoster && !hasBanner

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{title}</h1>
            <span className="text-xl text-gray-400">{year}</span>
          </div>

          <div className="text-right">
            <div className="text-xl font-bold text-white mb-1">Rating</div>

            <div
              className="flex items-center gap-1 text-primary cursor-pointer"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[...Array(5)].map((_, i) => {
                const starValue = i + 1
                const isFilled = starValue <= (safeHover || Math.floor(safeRating))
                return (
                  <Star
                    key={i}
                    size={20}
                    fill={isFilled ? "currentColor" : "none"}
                    className={isFilled ? "text-primary" : "text-gray-600"}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onClick={() => setIsReviewModalOpen(true)}
                  />
                )
              })}
            </div>

            <span className="text-sm text-gray-400">{safeRating.toFixed(1)}/5</span>

            <ReviewModal
              isOpen={isReviewModalOpen}
              onClose={() => setIsReviewModalOpen(false)}
              movieId={id}
              movieTitle={title}
              initialRating={Math.floor(safeRating)}
            />
          </div>
        </div>

        {!hasNoMedia ? (
          <div
            className={`flex flex-col md:flex-row gap-8 ${
              isSingleMedia ? "justify-center" : ""
            } h-auto md:h-[500px]`}
          >
            {hasPoster && (
              <div
                className={`relative w-full md:w-auto md:aspect-[2/3] h-[500px] md:h-full rounded-lg overflow-hidden shadow-2xl border-4 border-white/10 shrink-0 ${
                  isSingleMedia ? "mx-auto" : ""
                }`}
              >
                <Image src={posterUrl!} alt={title} fill className="object-cover" />
              </div>
            )}

            {hasBanner && (
              <div
                className={`relative w-full ${
                  isSingleMedia ? "md:w-[800px]" : "md:flex-1"
                } h-[300px] md:h-full rounded-lg overflow-hidden bg-black border border-gray-800`}
              >
                {isPlayingTrailer && trailerId ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0"
                  />
                ) : (
                  <div
                    className="relative w-full h-full group cursor-pointer"
                    onClick={() => trailerId && setIsPlayingTrailer(true)}
                  >
                    {bannerUrl ? (
                      <Image
                        src={bannerUrl}
                        alt="Backdrop"
                        fill
                        className="object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <span className="text-gray-600">No Banner Available</span>
                      </div>
                    )}

                    {trailerId && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play size={40} className="text-white fill-white ml-1" />
                          </div>
                        </div>

                        <div className="absolute top-4 left-0 right-0 text-center">
                          <h2 className="text-3xl md:text-5xl font-bold text-primary/80 drop-shadow-lg uppercase tracking-widest">
                            {title}
                          </h2>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-[300px] bg-[#1a1a1a] rounded-lg border border-gray-800 flex items-center justify-center text-gray-500">
            No Media Available
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 mt-8">
          <div className="text-gray-300 space-y-6">
            <p className="text-lg leading-relaxed">{synopsis}</p>

            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/search?genre=${encodeURIComponent(genre)}`}
                  className="px-3 py-1 rounded-full border border-gray-600 text-sm hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>

            <div className="space-y-6 border-t border-gray-800 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#252525] p-3 rounded-lg flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Sutradara</span>
                  {directorUsername ? (
                    <Link
                      href={`/user/${directorUsername}`}
                      className="text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <User size={14} /> {director}
                    </Link>
                  ) : (
                    <span className="text-primary font-medium">{director}</span>
                  )}
                </div>

                <div className="bg-[#252525] p-3 rounded-lg flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Penulis</span>
                  {writerUsername ? (
                    <Link
                      href={`/user/${writerUsername}`}
                      className="text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <User size={14} /> {writer}
                    </Link>
                  ) : (
                    <span className="text-primary font-medium">{writer}</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold mb-3">Pemeran</h3>
                <CastList cast={cast} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-primary text-black font-bold text-center py-4 rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Play size={24} fill="currentColor" />
                Tonton Film
              </a>
            )}

            <div className="bg-[#1a1a1a] p-6 rounded-xl h-fit border border-gray-800">
              <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2">
                Info Film
              </h3>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Durasi</div>
                  <div className="text-white font-medium">
                    {duration && duration !== "0m" ? duration : "TBA"}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500 mb-1">Bahasa</div>
                  <div className="text-white font-medium">{language}</div>
                </div>

                <div>
                  <div className="text-gray-500 mb-1">Tanggal Rilis</div>
                  <div className="text-white font-medium">{releaseDate}</div>
                </div>

                <div>
                  <div className="text-gray-500 mb-1">Produksi</div>
                  <div className="text-white font-medium">DBFPN Studios</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
