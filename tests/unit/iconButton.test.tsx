import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "../../src/components/ui/IconButton";

describe("IconButton", () => {
  it("renders with aria label and click handler", () => {
    const onClick = vi.fn();

    render(
      <IconButton label="Add item" onClick={onClick}>
        +
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Add item" });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not click when disabled", () => {
    const onClick = vi.fn();

    render(
      <IconButton disabled label="Disabled item" onClick={onClick}>
        +
      </IconButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Disabled item" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

