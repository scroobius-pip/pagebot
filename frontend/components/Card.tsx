import React from 'react';

export const Card: React.FC<{ icon?: JSX.Element; children: JSX.Element; bg: string; bc?: string; }> = (props) => {

    return <div
        style={{
            backgroundColor: props.bg,
            borderStyle: 'solid',
            borderWidth: '6px',
            borderColor: props.bc
        }}
        className='flex flex-1 flex-col gap-10 items-start p-14 rounded-[2rem] duration-300 hover:shadow-lg cursor-pointer'>

        {props.icon}

        {/* <div className='text-left max-w-xs text-4xl leading-snug'>
            {props.text}
        </div> */}
        {props.children}
    </div>;
};
