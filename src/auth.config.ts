import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  session: { strategy: "jwt" },
  providers: [], // configure providers in auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.sub as string
        ;(session.user as any).role = token.role as string
      }
      return session
    }
  }
} satisfies NextAuthConfig
