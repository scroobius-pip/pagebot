import "@/styles/globals.css";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Providers } from "./providers";
import { Link } from "@nextui-org/link";
import clsx from "clsx";
import { LogoText } from '@/components/icons';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head >

        <script async data-pgbt_id="1059050779408717183" src='https://s.thepagebot.com/pgbt.js' />
        {/* <meta name="viewport" content="width=device-width, initial-scale=1.0" /> */}
        <meta name="pgbt:qa" data-question="What do you offer?" data-answer="PageBot offers a customer service agent that understands your website's content and knowledge base. It can provide instant responses to your customers' questions and supports various data sources such as PDF, HTML, JSON, CSV, TXT, DOCX, and MD. PageBot also supports multilingual conversations in Arabic, English, Spanish, Turkish, French, Italian, and Dutch. It has a tiny footprint, keeping your webpage fast with less than 50kb of JavaScript. Additionally, PageBot offers a usage-based billing system, allowing you to pay only for what you use. You can customize its appearance using CSS overrides. If you'd like to try it out, there is a one-month free trial available with the option to cancel anytime." />
      </head>
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased  flex",
          fontSans.className
        )}
      >
        {/* <Providers themeProps={{ attribute: "class", defaultTheme: "light", }}> */}
        <div className="w-full">

          <main className='w-full max-w-[120rem] m-auto'>
            {children}
          </main>
          <footer className="w-full flex   bg-[#1E1E1E] rounded-t-[5rem] p-20 ">
            <LogoText className='h-10 text-slate-100' />
          </footer>
        </div>
        {/* </Providers> */}
      </body>
    </html>
  );
}
