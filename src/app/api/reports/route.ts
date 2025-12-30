import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  const session = await auth()
  const rawId = (session?.user as any)?.id
  const reporterId = Number(rawId)

  if (!session || !Number.isInteger(reporterId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "BAD_JSON" }, { status: 400 })
  }

  const targetType = String(body?.targetType ?? "")
  const targetId = Number(body?.targetId)
  const reason = String(body?.reason ?? "").trim()

  if (!["user", "movie", "comment"].includes(targetType)) {
    return NextResponse.json({ error: "INVALID_TARGET_TYPE" }, { status: 400 })
  }

  if (!Number.isInteger(targetId) || targetId <= 0) {
    return NextResponse.json({ error: "INVALID_TARGET_ID" }, { status: 400 })
  }

  if (reason.length < 3) {
    return NextResponse.json({ error: "REASON_TOO_SHORT" }, { status: 400 })
  }

  try {
    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType,
        targetId,
        reason,
        status: "pending",
      },
      select: { id: true, createdAt: true },
    })

    return NextResponse.json({ ok: true, report }, { status: 201 })
  } catch (e) {
    console.error("REPORT_CREATE_ERROR", e)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}
