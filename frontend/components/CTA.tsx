import { Logo } from '@/components/icons';
import { HeartHandshakeIcon, SparkleIcon } from 'lucide-react';
import { Snippet } from '@nextui-org/snippet';
import { Button } from '@nextui-org/button';
import Link from 'next/link';


export const CTA = ({ mini }: { mini?: boolean; }) => {
    const CTAButton = <div className='p-2 flex-1 md:pl-6 bg-[#AA7CFB] rounded-r-full rounded-bl-full flex-row flex gap-8 w-full md:w-auto'>
        <div className='md:flex flex-col items-end hidden '>
            <p className='text-slate-50 font-medium'>
                50 messages free
                <b> monthly</b>
            </p>
            <p className='text-slate-50 font-medium'>
                cancel anytime
            </p>
        </div>
        <Button as={Link} href='/dashboard' size='lg' className='rounded-3xl text-2xl font-medium text-[#9257FA] bg-slate-50 w-full md:w-auto '
            endContent={<SparkleIcon size={24} strokeWidth={2} color='#9257FA' />}
        >
            Get Started
        </Button>
    </div>;

    const Stats = <div className='flex flex-row gap-2.5'>
        <HeartHandshakeIcon color='white' />
        <p className='text-slate-50 font-medium'>
            <b>17,109 users</b> are already using PageBot
        </p>
    </div>;

    if (mini) {
        return <div className='flex flex-col justify-between rounded-3xl   bg-[#9257FA] p-4  gap-4 items-end'>
            {Stats}
            {CTAButton}
        </div>;
    }

    return <div className='rounded-[2rem]  bg-[#9257FA]  border-solid border-[#E2CFF9] border-[6px] p-10 gap-8 flex flex-col items-end'>
        <div className='flex flex-col md:flex-row gap-6 items-center justify-center self-start '>
            <div className='bg-slate-50 p-2 rounded-3xl self-start'>
                <Logo className='h-10 text-[#9257FA]' />
            </div>
            <p className='text-slate-50 text-xl font-medium '>
                Add GPT <b>superpowers</b> to your website with a <b>single</b> line of code
            </p>
        </div>
        {/* <div> */}
        <Snippet hideSymbol size='lg' variant='solid' className='bg-slate-50 text-[#9257FA] self-start w-h hidden md:flex rounded-full'
            classNames={{
                pre: 'whitespace-normal	font-bold overflow-x-auto '
            }}
        >
            {`<script data-pgbt_id="<YOUR_ID>" src='https://x.thepagebot.com' />`}
        </Snippet>

        {CTAButton}
        {Stats}
    </div>;
};
