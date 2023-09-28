import { Snippet } from '@nextui-org/snippet'
import { GoalIcon } from 'lucide-react'
import { CTA } from './CTA'
import { Card } from './Card'
import { SectionIconTitle } from './SectionIconTitle'
import { textBlack } from './primitives'
import { Section } from './section'

const FeaturesSection = () => {
    return <Section className='flex flex-col gap-14 justify-between'>
        <div className='p-4 bg-[#FFFCF9] rounded-full flex flex-col justify-between gap-2'>
            <SectionIconTitle text='Features' color={textBlack} icon={<GoalIcon size={36} />} />

        </div>
        <div className='flex flex-row gap-6 flex-wrap '>
            <Card
                className='flex-auto'
                bg='#FFBB0C'
            >
                <div className='flex gap-6 flex-col'>
                    <div className='flex flex-col gap-2'>
                        <h4 className='text-3xl font-bold'>supports most data sources</h4>
                        <p className='text-xl'>PDF, HTML, JSON, CSV, TXT, PPTX, DOCX, MD</p>
                    </div>
                    <Snippet hideSymbol size='lg' variant='solid' className='bg-[#fad16a] text-[#] '
                        classNames={{
                            pre: 'whitespace-normal	font-bold '
                        }}
                    >
                        {`<meta name=’pgbt:source’ content=’url.pdf’ data-expires='3600' />`}
                        {`<meta name=’pgbt:source’ content=’url.html’ data-expires='3600' />`}
                        {`<meta name=’pgbt:source’ content=’url.csv data-expires='3600' />`}

                    </Snippet>
                </div>
            </Card>
            <Card
                className='flex-auto w-full'
                bg='#FFFCF9'
            >

                {/* <div className='flex flex-col gap-2'>
                    <h4 className='text-3xl font-bold'>include data from your own api’s</h4>
                    <p className='text-xl'>e.g for situations where the bot needs information about the user in the database.</p>
                    <Snippet hideSymbol size='lg' variant='solid' className='bg-[#EAEAEA]'
                        classNames={{
                            pre: 'whitespace-normal	font-bold overflow-scroll'
                        }}
                    >
                        {`<meta name='pgbt:source' content='https://jsonplaceholder.typicode.com/users/1/todos' data-expires='0'  />`}

                    </Snippet>
                </div> */}
                <div className='flex gap-6 flex-col w-full'>
                    <div className='flex flex-col gap-2'>
                        <h4 className='text-3xl font-bold'>include data from your own api’s</h4>
                        <p className='text-xl'>e.g for situations where the bot needs information about the user in the database.</p>
                    </div>
                    <Snippet hideSymbol size='lg' variant='solid' className='bg-[#EAEAEA] max-w-full '
                        classNames={{
                            pre: 'whitespace-normal	font-bold '
                        }}
                    >
                        {`<meta name='pgbt:source' content='https://jsonplaceholder.typicode.com/users/1/todos' data-expires='0'  />`}


                    </Snippet>
                </div>

            </Card>
            <Card
                className='flex-auto'
                bg='#9257FA'
            >
                <div className='flex flex-col gap-2'>
                    <h4 className='text-3xl font-bold text-slate-50'>usage based billing</h4>
                    <p className='text-xl text-slate-50'>only pay for what you use, stop billing by simply removing the script tag from your code.</p>
                </div>
            </Card>
            <Card
                className='flex-auto'
                bg='#FFFCF9'
            >
                <div className='flex flex-col gap-2'>
                    <h4 className='text-3xl font-bold '>automatic human handoff</h4>
                    <p className='text-xl '>Pagebot detects when to hand off the conversation to you and forwards it via email.</p>
                </div>
            </Card>
            <Card
                className='flex-auto'
                bg='#FFFCF9'
            >
                <div className='flex flex-col gap-2'>
                    <h4 className='text-3xl font-bold '>multilingual</h4>
                    <p className='text-xl '>Pagebot supports languages in Arabic, English, Spanish, Turkish, French, Italian and Dutch.</p>
                </div>
            </Card>
            <Card
                className='flex-auto'
                bg='#FFFCF9'
            >
                <div className='flex flex-col gap-2'>
                    <h4 className='text-3xl font-bold '>tiny footprint</h4>
                    <p className='text-xl '>unlike other chatbots, pagebot keeps your webpage fast in <b>{`<50kb`}</b> of Javascript.</p>
                </div>
            </Card>
            <Card
                className='flex-auto'
                bg='#FFFCF9'
            >
                <div className='flex flex-col gap-2'>
                    <h4 className='text-3xl font-bold '>unlimited messages & page sources</h4>
                    <p className='text-xl '>use pagebot as little or as much as you want</p>
                </div>
            </Card>
            <Card
                //   className='flex-auto'
                bg='#FFFCF9'
            >
                <div className='flex flex-col gap-2'>
                    <h4 className='text-3xl font-bold '>customizable</h4>
                    <p className='text-xl '>easily change pagebot’s appearance using css overrides</p>
                </div>
            </Card>


        </div >

        <CTA mini />

    </Section >
}

export default FeaturesSection