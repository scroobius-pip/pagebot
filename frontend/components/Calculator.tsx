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

    const cost = (messageCount - 50) * 0.05


    return <div className='flex flex-col gap-4 bg-white-1 p-8 rounded-2xl'>
        <p className='text-2xl font-medium'><span ref={messageRef} className='text-purple font-semibold ring-[#FF6565] transition-all duration-100 p-1 rounded-full'>{messageCount}</span>
            messages monthly would cost:
        </p>
        {<p className='text-3xl font-semibold'>
            {messageCount <= 50 ? '$0/mo' : `~${formatCurrency(cost)}/mo`}
            <br />
            <span className='text-sm font-medium p-2 px-4 rounded-full text-white bg-purple'>50 Messages Free Monthly</span>
        </p>
        }
    </div>;

};


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}