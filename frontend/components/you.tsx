import { Section } from '@/components/section';
import { GoalIcon, ShapesIcon, TimerIcon, TrendingDownIcon, Zap } from 'lucide-react';
import { CTA } from '@/components/CTA';
import React from 'react';
import { SectionIconTitle } from './SectionIconTitle';
import { Card } from './Card';

export const You2 = () => <div className='flex flex-col gap-14 justify-between '>

    {/* <SectionIconTitle text='Is this you ?' color={textBlack} icon={<GoalIcon size={36} />} /> */}


    <div className='flex flex-row flex-wrap gap-6 max-w-4xl'>
        <Card
            className='flex-auto'
            bg='#1E1E1E'
            // bc='#86ffb6'
            icon={<TimerIcon color='#FFFCF9' size={46} />}
        >
            <p className='text-slate-50 text-left max-w-xs text-3xl leading-snug'>I want to spend more time <b>building</b> my <b>products</b> over handling customer service.</p>
        </Card>
        <Card
            className='flex-auto'
            bg='#FFFCF9'
            // bc='#fad16a'
            icon={<Zap size={48} />}
        >
            <p className='text-left max-w-xs text-3xl leading-snug'>I want to give my customers <b>instant</b> responses to their questions</p>

        </Card>
        <Card
            className='flex-auto'
            bg='#FFFCF9'
            // bc='#ffb6b6'
            icon={<ShapesIcon size={46} />}
        >
            <p className='text-left max-w-xs text-3xl leading-snug'>I have a large knowledge-base that is <b>difficult</b> to onboard human workers.</p>

        </Card>
        <Card
            className='flex-auto'
            bg='#FFFCF9'
            icon={<TrendingDownIcon size={46} />}
        >
            <p className='text-left max-w-xs text-3xl leading-snug'>I want to <b>decrease</b> customer support tickets on trivial questions.</p>

        </Card>

    </div>

</div >;


export const You = () => {
    return <section className='max-w-[1400px] py-36 w-full m-auto p-12'>
        <div className='flex flex-col gap-14 justify-between '>
            <h2 className='text-4xl font-medium'>Is this you ?</h2>
            <div className='grid gap-6 grid-cols-3 md:grid-cols-6 lg:grid-cols-12'>
                <Card
                    className='col-span-3 py-12'
                    bg='#1E1E1E'
                    bc='#B1B4B9'
                    // bc='#86ffb6'
                    icon={<TimerIcon color='#FFFCF9' size={46} />}
                >
                    <p className='text-white text-left max-w-xs text-2xl leading-snug'>I want to spend more time <b>building</b> my <b>products</b> over handling customer service.</p>
                </Card>
                <Card
                    className='col-span-3 py-12'
                    bg='#FFFFFF'
                    bc='#F5F5F5'
                    icon={<Zap size={48} />}
                >
                    <p className='text-left max-w-xs text-2xl leading-snug'>I want to give my customers <b>instant</b> responses to their questions</p>

                </Card>
                <Card
                    className='col-span-3 py-12'
                    bg='#FFFFFF'
                    bc='#F5F5F5'
                    icon={<ShapesIcon size={46} />}
                >
                    <p className='text-left max-w-xs text-2xl leading-snug'>I have a large knowledge-base that is <b>difficult</b> to onboard human workers.</p>

                </Card>
                <Card
                    className='col-span-3 py-12'
                    bg='#FFFFFF'
                    bc='#F5F5F5'
                    icon={<TrendingDownIcon size={46} />}
                >
                    <p className='text-left max-w-xs text-2xl leading-snug'>I want to <b>decrease</b> customer support tickets on trivial questions.</p>

                </Card>
            </div>
            <h1 className='text-3xl font-medium leading-relaxed max-w-2xl mt-36'>
                "We're on a mission to revolutionize customer service with GPT-powered chatbots for instant, effective support."
            </h1>
        </div>

    </section>
}