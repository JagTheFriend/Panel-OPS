// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Start interview</Button>);
    expect(
      screen.getByRole("button", { name: "Start interview" }),
    ).toBeInTheDocument();
  });

  it("fires onClick when enabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button variant="secondary" onClick={onClick}>
        Join panel
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "Join panel" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and shows a spinner while loading", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is disabled when the disabled prop is set", () => {
    render(<Button disabled>Leave panel</Button>);
    expect(screen.getByRole("button", { name: "Leave panel" })).toBeDisabled();
  });

  it("applies variant and size classes", () => {
    render(
      <Button variant="danger" size="sm">
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-danger");
    expect(button.className).toContain("h-8");
  });

  it("passes through native attributes like aria-label and type", () => {
    render(
      <Button aria-label="Close dialog" type="button">
        x
      </Button>,
    );
    expect(
      screen.getByRole("button", { name: "Close dialog" }),
    ).toHaveAttribute("type", "button");
  });
});
