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
        <div className='flex gap-2 flex-col'>
            <Input onChange={({ target: { value } }) => {
                setEmail(value)
            }} value={email} variant='underlined' placeholder='Email' type='email' color='secondary' />
            <Button onClick={sendToken} isLoading={sendLoading} color='secondary' isDisabled={!isEmailValid || sendLoading} fullWidth >Send Token</Button>
        </div>,
        <TokenInput onComplete={(token) => {
            getJWT(token)
        }} />,
        <Spinner size='md' color='secondary' />
    ]

    return <div className='w-full h-full  flex justify-center items-center bg-neutral-50'>
        <div className='p-12 rounded-xl flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
                <div className='flex gap-2  items-center'>
                    <Logo className='h-8' />
                    <h1 className='font-semibold text-base'>Login</h1>
                </div>
                <p className='font-semibold'>Enter your email to receive a login token.</p>
            </div>
            {steps[step]}
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
        ref.current?.addEventListener('keyup', (e) => {
            const preventedKeys = ['Tab', 'Meta', 'ArrowUp', 'ArrowDown']
            const previousKeys = ['Backspace', 'Delete', 'ArrowLeft']
            const deleteKeys = ['Delete', 'Backspace']
            const nextKeys = ['ArrowRight', 'Enter', 'Space']

            const input = e.target as HTMLInputElement
            const pos = input.getAttribute('data-pos')


            if (preventedKeys.includes(e.key) || !pos) {
                return e.preventDefault()
            }

            if (previousKeys.includes(e.key)) {
                deleteKeys.includes(e.key) && setTokenValue(pos, '');
                focusPrev()
            }
            else if (nextKeys.includes(e.key)) {
                focusNext()
            }
            else if (isAlphaCapsNumeric(e.key)) {
                let value = toCaps(e.key)
                input.value = value
                setTokenValue(pos, value);
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
    return <div className='flex gap-2 flex-row ' ref={ref} >
        {Array.from({ length: TOKEN_LENGTH }).map((_, i) => <Input size='lg' autoFocus={i === 0} data-pos={i} maxLength={1} className='w-6 text-xl' variant='underlined' />)}
    </div>
}