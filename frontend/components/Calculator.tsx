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
        <p className='text-3xl'>A source containing
            <span ref={sourceRef} className='text-purple p-1 mx-1 rounded-full'>{sourceCount}</span>
            words, updated <b>weekly </b>
            for
            <span ref={messageRef} className='text-purple ring-[#FF6565] transition-all duration-100 p-1 mx-1 rounded-full'>{messageCount}</span>
            messages monthly would cost:
        </p>
        <p className='text-3xl font-semibold'>
            {/* <b>4 weeks</b> * $0.0005/source + ((0.00004 * <b className='text-[#9257FA]'>{sourceCount}</b>) + 0.05) * <b className='text-[#FF6565]'>{messageCount}</b>) = */}
            ~${cost}/month
        </p>
    </div>;

};
