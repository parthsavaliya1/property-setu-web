import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PropertyVideoCard } from "@/components/propertysetu/video-card";
afterEach(cleanup);
it("shows a compact card and opens the selected video only when clicked", async () => {
  render(<PropertyVideoCard src="https://media.example/tour.mp4" poster="https://media.example/house.jpg" index={0} />);
  expect(screen.getByText("Tap to watch")).toBeTruthy();
  expect(document.querySelector("video")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Watch property video 1" }));
  expect(await screen.findByRole("dialog")).toBeTruthy();
  expect(document.querySelector("video")).toHaveAttribute("src", "https://media.example/tour.mp4");
  expect(document.querySelector("video")).toHaveAttribute("controls");
  fireEvent.click(screen.getByRole("button", { name: "Close video" }));
  expect(document.querySelector("video")).toBeNull();
});
it("removes only the chosen attachment without starting playback", () => {
  const remove = vi.fn();
  const { rerender } = render(<PropertyVideoCard src="https://media.example/tour.mp4" index={1} onRemove={remove} />);
  fireEvent.click(screen.getByRole("button", { name: "Remove video 2" }));
  expect(remove).toHaveBeenCalledTimes(1);
  expect(document.querySelector("video")).toBeNull();
  rerender(<PropertyVideoCard src="https://media.example/tour.mp4" index={1} onRemove={remove} disabled />);
  expect(screen.getByRole("button", { name: "Remove video 2" })).toBeDisabled();
});
