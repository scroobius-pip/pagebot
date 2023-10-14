"use client"

import { ArrowRight } from 'lucide-react'
import { Logo } from './icons'
import { Accordion, AccordionItem, Snippet } from '@nextui-org/react'
import { useEffect, useRef, useState } from 'react'

const CodeSnippet = ({ children, title }: any) => {
    return <>
        <br />
        <span className='text-white-1 opacity-40 block'>{title}</span>
        <span className='opacity-80 duration-400 hover:opacity-100 '>
            {children}
        </span>
        <br />
    </>
}


const FeaturesSection = () => {
    const [selectedPreview, setSelectedPreview] = useState<number>(0)
    const selectedPreviewRef = useRef<HTMLDivElement>(null)

    useEffect(() => {

    }, [])

    return <div id='features' className='w-full bg-black text-white overflow-x-hidden py-36 pb-0'>
        <section className='max-w-[1400px] w-full m-auto p-12 pb-0 flex gap-12 flex-col '>
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
            <div className='flex flex-col md:flex-row gap-6  text-lg max-w-prose font-normal mb-12'>
                <p>
                    Add data-sources to your chat-bot dynamically via meta tags
                </p>
                <p>
                    Only pay for what you use; no monthly upfront costs
                </p>
            </div>

            <div className='grid grid-cols-6 md:grid-cols-12 h-full md:h-screen'>
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
                    onSelectionChange={(selection) => {

                        const currentKey = parseInt((selection as any).currentKey)

                        setSelectedPreview(currentKey)
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
                        <div className="animate-entrance max-w-2xl flex flex-col gap-6 mt-6 md:hidden"
                        // style={{
                        //     display: i === selectedPreview ? 'flex' : 'none'
                        // }}
                        >
                            {feature.image}
                        </div>
                    </AccordionItem>)}
                </Accordion>
                <div className='rounded-2xl  bg-purple rounded-bl-none pl-24 pt-24 h-full w-screen   col-span-6  hidden md:flex justify-start items-start '>

                    {
                        features.map(({ image }, index) => {
                            return <div className="animate-entrance max-w-2xl flex flex-col gap-6"
                                style={{
                                    display: index === selectedPreview ? 'flex' : 'none'
                                }}
                            >
                                {image}
                            </div>
                        })
                    }
                </div>

            </div>
        </section>

    </div>
}

interface Features {
    title: string
    description: string[]
    image?: JSX.Element
}

const features: Features[] = [
    {
        title: "Supports most data-sources; including your own API’s",
        description: [
            "PDF, HTML, JSON, CSV, TXT, PPTX, DOCX, MD",
            "+",
            "Including existing REST APIs; for example in situations where the bot needs the current logged-in user’s information."
        ],
        image: <>
            <Snippet hideSymbol size='lg' variant='solid' className='bg-black   text-white  self-start w-h hidden md:flex rounded-2xl p-8'
                classNames={{
                    pre: 'whitespace-normal 	font-bold overflow-x-auto '
                }}
            >

                <CodeSnippet
                    title='JSON API'
                >
                    {`<meta name='pgbt:source' content='https://dummyjson.com/users/1' />`}
                </CodeSnippet>

                <CodeSnippet
                    title='Raw Text'
                >
                    {`<meta name='pgbt:source' content='pricing is {(messageCount - 50)*0.05usd' />`}
                </CodeSnippet>


                <CodeSnippet
                    title='Relative URL to webpage'
                >
                    {`<meta name='pgbt:source' content='/pricing' />`}
                </CodeSnippet>
                <CodeSnippet
                    title='Absolute URL to webpage'
                >
                    {`<meta name='pgbt:source' content='https://arible.co' />`}
                </CodeSnippet>

                <CodeSnippet
                    title='PDF'
                >
                    {`<meta name='pgbt:source' content='https://example.com/pricing.pdf' />`}
                </CodeSnippet>
                <br />

            </Snippet>
            <img src='/api.png' className='' />
        </>
    },
    {
        title: "Pre-defined Q&A",
        description: ["Add pre-defined questions and answers that your customers immediately see when they open the chat-bot.", "These aren't charged as they are not sent to the server."],
        image: <>
            <Snippet hideSymbol size='lg' variant='solid' className='bg-black text-white-1  self-start w-h hidden md:flex rounded-2xl p-8'
                classNames={{
                    pre: 'whitespace-normal	font-bold overflow-x-auto '
                }}
            >

                {`<meta name='pgbt:qa' data-question="How many continents are there?" data-answer="7" />`}

            </Snippet>
            <img src='/qa.png' className='rounded-2xl' />

        </>
    },
    {
        title: 'Automatic Human Handoff',
        description: ["Pagebot detects when to hand off the conversation to you and forwards it via email."],
        image: <>
            <img src='/handoff.png' className='' />
        </>
    },
    {
        title: 'Knowledge Gap Detection',
        description: [],
        image: <>
            knowledge
        </>
    },
    {
        title: 'Supports 130+ Languages; Automatically',
        description: ["Pagebot automatically detects and understands the languages of your datasources and visitor's messages"]
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
        title: 'Extremely fast response times; 1.5s on average',
        description: ["PageBot's servers are written in Rust; a language that known for its speed and reliability."]
    }

]


export default FeaturesSection