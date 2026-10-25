import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  failed: boolean;
}

/** Last-resort screen: a render error anywhere below shows this instead of a blank page. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // ponytail: console only; forward to an error tracker here once one exists (Task 14 alarms cover the API side)
    console.error("Unhandled render error", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={{ padding: "4rem 1.5rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <h1>Something went wrong</h1>
        <p>The page hit an unexpected error. Reloading usually fixes it.</p>
        <button onClick={() => window.location.assign("/dashboard")}>Reload the dashboard</button>
      </div>
    );
  }
}
