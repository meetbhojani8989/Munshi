import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Outfit, Rubik, IBM_Plex_Mono } from "next/font/google";
import { MunshiProvider } from "@/components/MunshiProvider";
import { Shell } from "@/components/layout/Shell";

const sans = Rubik({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Munshi — Every bill updates everything",
  description: "A calm AI back office for small businesses",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Applies the saved theme before first paint so dark users never see a white flash.
const themeScript = `try{if(localStorage.getItem("munshi_theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <MunshiProvider>
          <Shell>{children}</Shell>
        </MunshiProvider>
      </body>
    </html>
  );
}
