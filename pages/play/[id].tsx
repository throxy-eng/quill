import type { GetStaticPaths, GetStaticProps } from "next";
import { PlayScreen } from "@/components/play-screen";
import { get_puzzle, puzzles, type Puzzle } from "@/lib/puzzles";

interface PlayPageProps {
  puzzle: Puzzle;
}

export default function PlayPage({ puzzle }: PlayPageProps) {
  return <PlayScreen puzzle={puzzle} />;
}

export const getStaticPaths: GetStaticPaths = function get_static_paths() {
  return {
    paths: puzzles.map((puzzle) => ({ params: { id: puzzle.id } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PlayPageProps> = function get_static_props(context) {
  const puzzle_id = typeof context.params?.id === "string" ? context.params.id : "";
  const puzzle = get_puzzle(puzzle_id);
  if (!puzzle) return { notFound: true };
  return { props: { puzzle } };
};
