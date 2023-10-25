
import { Card } from './Card'
import { Snippet } from '@nextui-org/react'


interface Doc {
    codes: JSX.Element[],
    title: string,
    // description?: ,
    children?: JSX.Element
}


export const DocElement = ({ codes, title, children }: Doc) => {
    return <Card
        className='flex-auto gap-12 bg-white'

    >
        <>
            <div className='flex flex-col'>
                <h4 className='text-2xl font-bold capitalize'>{title}</h4>
            </div>
            <div className='flex flex-col gap-6'>
                {codes.map(code => {
                    return <Snippet hideSymbol size='lg' variant='solid' className='bg-white-1   text-black  self-start w-h hidden md:flex rounded-2xl p-8'
                        classNames={{
                            pre: 'whitespace-normsal	font-bold '
                        }}
                    >
                        {code}
                    </Snippet>
                })}

                {children}
            </div>
        </>
    </Card>
}

