import { Section } from '@/components/section';
import { GoalIcon, ShapesIcon, TimerIcon, TrendingDownIcon, Zap } from 'lucide-react';
import { Section1 } from '@/components/Section1';
import { textBlack } from '@/components/primitives';
import { CTA } from '@/components/CTA';
import React from 'react';
import { SectionIconTitle, Card } from './page';


export default function Home() {
    return (
        <>
            <Section1 />

            <Section className='flex flex-col gap-14 justify-between'>
                <div className='p-4 bg-[#FFFCF9] rounded-full flex flex-col justify-between gap-2'>
                    <SectionIconTitle text='Is this you ?' color={textBlack} icon={<GoalIcon size={36} />} />

                </div>
                <div className='flex flex-row flex-wrap gap-12 flex-1'>
                    <Card
                        bg='#FFFCF9'
                        // bc='#fad16a'
                        icon={<Zap size={48} />}
                        text={<p>I want to give my customers <b>instant</b> responses to their questions</p>} />
                    <Card
                        bg='#FFFCF9'
                        // bc='#ffb6b6'
                        icon={<ShapesIcon size={46} />}
                        text={<p>I have a large knowledge-base that is <b>difficult</b> to onboard human workers.</p>} />
                    <Card
                        bg='#FFFCF9'
                        icon={<TrendingDownIcon size={46} />}
                        text={<p>I want to <b>decrease</b> customer support tickets on trivial questions.</p>} />
                    <Card
                        bg='#1E1E1E'
                        // bc='#86ffb6'
                        icon={<TimerIcon color='#FFFCF9' size={46} />}
                        text={<p className='text-slate-50'>I want to spend more time <b>building</b> my <b>products</b> over handling customer service.</p>} />
                </div>
                <CTA mini />
            </Section>
        </>

    );
}
