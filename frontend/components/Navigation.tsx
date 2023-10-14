"use client"
import { Button, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/react'
import { LogoText } from './icons'
import { Link } from '@nextui-org/link'
import { SparkleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import isJwtTokenExpired from 'jwt-check-expiry'

const Navigation = () => {
    const [loggedIn, setLoggedIn] = useState(false)

    useEffect(() => {
        const jwt = localStorage.getItem('jwt');
        (jwt && !isJwtTokenExpired(jwt) && setLoggedIn(true))
    }, [])

    return <Navbar className='bg-purple py-2 flex-col text-white' maxWidth='xl' shouldHideOnScroll isBordered  >
        <NavbarBrand>
            <Link href='/' className='text-white'>
                <LogoText className='h-8' />
            </Link>
        </NavbarBrand>
        <NavbarContent justify='center' className='hidden sm:flex'>
            {!loggedIn && <>
                <NavbarItem className=''>
                    <Link className='text-white font-medium opacity-60 transition hover:opacity-100' href='#features'>Features</Link>
                </NavbarItem>
                <NavbarItem className=''>
                    <Link className='text-white font-medium opacity-60 transition hover:opacity-100 ' href='#pricing'>Pricing</Link>
                </NavbarItem>
            </>}
        </NavbarContent>
        <NavbarContent justify='end' className='' >
            {!loggedIn ? <>
                <NavbarItem>
                    <Link className='text- font-medium opacity-60 transition hover:opacity-100 hidden sm:flex' href='/login'>Login</Link>
                </NavbarItem>
                <NavbarItem>
                    <Button as={Link} href='/login' size='lg' className='rounded-3xl text-sm md:text-lg font-medium text-purple bg-white w-full md:w-auto '
                        endContent={<SparkleIcon size={24} strokeWidth={2} color='#5C07ED' className='' />}
                    >
                        Get Started For Free
                    </Button>
                </NavbarItem>
            </> : <>
                <NavbarItem>
                    <Link onClick={() => {
                        localStorage.removeItem('jwt')
                        setLoggedIn(false)

                    }} className='text-white font-medium opacity-60 transition hover:opacity-100 hidden sm:flex' href='#'>Logout</Link>
                </NavbarItem>
                <NavbarItem>
                    <Button as={Link} href='/dashboard' size='lg' className='rounded-3xl text-sm md:text-lg font-medium text-purple bg-white w-full md:w-auto '
                        endContent={<SparkleIcon size={24} strokeWidth={2} className='text-purple' />}
                    >
                        Dashboard
                    </Button>
                </NavbarItem>

            </>
            }
        </NavbarContent>
    </Navbar>
}

export default Navigation