import { useState } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import MessageList from "./chat/MessageList";
import "./chat/chat.css";

// WIP: One agent instance per page load.
const sessionId = crypto.randomUUID();

export default function ChatPanel() {
  const agent = useAgent({ agent: "strength-sync-agent", name: sessionId });
  // Worker streams to FE
  const { messages, sendMessage, status } = useAgentChat({
    agent,
    onToolCall: async ({ toolCall, addToolOutput }) => {
      console.log("🚀 ~ toolCall, addToolOutput :", toolCall, addToolOutput);
    },
  });

  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  const isStreaming = status === "submitted" || status === "streaming";

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>Chat</h2>
      </div>
      <MessageList messages={messages} />
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Describe a diagram..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={isStreaming || !input.trim()}
        >
          {isStreaming ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
