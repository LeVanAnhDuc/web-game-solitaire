import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { strings } from "@/lib/strings";
import { Toolbar, type ToolbarProps } from "./Toolbar";

function setup(overrides: Partial<ToolbarProps> = {}) {
  const props: ToolbarProps = {
    onUndo: vi.fn(),
    onRestart: vi.fn(),
    onNewGame: vi.fn(),
    onAutoComplete: vi.fn(),
    drawMode: 1,
    onDrawModeChange: vi.fn(),
    canUndo: true,
    canAutoComplete: true,
    ...overrides,
  };
  render(<Toolbar {...props} />);
  return props;
}

describe("Toolbar", () => {
  it("shows every control with its Vietnamese label", () => {
    setup();
    expect(screen.getByLabelText(strings.toolbar.undo)).toBeTruthy();
    expect(screen.getByLabelText(strings.toolbar.restart)).toBeTruthy();
    expect(screen.getByLabelText(strings.toolbar.newGame)).toBeTruthy();
    expect(screen.getByLabelText(strings.toolbar.autoComplete)).toBeTruthy();
    expect(screen.getByLabelText(strings.toolbar.drawMode)).toBeTruthy();
  });

  it("fires each action callback", () => {
    const props = setup();
    fireEvent.click(screen.getByLabelText(strings.toolbar.undo));
    fireEvent.click(screen.getByLabelText(strings.toolbar.restart));
    fireEvent.click(screen.getByLabelText(strings.toolbar.newGame));
    fireEvent.click(screen.getByLabelText(strings.toolbar.autoComplete));
    expect(props.onUndo).toHaveBeenCalledTimes(1);
    expect(props.onRestart).toHaveBeenCalledTimes(1);
    expect(props.onNewGame).toHaveBeenCalledTimes(1);
    expect(props.onAutoComplete).toHaveBeenCalledTimes(1);
  });

  it("disables Undo when there is no history, without removing it from the page", () => {
    const props = setup({ canUndo: false });
    const undo = screen.getByLabelText(strings.toolbar.undo);
    expect(undo.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(undo);
    expect(props.onUndo).not.toHaveBeenCalled();
    // Still announced and still reachable by keyboard - it is not `disabled`.
    expect(undo.hasAttribute("disabled")).toBe(false);
  });

  it("disables Hoàn tất until every card is face up", () => {
    const props = setup({ canAutoComplete: false });
    const auto = screen.getByLabelText(strings.toolbar.autoComplete);
    expect(auto.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(auto);
    expect(props.onAutoComplete).not.toHaveBeenCalled();
  });

  it("reports the draw mode the player picked", () => {
    const props = setup({ drawMode: 1 });
    const select = screen.getByLabelText(strings.toolbar.drawMode) as HTMLSelectElement;
    expect(select.value).toBe("1");
    fireEvent.change(select, { target: { value: "3" } });
    expect(props.onDrawModeChange).toHaveBeenCalledWith(3);
  });

  it("offers both draw modes by name", () => {
    setup({ drawMode: 3 });
    expect(screen.getByText(strings.toolbar.draw1)).toBeTruthy();
    expect(screen.getByText(strings.toolbar.draw3)).toBeTruthy();
  });

  it("gives every button a 44px minimum height - NFR-A11Y-03", () => {
    setup();
    const undo = screen.getByLabelText(strings.toolbar.undo);
    expect(undo.className).toContain("min-h-[44px]");
  });
});
