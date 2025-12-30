import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { Star } from "lucide-react"

export default async function UserReviewsPage({ params }: { params: { username: string } }) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: params.username },
        { id: !isNaN(Number(params.username)) ? Number(params.username) : undefined },
      ],
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      status: true,
      role: true,
      _count: { select: { reviews: true } },
    },
  })

  if (!user) notFound()

  const displayName = user.username || user.email.split("@")[0]

  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    include: {
      movie: { select: { id: true, title: true, slug: true, posterUrl: true, releaseDate: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Ulasan @{displayName}</h1>
            <p className="text-gray-400 text-sm mt-1">
              Total: {user._count.reviews}
            </p>
          </div>

          <Link
            href={`/user/${encodeURIComponent(params.username)}`}
            className="px-3 py-2 rounded-lg bg-[#252525] hover:bg-[#333] border border-gray-700 text-white text-sm"
          >
            Kembali ke profil
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="text-gray-500 italic">Belum ada ulasan.</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/movie/${r.movie.slug}`} className="font-bold text-white text-lg hover:text-primary">
                      {r.movie.title}
                    </Link>
                    <div className="text-gray-500 text-sm mt-1">
                      {new Date(r.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-sm font-bold">
                    <Star size={14} fill="currentColor" /> {r.rating}
                  </div>
                </div>

                <p className="text-gray-300 mt-4 italic">
                  &quot;{r.content || "Tidak ada komentar"}&quot;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
