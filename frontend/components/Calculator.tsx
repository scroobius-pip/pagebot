"use client"
import { useRef, useState } from 'react';
import { useEditable } from 'use-editable';
export const Calculator = () => {
    const INITIAL_SOURCE_COUNT = 2000;
    const INITIAL_MESSAGE_COUNT = 50;

    const [sourceCount, setSourceCount] = useState(INITIAL_SOURCE_COUNT);
    const [messageCount, setMessageCount] = useState(INITIAL_MESSAGE_COUNT);

    const messageRef = useRef<HTMLSpanElement>(null);
    const sourceRef = useRef<HTMLSpanElement>(null);

    useEditable(messageRef, (value) => {
        const parsed = parseInt(value);
        const parsedValue = isNaN(parsed) ? INITIAL_MESSAGE_COUNT : parsed;
        setMessageCount(parsedValue);
    })

    useEditable(sourceRef, (value) => {
        const parsed = parseInt(value);
        const parsedValue = isNaN(parsed) ? INITIAL_SOURCE_COUNT : parsed;
        setSourceCount(parsedValue);
    })

    const cost = (4 * 0.0005 + ((0.00005 * sourceCount) + 0.05) * (messageCount - 50));


    return <div className='flex flex-col gap-12'>
        <p className='text-2xl font-medium'>A source containing
            <span ref={sourceRef} className='text-purple p-1 mx-1 rounded-full font-semibold'>{sourceCount}</span>
            words, updated weekly
            for
            <span ref={messageRef} className='text-purple font-semibold ring-[#FF6565] transition-all duration-100 p-1 mx-1 rounded-full'>{messageCount}</span>
            messages monthly would cost:
        </p>
        <p className='text-5xl font-semibold'>
            {/* <b>4 weeks</b> * $0.0005/source + ((0.00004 * <b className='text-[#9257FA]'>{sourceCount}</b>) + 0.05) * <b className='text-[#FF6565]'>{messageCount}</b>) = */}
            {messageCount <= 50 ? '$0' : `~${formatCurrency(cost)}/month`}
            <br />
            <span className='text-sm font-medium p-2 px-4 rounded-full text-white bg-purple'>50 Messages Free Monthly</span>
        </p>
    </div>;

};


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}