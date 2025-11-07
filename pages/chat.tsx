import type { NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";

interface ConversationParticipant {
  id: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
}

interface Conversation {
  id: string;
  title: string;
  participants: ConversationParticipant[];
  updatedAt: string;
}

interface MessageAuthor {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
}

interface Message {
  id: string;
  content: string;
  timestamp: Date | string;
  author: MessageAuthor;
}

interface ChatProps {}

const Chat: NextPage<ChatProps> = () => {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [newConversationEmail, setNewConversationEmail] = useState("");
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const currentConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const fetchConversations = async () => {
    setIsLoadingConversations(true);

    try {
      const response = await fetch("/api/conversations");

      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.status}`);
      }

      const data = (await response.json()) as { conversations: Conversation[] };
      setConversations(data.conversations);

      if (data.conversations.length > 0) {
        setSelectedConversationId((current) => current ?? data.conversations[0].id);
      } else {
        setSelectedConversationId(null);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      void fetchConversations();
    }
  }, [status]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }

      setIsLoadingMessages(true);

      try {
        const response = await fetch(
          `/api/messages?conversationId=${encodeURIComponent(selectedConversationId)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load messages: ${response.status}`);
        }

        const data = (await response.json()) as { messages: Message[] };
        setMessages(data.messages);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    if (status === "authenticated") {
      void loadMessages();
    }
  }, [selectedConversationId, status]);

  const handleMessageSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!inputValue.trim() || isSendingMessage || !selectedConversationId) {
      return;
    }

    const messageContent = inputValue.trim();
    setInputValue("");
    inputRef.current?.focus();
    setIsSendingMessage(true);

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      timestamp: new Date().toISOString(),
      author: {
        id: session?.user.id ?? "",
        name: session?.user.name ?? null,
        email: session?.user.email ?? null,
        imageUrl: session?.user.image ?? null,
      },
    };

    setMessages((previous) => [...previous, optimisticMessage]);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageContent,
          conversationId: selectedConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const parsedResponse = (await response.json()) as {
        messages?: Message[];
      };
      const savedMessages = parsedResponse.messages ?? [];

      setMessages((previous) => {
        const withoutOptimistic = previous.filter(
          (message) => message.id !== optimisticMessage.id
        );

        const combined = [...withoutOptimistic];

        savedMessages.forEach((message) => {
          if (!combined.some((existing) => existing.id === message.id)) {
            combined.push(message);
          }
        });

        return combined;
      });

      void fetchConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((previous) =>
        previous.filter((message) => message.id !== optimisticMessage.id)
      );
      setInputValue(messageContent);
    } finally {
      setIsSendingMessage(false);
      inputRef.current?.focus();
    }
  };

  const handleCreateConversation = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newConversationEmail.trim() || isCreatingConversation) {
      return;
    }

    setIsCreatingConversation(true);

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantEmail: newConversationEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`);
      }

      const conversation = (await response.json()) as Conversation;
      setConversations((previous) => {
        const filtered = previous.filter((item) => item.id !== conversation.id);
        return [conversation, ...filtered];
      });
      setSelectedConversationId(conversation.id);
      setNewConversationEmail("");
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  return (
    <>
      <Head>
        <title>Chat - Cracouchat</title>
        <meta name="description" content="Chat with Cracoufrat" />
      </Head>

      <div className="flex h-screen flex-col bg-background">
        <header className="border-b border-border bg-background px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="heading-lg text-foreground">Cracouchat</h1>
            {status === "loading" && (
              <p className="copy-base text-foreground-muted">Loading session...</p>
            )}
            {status === "unauthenticated" && (
              <button
                type="button"
                onClick={() => signIn("github")}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Sign in
              </button>
            )}
            {session && (
              <div className="flex items-center gap-4">
                <p className="copy-base text-foreground">
                  {session.user.email ?? session.user.id}
                </p>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-lg border border-border px-4 py-2 text-foreground hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {status === "unauthenticated" && (
          <div className="flex flex-1 items-center justify-center">
            <p className="copy-base text-foreground-muted">
              Sign in with GitHub to start chatting.
            </p>
          </div>
        )}

        {status === "authenticated" && (
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-72 border-r border-border bg-muted/40">
              <div className="flex h-full flex-col">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="heading-md text-foreground">Conversations</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {isLoadingConversations && (
                    <div className="flex h-full items-center justify-center px-4 text-center">
                      <p className="copy-base text-foreground-muted">Loading conversations...</p>
                    </div>
                  )}
                  {!isLoadingConversations && conversations.length === 0 && (
                    <div className="flex h-full items-center justify-center px-4 text-center">
                      <p className="copy-base text-foreground-muted">
                        Create a conversation to get started.
                      </p>
                    </div>
                  )}
                  {!isLoadingConversations && conversations.length > 0 && (
                    <ul className="space-y-1 px-2 py-3">
                      {conversations.map((conversation) => (
                        <li key={conversation.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedConversationId(conversation.id)}
                            className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                              conversation.id === selectedConversationId
                                ? "bg-blue-100 text-blue-600"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <p className="copy-base font-semibold">{conversation.title}</p>
                            <p className="copy-sm text-foreground-muted">
                              {new Date(conversation.updatedAt).toLocaleString()}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="border-t border-border px-4 py-3">
                  <form className="space-y-2" onSubmit={handleCreateConversation}>
                    <label className="block text-sm text-foreground-muted" htmlFor="participant-email">
                      Invite by email
                    </label>
                    <input
                      id="participant-email"
                      type="email"
                      value={newConversationEmail}
                      onChange={(event) => setNewConversationEmail(event.target.value)}
                      placeholder="friend@example.com"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-foreground-muted focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={isCreatingConversation || newConversationEmail.trim().length === 0}
                      className="w-full rounded-lg bg-blue-500 px-3 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCreatingConversation ? "Creating..." : "Create conversation"}
                    </button>
                  </form>
                </div>
              </div>
            </aside>

            <div className="flex flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="mx-auto max-w-3xl space-y-6">
                  {isLoadingMessages && (
                    <div className="flex h-full items-center justify-center">
                      <p className="copy-base text-foreground-muted">Loading messages...</p>
                    </div>
                  )}
                  {!isLoadingMessages && messages.length === 0 && (
                    <div className="flex h-full items-center justify-center">
                      <p className="copy-base text-foreground-muted">
                        {currentConversation
                          ? "No messages yet. Be the first to say hello."
                          : "Select a conversation or create a new one."}
                      </p>
                    </div>
                  )}

                  {messages.map((message) => {
                    const isOwnMessage = message.author.id === session.user.id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            isOwnMessage
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-foreground dark:bg-gray-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className="copy-sm font-semibold">
                              {message.author.name ?? message.author.email ?? "Unknown user"}
                            </p>
                            <p className="copy-xs opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <p className="copy-base whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t border-border bg-background px-6 py-4">
                <form onSubmit={handleMessageSubmit} className="mx-auto max-w-3xl">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      ref={inputRef}
                      placeholder={
                        selectedConversationId
                          ? "Type your message..."
                          : "Select a conversation to enable messaging"
                      }
                      disabled={!selectedConversationId || isSendingMessage}
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-foreground-muted focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!selectedConversationId || !inputValue.trim() || isSendingMessage}
                      className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSendingMessage ? "Sending..." : "Send"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Chat;

