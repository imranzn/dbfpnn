import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = String(url.searchParams.get("email") ?? "").trim().toLowerCase()
  const token = String(url.searchParams.get("token") ?? "").trim()

  if (!email || !token) {
    return NextResponse.redirect(new URL("/signin?verified=0", url.origin))
  }

  const vt = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  })

  if (!vt) {
    return NextResponse.redirect(new URL("/signin?verified=0", url.origin))
  }

  if (vt.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    return NextResponse.redirect(new URL("/signin?verified=0", url.origin))
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  })

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  return NextResponse.redirect(new URL("/signin?verified=1", url.origin))
}
