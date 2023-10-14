import { FileTextIcon, InfoIcon, PercentCircleIcon } from 'lucide-react'
import { SectionIconTitle } from './SectionIconTitle'
import { Section } from './section'
import { Card } from './Card'
import { Snippet } from '@nextui-org/snippet'
import { CTA } from './CTA'



interface Doc {
    code: JSX.Element,
    title: string,
    // description?: ,
    children?: JSX.Element
}


export const DocElement = ({ code, title, children }: Doc) => {
    return <Card
        className='flex-auto gap-12'
        bg='#FFFCF9'
        bc='#FFFCF9'
    >
        <>
            <div className='flex flex-col'>
                <h4 className='text-2xl font-bold capitalize'>{title}</h4>
            </div>
            <div className='flex flex-col gap-6'>
                <Snippet hideSymbol size='lg' variant='solid' className='bg-white-1   text-black  self-start w-h hidden md:flex rounded-2xl p-8'
                    classNames={{
                        pre: 'whitespace-normal	font-bold '
                    }}
                >
                    {code}
                </Snippet>
                {/* {description && <div className=''>
                    <InfoIcon className='inline mr-2 text-purple-600' />
                    <span className='font-medium'>{description}</span>
                </div>} */}
                {children}
            </div>
        </>
    </Card>
}

