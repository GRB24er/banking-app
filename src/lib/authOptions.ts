import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// Type declarations
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

// Extended JWT type
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    balance?: number;
  }
}

// Extended Session type
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

// Password comparison with timing-safe equality
const comparePasswords = async (inputPassword: string, hashedPassword: string) => {
  try {
    return await bcrypt.compare(inputPassword, hashedPassword);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials.password) {
            throw new Error('Both email and password are required');
          }

          await dbConnect();

          const mongooseUser = await User.findOne({
            email: credentials.email.toLowerCase()
          }).select('+password').lean() as MongooseUser | null;

          if (!mongooseUser) {
            throw new Error('Invalid credentials');
          }

          const isValid = await comparePasswords(
            credentials.password,
            mongooseUser.password
          );

          if (!isValid) {
            throw new Error('Invalid credentials');
          }

          return {
            id: mongooseUser._id.toString(),
            name: mongooseUser.name,
            email: mongooseUser.email,
            role: mongooseUser.role,
            balance: mongooseUser.balance
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin' // Redirect to signin on auth errors
  },
  secret: '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae',
  callbacks: {
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
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn({ user }) {
      console.log(`User ${user.email} signed in`);
    },
    async signOut({ token }) {
      console.log(`User ${token.email} signed out`);
    }
  }
};