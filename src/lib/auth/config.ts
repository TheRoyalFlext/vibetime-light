import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { SupabaseLightAdapter } from "./adapter"

export const authConfig: NextAuthConfig = {
  adapter: SupabaseLightAdapter(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user }) {
      const domain = process.env.ALLOWED_EMAIL_DOMAIN ?? "@storysuccess.fr"
      return user.email?.endsWith(domain) ?? false
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage = nextUrl.pathname.startsWith("/auth")
      if (isAuthPage) return isLoggedIn ? Response.redirect(new URL("/dashboard", nextUrl)) : true
      return isLoggedIn
    },
  },
}
