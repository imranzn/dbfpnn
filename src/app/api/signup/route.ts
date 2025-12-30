import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { APP_NAME, APP_URL, MAIL_FROM, mailer } from "@/lib/mailer"
import crypto from "crypto"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const email = String(body?.email ?? "").trim().toLowerCase()

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    })

    // Kalau sudah terdaftar dan sudah verified -> jangan signup lagi
    if (existing?.emailVerified) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 409 }
      )
    }

    // Kalau user belum ada, buat user baru (belum verified)
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          role: "user",
          status: "active",
          emailVerified: null,
        },
        select: { id: true },
      })
    }

    // Pakai tabel VerificationToken bawaan NextAuth
    // Bersihin token lama buat email ini biar tidak numpuk
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    const verifyUrl =
      `${APP_URL}/api/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`

    await mailer.sendMail({
      from: `${APP_NAME} <${MAIL_FROM}>`,
      to: email,
      subject: `Verify your email for ${APP_NAME}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Verifikasi akun ${APP_NAME}</h2>
          <p>Halo,</p>
          <p>Klik tombol ini untuk verifikasi email kamu:</p>
          <p>
            <a href="${verifyUrl}" style="display:inline-block;padding:10px 14px;background:#f5c400;color:#000;text-decoration:none;border-radius:8px;font-weight:bold">
              Verifikasi Email
            </a>
          </p>
          <p>Link berlaku 24 jam.</p>
          <p style="color:#777;font-size:12px">Kalau kamu tidak merasa daftar, abaikan email ini.</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
