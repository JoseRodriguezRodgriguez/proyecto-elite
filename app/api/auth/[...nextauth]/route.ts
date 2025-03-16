import NextAuth, {
  AuthOptions,
  type Account,
  type Profile,
  type Session,
  type User,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
// Si usas bcrypt
import { compare } from "bcryptjs";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        user: { label: "Usuario", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.user || !credentials?.password) {
          throw new Error("Faltan credenciales");
        }

        // Buscar en la tabla Employee
        const employee = await prisma.employee.findUnique({
          where: { user: credentials.user },
        });
        if (!employee) throw new Error("No existe usuario");

        // OJO: si usas bcrypt:
        // const isValid = await compare(credentials.password, employee.password)
        // if (!isValid) throw new Error("Password incorrecto");

        // Si usas texto plano, haz:
        if (employee.password !== credentials.password) {
          throw new Error("Password incorrecto");
        }

        // NextAuth exige un objeto con 'id' (string), 'name', etc.
        return {
          id: String(employee.id),
          name: employee.name,
          role: employee.role,
          user: employee.user
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  // Ajustamos la estrategia JWT y el tiempo de expiración
  session: {
    strategy: "jwt",
    // maxAge en segundos; aquí 24h
    maxAge: 60 * 60 * 8,
  },

  callbacks: {
    async jwt({
      token,
      user,
      account,
      profile,
      isNewUser,
      trigger,
      session,
    }: {
      token: JWT;
      user?: User | AdapterUser;
      account?: Account | null;
      profile?: Profile;
      isNewUser?: boolean;
      trigger?: "signIn" | "signUp" | "update";
      session?: any;
    }) {
      if (user) {
        token.id = user.id;
        // token.role = (user as any).role;
      }
      return token;
    },
    async session({
      session,
      token,
      user,
    }: {
      session: Session;
      token: JWT;
      user: User | AdapterUser;
    }) {
      // Copiamos info extra del token a session.user
      session.user.id = token.id as string;
      // session.user.role = token.role as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // Asegúrate de definir esto en .env
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
