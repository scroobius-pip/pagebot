import { FileTextIcon, InfoIcon, PercentCircleIcon } from 'lucide-react'
import { SectionIconTitle } from './SectionIconTitle'
import { textBlack } from './primitives'
import { Section } from './section'
import { Card } from './Card'
import { Snippet } from '@nextui-org/snippet'
import { CTA } from './CTA'



interface Doc {
    code: JSX.Element,
    title: string,
    description: string,
}


const Docs = () => {
    return <Section className='flex flex-col gap-14 justify-between'>
        <div className='p-4 bg-[#FFFCF9] rounded-full flex flex-col justify-between gap-2'>
            <SectionIconTitle text='Documentation' color={textBlack} icon={<FileTextIcon size={36} />} />
        </div>
        <div className='flex flex-col gap-2'>
            <h4 className='text-3xl font-bold '>minimal documentation</h4>
            <p className='text-2xl max-w-prose font-boldd'>PageBot is so simple to use, the entire documentation can be written on a single napkin</p>
        </div>
        <div className='flex flex-row gap-4 flex-wrap'>

            <DocElement code={<>
                {`<script data-pgbt_id="<YOUR_ID>" src='https://s.thepagebot.com/pgbt.js' />`}
            </>}
                title='installation'
                description='put in the head tag of every page you want pagebot to appear in.'
            />
            <DocElement
                code={<>
                    {`<meta name='pgbt:source' content='/' /> {*/ relative url */}`}
                    {`<meta name='pgbt:source' content='https://example.com' /> {*/ absolute url */}`}
                    {`<meta name='pgbt:source' content='https://example.com/api' /> {*/ api endpoint */}`}
                    {`<meta name='pgbt:source' content='https://example.com/api' data-expires='3600' /> {*/ cached for 1 hour */}`}
                </>}
                title='adding a source'
                description='specify the source of the knowledge-base. this can be a url, an api endpoint or a relative url of the current page. you can also specify how many seconds the cache should last (default is 1 day).'

            />
            <DocElement
                code={<>
                    {`<meta name='pgbt:qa' data-question='What is the meaning of life?' data-answer='42' />`}
                    {`<meta name='pgbt:qa' data-question='Is this the real life?' data-answer='Is this just fantasy?' />`}
                    {`<meta name='pgbt:qa' data-question='But what about the children?' data-answer='What about the children?' /> */}`}
                </>}
                title='adding predefined questions and answers'
                description='predefined questions and answers aren’t charged as they are never sent to the server. you should use this to save costs and reduce waiting time.'
            />
        </div>
        <CTA mini />
    </Section>
}


const DocElement = ({ code, title, description }: Doc) => {
    return <Card
        className='flex-auto'
        bg='#FFFCF9'
    >
        <>
            <div className='flex flex-col gap-2'>
                <h4 className='text-3xl font-bold'>{title}</h4>
                {/* <p className='text-xl'>e.g for situations where the bot needs information about the user in the database.</p> */}
            </div>
            <div className='flex flex-col gap-2'>
                <Snippet hideSymbol size='lg' variant='solid' className='bg-[#EAEAEA]'
                    classNames={{
                        pre: 'whitespace-normal	font-bold text-[#9257FA] '
                    }}
                >
                    {code}
                </Snippet>
                <div className='flex flex-row gap-1'>
                    <InfoIcon size={24} />
                    <span className='font-medium'>{description}</span>
                </div>
            </div>
        </>
    </Card>
}

export default Docs