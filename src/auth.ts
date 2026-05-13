import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import type { Role } from "@prisma/client";

// Schema validasi login
const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

// NextAuth config
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // Pakai JWT — stateless, tidak butuh session di DB untuk setiap request
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login", // error OAuth redirect ke sini
  },

  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Set role default USER saat pertama login via Google
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "USER" as Role,
        };
      },
    }),

    // Email + Password
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Validasi input
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 2. Cari user di database
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            passwordHash: true,
            role: true,
            isActive: true,
            isBanned: true,
            emailVerified: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        // 3. Cek status akun
        if (!user.isActive || user.isBanned) return null;

        // 4. Verifikasi password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // 5. Return user object — akan masuk ke JWT token
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // jwt: dipanggil saat token dibuat/diperbarui
    async jwt({ token, user, trigger, session }) {
      // Saat pertama login — user ada, inject role ke token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Saat user update profil dari settings
      if (trigger === "update" && session) {
        token.name = session.name;
        token.image = session.image;
      }

      return token;
    },

    // session: dipanggil saat useSession() dipanggil
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },

    // signIn: cek tambahan sebelum login diizinkan
    async signIn({ user, account }) {
      // OAuth (Google) — auto-verify email
      if (account?.provider === "google") {
        await prisma.user.updateMany({
          where: { email: user.email! },
          data: { emailVerified: new Date() },
        });
        return true;
      }
      return true;
    },
  },
});
