import React from 'react';

export const Card: React.FC<{ icon?: JSX.Element; children: JSX.Element; className?: string }> = (props) => {

    return <div

        className={'flex  flex-col gap-4 items-start py-16 px-12 rounded-2xl duration-300 dhover:shadow-md cursor-pointer ' + props.className}>
        {props.icon}
        {props.children}
    </div>;
};
