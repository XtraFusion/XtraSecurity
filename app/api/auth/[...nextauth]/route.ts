import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import prisma from "@/lib/db"

// Helper: upsert a Google user and create their workspace + subscription on first sign-in
async function upsertGoogleUser(profile: { email: string; name?: string | null; image?: string | null }) {
  let user = await prisma.user.findUnique({ where: { email: profile.email } })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name ?? profile.email.split("@")[0],
        image: profile.image ?? null,
        emailVerified: new Date(),
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Create personal workspace + free subscription for new users
    try {
      const workspaceName = user.name ? `${user.name}'s workspace` : "Personal Workspace"
      await prisma.workspace.create({
        data: {
          name: workspaceName,
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
      console.error("[auth] Failed to create workspace/subscription for new Google user:", e)
    }
  } else {
    // Update profile image if changed
    if (profile.image && profile.image !== user.image) {
      await prisma.user.update({
        where: { id: user.id },
        data: { image: profile.image, updatedAt: new Date() },
      })
    }
  }

  return user
}

export const authOptions: NextAuthOptions = {
  // No adapter — we manage DB writes manually in callbacks (required for JWT strategy + OAuth)
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Demo admin credentials
        if (credentials.email === "admin@example.com" && credentials.password === "password") {
          try {
            let user = await prisma.user.findUnique({ where: { email: credentials.email } })

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: credentials.email,
                  name: "Admin User",
                  role: "admin",
                  emailVerified: new Date(),
                },
              })

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
                console.error("[auth] Failed to create workspace/subscription for admin:", e)
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
            console.error("[auth] Database error during credentials auth:", error)
            return null
          }
        }

        return null
      },
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
    async signIn({ user, account }) {
      // For Google OAuth: upsert the user in our DB and attach their DB id to the token
      if (account?.provider === "google" && user.email) {
        try {
          const dbUser = await upsertGoogleUser({
            email: user.email,
            name: user.name,
            image: user.image,
          })
          // Attach DB id so jwt callback can embed it in the token
          user.id = dbUser.id
          ;(user as any).role = dbUser.role
          ;(user as any).tier = (dbUser as any).tier || "free"
        } catch (e) {
          console.error("[auth] Failed to upsert Google user:", e)
          return false // Deny sign-in if DB write fails
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "user"
        token.tier = (user as any).tier || "free"
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).tier = token.tier
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
}

const handler = NextAuth(authOptions as any)
export { handler as GET, handler as POST }
