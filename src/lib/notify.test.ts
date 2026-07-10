import { describe, it, expect, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

import { toast } from "sonner";
import { notify } from "./notify";

describe("notify", () => {
  it("success routes to toast.success", () => {
    notify.success("ok");
    expect(toast.success).toHaveBeenCalledWith("ok", expect.any(Object));
  });
  it("error routes to toast.error", () => {
    notify.error("bad");
    expect(toast.error).toHaveBeenCalled();
  });
  it("fromError maps the error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    notify.fromError({ code: "23505" });
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/already exists/i), expect.any(Object));
  });
});
