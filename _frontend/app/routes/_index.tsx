import { Button, Card, CardHeader, Image } from '@nextui-org/react';
import type { V2_MetaFunction } from "@remix-run/cloudflare";
import { useEffect, useRef } from 'react';

export const meta: V2_MetaFunction = () => {

  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  useEffect(() => {
    alert('hello')
  })
  return (
    <>
      <Section>
        <h1 className='text-5xl font-bold'>Welcome to Remix!</h1>
      </Section>
      <Section>
        <h1>Section 2</h1>
      </Section>
      <Section>
        <h1>Section 3</h1>
      </Section>
      <Section>
        <h1>Section 4</h1>
      </Section>
    </>
  );
}



const Section = ({ children }: any) => {
  const ref = useRef(null)

  // useEffect(() => {
  //   const observer = new IntersectionObserver((entries) => {
  //     entries.forEach((entry) => {
  //       if (entry.isIntersecting) {
  //         entry.target.classList.add('animated-section-enter')
  //       }
  //     })
  //   }, {
  //     threshold: 0.5
  //   })
  //   console.log(ref.current)

  //   if (ref.current) {
  //     observer.observe(ref.current)
  //   }

  //   return () => {
  //     if (ref.current) {
  //       observer.unobserve(ref.current)
  //     }
  //   }
  // }, [])


  return <section
    ref={ref}
    style={{
      height: 'calc(100vh - 2.5rem * 2)',
      margin: '2.5rem',
      padding: '2.5rem',
      borderRadius: '4.5rem',
    }
    }
    className='bg-[#F1F1F1] animated-section'
  >
    {children}
  </section >
}

