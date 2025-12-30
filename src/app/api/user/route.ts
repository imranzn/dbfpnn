import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const reporterIdRaw = (session?.user as any)?.id
    const reporterId = Number(reporterIdRaw)

    if (!session || !Number.isFinite(reporterId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const targetUserId = Number(body?.targetUserId)
    const reason = String(body?.reason ?? "").trim()

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return NextResponse.json({ error: "targetUserId tidak valid" }, { status: 400 })
    }

    if (targetUserId === reporterId) {
      return NextResponse.json({ error: "Tidak bisa melaporkan akun sendiri" }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ error: "Alasan laporan wajib diisi" }, { status: 400 })
    }

    if (reason.length > 200) {
      return NextResponse.json({ error: "reason kepanjangan (max 200)" }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Target user tidak ditemukan" }, { status: 404 })
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType: "user",
        targetId: targetUserId,
        reason,
        status: "pending",
      },
      select: { id: true, createdAt: true },
    })

    return NextResponse.json({ ok: true, report }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
