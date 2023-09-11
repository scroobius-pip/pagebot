"use client"
import { useEffect, useRef } from 'react'


export const Section: React.FC<{ children: any, className?: string }> = ({ children, className }) => {
    const ref = useRef(null)
    const buildThresholdArray = () => Array.from(Array(100).keys(), i => i / 100)
    const prevRatio = useRef(0.0)

    const startScale = 0.65;
    const targetScale = 1;
    const startOpacity = 0;
    const targetOpacity = 1;

    useEffect(() => {
        //@ts-ignore
        ref.current && (ref.current.style.transform = `scale(${startScale})`)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {

                    const progress = entry.intersectionRatio / 1;
                    const scale = startScale + (targetScale - startScale) * progress;
                    const opacity = startOpacity + (targetOpacity - startOpacity) * progress;
                    //@ts-ignore
                    entry.target.style.transform = `scale(${scale})`
                    //@ts-ignore
                    entry.target.style.opacity = opacity
                }


                // prevRatio.current = entry.intersectionRatio;
            })
        }, {
            threshold: buildThresholdArray()
        })

        ref.current && observer.observe(ref.current)
        return () => (ref.current && observer.unobserve(ref.current), undefined)
    }, [])


    return <section
        ref={ref}
        style={{
            height: 'calc(100vh - 2.5rem * 2)',
            margin: '2.5rem',
            padding: '2.5rem',
            borderRadius: '4.5rem',
            transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
        }
        }
        className={`bg-[#F1F1F1] animated-section ${className}`}
    >
        {children}
    </section >
}

