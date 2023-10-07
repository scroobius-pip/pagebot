import { Poppins as FontMono, Poppins  as FontSans } from "next/font/google"

export const fontSans = FontSans({
  // subsets: ["latin"],
  // variable: "--font-sans",
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
})

export const fontMono = FontMono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
})
