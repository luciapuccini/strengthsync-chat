import Placeholder from "./Placeholder/Placeholder";
import ChatPanel from "./ChatPanel/ChatPanel";
import { Button } from "./shadcn/ui/button";
import "./App.css";

export default function App() {
  return (
    <div>
      <Button>Tailwind + shadcn demo</Button>

      <Placeholder />

      <ChatPanel />
    </div>
  );
}
