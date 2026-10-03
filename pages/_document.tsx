import { Head, Html, Main, NextScript } from "next/document";

const base_path = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="application-name" content="Quill" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Quill" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="Original sudoku puzzles" />
        <link rel="manifest" href={`${base_path}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${base_path}/apple-touch-icon.png`} />
        <link rel="icon" href={`${base_path}/favicon.png`} type="image/png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
