import { PercentCircleIcon } from 'lucide-react'
import { SectionIconTitle } from './SectionIconTitle'
import { textBlack } from './primitives'
import { Section } from './section'
import { Card } from './Card'
import { Calculator } from './Calculator'
import { CTA } from './CTA'

const Pricing = () => {
    return <Section className='flex flex-col gap-14 justify-between'>
        <div className='p-4 bg-[#FFFCF9] rounded-full flex flex-col justify-between gap-2'>
            <SectionIconTitle text='Pricing' color={textBlack} icon={<PercentCircleIcon size={36} />} />
        </div>
        <div className='flex flex-col gap-2'>
            <h4 className='text-3xl font-bold '>usage based billing</h4>
            <p className='text-2xl max-w-prose font-boldd'>only pay for what you use; leave anytime. one month free initially</p>

        </div>

        <div className='flex flex-row gap-4 flex-wrap'>
            <Card
                className='flex-1'
                bg='#EAEAEA'
            >
                <div className='flex flex-col gap-2 justify-between'>
                    <div>
                        <h4 className='text-3xl font-bold '>source retrieval</h4>
                        <p className='text-xl  max-w-prose mt-2'>Your knowledge-base retrieved by pagebot, e.g a PDF, a web-page, API calls to your backend.
                            PageBot can cache this information based on your preferences, so setting an expiry of 24 hours would be alot less expensive than 60 seconds but more expensive than 1 year.
                        </p>
                    </div>
                    <p className='text-3xl font-bold mt-2'>~$0.0005/source</p>
                </div>
            </Card>

            <Card
                className='flex-1 '
                bg='#EAEAEA'
            >
                <div className='flex flex-col gap-2 justify-between h-full'>
                    <div>
                        <h4 className='text-3xl font-bold '>source word count</h4>
                        <p className='text-xl max-w-prose mt-2'>
                            The word count of the source, e.g if you specify a PDF with 500 words, it would cost 500*$0.00004=$0.02
                        </p>
                    </div>
                    <p className='text-3xl font-bold mt-2'>~$0.00004/word</p>
                </div>
            </Card>
            <Card
                className='flex-1 '
                bg='#EAEAEA'
            >
                <div className='flex flex-col gap-2 justify-between h-full'>
                    <div>
                        <h4 className='text-3xl font-bold '>message count</h4>
                        <p className='text-xl mt-2'>The number of your customers messages PageBot replies to.</p>
                    </div>
                    <p className='text-3xl font-bold mt-2'>~$0.05/message</p>
                </div>
            </Card>
        </div>

        <div className='flex gap-4 flex-col'>
            <div>
                <h4 className='text-3xl font-bold '>Cost Estimate Calculator</h4>
                <p className='text-2xl max-w-prose font-boldd'>Here's an estimate below, you can adjust the numbers</p>
            </div>
            <Calculator />
        </div>
        <CTA mini />
    </Section>
}

export default Pricing