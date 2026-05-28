import type { Metadata } from "next";
import { DM_Serif_Display, IBM_Plex_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import "./globals.css";
import "../styles/scholars-header.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const sans = GeistSans;

export const metadata: Metadata = {
  title: "Operation TTG · Eligibility Intelligence",
  description: "NCAA D1 10/7 Eligibility Intelligence — QuasarNova LLC",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "48x48" },
      { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${mono.variable} ${sans.variable}`}>
      <body>
        {/* QuasarNova v1 §6.4 — skip-to-content link required on every page. */}
        <a href="#main-content" className="qn-skip-link">
          Skip to main content
        </a>
        {children}
        {/* Sonner toasts — bottom-right on web, bottom-center on mobile (§6.6). */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "rounded-lg border border-[#E5E7EB] bg-white text-[13px] text-[#111827]",
            },
          }}
          closeButton
        />
      </body>
    </html>
  );
}
