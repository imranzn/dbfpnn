import NextAuth from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { authConfig } from "./auth.config"

function IntIdPrismaAdapter(p: typeof prisma) {
  const base = PrismaAdapter(p) as any

  return {
    ...base,

    async getUser(id: any) {
      if (!id) return null
      const numId = Number(id)
      if (!Number.isFinite(numId)) return null
      return p.user.findUnique({ where: { id: numId } })
    },

    async updateUser(user: any) {
      if (!user?.id) return null
      const numId = Number(user.id)
      return p.user.update({
        where: { id: numId },
        data: { ...user, id: undefined },
      })
    },

    async deleteUser(id: any) {
      if (!id) return null
      const numId = Number(id)
      return p.user.delete({ where: { id: numId } })
    },
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: IntIdPrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  debug: false,
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
})
