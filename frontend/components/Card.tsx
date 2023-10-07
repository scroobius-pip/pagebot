import React from 'react';

export const Card: React.FC<{ icon?: JSX.Element; children: JSX.Element; bg: string; bc?: string; className?: string }> = (props) => {

    return <div
        style={{
            backgroundColor: props.bg,
            borderStyle: 'solid',
            borderWidth: '.4em',
            borderColor: props.bc
        }}
        className={'flex  flex-col gap-4 items-start py-12 px-8 rounded-2xl duration-300 dhover:shadow-md cursor-pointer ' + props.className}>
        {props.icon}
        {props.children}
    </div>;
};
