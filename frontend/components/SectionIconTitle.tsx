import { IconText } from '@/components/icons';
import React from 'react';

export const SectionIconTitle = IconText(({ text }) => {
    return <h2 className='text-3xl font-bold leading-tight grow max-w-lg'>
        {text}
    </h2>;
});
