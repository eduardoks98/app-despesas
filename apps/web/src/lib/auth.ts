import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Mock authentication for testing
          // In production, this would call your backend API
          const user = {
            id: '1',
            email: credentials.email,
            name: 'Test User',
            isPremium: false,
            isAdmin: false
          }

          return user
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isPremium = user.isPremium
        token.isAdmin = user.isAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.isPremium = token.isPremium
        session.user.isAdmin = token.isAdmin
        session.accessToken = token.accessToken
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register'
  }
}