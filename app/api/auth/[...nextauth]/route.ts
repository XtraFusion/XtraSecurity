import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"
import prisma from "@/lib/db"

const prismaAdapter = {
  createUser: async (data: any) => {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        image: data.image,
        emailVerified: data.emailVerified,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    return user
  },
  getUser: async (id: string) => {
    try {
      return await prisma.user.findUnique({ where: { id } })
    } catch (error) {
      return null
    }
  },
  getUserByEmail: async (email: string) => {
    try {
      return await prisma.user.findUnique({ where: { email } })
    } catch (error) {
      return null
    }
  },
  getUserByAccount: async ({ providerAccountId, provider }: any) => {
    try {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            providerAccountId,
            provider,
          },
        },
        include: { user: true },
      })
      return account?.user ?? null
    } catch (error) {
      return null
    }
  },
  updateUser: async (data: any) => {
    try {
      return await prisma.user.update({
        where: { id: data.id },
        data: {
          name: data.name,
          email: data.email,
          image: data.image,
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      return null
    }
  },
  linkAccount: async (data: any) => {
    try {
      return await prisma.account.create({
        data: {
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state,
        },
      })
    } catch (error) {
      return null
    }
  },
  createSession: async (data: any) => {
    try {
      return await prisma.session.create({
        data: {
          userId: data.userId,
          expires: data.expires,
          sessionToken: data.sessionToken,
        },
      })
    } catch (error) {
      return null
    }
  },
  getSessionAndUser: async (sessionToken: string) => {
    try {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })
      if (!session) return null
      return {
        session: {
          userId: session.userId,
          expires: session.expires,
          sessionToken: session.sessionToken,
        },
        user: session.user,
      }
    } catch (error) {
      return null
    }
  },
  deleteSession: async (sessionToken: string) => {
    try {
      return await prisma.session.delete({ where: { sessionToken } })
    } catch (error) {
      return null
    }
  },
}

export const authOptions: NextAuthOptions = {
  adapter: prismaAdapter as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.role = user.role || "user"
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions as any )
export { handler as GET, handler as POST }
