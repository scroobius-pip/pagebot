"use client"
import { Button, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/react'
import { LogoText } from './icons'
import { Link } from '@nextui-org/link'
import { SparkleIcon } from 'lucide-react'

const Navigation = () => {
    return <Navbar className='bg-white py-2 flex-col' maxWidth='xl' shouldHideOnScroll >
        <NavbarBrand>
            <LogoText className='h-8' />
        </NavbarBrand>
        <NavbarContent justify='center' className='hidden sm:flex'>
            <NavbarItem className=''>
                <Link className='text-black font-medium opacity-60 transition hover:opacity-100' href='#features'>Features</Link>
            </NavbarItem>
            <NavbarItem className=''>
                <Link className='text-black font-medium opacity-60 transition hover:opacity-100 ' href='#pricing'>Pricing</Link>
            </NavbarItem>
        </NavbarContent>
        <NavbarContent justify='end' className='' >
            <NavbarItem>
                <Link className='text-black font-medium opacity-60 transition hover:opacity-100 hidden sm:flex' href='/login'>Login</Link>
            </NavbarItem>
            <NavbarItem>
                <Button as={Link} href='/dashboard' size='lg' className='rounded-3xl text-sm md:text-lg font-medium text-white bg-black w-full md:w-auto '
                    endContent={<SparkleIcon size={24} strokeWidth={2} color='#FFFFFF' className='' />}
                >
                    Get Started For Free
                </Button>
            </NavbarItem>
        </NavbarContent>
    </Navbar>
}

export default Navigation