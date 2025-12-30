import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

type Body = {
  userId?: number
  action?: "ban" | "dismiss"
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const adminId = Number((session?.user as any)?.id)

    if (!session || !Number.isFinite(adminId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const me = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    })

    if (!me || me.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = (await req.json().catch(() => null)) as Body | null
    const userId = Number(body?.userId)
    const action = body?.action

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "userId tidak valid" }, { status: 400 })
    }
    if (action !== "ban" && action !== "dismiss") {
      return NextResponse.json({ error: "action tidak valid" }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    if (action === "ban") {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { status: "banned" },
        }),
        prisma.report.updateMany({
          where: { targetType: "user", targetId: userId, status: "pending" },
          data: { status: "resolved" },
        }),
        prisma.auditLog.create({
          data: {
            adminId,
            action: "ban_user",
            targetType: "user",
            targetId: userId,
            details: { reason: "reports" },
          },
        }),
      ])

      return NextResponse.json({ ok: true, action: "ban" }, { status: 200 })
    }

    // dismiss
    await prisma.$transaction([
      prisma.report.updateMany({
        where: { targetType: "user", targetId: userId, status: "pending" },
        data: { status: "dismissed" },
      }),
      prisma.auditLog.create({
        data: {
          adminId,
          action: "dismiss_reports",
          targetType: "user",
          targetId: userId,
          details: { target: "user" },
        },
      }),
    ])

    return NextResponse.json({ ok: true, action: "dismiss" }, { status: 200 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
