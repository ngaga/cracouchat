import type { NextPage } from "next";
import Head from "next/head";

const Home: NextPage = () => {
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
        </div>
      </main>
    </>
  );
};

export default Home;

