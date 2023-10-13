import "@/styles/globals.css";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Providers } from "./providers";
import { Link } from "@nextui-org/link";
import clsx from "clsx";
import { Logo, LogoText } from '@/components/icons';
import Navigation from '@/components/Navigation';

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

        <script async data-pgbt_id="1059050779408717183" src='https://unpkg.com/pgbt@1.4.4' />
        {/* <meta name="pgbt:source" content="url.pdf" data-expires='3600' />
        <meta name='pgbt:source' content='url.pdf' data-expires='3600' />
        <meta name='pgbt:source' content='url.html' data-expires='3600' />
        <meta name='pgbt:source' content='url.csv' data-expires='3600' /> */}
        <meta name='pgbt:source' content='https://api.arible.co/stats' data-expires='60' />

        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="pgbt:qa" data-question="What do you offer?" data-answer="PageBot offers a customer service agent that understands your website's content and knowledge base. It can provide instant responses to your customers' questions and supports various data sources such as PDF, HTML, JSON, CSV, TXT, DOCX, and MD. PageBot also supports multilingual conversations in Arabic, English, Spanish, Turkish, French, Italian, and Dutch. It has a tiny footprint, keeping your webpage fast with less than 50kb of JavaScript. Additionally, PageBot offers a usage-based billing system, allowing you to pay only for what you use. You can customize its appearance using CSS overrides. If you'd like to try it out, there is a one-month free trial available with the option to cancel anytime." />
        <style>
          {`
          .pb_main.detached {
            background-color: #F5F5F5;
            border-radius: 1em;
            padding: 2em;
            
          }
          `}
        </style>

      </head>
      <body
        className={clsx(
          "min-h-screen bg-bg font-sans antialiased flex flex-col ",
          fontSans.className
        )}
      >
        <Navigation />


        <main className='flex-1 flex flex-col `'>
          {children}
        </main>
        <footer className=" bg-black p-10  w-full flex text-white justify-around  max-w-md">
          <div className='flex gap-4 justify-between  w-full max-w-[1400px] mx-auto flex-col md:flex-row'>
            <div className='flex-col flex gap-2 h-full items-start justify-between'>
              <Logo className='h-8 ' />
              <p>© {new Date().getFullYear()} PageBot</p>
            </div>
            <div className='flex flex-col gap-2'>
              <b>Social</b>
              <a href='https://twitter.com/pagebotai' target='_blank' rel="noreferrer">
                X
              </a>
              <a href='https://www.linkedin.com/company/pagebotai' target='_blank' rel="noreferrer">
                LinkedIn
              </a>
            </div>
            <div className='flex flex-col gap-2'>
              <b>Legal</b>
              <a className='f' href='https://bronze-brush-9b0.notion.site/Privacy-Policy-a1179d5d327b4056b3b059c95ae846f8?pvs=4'>
                Privacy
              </a>
              <a className='f' href="https://bronze-brush-9b0.notion.site/Terms-Conditions-7f3bf549df494b778c324cacb8d36b86?pvs=4" target="_blank" rel="noreferrer">
                Terms
              </a>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
