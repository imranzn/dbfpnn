import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { ShieldAlert, Users, Clock, Flag } from "lucide-react"
import ReportDetailButton from "@/components/admin/ReportDetailButton"
import ModerationActions from "@/components/admin/ModerationActions"

type Row = {
  user: {
    id: number
    username: string | null
    email: string
    status: string
    role: string
  } | null
  count: number
  lastAt: Date | null
}

export default async function AdminModerationPage() {
  const session = await auth()
  const rawId = (session?.user as any)?.id
  const adminId = Number(rawId)

  if (!session || !Number.isFinite(adminId)) redirect("/signin")

  const me = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  })

  if (!me || me.role !== "admin") redirect("/dashboard/user")

  const [pendingCount, oldestPending] = await Promise.all([
    prisma.report.count({
      where: { targetType: "user", status: "pending" },
    }),
    prisma.report.findFirst({
      where: { targetType: "user", status: "pending" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ])

  // Poin 3 dan 4: user yang pernah dilapor, urut terbanyak
  const grouped = await prisma.report.groupBy({
    by: ["targetId"],
    where: { targetType: "user" },
    _count: { targetId: true },
    _max: { createdAt: true },
    orderBy: { _count: { targetId: "desc" } },
    take: 100,
  })

  const userIds = grouped.map((g) => g.targetId)

  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, email: true, status: true, role: true },
      })
    : []

  const userMap = new Map(users.map((u) => [u.id, u]))

  const rows: Row[] = grouped.map((g) => ({
    user: userMap.get(g.targetId) ?? null,
    count: g._count?.targetId ?? 0,
    lastAt: g._max?.createdAt ?? null,
  }))

  const totalReportedUsers = rows.filter((r) => !!r.user).length

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Moderasi</h1>
            <p className="text-gray-400 text-sm">Laporan pengguna, urut dari yang paling banyak.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#121212] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-400">
                <Flag size={18} />
              </div>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </div>
            <div className="text-gray-400 text-sm">Laporan pending</div>
          </div>

          <div className="bg-[#121212] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                <Users size={18} />
              </div>
              <div className="text-2xl font-bold">{totalReportedUsers}</div>
            </div>
            <div className="text-gray-400 text-sm">Akun yang pernah dilapor</div>
          </div>

          <div className="bg-[#121212] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                <Clock size={18} />
              </div>
              <div className="text-sm font-bold text-white">
                {oldestPending?.createdAt
                  ? new Date(oldestPending.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </div>
            </div>
            <div className="text-gray-400 text-sm">Laporan pending terlama</div>
          </div>
        </div>

        <div className="bg-[#121212] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-bold">Daftar akun dilaporkan</h2>
            <p className="text-gray-400 text-sm mt-1">Diurut berdasarkan jumlah laporan (terbanyak di atas).</p>
          </div>

          <div className="p-6">
            {rows.length === 0 ? (
              <div className="text-gray-500 text-center py-10">Belum ada laporan.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400">
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 pr-4">Akun</th>
                      <th className="text-left py-3 pr-4">Jumlah laporan</th>
                      <th className="text-left py-3 pr-4">Terakhir dilapor</th>
                      <th className="text-left py-3 pr-0">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((r) => {
                      const u = r.user
                      const username =
                        u?.username || u?.email?.split("@")[0] || (u?.id ? `User#${u.id}` : "Unknown")

                      return (
                        <tr
                          key={u?.id ?? `missing-${r.count}-${String(r.lastAt)}`}
                          className="border-b border-gray-800"
                        >
                          <td className="py-4 pr-4">
                            {u ? (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-300 uppercase">
                                  {username.charAt(0)}
                                </div>

                                <div>
                                  <div className="font-bold text-white leading-tight">{username}</div>
                                  <div className="text-gray-500 text-xs leading-tight">{u.email}</div>

                                  <div className="mt-2 flex gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                        u.status === "banned"
                                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                                          : "bg-green-500/10 text-green-400 border-green-500/20"
                                      }`}
                                    >
                                      {u.status}
                                    </span>

                                    {u.role === "admin" && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-primary/10 text-primary border-primary/20">
                                        admin
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">
                                User tidak ditemukan (mungkin sudah dihapus)
                              </span>
                            )}
                          </td>

                          <td className="py-4 pr-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold">
                              <Flag size={14} />
                              {r.count}
                            </span>
                          </td>

                          <td className="py-4 pr-4 text-gray-300">
                            {r.lastAt
                              ? new Date(r.lastAt).toLocaleString("id-ID", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </td>

                          <td className="py-4 pr-0">
                            {u ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <ReportDetailButton userId={u.id} username={username} />

                                <ModerationActions
                                  userId={u.id}
                                  username={username}
                                  disabled={u.role === "admin"}
                                />
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="text-gray-600 text-xs mt-6"></div>
      </div>
    </div>
  )
}
