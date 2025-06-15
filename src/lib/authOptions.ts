import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

interface MongooseUser {
  _id: any;
  name: string;
  email: string;
  role: string;
  balance: number;
  password: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
}

// Extend NextAuth JWT
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    balance?: number;
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      id?: string;
      role?: string;
      balance?: number;
    };
  }
}

const handler = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error('Email and password required');
        }

        await dbConnect();

        const mongooseUser = (await User.findOne({
          email: credentials.email.toLowerCase(),
        })
          .select('+password')
          .lean()) as MongooseUser | null;

        if (!mongooseUser) {
          throw new Error('No user found with that email');
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          mongooseUser.password
        );

        if (!isValid) {
          throw new Error('Incorrect password');
        }

        return {
          id: mongooseUser._id.toString(),
          name: mongooseUser.name,
          email: mongooseUser.email,
          role: mongooseUser.role,
          balance: mongooseUser.balance,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  secret: '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae',
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as AuthUser).id;
        token.role = (user as AuthUser).role;
        token.balance = (user as AuthUser).balance;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || '';
        session.user.role = token.role || 'user';
        session.user.balance = token.balance || 0;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
