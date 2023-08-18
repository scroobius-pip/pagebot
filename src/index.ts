import { render } from 'preact';
import PgbtUI from './ui';
//@ts-ignore
import * as cssText from 'bundle-text:./ui.css';
// import './ui.module.css';
type ExtractedData = {
    text: string,
    links: { text: string, href: string }[],
    references: { text: string, element: Element }[]
}

interface Source {
    url?: string,
    content?: string, // text
    expires?: number, //duration in seconds e.g. 60 * 60 * 24 * 7 = 1 week
}

const HOST = 'https://api.thepagebot.com/message'

class WebpageTextExtractor {
    private root: Node;
    private relevantTags: string[];

    constructor(root: Node = document.body, relevantTags: string[] = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH']) {
        this.root = root;
        this.relevantTags = relevantTags;
    }

    public extract(): ExtractedData {
        return this.extractFromNode(this.root, {
            text: '', links: [],
            references: []
        }, false);
    }

    private extractFromNode(node: Node, data: ExtractedData, inRelevantTag: boolean): ExtractedData {
        const childNodes = node.childNodes;
        if (this.relevantTags.includes(node.nodeName)) {
            inRelevantTag = true;
        }

        let childText = '';

        for (let i = 0; i < childNodes.length; i++) {
            const childNode = childNodes[i];
            if (childNode.nodeType === Node.TEXT_NODE && inRelevantTag) {
                const text = childNode.nodeValue?.trim();

                if (text) {
                    data.text += text + ' ';
                    childText += text + ' ';
                    // data.references.push({ text: text, element: node as Element });
                }

            } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                if (childNode.nodeName === 'A') {
                    data.links.push({
                        text: (childNode as HTMLAnchorElement).text,
                        href: (childNode as HTMLAnchorElement).href
                    });
                }
                data = this.extractFromNode(childNode, data, inRelevantTag);
            }
        }

        if (childText.length > 3)
            data.references.push({ text: childText, element: node as Element });

        return data;
    }
}

export class PageBot {
    private data: ExtractedData;
    private sources: Source[];
    private id: string;
    public initialQuestions: Array<[string, string]>;

    get text() {
        return this.data.text;
    }

    public constructor(extractedData: ExtractedData, id: string) {

        const customRoot = document.createElement('div');
        customRoot.style.position = 'absolute';
        customRoot.style.zIndex = "10000";
        customRoot.style.right = '0px'
        customRoot.id = 'pgbt-root';
        document.body.appendChild(customRoot);

        const style = document.createElement('style');
        style.textContent = cssText;

        customRoot.appendChild(style);


        this.id = id;
        this.data = extractedData;
        this.sources = PageBot.getPageSources()
            .concat([{ content: extractedData.text, url: window.location.href }])

        this.initialQuestions = this.getQuestions()
        render(PgbtUI, customRoot);

    }


    private static getPageSources(): Array<Source> {
        const isUrl = (str: string) => {
            try {
                new URL(str);
                return true;
            } catch (e) {
                return false;
            }
        }

        return Array.from(document.querySelectorAll('meta[name="pgbt:source"]:not([content=""])'))
            .reduce((acc: Array<Source>, el: HTMLMetaElement) => {
                const expiresAttribute = el.getAttribute('data-expires') as string;
                const content = el.content;
                const expires = expiresAttribute ? parseInt(expiresAttribute) : undefined;

                const existingSource = acc.find(s => s.content === content);

                if (!existingSource && content) {
                    acc.push(isUrl(content) ? { url: content, expires } : { content, expires });
                }

                return acc;

            }, []);
    }



    public async *query(queryText: string): AsyncGenerator<string> {
        const normalizedQueryText = normalizeText(queryText);
        const [_, answer] = this.initialQuestions.find(([question, _]) => normalizeText(question) === normalizedQueryText) ?? [null, null]

        if (answer) {
            for (const word of answer.split(" ")) {
                yield word + " ";
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

        } else {

            // const url = 'http://localhost:8000/message'; // Replace with your endpoint URL
            const body = JSON.stringify({
                user_id: this.id,
                query: queryText,
                sources: this.sources,
                page_url: window.location.href,
            });

            const response = await fetch(HOST, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            if (response.ok) {
                const reader = response.body?.getReader();
                const textDecoder = new TextDecoder();


                while (true) {
                    const { value, done } = await reader?.read() ?? { value: null, done: true };
                    if (done) break;

                    //message is prepended with data:<message>
                    const message = textDecoder.decode(value)
                    const decodedMessage = message.replaceAll('data:', '');
                    yield decodedMessage;
                }

            } else {
                console.error('Error fetching data:', response.status, response.statusText);
                throw new Error('Failed to fetch data');
            }
        }


    }


    private getQuestions(): Array<[string, string]> {
        // <meta name='pgbt:qa' data-question='What is the meaning of life?' data-answer='42' />
        return Array.from(document.querySelectorAll('meta[name="pgbt:qa"]'))
            .map((el: HTMLMetaElement) => {
                const question = el.getAttribute('data-question');
                const answer = el.getAttribute('data-answer');
                return [question, answer] as [string, string];
            });

    }

}

const normalizeText = (text: string) => text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\[\]\"\'<>\\|]/g, "").trim();
const debounce = (func: Function, delay: number) => {
    let inDebounce: number;
    return function (this: any, ...args: any[]) {
        clearTimeout(inDebounce);
        inDebounce = setTimeout(() => func.apply(this, args), delay);
    }
};

let callCount = 0;

//@ts-ignore
const MIN_DATA_LENGTH = process.env.NODE_ENV === 'development' ? 10 : 500;
const initializePageBot = () => {
    callCount++;

    const timeStart = performance.now();
    const extractedData = new WebpageTextExtractor().extract();
    const timeEnd = performance.now();
    console.log(`Extracted data in ${timeEnd - timeStart}ms`);

    const currentLength = extractedData.text.length;

    if (currentLength < MIN_DATA_LENGTH) {
        console.log('Document too short, skipping');
        return;
    }

    console.log(`Document length: ${currentLength}`);
    console.log(`Document created in ${performance.now() - timeCreate}ms`);

    const currentScript = document.getElementById('pgbt');
    const userId = currentScript?.getAttribute('data-id');

    if (!userId) {
        console.log('No user id provided, skipping');
        return;
    }

    globalThis['pgbt'] = new PageBot(extractedData, userId);
    observer.disconnect();
    console.log(`Observer disconnected after ${callCount} calls`);
}

const timeCreate = performance.now();
const observer = new MutationObserver(debounce(initializePageBot, 1000));

observer.observe(document, { childList: true, subtree: true })


// window.addEventListener("load", () => {
//     const timeStart = performance.now();
//     const extractor = new WebpageTextExtractor();
//     const extractedData = extractor.extract();
//     const timeEnd = performance.now();
//     console.log(`Extracted data in ${timeEnd - timeStart}ms`);
//     globalThis['pgbt'] = new PageBot(extractedData);



//     // scroll to last reference
//     // const lastReference = extractedData.references[extractedData.references.length - 1];
//     // lastReference.element.scrollIntoView({ behavior: "smooth", block: "center" });

// });
