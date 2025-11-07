import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date | string;
}

interface ChatProps {}

const Chat: NextPage<ChatProps> = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/messages");
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void fetchMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    const userContent = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      // Send user message - show it immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: userContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Save to database
      const userResponse = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: userContent,
          role: "user",
        }),
      });

      if (!userResponse.ok) {
        throw new Error("Failed to send message");
      }

      const savedUserMessage = await userResponse.json();
      // Replace temp message with saved one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? savedUserMessage : msg
        )
      );

      // Simulate API delay for assistant response
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Send assistant response
      const assistantResponse = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "Cracoufrat!",
          role: "assistant",
        }),
      });

      if (!assistantResponse.ok) {
        const errorData = await assistantResponse.json().catch(() => ({}));
        throw new Error(
          `Failed to send assistant message: ${assistantResponse.status} ${errorData.error ?? ""}`
        );
      }

      const assistantMessage = await assistantResponse.json();
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Show error to user - add assistant message anyway for UX
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Nom d'un Cracoufrat!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Chat - Cracouchat</title>
        <meta name="description" content="Chat with Cracoufrat" />
      </Head>

      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background px-4 py-3">
          <h1 className="heading-lg text-foreground">Cracouchat</h1>
        </header>

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {isLoadingMessages && (
              <div className="flex h-full items-center justify-center">
                <p className="copy-base text-foreground-muted">Loading messages...</p>
              </div>
            )}
            {!isLoadingMessages && messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="copy-base text-foreground-muted">
                  Start a conversation by typing a message below
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-foreground dark:bg-gray-800"
                  }`}
                >
                  <p className="copy-base whitespace-pre-wrap">{message.content}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-3 dark:bg-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-gray-500"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-gray-500" style={{ animationDelay: "0.2s" }}></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-gray-500" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-border bg-background px-4 py-4">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-foreground-muted focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Chat;

