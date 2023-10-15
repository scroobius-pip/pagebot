import { Button } from '@nextui-org/react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
const GetStarted = () => <section className='px-2 py-12 bg-black-1 w-full  flex gap-2 justify-around '>
    {/*@ts-ignore */}
    <Button href='/login' as={Link} color='' fullWidth className='w-full py-8 text-white' endContent={
        <ArrowRight size={32} />
    }>
        <h2 className=''>Get Started For Free</h2>

    </Button>
</section>


export default GetStarted