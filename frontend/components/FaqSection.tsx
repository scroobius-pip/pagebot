"use client"
import React from 'react';
import { Accordion, AccordionItem } from '@nextui-org/react';

export function FaqSection() {
    return <section>
        <Accordion>
            <AccordionItem title='Pricing'>
                <p>
                    PageBot is a GPT powered chatbot that understands your website's content and knowledgebase
                </p>
            </AccordionItem>
        </Accordion>
    </section>;
}
