// src/lib/authOptions.ts

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// ✅ Hardcoded JWT secret — keep secure in production
const AUTH_SECRET = '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae';

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    balance?: number;
    btcBalance?: number;
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      balance?: number;
      btcBalance?: number;
    };
  }
}

export const authOptions: NextAuthOptions = {
  secret: AUTH_SECRET,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password required');
          }

          await dbConnect();

          const user = await User.findOne({ email: credentials.email.toLowerCase() }).select('+password');
          if (!user) throw new Error('Invalid credentials');

          const isMatch = await user.comparePassword(credentials.password);
          if (!isMatch) throw new Error('Invalid credentials');

          return {
            id:          user._id.toString(),
            name:        user.name,
            email:       user.email,
            role:        (user as any).role || 'user',
            balance:     user.balance || 0,
            btcBalance:  user.btcBalance || 0,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.role        = (user as any).role;
        token.balance     = (user as any).balance;
        token.btcBalance  = (user as any).btcBalance;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id          = token.id;
      session.user.role        = token.role;
      session.user.balance     = token.balance;
      session.user.btcBalance  = token.btcBalance;
      return session;
    }
  },

  pages: {
    signIn: '/auth/signin',
    error:  '/auth/signin',
  },

  events: {
    async signIn({ user }) {
      console.log(`✅ User signed in: ${user?.email}`);
    },
    async signOut({ token }) {
      console.log(`❌ User signed out: ${token?.email}`);
    }
  },

  debug: false,
};
