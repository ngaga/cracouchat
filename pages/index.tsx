import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

const Home: NextPage = () => {
  const { data: session, status } = useSession();

  return (
    <>
      <Head>
        <title>Cracouchat</title>
        <meta name="description" content="Fun chat to sharpen my react python chat skills" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="heading-5xl text-foreground">Cracouchat</h1>
          <p className="copy-lg text-foreground">Fun chat to sharpen my react python chat skills</p>
          {status === "loading" && (
            <p className="copy-base text-foreground-muted">Loading session...</p>
          )}
          {status !== "loading" && !session && (
            <button
              type="button"
              onClick={() => signIn("github")}
              className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
            >
              Sign in with GitHub
            </button>
          )}
          {session && (
            <div className="flex flex-col items-center gap-4">
              <p className="copy-base text-foreground">
                You are signed in as {session.user.email ?? session.user.id}
              </p>
              <div className="flex gap-4">
                <Link
                  href="/chat"
                  className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
                >
                  Open chat
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-lg border border-border px-6 py-3 text-foreground hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Home;

