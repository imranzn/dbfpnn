import type { NextAuthConfig } from "next-auth"
import { NextResponse } from "next/server"

export const authConfig = {
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin?verify=true",
  },

  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        ;(session.user as any).id = Number((token as any).id)
        ;(session.user as any).email = (token as any).email
        ;(session.user as any).name = (token as any).name
        ;(session.user as any).username = (token as any).username
        ;(session.user as any).role = (token as any).role
        ;(session.user as any).avatar_url = (token as any).avatar_url
        ;(session.user as any).bio = (token as any).bio
        ;(session.user as any).status = (token as any).status
      }
      return session
    },

    async jwt({ token, user }) {
      if (user) {
        ;(token as any).id = Number((user as any).id)
        ;(token as any).email = (user as any).email
        ;(token as any).name = (user as any).name
        ;(token as any).username = (user as any).username
        ;(token as any).role = (user as any).role
        ;(token as any).avatar_url = (user as any).avatar_url
        ;(token as any).bio = (user as any).bio
        ;(token as any).status = (user as any).status
      }
      return token
    },

    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const path = request.nextUrl.pathname

      const isOnDashboard = path.startsWith("/dashboard")
      const isOnAuth = path.startsWith("/signin") || path.startsWith("/register")

      if (isOnDashboard) return isLoggedIn

      if (isOnAuth && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
      }

      return true
    },
  },

  providers: [],
} satisfies NextAuthConfig
