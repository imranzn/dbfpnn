import { NextResponse } from "next/server"
import { auth } from "@/auth" // pastikan file ini ada
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const { movieId, rating, comment } = body

    const mId = Number(movieId)
    const r = Number(rating)
    const uId = Number(session?.user?.id)

    if (!session || !uId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const valid = Number.isInteger(mId) && mId > 0 && r >= 1 && r <= 5
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid payload", detail: { movieId, rating } },
        { status: 400 }
      )
    }

    const review = await prisma.review.upsert({
      where: { userId_movieId: { userId: uId, movieId: mId } },
      update: { rating: r, content: comment ?? null },
      create: { userId: uId, movieId: mId, rating: r, content: comment ?? null },
    })

    return NextResponse.json({ success: true, review }, { status: 201 })
  } catch (e: any) {
    console.error("POST /api/ratings error:", e)
    return NextResponse.json(
      { error: "Failed to submit review", detail: e?.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const reviews = await prisma.review.findMany()
    return NextResponse.json(reviews)
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to fetch reviews", detail: e?.message },
      { status: 500 }
    )
  }
}
