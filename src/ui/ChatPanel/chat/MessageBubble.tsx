import type { UIMessage } from "ai";
import MarkdownRenderer from "./MarkdownRenderer";
import ToolStatus from "../streaming/ToolStatus";
import { Message, MessageContent, MessageHeader } from "../../shadcn/ui/message";
import { Bubble, BubbleContent } from "../../shadcn/ui/bubble";
import "../streaming/streaming.css";

interface MessageBubbleProps {
  message: UIMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const align = message.role === "user" ? "end" : "start";

  return (
    <Message align={align}>
      <MessageContent>
        <MessageHeader>
          {message.role === "user" ? "You" : "Assistant"}
        </MessageHeader>
        {message.parts?.map((part, i) => {
          // Plain text part
          if (part.type === "text") {
            return (
              <Bubble key={i} align={align} variant={message.role === "user" ? "default" : "outline"}>
                <BubbleContent>
                  {message.role === "assistant" ? (
                    <MarkdownRenderer content={part.text} />
                  ) : (
                    part.text
                  )}
                </BubbleContent>
              </Bubble>
            );
          }

          // Tool call part: type is `tool-<toolName>` (e.g. tool-generateDiagram)
          if (part.type?.startsWith("tool-")) {
            const toolName = part.type.replace("tool-", "");
            const toolPart = part as { state?: string };
            const status =
              toolPart.state === "output-available"
                ? "complete"
                : toolPart.state === "output-error"
                  ? "error"
                  : "running";
            return <ToolStatus key={i} name={toolName} status={status} />;
          }

          return null;
        })}
      </MessageContent>
    </Message>
  );
}
