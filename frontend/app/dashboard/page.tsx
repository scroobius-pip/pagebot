"use client"
import { SectionIconTitle } from '@/components/SectionIconTitle';
import { Section } from '@/components/section';
import { BadgeCheck, DeleteIcon, Globe2Icon, LayoutDashboardIcon } from 'lucide-react';

import React, { useEffect, useState } from 'react';
import { DocElement } from '@/components/documentation';
import isJwtTokenExpired from 'jwt-check-expiry'

import { Button, Input, Spinner, Tooltip } from '@nextui-org/react';
// declare LemonSqueezy: any
declare global {
    var LemonSqueezy: any
    var createLemonSqueezy: any
}
interface Me {
    id: string
    allowed_domains: string[] | null
    subscription_id: string | null
    subscribed: boolean
    email: string
    usage: {
        message_count: number
        source_retrieval_count: number
    }
}

const HOST = 'https://api.thepagebot.com'

export default function Dashboard() {
    const [domains, setDomains] = useState<string[]>([])
    const deleteDomain = (domain: string) => {
        const newDomains = domains.filter((d) => d !== domain)
        setDomains(newDomains)
        updateDomains(newDomains)
    }
    const [me, setMe] = useState<Me | null>(null)


    const getMe = async () => {
        setMe(null)
        const endpoint = HOST + '/me'
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('jwt')}`
            }
        })
        const json = await res.json() as Me
        console.log(json)
        setMe(json)
    }

    const updateDomains = async (domains: string[]) => {
        const endpoint = HOST + '/domains'
        const res = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                domains
            }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('jwt')}`
            }
        })

        if (res.status === 200) {
            const json = await res.json() as { domains: string[] }
            setDomains(json.domains)
            setMe(me => {
                if (me) {
                    return {
                        ...me,
                        allowed_domains: json.domains
                    }
                }
                return me
            })
            alert('Domains updated!')
        }
    }

    useEffect(() => {
        if (me?.allowed_domains) {
            setDomains(me.allowed_domains)
        }
    }, [me])

    useEffect(() => {
        // createLemonSqueezy()
        const jwt = localStorage.getItem('jwt');
        (jwt && !isJwtTokenExpired(jwt) && getMe()) || (window.location.href = '/login')
    }, [])


    const checkoutLink = `https://pagebot.lemonsqueezy.com/checkout/buy/2fcdb9bd-9409-441b-a7b7-f3581e6e9eb9?checkout[email]=${me?.email}`

    return <>
        <Section disabled className='flex flex-col gap-14 w-full'>
            <div className='flex flex-col gap-12 w-full max-w-6xl m-auto'>
                <div className='flex flex-col gap-2 bgf-[#FFFCF9] p-6 -mx-10 '>
                    <h2 className='text-3xl font-extrabold'>Usage</h2>
                    <div className="flex flex-wrap flex-row gap-4">
                        <div className='p-8 shadow-sm rounded-3xl bg-purple text-white    border-2 gap-4 flex flex-col'>
                            <div>
                                <Tooltip content="Customer messages that were answered by PageBot.">
                                    <p className='text-lg font-medium '>Total Messages <span className='ml-6 text-sm opacity-90'>Last 30 Days</span></p>
                                </Tooltip>
                            </div>
                            {me ? <h3 className='text-6xl font-bold'>{me.usage.message_count}</h3> : <Spinner size='md' color='white' />}
                        </div>
                        <div className='p-8 shadow-sm rounded-3xl bg-white gap-4 flex flex-col'>
                            <div>
                                <Tooltip content="How many times PageBot had to retrieve a source.">
                                    <p className='text-lg font-medium'>Source Retrieval Count <span className='ml-6 text-sm opacity-70'>Last 30 Days</span></p>
                                </Tooltip>
                            </div>
                            {me ? <h3 className='text-6xl font-bold'>{me.usage.source_retrieval_count}</h3> : <Spinner size='md' color='current' />}
                        </div>
                    </div>
                </div>
                {!me?.subscription_id && <div className='bg-black rounded-3xl text-white p-12  flex flex-col gap-6 self-start border-2 border-white'>

                    <h2 className='text-2xl'>Subscribe</h2>
                    <p className='font-medium text-lg  w-auto capitalize'>
                        Subscribe to remove monthly 50 Message Limit
                    </p>
                    <Button
                        endContent={
                            <BadgeCheck size={32} />
                        }
                        className='rounded-2xl w-full lemonsqueezy-button bg-white text-black-1 text-xl font-medium  p-8'
                        // as='a' href={checkoutLink}
                        onClick={() => {
                            createLemonSqueezy()
                            LemonSqueezy.Setup({
                                eventHandler: (data: any) => {
                                    if (data.event) {
                                        getMe()
                                    }

                                }
                            })
                            LemonSqueezy.Url.Open(checkoutLink)
                        }}
                    >Subscribe</Button>

                </div>}
                <div className='flex flex-col gap-24'>

                    <div className='w-full'>
                        <div className='flex gap-8 w-full mb-4 flex-col'>
                            <div className='w-full'>
                                <h2 className='text-2xl font-medium'>Allowed Domains</h2>
                                <p className='text-lg font-d'>Domains that are permitted to access your PageBot instance. <b className='text-medium'>Defaults to Any</b></p>
                            </div>
                            <DomainInput onAdd={(domain) => {

                                if (domains.includes(domain)) {
                                    return
                                }
                                const newDomains = [...domains, domain]
                                updateDomains(newDomains)
                                setDomains(newDomains)

                            }} />
                        </div>
                        {me ? <DomainList domains={domains} onDelete={deleteDomain} /> : <Spinner size='md' color='current' />}
                    </div>
                    {/* <div className='w-full'>
                        <div className='flex gap-8 w-full flex-col'>
                            <div className='w-full'>
                                <h2 className='text-2xl font-medium'>Billing</h2>
                                <p className='text-lg font-d'>Manage your billing through the Stripe portal.</p>
                            </div>
                            <Button className='rounded-3xl' as='a' href='https://billing.stripe.com/p/login/bIY7vz4zxcXC5k4dQQ'>Stripe Portal</Button>
                        </div>
                    </div> */}

                    {Documentation(me)}
                </div>
            </div>

        </Section>
    </>
}

interface DomainListProps {
    domains: string[]
    onDelete: (domain: string) => void
}

const DomainList: React.FC<DomainListProps> = ({ domains, onDelete }: DomainListProps) => {
    return <div className='flex flex-wrap gap-2'>
        {domains.map((domain) => <DomainListItem key={domain} domain={domain} onDelete={onDelete} />)}
    </div>

}

const DomainListItem: React.FC<{ domain: string, onDelete: (domain: string) => void }> = ({ domain, onDelete }) => {
    return <div className='flex gap-6 items-center p-2 bg-neutral-200 rounded-xl'>
        <div className='flex gap-2'>
            <Globe2Icon size={24} />
            <p>{domain}</p>
        </div>
        <Button isIconOnly onClick={() => onDelete(domain)}>
            <DeleteIcon size={24} />
        </Button>
    </div>
}


const DomainInput: React.FC<{ onAdd: (domain: string) => void }> = (props) => {
    const [domain, setDomain] = useState('')
    const [start, setStart] = useState(false)

    return <div >
        {
            start ? <div className='flex-1'>
                <div className='flex gap-1 items-center'>
                    <Input

                        onKeyDown={(e) => {

                            if (e.key === 'Enter' && domain.length > 0 && start) {
                                setStart(false)
                                props.onAdd(domain)
                                setDomain('')
                            }
                        }}
                        variant='faded' size='lg' placeholder='localhost:3000' type='text' value={domain} onChange={(e) => setDomain(e.target.value)} className='rounded-3xl p-2 w-full' />
                    <Button className='rounded-3xl' onClick={() => {
                        setStart(false)
                        props.onAdd(domain)
                        setDomain('')
                    }}>Add</Button>
                </div>
                {/* <p className='text-sm font-d'>Domains that are permitted to access your PageBot instance.</p> */}
            </div> : <Button onClick={() => setStart(true)}
                className='rounded-3xl' >Add Domain</Button>
        }
    </div >

}

function Documentation(me: Me | null) {
    return <div>
        <h2 className='text-2xl font-medium mb-4'>Integration Steps</h2>
        <div>
            <div className='flex flex-row gap-4 flex-wrap'>

                <DocElement codes={[<>
                    {`<script data-pgbt_id="${me?.id || 'LOADING'}" src='https://x.thepagebot.com' />`}
                </>]}
                    title='installation'
                >
                    <p className='font-bold text-purple'>Copy and paste this script tag into the head of your page.</p>

                </DocElement>
                <DocElement

                    codes={
                        [
                            <>
                                <p className='text-sm opacity-70'>Relative Url</p>
                                {`<meta name='pgbt:source' content='/'/> `}
                            </>,
                            <>
                                <p className='text-sm opacity-70'>Client or Server Rendered Webpage</p>
                                {`<meta name='pgbt:source' content='https://arible.co' data-expires='604800'/> `}
                            </>,
                            <>
                                <p className='text-sm opacity-70'>API GET Request</p>
                                {`<meta name='pgbt:source' content='https://dummyjson.com/users/search?q=John' data-expires='60'/> `}
                            </>,
                            <>
                                <p className='text-sm opacity-70'>SITEMAP</p>
                                {`<meta name='pgbt:source' content='https://arible.co/sitemap.xml' data-expires='6.048e5'/> `}
                            </>,
                            <>
                                <p className='text-sm opacity-70'>SITEMAP</p>
                                {`<meta name='pgbt:source' content='Name's Bond, James Bond'/> `}
                            </>
                        ]
                    }

                    title='adding a source'
                >
                    <>
                        <p>
                            <b>content</b>
                            <br />
                            This can either be raw text, a relative or absolute url. If it is a url, pagebot  will fetch the url and use the response as the source.
                        </p>
                        <p>
                            <b>data-expires</b>
                            <br />
                            <span className='font-medium'>Optional</span>
                            <br />
                            This is the number of seconds that pagebot will cache the source for. After this time, pagebot will fetch the source again.
                            Defaults to 1 month in seconds (2.6e+6 seconds)
                            <br />
                            <br />
                            <span className=' text-md'>
                                PageBot automatically parses the contents of the current webpage and its index page as a source. This means <b> you don't need to add the current page or the landing page as a source e.g content='/' is not required.</b>
                            </span>
                        </p>
                        <p className='text-purple font-bold'>We discourage using sitemap datasources, due to potential performance issues of having to retrieve a large number of urls.</p>
                        <p>
                            <b>Supported Formats</b>
                            <br />
                            <ul className='flex gap-4 p-4 px-8 mt-2 text-sm font-medium bg-white-1 items-start justify-start w-fit rounded-2xl'>
                                <span>HTML</span>
                                <span>Markdown</span>
                                <span>Text</span>
                                <span>JSON</span>
                                <span>DOCX</span>
                                <span>PDF</span>
                                <span>SITEMAP</span>
                            </ul>
                        </p>
                    </>
                </DocElement>
                <DocElement
                    codes={[<>
                        {`<meta name='pgbt:qa' data-question='What is the meaning of life?' data-answer='42' />`}

                    </>]}
                    title='adding pre-defined questions and answers'
                >

                    <p className='text-purple font-bold'>
                        Pre-defined questions and answers are not charged as they are never sent to the server. you should use this to save costs and reduce waiting time.
                    </p>
                </DocElement>

            </div>
        </div>
    </div>;
}
