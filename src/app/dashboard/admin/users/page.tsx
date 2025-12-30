import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import ReportDetailButton from "@/components/admin/ReportDetailButton"

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const rawAdminId = (session?.user as any)?.id
  const adminId = Number(rawAdminId)

  if (!session || !Number.isInteger(adminId)) redirect("/signin")

  const me = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  })
  if (!me || me.role !== "admin") redirect("/dashboard/user")

  const userId = Number(params.id)
  if (!Number.isInteger(userId)) redirect("/dashboard/admin/moderation")

  const [u, reportsCount, lastReport] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, role: true, status: true, createdAt: true },
    }),
    prisma.report.count({
      where: { targetType: "user", targetId: userId },
    }),
    prisma.report.findFirst({
      where: { targetType: "user", targetId: userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, reason: true, status: true },
    }),
  ])

  if (!u) redirect("/dashboard/admin/moderation")

  const username = u.username || u.email.split("@")[0]

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-6">
          <Link href="/dashboard/admin/moderation" className="text-sm text-gray-400 hover:text-white">
            Kembali ke Moderasi
          </Link>
        </div>

        <div className="bg-[#121212] border border-gray-800 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-bold">{username}</div>
              <div className="text-gray-400 text-sm">{u.email}</div>

              <div className="mt-3 flex gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    u.status === "banned"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-green-500/10 text-green-400 border-green-500/20"
                  }`}
                >
                  {u.status}
                </span>

                <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-primary/10 text-primary border-primary/20">
                  {u.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ReportDetailButton userId={u.id} username={username} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Total laporan</div>
              <div className="text-2xl font-bold mt-1">{reportsCount}</div>
            </div>

            <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Laporan terakhir</div>
              <div className="text-sm mt-1">
                {lastReport?.createdAt
                  ? new Date(lastReport.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </div>
              <div className="text-gray-500 text-xs mt-2 line-clamp-2">
                {lastReport?.reason ?? "Belum ada laporan."}
              </div>
            </div>
          </div>
        </div>

        <div className="text-gray-600 text-xs mt-6">
          Halaman ini cuma target klik badge. Aksi ban/unban nanti bisa kamu tambah di sini.
        </div>
      </div>
    </div>
  )
}
