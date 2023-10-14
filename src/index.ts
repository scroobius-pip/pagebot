import { render } from 'preact';
import PgbtUI, { Message } from './ui';
//@ts-ignore
// import * as cssText from 'bundle-text:./ui.css';
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



export type ParsedMessage = {
    type: 'chunk',
    value: string,
} | {
    type: 'perf',
    value: {
        retrieval_time: string,
        embedding_time: string,
        search_time: string,
        total_time: string,
        first_chunk_time: string,
        token_count: number,
        cached: boolean
    }
} | {
    type: 'not_found',
} | {
    type: 'error',
} | {
    type: 'email',
}



const HOST = 'https://api.thepagebot.com/'
// const HOST = 'http://localhost:8000/'
//@ts-ignore
// const HOST = process.env.NODE_ENV === 'development' ? 'http://loc alhost:8000/' : 'https://api.thepagebot.com/'
class WebpageTextExtractor {
    private root: Node;
    private relevantTags: string[];

    constructor(root: Node = document.body, relevantTags: string[] = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'PRE']) {
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

        if (childText.length >= 3)
            data.references.push({ text: childText, element: node as Element });

        return data;
    }
}

interface HistoryItem {
    bot: boolean;
    content: string;
}

export class PageBot {
    private data: ExtractedData;
    private sources: Source[];
    private id: string;
    public history: HistoryItem[] = [];
    public initialQuestions: Array<[string, string]>;
    public detachedMode: boolean = false;

    get text() {
        return this.data.text;
    }



    public constructor(extractedData: ExtractedData, id: string, shouldStyle: boolean = true) {

        const [customRoot, detachedMode] = PageBot.getRoot();
        if (!detachedMode)
            document.body.appendChild(customRoot);

        if (shouldStyle) {
            const style = document.createElement('style');
            import('bundle-text:./ui.css').then(cssText => {
                style.textContent = cssText;
            })
            customRoot.appendChild(style);

        }



        this.detachedMode = detachedMode;
        this.id = id;
        this.data = extractedData;
        this.sources = this.getPageSources();
        this.initialQuestions = this.getQuestions()

        globalThis['pgbt'] = this;
        render(PgbtUI, customRoot);

    }

    private static getRoot(): [Element, boolean] {
        const ROOT_ID = 'pgbt-root';
        let root = document.getElementById(ROOT_ID);
        let detachedMode = true;

        if (!root) {
            const customRoot = document.createElement('div');
            customRoot.style.position = 'absolute';
            customRoot.style.zIndex = "10000";
            customRoot.style.right = '0px'
            customRoot.id = 'pgbt-root';
            root = customRoot;
            detachedMode = false;
        }

        return [root, detachedMode];
    }


    private getPageSources(): Array<Source> {
        const isUrl = (str: string) => {
            try {
                new URL(str);
                return true;
            } catch (e) {
                return false;
            }
        }

        const isAbsoluteUrl = (str: string) => {
            const regex = new RegExp('^(?:[a-z+]+:)?//', 'i');
            return regex.test(str);
        }

        const getAbsoluteUrl = (relativeUrl: string) => {
            const absoluteUrl = new URL(relativeUrl, document.baseURI);
            return absoluteUrl.href;
        }

        const indexSource = { url: getAbsoluteUrl('/') };

        const initialSources = indexSource.url.includes('localhost') ? [] : [indexSource];

        return Array.from(document.querySelectorAll('meta[name="pgbt:source"]:not([content=""])'))
            .reduce((acc: Array<Source>, el: HTMLMetaElement) => {
                const expiresAttribute = el.getAttribute('data-expires') as string;
                const content = el.content;
                const expires = expiresAttribute ? parseInt(expiresAttribute) : undefined;

                const existingSource = acc.find(s => s.content === content);

                if (!existingSource && content) {
                    acc.push(isUrl(content) ? {
                        url: isAbsoluteUrl(content) ? content : getAbsoluteUrl(content),
                        expires
                    } : {
                        content,
                        expires
                    });
                }

                return acc;

            }, initialSources)
            .concat([{
                content: this.data.text, url: window.location.href,
            }])
    }

    public async email(email: string, name: string, message: string): Promise<boolean> {
        const body = JSON.stringify({
            email,
            name,
            message,
            page_url: window.location.href,
            history: this.history,
            user_id: this.id,
        });

        const response = await fetch(HOST + 'email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        });

        if (response.ok) {
            return true;
        } else {
            console.error('Error fetching data:', response.status, response.statusText);
            return false;
        }

    }


    private static decodeMessage(message: string): ParsedMessage {

        try {

            if (!message) {
                return {
                    type: 'chunk',
                    value: '',
                }
            }
            const messageData = JSON.parse(message);

            if (messageData.chunk) {
                return {
                    type: 'chunk',
                    value: messageData.chunk,
                }
            } else if (messageData.perf) {
                return {
                    type: 'perf',
                    value: messageData.perf,
                }
            } else if (messageData.not_found) {
                return {
                    type: 'not_found',
                }
            } else if (messageData.error) {
                return {
                    type: 'error',
                }
            } else if (messageData.email) {
                return {
                    type: 'email',
                }
            } else if (messageData.none) {
                return {
                    type: 'chunk',
                    value: '',
                }
            }

            throw new Error('Invalid message format');
        }
        catch (error) {
            console.error(error, message)
            return {
                type: 'error',
            }

        }

    }


    public async *query(queryText: string): AsyncGenerator<ParsedMessage> {
        const normalizedQueryText = normalizeText(queryText);
        const [_, answer] = this.initialQuestions.find(([question, _]) => normalizeText(question) === normalizedQueryText) ?? [null, null]

        if (answer) {
            for (const word of answer.split(" ")) {
                // yield word + " ";
                yield {
                    type: 'chunk',
                    value: word + " ",
                }
                await new Promise((resolve) => setTimeout(resolve, 50));
            }

        } else {
            const sources = this.getPageSources();

            const body = JSON.stringify({
                message: {
                    user_id: this.id,
                    query: queryText,
                    sources,
                    page_url: window.location.href,
                },
                history: this.history
            });

            const response = await fetch(HOST + 'message', {
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
                    const messageData = message.replaceAll('data:', '')
                        .split('\n');


                    for (const message of messageData) {
                        const decodedMessage = PageBot.decodeMessage(message);
                        // console.log('decodedMessage', decodedMessage);
                        yield decodedMessage;
                    }
                }

            } else {
                console.error('Error fetching data:', response.status, response.statusText);
                throw new Error('Failed to fetch data');
            }
        }


    }


    private getQuestions(): Array<[string, string]> {
        // <meta name='pgbt:qa' data-question='What is the meaning of life?' data-answer='42' />
        try {

            const sources = Array.from(document.querySelectorAll('meta[name="pgbt:qa"]'))
                .map((el: HTMLMetaElement) => {
                    const question = el.getAttribute('data-question');
                    const answer = el.getAttribute('data-answer');
                    return [question, answer] as [string, string];
                });

            return sources

        } catch (e) {
            console.error(e)
        }
    }

}

const normalizeText = (text: string) => text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\[\]\"\'<>\\|]/g, "").trim();
const debounce = (func: Function, delay: number) => {
    let inDebounce;
    return function (this: any, ...args: any[]) {
        clearTimeout(inDebounce);
        inDebounce = setTimeout(() => func.apply(this, args), delay);
    }
};

let callCount = 0;

//@ts-ignore
// const MIN_DATA_LENGTH = process.env.NODE_ENV === 'development' ? 0 : 0;
const initializePageBot = () => {
    callCount++;

    const timeStart = performance.now();
    const extractedData = new WebpageTextExtractor().extract();
    const timeEnd = performance.now();
    console.log(`PGBT: Extracted data in ${timeEnd - timeStart}ms`);

    const currentLength = extractedData.text.length;

    console.log(`PGBT: Document length: ${currentLength}`);
    console.log(`PGBT: Document created in ${performance.now() - timeCreate}ms`);


    const currentScript = document.querySelectorAll('script[data-pgbt_id]')[0];
    const userId = currentScript?.getAttribute('data-pgbt_id');
    const noStyle = currentScript?.getAttribute('data-pgbt_style') === 'false';

    if (!userId) {
        console.log('No user id provided, skipping');
        return;
    }

    new PageBot(extractedData, userId, !noStyle);
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
