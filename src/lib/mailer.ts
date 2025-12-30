import nodemailer from "nodemailer"

function must(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export const mailer = nodemailer.createTransport({
  host: must("SMTP_HOST"),
  port: Number(must("SMTP_PORT")),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: {
    user: must("SMTP_USER"),
    pass: must("SMTP_PASS"),
  },
})

export const MAIL_FROM = process.env.MAIL_FROM || must("SMTP_USER")
export const APP_URL = must("APP_URL") // contoh: http://localhost:8000
export const APP_NAME = process.env.APP_NAME || "DBFPN"
