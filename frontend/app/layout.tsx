import "@/styles/globals.css";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Providers } from "./providers";
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

        <script data-pgbt_id="1059050779408717183" src='https://x.thepagebot.com' />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name='pgbt:source' content='pricing is {(messageCount - 50)*0.05usd' />
        <meta name="pgbt:qa" data-question="What do you offer?" data-answer="PageBot offers a customer service agent that understands your website's content and knowledge base. It can provide instant responses to your customers' questions and supports various data sources such as PDF, HTML, JSON, CSV, TXT, DOCX, and MD. PageBot also supports multilingual conversations in 100+ Languages. It has a tiny footprint, keeping your webpage fast with less than 30kb of JavaScript. Additionally, PageBot offers a usage-based billing system, allowing you to pay only for what you use. You can customize its appearance using CSS overrides." />
        <meta name="pgbt:qa" data-question="How do I add my data to PageBot ?" data-answer={`
      
        To add data to PageBot, you use meta tags with different content sources. Here are some examples:
        \n\n
        1.Raw Text:  \`<meta name='pgbt:source' content='pricing is {(messageCount - 50)*0.05usd' />\`
        \n
        2.Relative URL to webpage:  \`<meta name='pgbt:source' content='/pricing' />\`
        \n
        3.Absolute URL to webpage:  \`<meta name='pgbt:source' content='https://arible.co' />\`
        \n
        4.PDF:  \`<meta name='pgbt:source' content='https://example.com/pricing.pdf' />\`
        \n
        5.SITEMAPS:  \`<meta name='pgbt:source' content='https://www.arible.co/sitemap.xml' />\`
        
        6.API: \`<meta name='pgbt:source' content='https://dummyjson.com/users/1' />\`
        \n\n
        These meta tags allow PageBot to retrieve data from different sources and use it in the chatbot. Since specifying data sources is done with code, it makes PageBot very flexible
        
        `} />

        <script dangerouslySetInnerHTML={
          {
            __html: 'window.lemonSqueezyAffiliateConfig = { store: "pagebot" };'
          }
        }
        />
        <script src="https://lmsqueezy.com/affiliate.js" defer />
        <meta name="pgbt:qa" data-question="Is there a free plan ?" data-answer="Yes!, PageBot allows 50 free messages monthly. Data-sources are unlimited" />
        <meta name="pgbt:qa" data-question="What type of data can be used for PageBot ?" data-answer="PDF, HTML, JSON, CSV, DOCX, WEBPAGES, REST APIs, RAW TEXT, CSV, SITEMAPS" />
        {/* <meta name="pgbt:qa" data-question="Hi, what is the status of my orders ?" data-answer="Hey Sam!, \ You have two items in your order still processing." /> */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-D84T9KV8ZV"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments)}
          gtag('js', new Date());
          gtag('config', 'G-D84T9KV8ZV');
          `}}
        />

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


        <main className='flex-1 flex flex-col bg-purple'>
          {children}
        </main>
        <footer className=" bg-black p-10  w-full flex text-white justify-around  ">
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
              <a href='mailto:contact@thepagebot.com' className='' target='_blank' rel="noreferrer">
                <span className='font-medium'>
                  contact@thepagebot.com
                </span>
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
