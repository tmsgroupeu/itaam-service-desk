import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Temp Bypass",
      credentials: {
        email: { label: "Email (Type anything)", type: "email", placeholder: "admin@test.com" },
        role: { label: "Role", type: "text", placeholder: "ADMIN or EMPLOYEE" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        
        const reqRole = (credentials.role as string)?.toUpperCase() === 'EMPLOYEE' ? 'EMPLOYEE' : 'ADMIN'
        
        let user = await prisma.user.findFirst({ where: { email: credentials.email as string } })
        if (!user) {
          user = await prisma.user.create({
            data: { email: credentials.email as string, name: (credentials.email as string).split('@')[0], role: reqRole }
          })
        } else if (credentials.role && user.role !== reqRole) {
          // If the user logs in with a specific role, update their role for testing purposes
          user = await prisma.user.update({
            where: { id: user.id },
            data: { role: reqRole }
          })
        }
        
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    }),
  ],
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
})
