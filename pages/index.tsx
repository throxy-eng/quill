import Head from "next/head";
import { PuzzleList } from "@/components/puzzle-list";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Quill</title>
      </Head>
      <PuzzleList />
    </>
  );
}
