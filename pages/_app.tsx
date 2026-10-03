import { Figtree, Fraunces } from "next/font/google";
import type { AppProps } from "next/app";
import "@/styles/globals.css";

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${sans.variable} ${display.variable} font-sans`}>
      <Component {...pageProps} />
    </div>
  );
}
