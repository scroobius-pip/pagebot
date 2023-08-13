import { useState, useEffect, useRef } from 'preact/hooks';
import { PageBot } from '.';
// import * as classes from './ui.module.css'
import { parse } from 'tiny-markdown-parser';

interface Theme {
    primaryColor: string;
    textColor: string;
    backgroundColor: string;
    borderColor: string;
}

const defaultTheme: Theme = {
    primaryColor: '#5D5CDE',
    textColor: '#1a202c',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
}

const getTheme = (): Theme => {
    const theme = globalThis['pgbt']?.theme;
    return theme ? theme : defaultTheme;
}

const PgbtUI = () => {
    const [renderedText, setRenderedText] = useState<string>();
    const ref = useRef<HTMLDivElement>(null);
    const theme = getTheme();
    const [selectedQuestion, setSelectedQuestion] = useState<string>();
    const [isVisible, setIsVisible] = useState<boolean>(false);

    useEffect(() => {
        const pgbt: PageBot = globalThis['pgbt']
        setRenderedText(pgbt.text)
        registerScrollHandling();
    }, []);


    const registerScrollHandling = () => {
        const element = ref.current;
        if (element) {
            // element.addEventListener('mouseleave', () => {
            //     element.classList.add('pb_scroll-start');
            // })

            // element.addEventListener('mouseover', () => {
            //     element.classList.remove('pb_scroll-start');
            // })
            // document.addEventListener('scroll', () => {
            //     // check if pb_scroll-start class is already added
            //     if (!element.classList.contains('pb_scroll-start')) {
            //         element.classList.add('pb_scroll-start');
            //         element.classList.add('fade-out');
            //         element.classList.remove('fade-in');
            //     }
            // });
            // document.addEventListener('scrollend', () => {
            //     element.classList.toggle('fade-in');
            //     element.classList.toggle('fade-out');
            //     element.classList.remove('pb_scroll-start');
            // });
        }
    }

    return (
        <div ref={ref} className="pb_parent-bottom">

            <div
                style={{
                    backgroundColor: theme.backgroundColor,
                    // borderColor: theme.borderColor,
                }}
                className={`pb_container`}>
                {/* <div className="pb_header">
                    <CloseButton />
                </div> */}
                <div className="pb_chat-container ">
                    {
                        !selectedQuestion ? <ChatIntro
                            questionSelected={(question) => {
                                setSelectedQuestion(question);
                            }}
                        /> :
                            <MainChat selectedQuestion={selectedQuestion} />
                    }
                </div>
                {/* <a href='#' className="pb_heading">
                    <div className="pb_logo" />
                    <span className="pb_logo-text">Arible Chat</span>
                </a> */}

            </div>
            <div onClick={() => {
                setIsVisible(!isVisible);
            }} className='pb_trigger' style={{
                backgroundColor: theme.primaryColor,
            }}>

            </div>
        </div>
    );

}
interface Message {
    text: string;
    type: 'user' | 'bot';
}

interface MessageState {
    [key: string]: MessageStateItem;
}

interface MessageStateItem {
    message: Message;
    createdAt: Date;
    id: string;
}

interface MainChatProps {
    selectedQuestion: string;
}
const MainChat = (props: MainChatProps) => {

    const theme = getTheme();
    useEffect(() => {
        if (props.selectedQuestion && props.selectedQuestion !== 'default') {

            const userMessage = createMessage({
                text: props.selectedQuestion,
                type: 'user'
            });

            const botMessage = createMessage({
                text: '',
                type: 'bot'
            });

            setMessages({
                ...messages,
                [userMessage.id]: userMessage,
                [botMessage.id]: botMessage,
            });

            getResponse(botMessage.id, props.selectedQuestion);
        }
    }, []);
    // const [messages, setMessages] = useState<Message[]>([]);
    const [messages, setMessages] = useState<{
        [key: string]: {
            message: Message;
            createdAt: Date;
        }
    }>({});


    const scrollToBottom = () => {
        const element = document.getElementById('pb_message-box');
        if (element) {
            element.scrollTop = element.scrollHeight;
        }

    }

    const updateMessage = (id: string, message: string) => {

        setMessages(messages => (
            {
                ...messages,
                [id]: {
                    ...messages[id],
                    message: {
                        ...messages[id].message,
                        text: messages[id].message.text + message,
                    }
                }
            }
        ))

    }

    const createMessage = (message: Message): MessageStateItem => {
        const id = Math.random().toString(36).substring(7);
        const createdAt = new Date();
        const messageStateItem: MessageStateItem = {
            message,
            createdAt,
            id,
        }
        return messageStateItem;
    }


    const getResponse = async (botMessageId: string, message: string) => {
        const pgbt = globalThis['pgbt'] as PageBot;
        for await (const response of pgbt.query(message)) {
            updateMessage(botMessageId, response);
            scrollToBottom();
        }

    }
    return <div className='pb_main-chat'>
        <MessageBox messages={Object.values(messages).sort(({ createdAt: a }, { createdAt: b }) => {
            return a.getTime() - b.getTime();
        }).map((message) => message.message)} />

        <ChatInput onSend={(message) => {
            const userMessage = createMessage({
                text: message,
                type: 'user'
            });

            const botMessage = createMessage({
                text: '',
                type: 'bot'
            });

            setMessages({
                ...messages,
                [userMessage.id]: userMessage,
                [botMessage.id]: botMessage,
            });

            getResponse(botMessage.id, message);



        }} />
    </div>

}

interface MessageBoxProps {
    messages: Message[];
}

const MessageBox = (props: MessageBoxProps) => {
    const theme = getTheme();

    return <div className="pb_message-box" id="pb_message-box">
        {
            props.messages.map((message, index) => {
                let cleanText = message.text.replace(/\n\n/g, '');
                // let cleanText = cleanText.replace(/  /g, ' ');

                const html = parse(cleanText);
                console.log(JSON.stringify(message.text))
                // console.log(JSON.stringify(cleanText))

                return <div
                    style={{
                        backgroundColor: message.type === 'user' ? theme.primaryColor : undefined,
                    }}
                    key={index}
                    className={`pb_message ${message.type}`}


                >
                    <div
                        className='pb_message-text'
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                    {/* <p className="" /> */}

                </div>
            })
        }


    </div>
}

interface ChatInputProps {
    onSend: (message: string) => void;
}

const ChatInput = (props: ChatInputProps) => {
    const theme = getTheme();
    const [message, setMessage] = useState<string>('');

    const submit = () => {
        if (message.length > 0) {
            props.onSend(message);
            setMessage('');
        }
    }

    return <div
        style={{
            // backgroundColor: theme.backgroundColor,
            borderColor: theme.borderColor,
        }}
        className="pb_chat-input-container">
        <textarea
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    submit();
                }
            }}

            value={message} onInput={(e) => {
                setMessage(e.currentTarget.value);
            }} placeholder="Type your message here" />
        <button
            disabled={message.trim().length === 0}
            style={{
                backgroundColor: message.trim().length ? theme.primaryColor : undefined,
            }}
            onClick={submit}
        >
            <SendIcon />
        </button>
    </div>
}

interface ChatIntroProps {
    questionSelected: (question: string) => void;
}

const ChatIntro = (props: ChatIntroProps) => {
    const theme = getTheme();
    const qa = (globalThis['pgbt'] as PageBot).initialQuestions;


    return <>
        <div className="pb_question-container">

            {
                !!qa?.length && qa.map(([q, a], index) => {
                    if (q.length > 0 && a.length > 0) {
                        return <p
                            key={index}
                            onClick={() => {
                                props.questionSelected(q);
                            }}
                            style={{
                                color: theme.textColor,
                                // borderColor: theme.primaryColor,
                                // backgroundColor: theme.backgroundColor,
                                // backgroundColor: darkenHex(theme.backgroundColor, 300),
                            }
                            }
                            className="pb_question"
                        >
                            {q}
                        </p>
                    }
                })
            }
        </div>
        <StartChatButton onClick={() => {
            props.questionSelected('default');
        }
        } />
    </>

}

const StartChatButton = ({ onClick }: any) => {
    const theme = getTheme();
    return <button
        onClick={onClick}
        style={{
            backgroundColor: theme.primaryColor,
            borderColor: theme.borderColor,
        }}
        className="pb_button">
        Start Chat
        <SendIcon />
    </button>
}

const CloseButton = () => {
    const theme = getTheme();

    return <svg

        width="24" height="24"
        className='pb_close-button'
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
}

const ChatIcon = () => {
    const theme = getTheme();
    return <svg
        width="24" height="24" viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" >
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
    </svg>
}

const RightIcon = () => {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m9 18 6-6-6-6" /></svg>
}

const SendIcon = () => {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m3 3 3 9-3 9 19-9Z" /><path d="M6 12h16" /></svg>
}

const darkenHex = (hex: string, amount: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) + amount;
    const b = ((num >> 8) & 0x00FF) + amount;
    const g = (num & 0x0000FF) + amount;
    const newHex = g | (b << 8) | (r << 16);
    return '#' + newHex.toString(16);
}
export default <PgbtUI />;