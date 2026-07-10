import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConfirmProvider, useConfirm } from "./ConfirmProvider";

function Harness({ onResult }: { onResult: (b: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button onClick={async () => onResult(await confirm({ title: "Sure?", confirmLabel: "Yes" }))}>go</button>
  );
}

describe("useConfirm", () => {
  it("resolves true when confirmed", async () => {
    let result: boolean | undefined;
    render(
      <ConfirmProvider>
        <Harness onResult={(b) => (result = b)} />
      </ConfirmProvider>,
    );
    fireEvent.click(screen.getByText("go"));
    fireEvent.click(await screen.findByRole("button", { name: "Yes" }));
    await waitFor(() => expect(result).toBe(true));
  });
});
