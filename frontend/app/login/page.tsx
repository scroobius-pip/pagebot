"use client";
import { Logo } from '@/components/icons'
import { Section } from '@/components/section'
import { Button } from '@nextui-org/button'
import { Input } from '@nextui-org/input'
import { Spinner } from '@nextui-org/spinner'
import { useEffect, useRef, useState } from 'react'
import isJwtTokenExpired from 'jwt-check-expiry'

export default () => {
    const [email, setEmail] = useState<string>('')
    const [isEmailValid, setIsEmailValid] = useState<boolean>(false)
    const [sendLoading, setSendLoading] = useState<boolean>(false)

    const [sendSuccess, setSendSuccess] = useState<boolean>(false)

    const [sendTokenLoading, setSendTokenLoading] = useState<boolean>(false)
    const [jwt, setJwt] = useState<string>('')

    const [step, setStep] = useState<number>(0)

    useEffect(() => {
        const jwt = localStorage.getItem('jwt')
        jwt && !isJwtTokenExpired(jwt) && setJwt(jwt)
    }, [])

    useEffect(() => {
        const isValid = email.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i)
        setIsEmailValid(!!isValid)
    }, [email])

    useEffect(() => {
        const map: any = {
            'truefalse': 1,
            'truetrue': 2,
            'default': 0,
        }
        const key = `${sendSuccess}${sendTokenLoading}`
        setStep(map[key] || map['default'])

    }, [sendSuccess, sendTokenLoading])


    useEffect(() => {
        if (jwt) {
            localStorage.setItem('jwt', jwt)
            window.location.href = '/dashboard'
        }
    }, [jwt])

    const sendToken = async () => {
        setSendLoading(true)
        const endpoint = 'https://api.thepagebot.com/login'
        const res = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                email
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        res.status === 200 ? setSendSuccess(true) : setSendSuccess(false)
        setSendLoading(false)
    }

    const getJWT = async (token: string) => {
        setSendTokenLoading(true)
        const endpoint = 'https://api.thepagebot.com/jwt'
        const res = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                email,
                token
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if (res.status === 200) {
            const { jwt } = await res.json()
            setJwt(jwt)

        } else {

        }
        setSendTokenLoading(false)
    }

    const steps = [
        <div className='flex gap-2 flex-col w-full'>
            <Input onKeyDown={(e) => {
                if (e.key === 'Enter' && isEmailValid) {
                    sendToken()
                }
            }} onChange={({ target: { value } }) => {
                setEmail(value)
            }} value={email} variant='flat' placeholder='Email' type='email'
                // classNames={{
                //     input: 'text-black bg-black',
                //     base: 'text-black',
                //     innerWrapper: 'text-black bg-black',
                // }}
                className='text-black' color='secondary' />
            <Button onClick={sendToken} isLoading={sendLoading}
                className='bg-purple'
                color='secondary' isDisabled={!isEmailValid || sendLoading} fullWidth >Send Token</Button>
        </div>,
        <TokenInput onComplete={(token) => {
            getJWT(token)
        }} />,
        <Spinner size='md' color='secondary' />
    ]

    return <div className='w-full   flex-1 grid grid-cols-6'>
        <div className='col-span-full md:col-span-3 flex justify-center items-center bg-bg '>
            <div className='p-12 rounded-xl flex flex-col gap-24   w-full max-w-md items-center'>
                <div className='flex flex-col gap-4 justify-center items-center '>
                    <div className='flex gap-2  items-end'>
                        <Logo className='h-12' />
                        <h1 className='font-medium text-2xl '>Hi!</h1>
                    </div>
                    {step === 0 && <h3 className='font-normal text-lg'>We'll send a token to your email.</h3>}
                    {step === 1 && <>
                        <h3 className='font-normal text-xl text-center'>We've sent a token  to <b>{email}</b></h3>

                    </>}
                </div>
                {steps[step]}
                <p className='text-center text-sm mt-4'>By signing up, you agree to our <a className='font-medium' href='https://bronze-brush-9b0.notion.site/Terms-Conditions-7f3bf549df494b778c324cacb8d36b86?pvs=4' target='_blank' rel="noreferrer">Terms of Service</a> and <a className='font-medium' href='https://bronze-brush-9b0.notion.site/Privacy-Policy-a1179d5d327b4056b3b059c95ae846f8?pvs=4' target='_blank' rel="noreferrer">Privacy Policy</a>.</p>

            </div>
        </div>
        <div className='col-span-3 bg-purple md:flex justify-center items-center hidden'>

        </div>
    </div>
}

const TOKEN_LENGTH = 6

interface TokenInputProps {
    onComplete: (token: string) => void
}

const TokenInput = (props: TokenInputProps) => {
    const ref = useRef<HTMLDivElement>(null)
    const [tokenList, setTokenList] = useState<string[]>(new Array(TOKEN_LENGTH).fill(''))



    const isAlphaCapsNumeric = (value: string) => {
        return /^[A-Z0-9]$/i.test(value)
    }
    const toCaps = (value: string) => {
        return value.toUpperCase()
    }

    useEffect(() => {
        const token = tokenList.join('')
        if (token.length === TOKEN_LENGTH) {
            props.onComplete(token)
        }
    }, [tokenList])

    useEffect(() => {
        ref.current?.addEventListener('paste', (e) => {
            e.preventDefault()
            const paste: string = (e.clipboardData || (window as any)?.clipboardData).getData('text')
            const pasteArray = paste.toUpperCase().split('').slice(0, TOKEN_LENGTH)
            setTokenList(pasteArray)
        })

        ref.current?.addEventListener('keyup', (e) => {

            const preventedKeys = ['Tab', 'Meta', 'ArrowUp', 'ArrowDown']
            const previousKeys = ['Backspace', 'Delete', 'ArrowLeft']
            const deleteKeys = ['Delete', 'Backspace']
            const nextKeys = ['ArrowRight', 'Enter', 'Space']

            const input = e.target as HTMLInputElement
            const pos = input.getAttribute('data-pos')
            const key = e.key !== 'Unidentified' ? e.key : (e as any).target.value

            //@ts-ignore
            // console.log(e.data)
            if (!key) {
                return e.preventDefault()
            }
            if (preventedKeys.includes(key) || !pos) {
                return e.preventDefault()
            }

            if (previousKeys.includes(key)) {
                deleteKeys.includes(key) && setTokenValue(pos, '');
                input.value = ''
                focusPrev()
            }
            else if (nextKeys.includes(key)) {
                focusNext()
            }
            else if (isAlphaCapsNumeric(key)) {

                let value = toCaps(key)

                setTokenValue(pos, value);
                input.value = value
                focusNext()
            } else {
                e.preventDefault()
            }

            function setTokenValue(pos: string, value: string) {
                setTokenList((prev) => {
                    const next = [...prev];
                    next[Number(pos)] = value;
                    return next;
                });
            }

            function focusNext() {
                const next = document.querySelector(`input[data-pos="${Number(pos) + 1}"]`) as HTMLInputElement
                next?.focus()
            }

            function focusPrev() {
                const prev = document.querySelector(`input[data-pos="${Number(pos) - 1}"]`) as HTMLInputElement
                prev?.focus()
            }
        })
    }, [])
    return <>
        <div className='flex gap-2 flex-row ' ref={ref} >
            {
                Array.from({ length: TOKEN_LENGTH })
                    .map((_, i) => <Input value={
                        tokenList[i]
                    }
                        key={i}
                        size='lg'
                        autoFocus={i === 0}
                        data-pos={i}
                        maxLength={1}
                        className='w-6 text-xl text-center'
                        variant='underlined' />)
            }

        </div>
        {/* {tokenList.join('')} */}
    </>
}