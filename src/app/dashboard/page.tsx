import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { Star, Bookmark, UploadCloud, User as UserIcon } from "lucide-react"

export default async function UserDashboard() {
  const session = await auth()
  const rawId = (session?.user as any)?.id
  const userId = Number(rawId)

  if (!session || !Number.isFinite(userId) || !Number.isInteger(userId)) {
    redirect("/signin")
  }

  const [reviewsCount, watchlistCount, submissionsCount, dbUser] = await Promise.all([
    prisma.review.count({ where: { userId } }),
    prisma.watchlist.count({ where: { userId } }),
    prisma.movie.count({ where: { submitterId: userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, role: true, status: true },
    }),
  ])

  if (!dbUser) redirect("/signin")

  const username = dbUser.username || dbUser.email.split("@")[0]
  const initial = username.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-white/5 border border-gray-800 text-gray-200">
            <UserIcon size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400 text-sm">Ringkasan aktivitas akun kamu.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Reviews" value={reviewsCount} icon={<Star size={18} />} />
          <StatCard title="Watchlist" value={watchlistCount} icon={<Bookmark size={18} />} />
          <StatCard title="Submissions" value={submissionsCount} icon={<UploadCloud size={18} />} />
        </div>

        <div className="bg-[#121212] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-200">
              {initial}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-bold">{username}</div>

                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    dbUser.status === "banned"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-green-500/10 text-green-400 border-green-500/20"
                  }`}
                >
                  {dbUser.status}
                </span>

                {dbUser.role === "admin" && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-primary/10 text-primary border-primary/20">
                    admin
                  </span>
                )}
              </div>

              <div className="text-gray-400 text-sm mt-1">{dbUser.email}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <MiniCard label="User ID" value={String(dbUser.id)} />
            <MiniCard label="Role" value={dbUser.role} />
            <MiniCard label="Status" value={dbUser.status} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="bg-[#121212] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 rounded-lg bg-white/5 text-gray-200">{icon}</div>
        <div className="text-3xl font-bold">{value}</div>
      </div>
      <div className="text-gray-400 text-sm">{title}</div>
    </div>
  )
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl p-4">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="text-white font-bold mt-1">{value}</div>
    </div>
  )
}
