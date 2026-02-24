import { useState, useRef, useEffect } from "react";

export default function ChatWindow() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hi! How can I help?" },
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the latest message whenever messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function toggleChat() {
        setIsOpen((prev) => !prev);
    }

    // Sends the user message to the /chat endpoint and appends the AI reply
    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed }),
            });

            const data = await res.json();
            const reply = data.reply ?? data.error ?? "Something went wrong.";

            setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: "Error: Could not reach the server." },
            ]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed bottom-0 right-4 z-50 w-80">
            {isOpen && (
                <div className="bg-white border border-gray-200 shadow-xl rounded-t-xl overflow-hidden">
                    <div className="h-72 p-3 overflow-y-auto space-y-2">
                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                                    m.role === "user"
                                        ? "ml-auto bg-blue-600 text-white"
                                        : "mr-auto bg-gray-100 text-gray-900"
                                }`}
                            >
                                {m.text}
                            </div>
                        ))}

                        {/* Typing indicator shown while waiting for Gemini response */}
                        {isLoading && (
                            <div className="mr-auto bg-gray-100 text-gray-500 px-3 py-2 rounded-xl text-sm max-w-[85%]">
                                Thinking...
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-2 border-t border-gray-200 flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                            placeholder="Type a message..."
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={toggleChat}
                className="w-full bg-[#0693E3] text-white rounded-t-xl text-center cursor-pointer py-3"
            >
                {isOpen ? "Close" : "Speak with an AI Agent!"}
            </button>
        </div>
    );
}