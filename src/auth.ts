import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
    }),
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
  ]
})
