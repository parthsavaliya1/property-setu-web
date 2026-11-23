import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MediaSettingsForm } from "@/components/propertysetu/media-settings";
import { defaultMediaSettings } from "@/lib/mediaSettings";
const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/components/propertysetu/admin", () => ({ useAdmin: () => ({ token: "admin-test", request: mocks.request }) }));
afterEach(cleanup);
beforeEach(() => {
  mocks.request.mockReset();
  mocks.request.mockImplementation(async (_path: string, options?: RequestInit) => options?.body ? JSON.parse(String(options.body)) : defaultMediaSettings);
});
it("saves two 60-second videos and clarity limits from the admin form", async () => {
  render(<MediaSettingsForm />);
  const count = await screen.findByLabelText("Videos per property (0 disables videos)");
  fireEvent.change(count, { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Maximum seconds per video"), { target: { value: "60" } });
  fireEvent.change(screen.getByLabelText("Photo quality (%)"), { target: { value: "90" } });
  fireEvent.change(screen.getByLabelText("Video maximum side (pixels)"), { target: { value: "1080" } });
  fireEvent.change(screen.getByLabelText("Video clarity"), { target: { value: "high" } });
  fireEvent.click(screen.getByRole("button", { name: "Save media settings" }));
  await screen.findByRole("status");
  const call = mocks.request.mock.calls.find(([, options]) => options?.method === "PATCH");
  expect(call?.[0]).toBe("/api/admin/media-settings");
  expect(JSON.parse(call?.[1]?.body)).toMatchObject({ maxVideos: 2, maxVideoDurationSeconds: 60, photoQuality: 90, videoMaxEdge: 1080, videoQuality: "high" });
});
it("shows save failures without discarding the selected settings", async () => {
  render(<MediaSettingsForm />);
  fireEvent.change(await screen.findByLabelText("Videos per property (0 disables videos)"), { target: { value: "2" } });
  mocks.request.mockRejectedValueOnce(new Error("Save unavailable"));
  fireEvent.click(screen.getByRole("button", { name: "Save media settings" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Save unavailable");
  expect(screen.getByLabelText("Videos per property (0 disables videos)")).toHaveValue(2);
  await waitFor(() => expect(screen.getByRole("button", { name: "Save media settings" })).toBeEnabled());
});
