import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/shadcn/ui/button";

type Props = {
  children: ReactNode;
  onRetry: () => void;
};

type State = {
  error: Error | null;
};

export class HistoryErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[History] failed to load progress", error, info);
  }

  private retry = () => {
    this.props.onRetry();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6">
          <div>
            <h2 className="text-base font-semibold">Could not load history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {this.state.error.message}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={this.retry}>
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
