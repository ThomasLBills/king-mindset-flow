import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorState, EmptyState, LoadingState } from "./index";

describe("feedback states", () => {
  it("ErrorState shows message and fires retry", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Nope" onRetry={onRetry} />);
    expect(screen.getByText("Nope")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry|try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });
  it("EmptyState renders title + action", () => {
    render(<EmptyState title="Nothing here" action={<button>Add</button>} />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
  it("LoadingState is announced as busy", () => {
    render(<LoadingState lines={2} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });
});
