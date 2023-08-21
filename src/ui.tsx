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
    primaryColor: '#9257FA',
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
    const [hidden, setHidden] = useState<boolean>(true);

    useEffect(() => {
        const pgbt: PageBot = globalThis['pgbt']
        setRenderedText(pgbt.text)
        registerScrollHandling();
        // setInterval(() => {
        //     location.reload();
        // }, 10000);
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
            <div className={`pb_container ${hidden ? 'pb_hidden' : ''}`}>
                <div className='pb_logo'
                    onClick={() => {
                        setHidden(false);
                    }}
                >
                    <Logo />
                </div>
                <div className='pb_main'>
                    <div className='pb_main-top'>
                        <a href='#' className="pb_heading">
                            <LogoText color={theme.primaryColor} />
                        </a>
                        <div
                            className='pb_close-button'
                            onClick={() => {
                                setHidden(true)
                            }}
                        >
                            <CloseButton />
                        </div>
                    </div>
                    <h1 style={{
                        color: "#9257FA",
                    }}>
                        What would you like to know ?
                    </h1>
                    <MainChat />
                </div>

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


const MainChat = () => {
    const [selectedQuestion, setSelectedQuestion] = useState<string>();
    const beepContext = useRef<AudioContext | null>(null);
    const [inputDisabled, setInputDisabled] = useState<boolean>(false);

    const setupSounds = () => {
        try {

            beepContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        } catch (e) {
            console.error(e)
        }
    }

    const beep = () => {
        if (beepContext.current) {
            const beepOscillator = beepContext.current.createOscillator();
            const beepGain = beepContext.current.createGain();

            beepOscillator.connect(beepGain);
            beepGain.connect(beepContext.current.destination);

            beepOscillator.type = 'sine';
            beepOscillator.frequency.value = 520.0;

            beepGain.gain.exponentialRampToValueAtTime(
                0.00001, beepContext.current.currentTime + 1
            );

            beepOscillator.start(0)
        }

    }


    const theme = getTheme();
    useEffect(() => {

        setupSounds()
        scrollToBottom()
        if (selectedQuestion && selectedQuestion !== 'default') {

            const userMessage = createMessage({
                text: selectedQuestion,
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

            getResponse(botMessage.id, selectedQuestion);
        }
    }, []);
    // const [messages, setMessages] = useState<Message[]>([]);
    const [messages, setMessages] = useState<{
        [key: string]: {
            message: Message;
            createdAt: Date;
        }
    }>({
        // 'default': {
        //     message: {
        //         text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum.',
        //         type: 'bot',
        //     },
        //     createdAt: new Date(),
        // },
        // 'default2': {
        //     message: {
        //         text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum.',
        //         type: 'user'
        //     },
        //     createdAt: new Date(),
        // },
        // 'default3': {
        //     message: {
        //         text: 'Arible AI is',
        //         type: 'bot'
        //     },
        //     createdAt: new Date(),
        // },
        // 'default4': {
        //     message: {
        //         text: 'Arible AI is Arible AI is a platform that offers AI-generated portrait profile pictures for social media platforms like Twitter, LinkedIn, Facebook, Instagram, and TikTok. It uses AI technology to create realistic and artistic profile photos of yourself and others. The platform allows you to generate unlimited profile pictures on a monthly basis.                ',
        //         type: 'bot'
        //     },
        //     createdAt: new Date(),
        // }
    });


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
        let startedResponse = false;
        for await (const response of pgbt.query(message)) {
            if (!startedResponse) {
                startedResponse = true;
                beep()
            }
            updateMessage(botMessageId, response);
            scrollToBottom();
        }

    }

    const messageList = Object.values(messages).sort(({ createdAt: a }, { createdAt: b }) => {
        return a.getTime() - b.getTime();
    }).map((message) => message.message);

    return <div className='pb_main-chat'>
        {
            messageList.length ? <MessageBox messages={messageList} /> :

                <ChatIntro
                    questionSelected={(question) => {

                        const userMessage = createMessage({
                            text: question,
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
                        scrollToBottom();
                        getResponse(botMessage.id, question);
                    }}
                />
        }

        <ChatInput

            disabled={inputDisabled}
            onSend={(message) => {
                if (!inputDisabled) {
                    setInputDisabled(true);
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
                    scrollToBottom();
                    getResponse(botMessage.id, message)
                        .finally(() => {
                            setInputDisabled(false);
                        })
                }

            }} />
    </div>

}

interface MessageBoxProps {
    messages: Message[];
}

const MessageBox = (props: MessageBoxProps) => {
    return <div className="pb_message-box" id="pb_message-box">
        {props.messages.map(Message)}
    </div>
}


const Message = (message: Message) => {
    let cleanText = message.text.replace(/\n\n/g, '');
    const html = parse(cleanText);
    const theme = getTheme();
    return <div
        style={{
            backgroundColor: message.type === 'user' ? theme.primaryColor : undefined,
        }}

        className={`pb_message ${message.type}`}
    >
        <div className='pb_message-icon'>
            {
                message.type === 'bot' ? <Logo /> : <span>
                    Me
                </span>
            }
        </div>

        <div
            className='pb_message-text'
            dangerouslySetInnerHTML={{ __html: html }}
        />
        {message.type == 'bot' && <div className='pb_message-rating'>
            <button>
                <ThumbsIcon />
            </button>
            <button>
                <ThumbsIcon />
            </button>
        </div>}
    </div>
}
interface ChatInputProps {
    onSend: (message: string) => void;
    disabled: boolean
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
            disabled={message.trim().length === 0 || props.disabled}
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
                        return <div
                            key={index}
                            onClick={() => {
                                props.questionSelected(q);
                            }}
                            style={{
                                color: theme.textColor,
                            }
                            }
                            className="pb_question"
                        >
                            <div className='pb_question-icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width={'100%'} height={'100%'} viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
                                </svg>
                            </div>
                            <p>
                                {q}
                            </p>
                        </div>
                    }
                })
            }
        </div>

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

        width="100%" height="100%"
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
    return <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m3 3 3 9-3 9 19-9Z" /><path d="M6 12h16" /></svg>
}

const LogoText = ({ color }: any) => {
    return <svg height='100%' width='100%' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 393 117">
        <path fill={color} fill-rule="evenodd" d="M113.703 54.913a12.277 12.277 0 0 1 6.308 13.458 12.344 12.344 0 0 1-11.145 9.831c-3.049 7.465-6.729 14.247-10.672 19.977-.21.316-.473.526-.788.684-1.262.525-2.471 1.051-4.048 1.682h-.053l-2.628 13.721A3.329 3.329 0 0 1 87.364 117h-7.15c-1.524 0-2.785-.946-3.259-2.366l-4.048-13.09h-.157c-3.996.105-7.728.841-12.617.736-4.89.105-8.57-.631-12.618-.736h-.105l-4.1 13.09c-.421 1.42-1.683 2.366-3.207 2.366h-7.15a3.329 3.329 0 0 1-3.312-2.734l-2.629-13.721h-.052a144.3 144.3 0 0 1-4.048-1.682 1.806 1.806 0 0 1-.841-.684c-3.89-5.73-7.57-12.512-10.62-19.977-5.52-.42-10.041-4.416-11.198-9.83-1.104-5.416 1.472-10.883 6.309-13.46 3.838-19.188 24.13-33.96 53.57-34.644v.368V6.18c0-2.576 1.525-4.784 3.943-5.73C66.494-.498 69.07.08 70.857 1.92l31.228 33.067c6.098 5.573 10.146 12.407 11.618 19.925ZM82.948 86.088c4.154-.894 8.36-2.313 11.882-4.837 5.415-4.468 6.361-8.674 6.519-14.72.052-3.154 0-6.046-.474-9.147-.998-6.624-3.89-13.406-10.934-16.192-.316-.105-.526-.263-.842-.368-3.417-1.262-5.31-.684-8.937-.526-12.354 1.104-27.652 1.104-40.007 0-3.627-.158-5.52-.736-8.937.526-.315.105-.526.263-.894.368-6.992 2.786-9.883 9.568-10.882 16.192-.473 3.102-.578 5.993-.473 9.147.158 6.046 1.104 10.252 6.466 14.72 3.523 2.524 7.728 3.943 11.934 4.837 11.776 2.418 33.75 2.418 45.58 0Zm2.734-22.185c0 5.73-3.89 10.409-8.674 10.409-4.837 0-8.727-4.679-8.727-10.41 0-5.677 3.89-10.356 8.727-10.356 4.784 0 8.674 4.679 8.674 10.357Zm-33.698 0c0 5.73-3.89 10.409-8.675 10.409-4.836 0-8.726-4.679-8.726-10.41 0-5.677 3.89-10.356 8.727-10.356 4.784 0 8.674 4.679 8.674 10.357Z" clip-rule="evenodd" />
        <path fill={color} d="M148.214 83V38.328h21.12c2.09 0 3.968.363 5.632 1.088 1.664.683 3.072 1.643 4.224 2.88 1.194 1.237 2.112 2.752 2.752 4.544.64 1.75.96 3.67.96 5.76 0 2.133-.32 4.075-.96 5.824-.64 1.75-1.558 3.243-2.752 4.48-1.152 1.237-2.56 2.219-4.224 2.944-1.664.683-3.542 1.024-5.632 1.024h-11.392V83h-9.728Zm9.728-24.576h10.24c1.45 0 2.581-.363 3.392-1.088.853-.768 1.28-1.877 1.28-3.328v-2.816c0-1.45-.427-2.539-1.28-3.264-.811-.768-1.942-1.152-3.392-1.152h-10.24v11.648ZM213.596 83c-1.706 0-3.136-.533-4.288-1.6-1.109-1.067-1.813-2.496-2.112-4.288h-.384c-.512 2.176-1.642 3.84-3.392 4.992-1.749 1.11-3.904 1.664-6.464 1.664-3.37 0-5.952-.896-7.744-2.688-1.792-1.792-2.688-4.16-2.688-7.104 0-3.541 1.28-6.165 3.84-7.872 2.603-1.75 6.123-2.624 10.56-2.624h5.312v-2.112c0-1.621-.426-2.901-1.28-3.84-.853-.981-2.282-1.472-4.288-1.472-1.877 0-3.37.405-4.48 1.216-1.109.81-2.026 1.728-2.752 2.752l-5.632-4.992c1.366-2.005 3.072-3.563 5.12-4.672 2.091-1.152 4.907-1.728 8.448-1.728 4.779 0 8.363 1.045 10.752 3.136 2.39 2.09 3.584 5.141 3.584 9.152v14.72h3.136V83h-5.248Zm-13.12-5.824c1.579 0 2.923-.341 4.032-1.024 1.152-.683 1.728-1.792 1.728-3.328v-3.968h-4.608c-3.712 0-5.568 1.259-5.568 3.776v.96c0 1.237.384 2.155 1.152 2.752.768.555 1.856.832 3.264.832ZM256.306 85.432c0 1.792-.32 3.37-.96 4.736-.598 1.365-1.6 2.517-3.008 3.456-1.408.981-3.286 1.707-5.632 2.176-2.304.512-5.163.768-8.576.768-2.902 0-5.376-.192-7.424-.576-2.006-.341-3.648-.853-4.928-1.536-1.238-.64-2.155-1.45-2.752-2.432-.555-.939-.832-2.027-.832-3.264 0-1.877.554-3.35 1.664-4.416 1.109-1.067 2.645-1.728 4.608-1.984v-.704c-1.622-.299-2.838-.981-3.648-2.048-.811-1.11-1.216-2.39-1.216-3.84 0-.896.17-1.664.512-2.304a6.242 6.242 0 0 1 1.408-1.728 7.035 7.035 0 0 1 2.048-1.216 15.825 15.825 0 0 1 2.304-.704v-.256c-2.048-.939-3.563-2.219-4.544-3.84-.982-1.664-1.472-3.584-1.472-5.76 0-3.413 1.173-6.144 3.52-8.192 2.389-2.09 6.016-3.136 10.88-3.136 2.218 0 4.117.213 5.696.64v-1.28c0-1.792.426-3.072 1.28-3.84.896-.81 2.154-1.216 3.776-1.216h5.312v7.04h-7.424v.384c1.962.939 3.413 2.24 4.352 3.904.938 1.621 1.408 3.52 1.408 5.696 0 3.37-1.195 6.08-3.584 8.128-2.347 2.005-5.952 3.008-10.816 3.008-2.176 0-4.16-.235-5.952-.704-.982.64-1.472 1.536-1.472 2.688 0 .81.298 1.45.896 1.92.64.427 1.685.64 3.136.64h9.728c4.096 0 7.061.853 8.896 2.56 1.877 1.707 2.816 4.117 2.816 7.232Zm-8.896 1.28c0-.981-.384-1.728-1.152-2.24-.768-.512-2.112-.768-4.032-.768h-11.52a4.345 4.345 0 0 0-.96 1.408 5.424 5.424 0 0 0-.256 1.6c0 1.237.533 2.133 1.6 2.688 1.066.597 2.88.896 5.44.896h3.84c2.56 0 4.373-.299 5.44-.896 1.066-.555 1.6-1.45 1.6-2.688Zm-9.152-21.824c1.877 0 3.264-.384 4.16-1.152.938-.81 1.408-1.963 1.408-3.456v-.768c0-1.493-.47-2.624-1.408-3.392-.896-.81-2.283-1.216-4.16-1.216-1.878 0-3.286.405-4.224 1.216-.896.768-1.344 1.899-1.344 3.392v.768c0 1.493.448 2.645 1.344 3.456.938.768 2.346 1.152 4.224 1.152ZM274.155 83.768c-2.56 0-4.842-.405-6.848-1.216-2.005-.853-3.712-2.027-5.12-3.52-1.365-1.536-2.41-3.392-3.136-5.568-.682-2.176-1.024-4.608-1.024-7.296 0-2.645.342-5.035 1.024-7.168.683-2.176 1.686-4.032 3.008-5.568 1.366-1.536 3.03-2.71 4.992-3.52 1.963-.853 4.203-1.28 6.72-1.28 2.774 0 5.142.47 7.104 1.408 2.006.939 3.627 2.197 4.864 3.776 1.28 1.579 2.198 3.413 2.752 5.504.598 2.048.896 4.203.896 6.464V68.6h-21.568v.512c0 2.219.598 3.99 1.792 5.312 1.195 1.28 3.072 1.92 5.632 1.92 1.963 0 3.563-.384 4.8-1.152 1.238-.81 2.39-1.77 3.456-2.88l4.736 5.888c-1.493 1.75-3.456 3.115-5.888 4.096-2.389.981-5.12 1.472-8.192 1.472Zm-.192-28.16c-1.92 0-3.434.64-4.544 1.92-1.066 1.237-1.6 2.901-1.6 4.992v.512h11.776v-.576c0-2.048-.469-3.69-1.408-4.928-.896-1.28-2.304-1.92-4.224-1.92ZM296.589 38.328h21.696c3.712 0 6.592 1.045 8.64 3.136 2.09 2.09 3.136 4.864 3.136 8.32 0 1.707-.235 3.157-.704 4.352-.427 1.195-1.024 2.176-1.792 2.944a6.88 6.88 0 0 1-2.624 1.728c-.982.341-2.048.533-3.2.576v.384c1.066 0 2.176.192 3.328.576a9.26 9.26 0 0 1 3.264 1.856c.981.81 1.792 1.877 2.432 3.2.682 1.323 1.024 2.944 1.024 4.864 0 1.75-.299 3.413-.896 4.992-.555 1.536-1.344 2.88-2.368 4.032a11.601 11.601 0 0 1-3.648 2.752c-1.408.64-2.944.96-4.608.96h-23.68V38.328Zm9.728 36.48h11.2c1.28 0 2.282-.341 3.008-1.024.768-.725 1.152-1.728 1.152-3.008V68.6c0-1.28-.384-2.261-1.152-2.944-.726-.725-1.728-1.088-3.008-1.088h-11.2v10.24Zm0-18.176h9.664c1.28 0 2.282-.363 3.008-1.088.725-.725 1.088-1.728 1.088-3.008v-1.92c0-1.28-.363-2.283-1.088-3.008-.726-.725-1.728-1.088-3.008-1.088h-9.664v10.112ZM352.396 83.768c-2.474 0-4.693-.405-6.656-1.216a13.573 13.573 0 0 1-4.928-3.52c-1.322-1.536-2.346-3.392-3.072-5.568-.725-2.176-1.088-4.608-1.088-7.296 0-2.688.363-5.12 1.088-7.296.726-2.176 1.75-4.01 3.072-5.504a13.573 13.573 0 0 1 4.928-3.52c1.963-.81 4.182-1.216 6.656-1.216 2.475 0 4.672.405 6.592 1.216 1.963.81 3.606 1.984 4.928 3.52 1.366 1.493 2.411 3.328 3.136 5.504.726 2.176 1.088 4.608 1.088 7.296 0 2.688-.362 5.12-1.088 7.296-.725 2.176-1.77 4.032-3.136 5.568-1.322 1.536-2.965 2.71-4.928 3.52-1.92.81-4.117 1.216-6.592 1.216Zm0-7.488c1.878 0 3.328-.576 4.352-1.728 1.024-1.152 1.536-2.795 1.536-4.928v-6.848c0-2.133-.512-3.776-1.536-4.928-1.024-1.152-2.474-1.728-4.352-1.728-1.877 0-3.328.576-4.352 1.728-1.024 1.152-1.536 2.795-1.536 4.928v6.848c0 2.133.512 3.776 1.536 4.928 1.024 1.152 2.475 1.728 4.352 1.728ZM386.29 83c-3.285 0-5.781-.832-7.488-2.496-1.664-1.664-2.496-4.096-2.496-7.296V56.76h-4.736V49.4h2.368c1.28 0 2.155-.299 2.624-.896.47-.64.704-1.536.704-2.688v-5.504h8.512V49.4h6.656v7.36h-6.656v18.88h6.144V83h-5.632Z" />
    </svg>
}

const ThumbsIcon = () => {
    return <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>
}

const Logo = ({ color }: any) => {
    return <svg width="100%" height="100%" viewBox="0 0 121 117" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M113.703 54.9129C118.592 57.4889 121.168 62.9564 120.011 68.3712C118.907 73.7861 114.334 77.7816 108.866 78.2021C105.817 85.6673 102.137 92.4491 98.1943 98.1794C97.984 98.4948 97.7211 98.7051 97.4057 98.8628C96.144 99.3885 94.9349 99.9142 93.3577 100.545C93.3227 100.545 93.3051 100.545 93.3051 100.545L90.6766 114.266C90.3611 115.896 88.9943 117 87.3645 117H80.2148C78.6902 117 77.4285 116.054 76.9554 114.634L72.9074 101.544C72.8723 101.544 72.8197 101.544 72.7496 101.544C68.7542 101.649 65.0216 102.385 60.1325 102.28C55.2433 102.385 51.5633 101.649 47.5153 101.544C47.4802 101.544 47.4452 101.544 47.4101 101.544L43.3095 114.634C42.889 116.054 41.6273 117 40.1027 117H32.9529C31.3232 117 29.9564 115.896 29.6409 114.266L27.0124 100.545C27.0124 100.545 26.9948 100.545 26.9598 100.545C25.3826 99.9142 24.1209 99.3885 22.9118 98.8628C22.5438 98.7051 22.2809 98.4948 22.0706 98.1794C18.1803 92.4491 14.5003 85.6673 11.4512 78.2021C5.93115 77.7816 1.40999 73.7861 0.253412 68.3712C-0.850591 62.9564 1.72542 57.4889 6.562 54.9129C10.3997 35.7243 30.6924 20.9516 60.1325 20.2682V20.6362V20.4785V6.17902C60.1325 3.60301 61.657 1.39499 64.0753 0.448702C66.4936 -0.497587 69.0696 0.0807101 70.8571 1.92072L102.085 34.9883C108.183 40.5609 112.231 47.3952 113.703 54.9129ZM82.9485 86.0879C87.1017 85.1942 91.3074 83.7747 94.8297 81.2513C100.245 76.7827 101.191 72.577 101.349 66.5312C101.401 63.3769 101.349 60.4855 100.875 57.3838C99.8766 50.7597 96.9851 43.978 89.9406 41.1917C89.6251 41.0866 89.4148 40.9288 89.0994 40.8237C85.6822 39.562 83.7897 40.1403 80.1622 40.298C67.8079 41.402 52.5096 41.402 40.1552 40.298C36.5278 40.1403 34.6352 39.562 31.2181 40.8237C30.9026 40.9288 30.6924 41.0866 30.3244 41.1917C23.3323 43.978 20.4409 50.7597 19.442 57.3838C18.9689 60.4855 18.8638 63.3769 18.9689 66.5312C19.1266 72.577 20.0729 76.7827 25.4352 81.2513C28.9575 83.7747 33.1632 85.1942 37.369 86.0879C49.145 88.5062 71.1199 88.5062 82.9485 86.0879ZM85.6822 63.9027C85.6822 69.633 81.792 74.3118 77.0079 74.3118C72.1713 74.3118 68.281 69.633 68.281 63.9027C68.281 58.2249 72.1713 53.546 77.0079 53.546C81.792 53.546 85.6822 58.2249 85.6822 63.9027ZM51.9839 63.9027C51.9839 69.633 48.0936 74.3118 43.3095 74.3118C38.473 74.3118 34.5827 69.633 34.5827 63.9027C34.5827 58.2249 38.473 53.546 43.3095 53.546C48.0936 53.546 51.9839 58.2249 51.9839 63.9027Z" fill="#1E1E1E" />
    </svg>
    // let logo = import('./logo_animated.svg');
    // const svgUrl = 'https://pub-7bbc6377635e4e588a0a4c5fdfb0df93.r2.dev/logo_animated.svg'
    // return <img src={svgUrl} width="100%" height="100%" />

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