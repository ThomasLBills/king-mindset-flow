import { describe, it, expect, vi } from "vitest";

vi.mock("./notify", () => ({ notify: { error: vi.fn() } }));

import { notify } from "./notify";
import { mutationErrorHandler } from "./queryClient";

const mut = (meta?: Record<string, unknown>) => ({ meta }) as { meta?: { handled?: boolean } };

describe("global mutation net", () => {
  it("toasts when the mutation does not opt out", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mutationErrorHandler(new Error("boom"), undefined, undefined, mut());
    expect(notify.error).toHaveBeenCalled();
  });
  it("stays silent when meta.handled is set", () => {
    (notify.error as ReturnType<typeof vi.fn>).mockClear();
    mutationErrorHandler(new Error("boom"), undefined, undefined, mut({ handled: true }));
    expect(notify.error).not.toHaveBeenCalled();
  });
});
