import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AccountStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GENERIC_LOGIN_ERROR } from "@/lib/auth/constants";
import { normalizeUsername } from "@/lib/auth/username";
import { verifyPassword } from "@/lib/auth/password";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        user: { label: "Usuario", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.user || !credentials?.password) {
          throw new Error(GENERIC_LOGIN_ERROR);
        }

        const normalizedUser = normalizeUsername(credentials.user);

        if (!normalizedUser) {
          throw new Error(GENERIC_LOGIN_ERROR);
        }

        const employee = await prisma.employee.findUnique({
          where: { user: normalizedUser },
        });

        if (
          !employee ||
          employee.accountStatus !== AccountStatus.ACTIVE ||
          !employee.password
        ) {
          throw new Error(GENERIC_LOGIN_ERROR);
        }

        const isValid = await verifyPassword(
          credentials.password,
          employee.password
        );

        if (!isValid) {
          throw new Error(GENERIC_LOGIN_ERROR);
        }

        await prisma.employee.update({
          where: { id: employee.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: String(employee.id),
          name: employee.name,
          user: employee.user,
          role: employee.role,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.user = user.user;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.user = token.user;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
