import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Appointly | Effortless Booking",
  description: "Book your appointments quickly and frictionlessly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <nav className="navbar fade-in">
          <Link href="/" className="logo">
            Appointly.
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">Book</Link>
            <Link href="/my-appointments" className="nav-link">My Appointments</Link>
          </div>
        </nav>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
