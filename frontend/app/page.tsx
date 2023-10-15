"use client"
import React, { useEffect } from 'react';
import { You } from '@/components/you';
import { Intro } from '@/components/intro';

import FeaturesSection from '@/components/features';
import Pricing from '@/components/pricing';
import { Logo } from '@/components/icons';
import { HeartHandshakeIcon, SparkleIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@nextui-org/react';
import GetStarted from '@/components/GetStarted';
import Marquee from "react-fast-marquee";

export const runtime = 'edge';

export default function Home() {
  const libraries = ['wordpress', 'nextjs', 'reactjs', 'angular', 'php', 'vue']
  return <div className=''>

    <Intro />
    <div className='bg-purple py-12 max-w-xl m-auto '>

      <Marquee gradient gradientColor='#5C07ED' className='gap-2'>

        {
          libraries.map((lib, i) => <img
            key={i}
            style={{
              filter: 'invert(1)'
            }}
            src={`/${lib}.svg`} alt={lib} className='h-12 mx-4' />)
        }
      </Marquee>

    </div>
    <CTA />
    <div className='bg-white'>
      <You />
    </div>
    <FeaturesSection />
    <div className='bg-white'>
      <Pricing />
    </div>
    <GetStarted />

  </div>

}



const CTAButton = () => <div
  className='p-2 flex-1 md:pl-6 bg-black-1 rounded-r-full rounded-bl-full flex-row flex gap-8 w-full md:w-auto'>
  <div className='md:flex flex-col justify-center items-end hidden '>
    <p className='text-slate-50 font-medium text-sm  capitalize'>
      50 messages free
      monthly
    </p>
    <b className='text-slate-50 font-bold text-sm capitalize'>
      cancel anytime
    </b>
  </div>
  <Button as={Link} href='/dashboard' size='lg' className='rounded-3xl text-2xl font-medium text-black bg-white w-full md:w-auto '
    endContent={<SparkleIcon size={24} strokeWidth={2} color='#1E1E1E' />}
  >
    Get Started
  </Button>

</div>;

const CTA = () => {
  const [stats, setStats] = React.useState({
    user_count: 0,
    message_count: '0',
    page_count: '0'
  })

  const getStats = async () => {
    const HOST = 'https://api.thepagebot.com'
    const endpoint = HOST + '/stats'
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`
      }
    })
    const json = await res.json() as {
      user_count: number,
      message_count: string,
      page_count: string
    }

    setStats(json)
  }

  useEffect(() => {
    getStats()
  }, [])

  return <div className='bg-black w-full  text-white'>
    <div className='max-w-[1400px] w-full m-auto py-36 p-4 flex flex-col gap-24 items-start'>

      <div >
        <div className='flex flex-col md:flex-row gap-6 items-center justify-center self-start '>
          <div className='bg-white p-2 rounded-3xl self-start'>
            <Logo className='h-10 text-black' />
          </div>
          <p className='text-slate-50 text-lg md:text-2xl font-medium max-w-xl leading-relaxed'>
            Add GPT <b>superpowers</b> to your website with a <b>single</b> line of code, no <b>training</b> required.
          </p>
        </div>

        <div className='p-4 bg-black-1 font-medium rounded-2xl mt-6'>
          {`<script data-pgbt_id="<YOUR_ID>" src='https://x.thepagebot.com' />`}
        </div>
      </div>

      <div className='flex gap-6 flex-col self-end items-end'>
        <CTAButton />
        <div className='flex flex-row gap-2.5'>
          <HeartHandshakeIcon color='white' />
          <p className='text-white text- font-medium'>
            <b>{stats.user_count} users</b> are already using PageBot
          </p>
        </div>
      </div>
    </div>
  </div>
}



