// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "@/components/ui/toast";

vi.mock("motion/react", async () => {
  const React = await import("react");
  const omitted = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "layout",
    "layoutId",
    "variants",
    "whileHover",
    "whileTap",
  ]);
  const motion = new Proxy(
    {},
    {
      get: () =>
        function Motion(props: Record<string, unknown>) {
          const rest: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(props)) {
            if (!omitted.has(key)) rest[key] = value;
          }
          return React.createElement("div", rest);
        },
    },
  );
  return {
    AnimatePresence: ({ children }: { children?: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion,
  };
});

function ToastTrigger() {
  const { push } = useToast();
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          push({
            title: "Participant added",
            description: "CS001 joined the queue",
            tone: "success",
          })
        }
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => push({ title: "Panel deleted", tone: "error" })}
      >
        Delete
      </button>
    </div>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ToastProvider", () => {
  it("renders pushed toasts with title and description", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Participant added")).toBeInTheDocument();
    expect(screen.getByText("CS001 joined the queue")).toBeInTheDocument();
  });

  it("stacks multiple toasts", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Participant added")).toBeInTheDocument();
    expect(screen.getByText("Panel deleted")).toBeInTheDocument();
  });

  it("auto-dismisses after the timeout", async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Panel deleted")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4300);
    });
    expect(screen.queryByText("Panel deleted")).not.toBeInTheDocument();
  });

  it("throws a helpful error when useToast is used outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ToastTrigger />)).toThrow(
      "useToast must be used inside <ToastProvider>",
    );
    spy.mockRestore();
  });

  it("marks its toast container as an aria-live polite region", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});
