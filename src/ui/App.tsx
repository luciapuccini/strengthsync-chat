import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import Placeholder from "./Placeholder/Placeholder";
import ChatPanel from "./ChatPanel/ChatPanel";
import "./App.css";

// WIP: One agent instance per page load.
const sessionId = crypto.randomUUID();

export default function App() {
  const agent = useAgent({ agent: "strength-sync-agent", name: sessionId });
  // Worker streams to FE
  const { messages, sendMessage, status } = useAgentChat({
    agent,
    onToolCall: async ({ toolCall, addToolOutput }) => {
      console.log("🚀 ~ toolCall, addToolOutput :", toolCall, addToolOutput);
    },
  });

  return (
    <div>
      <Placeholder />

      <ChatPanel
        messages={messages}
        sendMessage={sendMessage}
        status={status}
      />
    </div>
  );
}
