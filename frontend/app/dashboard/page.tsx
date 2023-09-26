"use client"
import { SectionIconTitle } from '@/components/SectionIconTitle';
import { textBlack } from '@/components/primitives';
import { Section } from '@/components/section';
import { DeleteIcon, Globe2Icon, LayoutDashboardIcon } from 'lucide-react';
import { Tooltip } from '@nextui-org/tooltip';
import { Button } from '@nextui-org/button';
import { Input } from '@nextui-org/input'
import React, { useEffect, useState } from 'react';
import { DocElement } from '@/components/documentation';
import isJwtTokenExpired from 'jwt-check-expiry'
import { Spinner } from '@nextui-org/spinner';

interface Me {
    id: string
    usage: any[]
    allowed_domains: string[] | null
    subscribed: boolean
}

export default function Dashboard() {
    const [domains, setDomains] = useState<string[]>([])
    const deleteDomain = (domain: string) => {
        const newDomains = domains.filter((d) => d !== domain)
        setDomains(newDomains)
        updateDomains(newDomains)
    }
    const [me, setMe] = useState<Me | null>(null)


    const getMe = async () => {
        const endpoint = 'https://api.thepagebot.com/me'
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
        const endpoint = 'https://api.thepagebot.com/domains'
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
        const jwt = localStorage.getItem('jwt');
        (jwt && !isJwtTokenExpired(jwt) && getMe()) || (window.location.href = '/login')
    }, [])




    return <>
        <Section disabled className='flex flex-col gap-14 justify-'>
            <div className='p-4 bg-[#FFFCF9]  rounded-full flex  justify-between gap-2'>
                <SectionIconTitle text='Dashboard' color={textBlack} icon={<LayoutDashboardIcon size={24} />} />
                <Button variant='flat' className='rounded-full' onClick={() => {
                    localStorage.removeItem('jwt')
                    window.location.href = '/login'
                }}>Logout</Button>
            </div>
            <div className='flex flex-col gap-12'>
                <div className='flex flex-col gap-2 bg-[#FFFCF9] p-6 -mx-10'>
                    <h2 className='text-3xl font-extrabold'>Usage</h2>
                    <div className="flex flex-wrap flex-row gap-4">
                        <div className='p-8 shadow-sm rounded-3xl bg-[#9257FA] text-neutral-50    border-2 gap-4 flex flex-col'>
                            <div>
                                <Tooltip content="Customer messages that were answered by PageBot.">
                                    <p className='text-lg font-medium '>Total Messages <span className='ml-6 text-sm opacity-90'>Last 30 Days</span></p>
                                </Tooltip>
                            </div>
                            {me ? <h3 className='text-6xl font-bold'>20.1k</h3> : <Spinner size='md' color='white' />}
                        </div>
                        <div className='p-8 shadow-sm rounded-3xl bg-neutral-50 border-2 gap-4 flex flex-col'>
                            <div>
                                <Tooltip content="How many times PageBot had to retrieve a source.">
                                    <p className='text-lg font-medium'>Source Retrieval Count <span className='ml-6 text-sm opacity-70'>Last 30 Days</span></p>
                                </Tooltip>
                            </div>
                            {me ? <h3 className='text-6xl font-bold'>2.1k</h3> : <Spinner size='md' color='current' />}
                        </div>


                    </div>
                </div>
                <div className='flex flex-col gap-24 max-w-3dxl'>

                    <div className='w-full'>
                        <div className='flex gap-8 w-full mb-4'>
                            <div className='w-full'>
                                <h2 className='text-3xl font-extrabold'>Allowed Domains</h2>
                                <p className='text-lg font-d'>Domains that are permitted to access your PageBot instance.</p>
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
                    <div className='w-full'>
                        <div className='flex gap-8 w-full'>
                            <div className='w-full'>
                                <h2 className='text-3xl font-extrabold'>Billing</h2>
                                <p className='text-lg font-d'>Manage your billing through the Stripe portal.</p>
                            </div>
                            <Button className='rounded-3xl' as='a' href='https://billing.stripe.com/p/login/bIY7vz4zxcXC5k4dQQ'>Stripe Portal</Button>
                        </div>
                    </div>
                    <div>
                        <h2 className='text-3xl font-extrabold mb-4'>Integration Steps</h2>
                        <div>
                            <div className='flex flex-row gap-4 flex-wrap'>

                                <DocElement code={<>
                                    {`<script data-pgbt_id="${me?.id || 'LOADING'}" src='https://s.thepagebot.com/pgbt.js' />`}
                                </>}
                                    title='installation'
                                    description='Put in the head tag of every page you want pagebot to appear in.'
                                />
                                <DocElement
                                    code={<>
                                        {`<meta name='pgbt:source' content='/' /> {*/ relative url to the current page */}`}
                                        {``}
                                        {`<meta name='pgbt:source' content='https://example.com' /> {*/ absolute url */}`}
                                        {`<meta name='pgbt:source' content='https://example.com/api' /> {*/ api endpoint */}`}
                                        {`<meta name='pgbt:source' content='https://example.com/api' data-expires='3600' /> {*/ cached for 1 hour */}`}
                                    </>}
                                    title='adding a source'
                                    description='Specify the source of the knowledge-base. this can be a url, an api endpoint or a relative url of the current page. you can also specify how many seconds the cache should last (default is 1 day).'
                                />
                                <DocElement
                                    code={<>
                                        {`<meta name='pgbt:qa' data-question='What is the meaning of life?' data-answer='42' />`}
                                        {`<meta name='pgbt:qa' data-question='Is this the real life?' data-answer='Is this just fantasy?' />`}
                                        {`<meta name='pgbt:qa' data-question='But what about the children?' data-answer='What about the children?' /> */}`}
                                    </>}
                                    title='adding predefined questions and answers'
                                    description='Predefined questions and answers aren’t charged as they are never sent to the server. you should use this to save costs and reduce waiting time.'
                                />
                            </div>
                        </div>
                    </div>
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