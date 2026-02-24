import { useState, useRef, useEffect } from "react";

export default function ChatWindow() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hi! How can I help?" },
    ]);

    const messagesEndRef = useRef(null);

    //toggles to chat box of its on or not
    function toggleChat() {
        setIsOpen((prev) => !prev);
    }

    //sending message functionality where we have to put into AI in the backend
    function sendMessage(e:any) {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) return;

        setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
        setInput("");

        // TODO: call your backend / AI here, then append assistant response
        // setMessages((prev) => [...prev, { role: "assistant", text: "..." }]);
    }

    return (
        <div className="fixed bottom-0 right-4 z-50 w-80">
            {/*takes care of the message showing up in the chatbox*/}
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
                        <div ref={messagesEndRef} />
                    </div>

                    {/*Takes care of the input box at the bottom of message window*/}
                    <form onSubmit={sendMessage} className="p-2 border-t border-gray-200 flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                            placeholder="Type a message..."
                        />
                        <button
                            type="submit"
                            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
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