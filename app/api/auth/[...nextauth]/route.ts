import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import prisma from "@/lib/db"

const prismaAdapter = {
  createUser: async (data: any) => {
    // create user, personal workspace and default subscription
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

    try {
      // create a personal workspace for the user
      const workspaceName = data.name ? `${data.name}'s workspace` : "Personal Workspace";
      await prisma.workspace.create({
        data: {
          name: workspaceName,
          description: "Personal workspace",
          workspaceType: "personal",
          createdBy: user.id,
          subscriptionPlan: "free",
          // subscriptionEnd left null for free (no expiry) or set a year from now
          subscriptionEnd: null,
          // createdAt/updatedAt are defaulted by Prisma
        },
      })

      // create user subscription record with a 1 year expiry by default
      const oneYear = 1000 * 60 * 60 * 24 * 365;
      await prisma.userSubscription.create({
        data: {
          userId: user.id,
          plan: "free",
          workspaceLimit: 3,
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + oneYear),
        },
      })
    } catch (e) {
      // don't fail user creation if workspace/subscription creation fails; log for debugging
      console.error("Failed to create workspace/subscription for new user:", e)
    }

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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For demo purposes, accept hardcoded admin credentials
        if (credentials.email === "admin@example.com" && credentials.password === "password") {
          // Try to find user in database
          try {
            let user = await prisma.user.findUnique({
              where: { email: credentials.email }
            })

            // If user doesn't exist, create them
            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: credentials.email,
                  name: "Admin User",
                  role: "admin",
                  emailVerified: new Date(),
                }
              })

              // Create workspace and subscription for new user
              try {
                await prisma.workspace.create({
                  data: {
                    name: "Admin's workspace",
                    description: "Personal workspace",
                    workspaceType: "personal",
                    createdBy: user.id,
                    subscriptionPlan: "free",
                    subscriptionEnd: null,
                  },
                })

                const oneYear = 1000 * 60 * 60 * 24 * 365
                await prisma.userSubscription.create({
                  data: {
                    userId: user.id,
                    plan: "free",
                    workspaceLimit: 3,
                    status: "active",
                    startDate: new Date(),
                    endDate: new Date(Date.now() + oneYear),
                  },
                })
              } catch (e) {
                console.error("Failed to create workspace/subscription:", e)
              }
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              tier: user.tier || "free",
            }
          } catch (error) {
            console.error("Database error during authentication:", error)
            return null
          }
        }

        return null
      }
    }),
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
        token.tier = user.tier || "free"
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.tier = token.tier
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions as any )
export { handler as GET, handler as POST }
