import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        if (dbUser) {
          if (dbUser.role !== 'ADMIN') {
            const count = await prisma.user.count({ where: { role: 'ADMIN' } })
            if (count === 0) {
              await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
              dbUser.role = 'ADMIN'
            }
          }
          ;(session.user as any).role = dbUser.role
        }
      }
      return session
    }
  }
})
