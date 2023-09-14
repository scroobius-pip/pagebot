"use client"
import { useRef, useState } from 'react';
import { useEditable } from 'use-editable';
export const Calculator = () => {
    const INITIAL_SOURCE_COUNT = 2000;
    const INITIAL_MESSAGE_COUNT = 100;

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

    const cost = (4 * 0.0005 + ((0.00004 * sourceCount) + 0.05) * messageCount).toFixed(2);


    return <div className='flex flex-col gap-3'>
        <p className='text-xl font-medium'>A source containing
            <b ref={sourceRef} className='text-[#FFBB0C] p-1 mx-1 rounded-full'>{sourceCount}</b>
            words, updated <b>weekly </b>
            for
            <b ref={messageRef} className='text-[#FF6565] ring-[#FF6565] transition-all duration-100 p-1 mx-1 rounded-full'>{messageCount}</b>
            messages monthly would cost:
        </p>
        <p className='text-2xl font-medium'>
            <b>4 weeks</b> * $0.0005/source + ((0.00004 * <b className='text-[#FFBB0C]'>{sourceCount}</b>) + 0.05) * <b className='text-[#FF6565]'>{messageCount}</b>) = ~${cost}/month
        </p>
    </div>;

};
