import { Component, type ErrorInfo, type ReactNode } from "react";

type Fallback = ReactNode | ((error: Error, reset: () => void) => ReactNode);

export class ErrorBoundary extends Component<{ children: ReactNode; fallback: Fallback }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    const { fallback } = this.props;
    return typeof fallback === "function" ? fallback(this.state.error, this.reset) : fallback;
  }
}
