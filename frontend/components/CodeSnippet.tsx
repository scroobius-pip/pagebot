"use client";
export const CodeSnippet = ({ children, title }: any) => {
    return <>
        <br />
        <span className='text-white-1 opacity-40 block'>{title}</span>
        <span className='opacity-80 duration-400 hover:opacity-100 '>
            {children}
        </span>
        <br />
    </>;
};
