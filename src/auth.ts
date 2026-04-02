import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/** Prefer env at runtime; omit `secret` when unset so Auth.js can read AUTH_SECRET itself ([MissingSecret](https://errors.authjs.dev#missingsecret)). */
function authSecret(): string | undefined {
  const a = process.env["AUTH_SECRET"]?.trim();
  const b = process.env["NEXTAUTH_SECRET"]?.trim();
  return a || b || undefined;
}

const secret = authSecret();

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  ...(secret ? { secret } : {}),
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username =
          typeof credentials?.username === "string"
            ? credentials.username.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!username || !password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { username },
          });
          if (!user) return null;

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            name: user.displayName ?? user.username,
            email: null,
          };
        } catch (err) {
          console.error("[auth] credentials authorize DB error:", err);
          throw err;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.name = (token.name as string | null | undefined) ?? null;
      }
      return session;
    },
  },
});
