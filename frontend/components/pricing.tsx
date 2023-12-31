"use client"
import { Calculator } from './Calculator'
import { Button } from '@nextui-org/react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const Pricing = () => {
    return <section id='pricing' className='max-w-[1400px] w-full m-auto px-4 py-36 '>
        <div className='flex flex-col gap-24 '>
            <div className='flex gap-24 flex-col md:flex-row'>
                <div className='flex flex-col justify-between col-span-6 gap-12'>
                    <h2 className='text-4xl font-bold'>Pricing</h2>
                    <p className='text-2xl font-medium'>Only pay for what you use; no monthly upfront costs</p>
                </div>
                <div className='grid grid-cols-12 gap-6 col-span-6'>
                    {items.map((item, i) => <div
                        key={i}
                        className='col-span-12 px-4 py-6 rounded-2xl bg-white-1'>
                        <div className="flex flex-col gap-4 justify-between">
                            <div>
                                <h4 className="text-2xl capitalize font-medium mb-4">
                                    {item.title}
                                </h4>
                                <p className='text-base'>{item.description}</p>
                            </div>
                            <p className="text-xl font-semibold">{item.price}</p>
                        </div>

                    </div>)}
                    <div
                        className='col-span-12 px-4 py-6 rounded-2xl bg-purple text-white  capitalize'>
                        <div className="flex flex-col gap-2 justify-between">
                            <div className='flex flex-col gap-4'>
                                <h4 className="text-2xl capitalize font-medium">
                                    Free Plan
                                </h4>
                                <p className='text-base'>
                                    50 messages free monthly.
                                </p>
                                <p className='font-semibold'>
                                    no credit card required
                                </p>
                            </div>
                            {/* <p className="text-xl font-semibold">{item.price}</p> */}
                        </div>
                        <Button href='/login' as={Link} fullWidth className='w-full py-8 bg-white mt-12' endContent={
                            <ArrowRight size={32} />
                        }>
                            <h2 className='text-xl'>Get Started For Free</h2>

                        </Button>
                    </div>
                </div>
            </div>
            <div className='flex flex-col gap-12'>
                <div className='flex gap-12 flex-col'>
                    <h4 className='text-3xl font-bold '>Cost Estimate Calculator</h4>
                    <p className='text-2xl max-w-prose font-boldd'>Here's an estimate below, you can adjust the numbers</p>
                </div>
                <Calculator />
            </div>
        </div>
    </section>

}

interface PricingItem {
    title: string
    description: string
    price: string
}

const items = [
    {
        title: 'source retrieval',
        description: 'Your knowledge-base retrieved by pagebot, e.g a PDF, a web-page, API calls to your backend.',
        price: 'Free'
    },
    // {
    //     title: 'source word count',
    //     description: 'The word count of the source, e.g if you specify a PDF with 500 words, it would cost 500*$0.00004=$0.02',
    //     price: '~$0.00005/word'
    // },
    {
        title: 'message count',
        description: 'The number of your customers messages PageBot replies to.',
        price: '~$0.05/message'
    },
]

export default Pricing