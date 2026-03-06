import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

type CredentialsInput = {
  email: string;
  password: string;
};

function parseCredentials(
  credentials: Record<string, unknown> | undefined,
): CredentialsInput | null {
  const email =
    typeof credentials?.email === "string" ? credentials.email.trim() : "";
  const password =
    typeof credentials?.password === "string" ? credentials.password : "";

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  ...(process.env.NEXTAUTH_SECRET
    ? { secret: process.env.NEXTAUTH_SECRET }
    : {}),
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const parsedCredentials = parseCredentials(credentials);

        if (!parsedCredentials) {
          return null;
        }

        const user = await prisma.user.findUnique({
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            passwordHash: true,
          },
          where: {
            email: parsedCredentials.email,
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const passwordIsValid = await verifyPassword(
          parsedCredentials.password,
          user.passwordHash,
        );

        if (!passwordIsValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      if (!session.user || !token.sub) {
        return session;
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
