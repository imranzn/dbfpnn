import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Clock, Star, Film } from "lucide-react"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"

export default async function UserDashboard() {
  const session = await auth()
  const user = session?.user

  if (!user) return null

  const userId = Number(user.id)

  const [reviewsCount, watchlistCount, submissionsCount, dbUser] =
    await Promise.all([
      prisma.review.count({ where: { userId } }),
      prisma.watchlist.count({ where: { userId } }),
      prisma.movie.count({ where: { submitterId: userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true, username: true, name: true },
      }),
    ])

  const joinDate = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      })
    : "-"

  const recentReviews = await prisma.review.findMany({
    where: { userId },
    include: { movie: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  })

  return (
    <DashboardLayout user={dbUser}>
      <h1 className="text-3xl font-bold text-white mb-8">Ringkasan</h1>

      {/* Profile Card */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-4xl font-bold text-gray-400 uppercase">
            {(dbUser?.name || user.name || user.email || "U").charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {dbUser?.name || user.name || "Pengguna"}
            </h2>
            <p className="text-gray-400">
              @{dbUser?.username || user.email?.split("@")[0]} • Anggota sejak{" "}
              {joinDate}
            </p>
            <div className="flex gap-2 mt-3">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/20">
                Anggota {(user as any).role === "admin" ? "Admin" : "Gratis"}
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/user/${dbUser?.username || user.id}`}
          className="px-4 py-2 bg-[#252525] hover:bg-[#333] text-white rounded-lg font-medium transition-colors border border-gray-700"
        >
          Lihat Profil
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
              <Film size={24} />
            </div>
            <div className="text-2xl font-bold text-white">{watchlistCount}</div>
          </div>
          <div className="text-gray-400 text-sm">Film di Watchlist</div>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
              <Star size={24} />
            </div>
            <div className="text-2xl font-bold text-white">{reviewsCount}</div>
          </div>
          <div className="text-gray-400 text-sm">Ulasan Diberikan</div>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
              <Clock size={24} />
            </div>
            <div className="text-2xl font-bold text-white">
              {submissionsCount}
            </div>
          </div>
          <div className="text-gray-400 text-sm">Film Dikirim</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">Aktivitas Terbaru</h3>
        </div>

        <div className="p-6">
          {recentReviews.length > 0 ? (
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-800 last:border-0 last:pb-0"
                >
                  <div className="p-2 rounded-lg bg-gray-800 text-gray-400">
                    <Star size={16} />
                  </div>

                  <div>
                    <p className="text-white">
                      Anda memberikan rating{" "}
                      <span className="font-bold text-yellow-500">
                        {review.rating}/5
                      </span>{" "}
                      untuk film{" "}
                      <Link
                        href={`/movie/${review.movie.slug}`}
                        className="text-primary hover:underline"
                      >
                        {review.movie.title}
                      </Link>
                    </p>

                    <p className="text-gray-500 text-sm mt-1">
                      {new Date(
                        review.updatedAt ?? review.createdAt
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>

                    {review.content && (
                      <p className="text-gray-400 text-sm mt-2 italic">
                        &quot;{review.content}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Belum ada aktivitas yang tercatat.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
