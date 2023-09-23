import React from 'react';

export const Card: React.FC<{ icon?: JSX.Element; children: JSX.Element; bg: string; bc?: string; className?: string }> = (props) => {

    return <div
        style={{
            backgroundColor: props.bg,
            borderStyle: 'solid',
            borderWidth: '6px',
            borderColor: props.bc
        }}
        className={'flex  flex-col gap-10 items-start py-12 px-8 rounded-[2rem] duration-300 hover:shadow-md cursor-pointer ' + props.className}>
        {props.icon}
        {props.children}
    </div>;
};
