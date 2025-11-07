import type { NextApiRequest, NextApiResponse } from "next";
import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

import { connectDatabase, syncDatabase } from "@app/lib/database";
import { UserModel } from "@app/lib/models/User";

async function ensureDatabaseReady() {
  await connectDatabase();
  await syncDatabase();
}

async function findOrCreateUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
  provider: string;
  providerAccountId: string;
}) {
  await ensureDatabaseReady();

  const [user] = await UserModel.upsert(
    {
      email: params.email,
      name: params.name ?? null,
      imageUrl: params.image ?? null,
      provider: params.provider,
      providerAccountId: params.providerAccountId,
    },
    {
      returning: true,
      conflictFields: ["email"],
    }
  );

  return user;
}

const githubClientId = process.env.GITHUB_ID;
const githubClientSecret = process.env.GITHUB_SECRET;

if (!githubClientId || !githubClientSecret) {
  throw new Error("Missing GitHub OAuth environment variables");
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.providerAccountId || !user.email) {
        return false;
      }

      const databaseUser = await findOrCreateUser({
        email: user.email,
        name: user.name,
        image: user.image,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      });

      user.id = databaseUser.id;

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId;
      }

      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

export default async function auth(request: NextApiRequest, response: NextApiResponse) {
  return NextAuth(request, response, authOptions);
}


