
import React, { useEffect } from 'react';
import { You } from '@/components/you';
import { Intro } from '@/components/intro';

import FeaturesSection from '@/components/features';
import Pricing from '@/components/pricing';
import Documentation from '@/components/documentation';
import { Logo } from '@/components/icons';
import { Button } from '@nextui-org/button';
import { ArrowRight, HeartHandshakeIcon, SparkleIcon } from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
export const runtime = 'edge';

export default function Home() {

  return <div className=''>
    <header>
      <Navigation />
    </header>
    <Intro />
    <CTA />
    <You />
    <FeaturesSection />
    <Pricing />
    <div className='px-2 py-12 bg-white w-full  flex gap-2 justify-around '>
      {/*@ts-ignore */}
      <Button href='/login' as={Link} color='' fullWidth className='w-full py-8' endContent={
        <ArrowRight size={32} />
      }>
        <h2 className=''>Get Started For Free</h2>

      </Button>
    </div>
  </div>

}

const CTAButton = () => <div className='p-2 flex-1 md:pl-6 bg-black-1 rounded-r-full rounded-bl-full flex-row flex gap-8 w-full md:w-auto'>
  <div className='md:flex flex-col items-end hidden '>
    <p className='text-slate-50 font-medium  capitalize'>
      50 messages free
      <b> monthly</b>
    </p>
    <p className='text-slate-50 font-medium capitalize'>
      cancel anytime
    </p>
  </div>
  <Button as={Link} href='/dashboard' size='lg' className='rounded-3xl text-2xl font-medium text-black bg-white w-full md:w-auto '
    endContent={<SparkleIcon size={24} strokeWidth={2} color='#1E1E1E' />}
  >
    Get Started
  </Button>

</div>;

const CTA = () => <div className='bg-black w-full  text-white'>
  <div className='max-w-[1400px] w-full m-auto py-12 p-4 flex flex-col gap-24 items-start'>

    <div >
      <div className='flex flex-col md:flex-row gap-6 items-center justify-center self-start '>
        <div className='bg-white p-2 rounded-3xl self-start'>
          <Logo className='h-10 text-black' />
        </div>
        <p className='text-slate-50 text-3xl font-medium max-w-xl leading-relaxed'>
          Add GPT <b>superpowers</b> to your website with a <b>single</b> line of code, no <b>training</b> required.
        </p>
      </div>

      <div className='p-4 bg-black-1 rounded-2xl mt-6'>
        {`<script data-pgbt_id="<YOUR_ID>" src='https://s.thepagebot.com/pgbt.js' />`}
      </div>
    </div>

    <div className='flex gap-6 flex-col self-end items-end'>
      <CTAButton />
      <div className='flex flex-row gap-2.5'>
        <HeartHandshakeIcon color='white' />
        <p className='text-slate-50 font-medium'>
          <b>17,109 users</b> are already using PageBot
        </p>
      </div>
    </div>
  </div>
</div>