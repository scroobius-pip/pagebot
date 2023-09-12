import { Section } from '@/components/section';
import { LogoText, IconText, Logo } from '@/components/icons'
import { HeartHandshakeIcon, SparkleIcon } from 'lucide-react'
import { Snippet } from '@nextui-org/snippet'
import { Button } from '@nextui-org/button';
export default function Home() {
  return (
    <>

      <Section className='flex flex-col lg:flex-row gap-10 '>
        <div className='rounded-[2.5rem] bg-[#FFFCF9] p-10 flex flex-col gap-16 items-start flex-1 overflow-y-auto scrollbar-hide'>
          <div className='flex gap-9 flex-col items-start'>
            <LogoText className='h-16' />
            <h1 className={`text-6xl ${textGrey} font-bold`}>give your <span className={textBlack}>customers</span> <span className={textBlack}>conversations</span> that are:</h1>
            <div className='flex flex-row gap-5 flex-wrap'>
              <TitleIconText
                color='#FF6565'
                icon={
                  <svg className='h-16' viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24.5 6L20.7 17.6C20.5054 18.2024 20.1706 18.7501 19.7231 19.1979C19.2757 19.6457 18.7283 19.981 18.126 20.176L6.5 24L18.1 27.8C18.7024 27.9946 19.2501 28.3294 19.6979 28.7769C20.1457 29.2243 20.481 29.7717 20.676 30.374L24.5 42L28.3 30.4C28.4946 29.7976 28.8294 29.2499 29.2769 28.8021C29.7243 28.3543 30.2717 28.019 30.874 27.824L42.5 24L30.9 20.2C30.2976 20.0054 29.7499 19.6706 29.3021 19.2231C28.8543 18.7757 28.519 18.2283 28.324 17.626L24.5 6Z" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                }
                text='engaging'
              />
              <TitleIconText
                color='#FFBB0C'
                icon={
                  <svg className='h-16' viewBox="0 0 49 48" fill="none"  >
                    <path d="M24.5 15C24.5 13.22 25.0278 11.4799 26.0168 9.99987C27.0057 8.51983 28.4113 7.36628 30.0559 6.68509C31.7004 6.0039 33.51 5.82567 35.2558 6.17294C37.0016 6.5202 38.6053 7.37737 39.864 8.63604C41.1226 9.89472 41.9798 11.4984 42.3271 13.2442C42.6743 14.99 42.4961 16.7996 41.8149 18.4442C41.1337 20.0887 39.9802 21.4943 38.5001 22.4832C37.0201 23.4722 35.28 24 33.5 24M24.5 15C24.5 13.22 23.9722 11.4799 22.9832 9.99987C21.9943 8.51983 20.5887 7.36628 18.9442 6.68509C17.2996 6.0039 15.49 5.82567 13.7442 6.17294C11.9984 6.5202 10.3947 7.37737 9.13604 8.63604C7.87737 9.89472 7.0202 11.4984 6.67294 13.2442C6.32567 14.99 6.5039 16.7996 7.18509 18.4442C7.86628 20.0887 9.01983 21.4943 10.4999 22.4832C11.9799 23.4722 13.72 24 15.5 24M24.5 15V18M33.5 24C35.28 24 37.0201 24.5278 38.5001 25.5168C39.9802 26.5057 41.1337 27.9113 41.8149 29.5559C42.4961 31.2004 42.6743 33.01 42.3271 34.7558C41.9798 36.5016 41.1226 38.1053 39.864 39.364C38.6053 40.6226 37.0016 41.4798 35.2558 41.8271C33.51 42.1743 31.7004 41.9961 30.0559 41.3149C28.4113 40.6337 27.0057 39.4802 26.0168 38.0001C25.0278 36.5201 24.5 34.78 24.5 33M33.5 24H30.5M15.5 24C13.72 24 11.9799 24.5278 10.4999 25.5168C9.01983 26.5057 7.86628 27.9113 7.18509 29.5559C6.5039 31.2004 6.32567 33.01 6.67294 34.7558C7.0202 36.5016 7.87737 38.1053 9.13604 39.364C10.3947 40.6226 11.9984 41.4798 13.7442 41.8271C15.49 42.1743 17.2996 41.9961 18.9442 41.3149C20.5887 40.6337 21.9943 39.4802 22.9832 38.0001C23.9722 36.5201 24.5 34.78 24.5 33M15.5 24H18.5M24.5 33V30" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M24.5 30C27.8137 30 30.5 27.3137 30.5 24C30.5 20.6863 27.8137 18 24.5 18C21.1863 18 18.5 20.6863 18.5 24C18.5 27.3137 21.1863 30 24.5 30Z" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M16.5 32L19.5 29" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M29.5 19L32.5 16" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M16.5 16L19.5 19" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M29.5 29L32.5 32" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                }
                text='pleasant'
              />
              <TitleIconText
                color='#9257FA'
                icon={
                  <svg className='h-16' viewBox="0 0 49 49" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M31.7 5.90041C27.4224 4.23857 22.7034 4.09834 18.3346 5.50324C13.9659 6.90815 10.2132 9.77272 7.70601 13.6164C5.19886 17.4601 4.0898 22.0491 4.56489 26.6135C5.03999 31.1779 7.07032 35.4401 10.3153 38.6851C13.5603 41.9301 17.8225 43.9604 22.3869 44.4355C26.9513 44.9106 31.5403 43.8015 35.384 41.2944C39.2277 38.7872 42.0923 35.0345 43.4972 30.6658C44.9021 26.297 44.7618 21.578 43.1 17.3004" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M24.5 28.5C26.7091 28.5 28.5 26.7091 28.5 24.5C28.5 22.2909 26.7091 20.5 24.5 20.5C22.2909 20.5 20.5 22.2909 20.5 24.5C20.5 26.7091 22.2909 28.5 24.5 28.5Z" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M27.3 21.7L38.5 10.5" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>

                }
                text='instant'
              />
            </div>
          </div>

          <h2 className={`text-4xl ${textGrey} font-medium leading-tight grow max-w-lg`}>
            PageBot is a <span className={textBlack}>customer service</span> agent that<span className={textBlack}> understands</span> your <span className={textBlack}>website's</span> content and <span className={textBlack}>knowledge base</span>.
          </h2>
          <div className='rounded-[2rem]  bg-[#9257FA]  border-solid border-[#E2CFF9] border-[6px] p-10 gap-8 flex flex-col items-end'>
            <div className='flex flex-row gap-6 align-middle justify-center '>
              <div className='bg-slate-50 p-2 rounded-3xl self-start'>
                <Logo className='h-10 text-[#9257FA]' />
              </div>
              <p className='text-slate-50 text-2xl font-medium'>
                Add GPT-4 <b>superpowers</b> to your website with a <b>single</b> line of code
              </p>
            </div>
            <div>
              <Snippet hideSymbol size='lg' variant='solid' className='bg-slate-50 text-[#9257FA] '
                classNames={{
                  pre: 'whitespace-normal	font-bold'
                }}
              >
                {`<script data-pgbt_id="<YOUR_ID>" src='https://s.thepagebot.com/pgbt.js' />`}
              </Snippet>
            </div>
            <div className='p-2 pl-6 bg-[#AA7CFB] rounded-r-full rounded-bl-full flex-row flex gap-8'>
              <div className='flex flex-col items-end'>
                <p className='text-slate-50 font-medium'>
                  <b>1 month free</b> trial
                </p>
                <p className='text-slate-50 font-medium'>
                  cancel anytime
                </p>
              </div>
              <Button size='lg' className='rounded-3xl text-2xl font-medium text-[#9257FA] bg-slate-50'
                endContent={
                  <SparkleIcon size={24} strokeWidth={2} color='#9257FA' />
                }
              >
                Get Started
              </Button>
            </div>
            <div className='flex flex-row gap-2.5'>
              <HeartHandshakeIcon color='white' />
              <p className='text-slate-50 font-medium'>
                <b>17,109 users</b> are already using PageBot
              </p>
            </div>
          </div>
        </div>
        <div id='pgbt-root' className='bg-[#E9E9E9]  rounded-[2.5rem] p-10 '>

        </div>
      </Section>


    </>

  );
}

const TitleIconText = IconText(({ text }) => {
  const textStyle = text === 'engaging' ? 'font-bold' : text === 'instant' ? 'font-medium italic' : 'font-medium'
  return <h3 className={`text-6xl text-inherit ${textStyle}`}>
    {text}
  </h3>
})




const textGrey = 'text-[#8B8B8B]'
const textBlack = 'text-[#1E1E1E]'