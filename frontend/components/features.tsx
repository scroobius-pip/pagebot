"use client"

import { ArrowRight } from 'lucide-react'
import { Logo } from './icons'
import { Accordion, AccordionItem } from '@nextui-org/react'

const FeaturesSection = () => {
    return <div id='features' className='w-full bg-black text-white overflow-x-hidden'>
        <section className='max-w-[1400px] w-full m-auto p-12 flex gap-12 flex-col '>
            <div className='flex flex-col gap-14 justify-between '>
                <h2 className='text-3xl font-medium'>Why PageBot ?</h2>
            </div>
            <div className='flex flex-col md:flex-row gap-6 items-center self-start '>
                <div className='bg-white p-2 rounded-2xl self-start'>
                    <Logo className='h-6 text-black' />
                </div>
                <p className='text-slate-50 text-2xl font-medium  leading-relaxed'>
                    PageBot is the most flexible AI chat-bot you’ll ever use.
                </p>

            </div>
            <div className='flex flex-col md:flex-row gap-6  text-lg max-w-prose font-medium'>
                <p>
                    Add data-sources to your chat-bot dynamically via meta tags
                </p>
                <p>
                    Only pay for what you use; no monthly upfront costs
                </p>
            </div>

            <div className='grid grid-cols-6 md:grid-cols-12  h-screen'>
                <Accordion variant='light'
                    fullWidth
                    showDivider={false}
                    className='-mx-8  duration-150 rounded-b-2xl col-span-6 w-fdull'
                    itemClasses={{
                        base: 'bg-black rounded-xdl',
                        title: ' text-white font-semibold capitalize text-xl duration-150 transition',
                        trigger: 'bg-black px-6 rounded-2xl data-[open=true]:rounded-b-none data-[open=true]:bg-black-1 data-[hover=true]:bg-black-1 duration-150 transition',
                        indicator: '',
                        content: 'px-6 pb-6 bg-black-1 text-white font-medium text-md rounded-b-2xl'
                    }}
                >
                    {features.map((feature, i) => <AccordionItem

                        indicator={<ArrowRight color='#FFFFFF' />}
                        className='bg-black w-full'
                        key={i}
                        aria-label={feature.title}
                        title={feature.title}
                    >
                        {feature.description.map((desc, i) => <p key={i}>{desc}</p>)}
                    </AccordionItem>)}
                </Accordion>
                <div className='rounded-2xl  bg-purple pl-24 pt-24 h-full w-screen   col-span-6  hidden md:flex justify-start items-start '>
                    <div
                        style={{
                            backgroundImage: 'url(/hero.png)',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'start'
                        }}
                        className='w-full h-4/5'
                    />
                </div>

            </div>
        </section>

    </div>
}

interface Features {
    title: string
    description: string[]
    image?: string
}

const features: Features[] = [
    {
        title: "Supports most data-sources; including your own API’s",
        description: [
            "PDF, HTML, JSON, CSV, TXT, PPTX, DOCX, MD",
            "+",
            "Including existing api's; for example in situations where the bot needs the current logged-in user’s information."
        ],
        image: '/hero'
    },
    {
        title: "Pre-defined Q&A",
        description: ["Add pre-defined questions and answers that your customers immediately see when they open the chat-bot.", "These aren't charged as they are not sent to the server."]
    },
    {
        title: 'Automatic Human Handoff',
        description: ["Pagebot detects when to hand off the conversation to you and forwards it via email."]
    },
    {
        title: 'Tiny Footprint',
        description: ["Pagebot is only ~50kb gzipped; keeping your website fast."]
    },
    {
        title: 'Customizable; via CSS Overrides',
        description: ["Customize the look and feel of the chat-bot to match your brand."]
    },
    {
        title: 'Usage-based Billing',
        description: ["Only pay for what you use; no monthly upfront costs."]
    },
    {
        title: 'No Pre-Training Required',
        description: ["Unlike other chat-bots, Pagebot doesn't require you to upload your data for training via a dashboard.", "It uses the data-sources you specify via meta tags to answer questions.", "This means PageBot is ready to go as soon as you add it to your website."]
    },
    {
        title: 'Supports 90+ Languages; Automatically',
        description: ["Pagebot automatically detects the languages of your data-sources and visitors."]
    },
    {
        title: 'Extremely fast response times; 1.5s on average',
        description: ["PageBot's servers are written in Rust; a language that known for its speed and reliability."]
    }

]



export default FeaturesSection