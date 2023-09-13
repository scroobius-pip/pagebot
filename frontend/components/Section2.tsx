import { Section } from '@/components/section';
import { GoalIcon, ShapesIcon, TimerIcon, TrendingDownIcon, Zap } from 'lucide-react';
import { textBlack } from '@/components/primitives';
import { CTA } from '@/components/CTA';
import React from 'react';
import { SectionIconTitle } from './SectionIconTitle';
import { Card } from './Card';

export const Section2 = () => <Section className='flex flex-col gap-14 justify-between'>
    <div className='p-4 bg-[#FFFCF9] rounded-full flex flex-col justify-between gap-2'>
        <SectionIconTitle text='Is this you ?' color={textBlack} icon={<GoalIcon size={36} />} />

    </div>
    <div className='flex flex-row flex-wrap gap-12 flex-1'>
        <Card
            bg='#1E1E1E'
            // bc='#86ffb6'
            icon={<TimerIcon color='#FFFCF9' size={46} />}
        >
            <p className='text-slate-50 text-left max-w-xs text-3xl leading-snug'>I want to spend more time <b>building</b> my <b>products</b> over handling customer service.</p>
        </Card>
        <Card
            bg='#FFFCF9'
            // bc='#fad16a'
            icon={<Zap size={48} />}
        >
            <p className='text-left max-w-xs text-3xl leading-snug'>I want to give my customers <b>instant</b> responses to their questions</p>

        </Card>
        <Card
            bg='#FFFCF9'
            // bc='#ffb6b6'
            icon={<ShapesIcon size={46} />}
        >
            <p className='text-left max-w-xs text-3xl leading-snug'>I have a large knowledge-base that is <b>difficult</b> to onboard human workers.</p>

        </Card>
        <Card
            bg='#FFFCF9'
            icon={<TrendingDownIcon size={46} />}
        >
            <p className='text-left max-w-xs text-3xl leading-snug'>I want to <b>decrease</b> customer support tickets on trivial questions.</p>

        </Card>

    </div>
    <CTA mini />
</Section >;
