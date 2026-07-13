import { useState } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import MessageList from "./chat/MessageList";
import { Input } from "@/shadcn/ui/input";
import { Button } from "@/shadcn/ui/button";
import { SendIcon } from "lucide-react";

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
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Chat</h2>
      </div>
      <MessageList messages={messages} />
      <form className="flex gap-2 border-t p-3" onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Describe a diagram..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
        />
        <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}>
          <SendIcon />
        </Button>
      </form>
    </div>
  );
}
