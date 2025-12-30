import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(_: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    const rawId = (session?.user as any)?.id
    const adminId = Number(rawId)

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

    const userId = Number(params.userId)
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "userId tidak valid" }, { status: 400 })
    }

    const reports = await prisma.report.findMany({
      where: { targetType: "user", targetId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reason: true,
        createdAt: true,
        reporter: {
          select: { id: true, username: true, email: true },
        },
      },
    })

    return NextResponse.json({ reports }, { status: 200 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
