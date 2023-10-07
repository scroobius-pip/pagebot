"use client"
import { useEffect, useRef } from 'react'


export const Section: React.FC<{ children: any, className?: string, disabled?: boolean }> = ({ children, className, disabled }) => {
    const ref = useRef(null)
    const buildThresholdArray = () => Array.from(Array(100).keys(), i => i / 100)
    const prevRatio = useRef(0.0)

    const startScale = 0.9;
    const targetScale = 1;
    const startOpacity = 0;
    const targetOpacity = 1;

    useEffect(() => {
        if (disabled) return
        //@ts-ignore
        ref.current && (ref.current.style.transform = `scale(${startScale})`)
        const observer = new IntersectionObserver((entries) => {
            const transition =
                (scale: number, opacity: number, entry: IntersectionObserverEntry) => {
                    //@ts-ignore
                    (entry.target.style.transform = `scale(${scale})`, entry.target.style.opacity = opacity)
                }

            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    if (entry.intersectionRatio > 0.5) {
                        transition(targetScale, targetOpacity, entry)
                    }
                    else if (entry.intersectionRatio > prevRatio.current) {
                        const progress = entry.intersectionRatio / 1;
                        const scale = startScale + (targetScale - startScale) * progress;
                        const opacity = startOpacity + (targetOpacity - startOpacity) * progress;
                        transition(scale, opacity, entry)
                    }
                } else {
                    transition(startScale, startOpacity, entry)
                }

                prevRatio.current = entry.intersectionRatio;
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
            minHeight: 'calc(100vh)',
            // margin: '2.5rem',
            // padding: '2rem',
            // borderRadius: '4.5rem',
            transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
        }
        }
        className={`bg-[#F1F1F1]  animated-section ${className} p-8`}
    >
        {children}
    </section >
}

