import { useState, useRef, useEffect } from "react";
import ChatIcon from "../assets/Chat-Icon.svg";
import ExitCross from "../assets/Exit-Cross.svg";
import ExpandIcon from "../assets/Expand.svg";
import CollapseIcon from "../assets/Collapse.svg";

let _activeController: AbortController | null = null;

export function cancelActiveChatRequest(): void {
    if (_activeController) {
        _activeController.abort();
        _activeController = null;
    }
}

type Message = {
    role: string;
    text: string;
    queryPlan?: Record<string, any> | null;
    duration?: number;
};

export default function ChatWindow() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [openQueryIdx, setOpenQueryIdx] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0.0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        const handleUnload = () => cancelActiveChatRequest();
        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, []);

    function startTimer() {
        startTimeRef.current = Date.now();
        setElapsed(0);
        timerRef.current = setInterval(() => {
            setElapsed(parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(1)));
        }, 100);
    }

    function stopTimer(): number {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        return parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
    }

    function cancelRequest() {
        cancelActiveChatRequest();
        const duration = stopTimer();
        setIsLoading(false);
        setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "user") {
                return [...prev, { role: "assistant", text: "Request cancelled.", duration }];
            }
            return prev;
        });
    }

    function toggleChat() {
        setIsOpen((prev) => !prev);
    }

    function toggleExpand() {
        setIsExpanded((prev) => !prev);
    }

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
        setInput("");
        setIsLoading(true);
        startTimer();

        const controller = new AbortController();
        _activeController = controller;

        try {
            const res = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: trimmed,
                    history: messages.map((m) => ({
                        role: m.role === "user" ? "user" : "model",
                        parts: [{ text: m.text }],
                    })),
                }),
                signal: controller.signal,
            });

            const data = await res.json();
            const reply = data.reply ?? data.error ?? "Something went wrong.";
            const queryPlan = data.queryPlan ?? null;
            const duration = stopTimer();

            setMessages((prev) => [...prev, { role: "assistant", text: reply, queryPlan, duration }]);
        } catch (err: any) {
            if (err?.name === "AbortError") return;
            const duration = stopTimer();
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: "Error: Could not reach the server.", duration },
            ]);
        } finally {
            _activeController = null;
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <style>{`@keyframes blink{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
            <div
                className="relative flex flex-col bg-[#1E3869] shadow-2xl overflow-hidden"
                style={{
                    width: isOpen ? (isExpanded ? "520px" : "320px") : "48px",
                    height: isOpen ? (isExpanded ? "620px" : "420px") : "48px",
                    borderRadius: isOpen ? "16px" : "50%",
                    transition: "width 380ms cubic-bezier(0.34, 1.2, 0.64, 1), height 380ms cubic-bezier(0.34, 1.2, 0.64, 1), border-radius 380ms ease",
                }}
            >
                <div
                    className="flex flex-col flex-1 overflow-hidden"
                    style={{
                        opacity: isOpen ? 1 : 0,
                        pointerEvents: isOpen ? "auto" : "none",
                        transition: "opacity 180ms ease",
                        transitionDelay: isOpen ? "220ms" : "0ms",
                    }}
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/15">
                        <span className="text-white text-sm font-semibold tracking-wide">
                            AI Assistant
                        </span>
                        <div className="flex items-center gap-2">
                            {messages.length > 0 && !isLoading && (
                                <button
                                    onClick={() => setMessages([])}
                                    className="flex items-center justify-center px-2 py-0.5 rounded text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer bg-transparent border border-white/20"
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                onClick={toggleExpand}
                                className="flex items-center justify-center p-1 opacity-80 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none"
                            >
                                {isExpanded
                                    ? <img src={CollapseIcon} alt="Collapse" width={16} height={16} />
                                    : <img src={ExpandIcon} alt="Expand" width={16} height={16} />
                                }
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-white">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center pt-4">
                                <p className="text-gray-300 text-sm text-center select-none">
                                    Ask me anything to get started...
                                </p>
                            </div>
                        ) : (
                            messages.map((m, idx) => (
                                <div key={idx} className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                                    <div
                                        className={`w-fit max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                                            m.role === "user"
                                                ? "bg-blue-600 text-white"
                                                : m.text === "Request cancelled."
                                                    ? "bg-amber-50 text-amber-700 border border-amber-200 italic"
                                                    : "bg-gray-100 text-gray-900"
                                        }`}
                                    >
                                        {m.text}
                                    </div>
                                    {m.role === "assistant" && m.duration !== undefined && (
                                        <span className="text-[10px] text-gray-400 px-1">
                                            {m.duration}s
                                        </span>
                                    )}
                                    {m.role === "assistant" && m.queryPlan && (
                                        <div className="w-fit max-w-[85%]">
                                            <button
                                                onClick={() => setOpenQueryIdx(openQueryIdx === idx ? null : idx)}
                                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer px-1 py-0.5 rounded"
                                            >
                                                <svg
                                                    width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
                                                    style={{ transform: openQueryIdx === idx ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 180ms ease" }}
                                                >
                                                    <path d="M3 1.5l4 3.5-4 3.5V1.5z" />
                                                </svg>
                                                View Query
                                            </button>
                                            {openQueryIdx === idx && (
                                                <pre className="mt-1 text-xs bg-gray-900 text-green-400 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all max-w-full">
                                                    {m.queryPlan.operation === "aggregate"
                                                        ? JSON.stringify(m.queryPlan.pipeline, null, 2)
                                                        : JSON.stringify({
                                                            ...(m.queryPlan.query && Object.keys(m.queryPlan.query).length > 0 && { filter: m.queryPlan.query }),
                                                            ...(m.queryPlan.projection && Object.keys(m.queryPlan.projection).length > 0 && { fields: m.queryPlan.projection }),
                                                        }, null, 2)
                                                    }
                                                </pre>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}

                        {isLoading && (
                            <div className="mr-auto flex flex-col gap-1 px-1 py-2">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" style={{ animation: "blink 1.2s infinite 0ms" }} />
                                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" style={{ animation: "blink 1.2s infinite 400ms" }} />
                                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" style={{ animation: "blink 1.2s infinite 800ms" }} />
                                </div>
                                <span className="text-[10px] text-gray-400">{elapsed.toFixed(1)}s</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <form
                        onSubmit={sendMessage}
                        className="flex gap-1.5 bg-white p-2 pr-14 border-t border-gray-200"
                    >
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                            placeholder={isLoading ? "Waiting for response…" : "Type a message…"}
                            disabled={isLoading}
                        />
                        {isLoading ? (
                            <button
                                type="button"
                                onClick={cancelRequest}
                                className="flex-shrink-0 px-2 py-2 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer border-none"
                            >
                                Cancel
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-shrink-0 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                Send
                            </button>
                        )}
                    </form>
                </div>

                <button
                    onClick={toggleChat}
                    aria-label={isOpen ? "Close chat" : "Open chat"}
                    className="absolute bottom-0 right-0 w-12 h-12 flex items-center justify-center bg-transparent border-none cursor-pointer z-10"
                >
                    <img
                        src={ChatIcon}
                        alt="Chat"
                        width={28}
                        height={28}
                        className="absolute transition-all duration-200 ease-in-out"
                        style={{
                            opacity: isOpen ? 0 : 1,
                            transform: isOpen ? "rotate(90deg) scale(0.3)" : "rotate(0deg) scale(1)",
                        }}
                    />
                    <img
                        src={ExitCross}
                        alt="Close"
                        width={28}
                        height={28}
                        className="absolute transition-all duration-200 ease-in-out"
                        style={{
                            opacity: isOpen ? 1 : 0,
                            transform: isOpen ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.3)",
                        }}
                    />
                </button>
            </div>
        </div>
    );
}