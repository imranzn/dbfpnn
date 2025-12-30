import { Star, Calendar, Award, Film, MessageSquare, Instagram, Twitter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import RatingStats from "@/components/user/RatingStats"
import { auth } from "@/auth"
import ReportUserButton from "@/components/user/ReportUserButton"

export default async function UserProfile({ params }: { params: { username: string } }) {
  const session = await auth()
  const viewerIdRaw = (session?.user as any)?.id
  const viewerId = Number.isFinite(Number(viewerIdRaw)) ? Number(viewerIdRaw) : null

  // ambil role viewer dari DB, jangan percaya session
  let isAdminViewer = false
  if (viewerId) {
    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { role: true },
    })
    isAdminViewer = viewer?.role === "admin"
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: params.username },
        { id: !isNaN(Number(params.username)) ? Number(params.username) : undefined },
      ],
    },
    include: {
      reviews: {
        include: { movie: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      movies: {
        where: { status: "approved" },
        orderBy: { releaseDate: "desc" },
        take: 6,
      },
      _count: {
        select: {
          reviews: true,
          movies: { where: { status: "approved" } },
          watchlist: true,
        },
      },
    },
  })

  if (!user) notFound()

  const joinDate = new Date(user.createdAt).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })

  const displayName = user.username || user.email.split("@")[0]

  // rating stats
  const allRatings = await prisma.review.findMany({
    where: { userId: user.id },
    select: { rating: true },
  })

  const ratingStats: Record<number, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
  }

  allRatings.forEach((r) => {
    if (ratingStats[r.rating] !== undefined) ratingStats[r.rating]++
  })

  const totalRatings = allRatings.length

  const reviewsLink = `/user/${encodeURIComponent(params.username)}/reviews`
  const adminModerationLink = `/dashboard/admin/moderation?userId=${user.id}`

  const roleLabel = user.role === "admin" ? "Admin" : "Anggota"
  const roleBadgeClass =
    user.role === "admin"
      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      : "bg-primary/10 text-primary border-primary/20"

  const roleBadge = (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${roleBadgeClass}`}
      title={isAdminViewer ? "Klik untuk moderasi user" : undefined}
    >
      <Award size={14} /> {roleLabel}
    </span>
  )

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-grow pt-8 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 mb-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center text-5xl font-bold text-gray-400 border-4 border-[#121212] uppercase">
                {(user.username || user.email).charAt(0)}
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold">{displayName}</h1>
                    <p className="text-gray-400">@{user.username || "user"}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isAdminViewer ? (
                      <Link href={adminModerationLink} className="hover:opacity-90">
                        {roleBadge}
                      </Link>
                    ) : (
                      roleBadge
                    )}

                    {viewerId !== user.id && (
                      <ReportUserButton
                        viewerId={viewerId}
                        targetUserId={user.id}
                        targetUsername={user.username}
                      />
                    )}
                  </div>
                </div>

                <p className="text-gray-300 mb-4">
                  {user.bio || "Belum ada bio."}
                </p>

                <div className="flex gap-4 mb-6">
                  {(user.socialLinks as any)?.instagram && (
                    <a
                      href={`https://instagram.com/${(user.socialLinks as any).instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-400 hover:text-[#E1306C] text-sm"
                    >
                      <Instagram size={18} /> @{(user.socialLinks as any).instagram}
                    </a>
                  )}
                  {(user.socialLinks as any)?.twitter && (
                    <a
                      href={`https://twitter.com/${(user.socialLinks as any).twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-400 hover:text-[#1DA1F2] text-sm"
                    >
                      <Twitter size={18} /> @{(user.socialLinks as any).twitter}
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-6 text-sm text-gray-400 border-t border-gray-700 pt-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    Bergabung {joinDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <Film size={18} className="text-primary" />
                    {user._count.movies} Film Publikasi
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-primary" />
                    {user._count.reviews} Ulasan
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Film className="text-primary" /> Film Publikasi
                </h2>

                {user.movies.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.movies.map((movie) => (
                      <Link
                        key={movie.id}
                        href={`/movie/${movie.slug}`}
                        className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 hover:border-primary transition flex gap-4"
                      >
                        <div className="w-16 h-24 bg-gray-800 rounded-lg overflow-hidden relative">
                          {movie.posterUrl ? (
                            <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                              No img
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold line-clamp-1">{movie.title}</h3>
                          <p className="text-gray-400 text-sm">
                            {movie.releaseDate
                              ? new Date(movie.releaseDate).getFullYear()
                              : "-"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Belum ada film yang dipublikasikan.</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="text-primary" /> Ulasan Terbaru
                  </h2>
                  <Link href={reviewsLink} className="text-sm text-gray-400 hover:text-primary">
                    Lihat semua
                  </Link>
                </div>

                <div className="space-y-4">
                  {user.reviews.length > 0 ? (
                    user.reviews.map((review) => (
                      <div key={review.id} className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                        <div className="flex justify-between mb-4">
                          <div>
                            <Link
                              href={`/movie/${review.movie.slug}`}
                              className="font-bold text-lg hover:text-primary"
                            >
                              {review.movie.title}
                            </Link>
                            <p className="text-gray-500 text-sm">
                              {new Date(review.createdAt).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-sm font-bold">
                            <Star size={14} fill="currentColor" /> {review.rating}
                          </div>
                        </div>
                        <p className="text-gray-300 italic">
                          "{review.content || "Tidak ada komentar"}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">Belum ada ulasan.</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Link href={reviewsLink}>
                <RatingStats ratingStats={ratingStats} totalRatings={totalRatings} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
