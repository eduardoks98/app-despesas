import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      isPremium?: boolean
      isAdmin?: boolean
    }
    accessToken?: string
  }

  interface User {
    id: string
    email: string
    name?: string
    isPremium?: boolean
    isAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    isPremium?: boolean
    isAdmin?: boolean
    accessToken?: string
  }
}