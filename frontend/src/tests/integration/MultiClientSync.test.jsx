import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../utils/testUtils";
import { createMultipleMockSockets } from "../utils/socketMock";
import { allSampleTasks } from "../fixtures/taskData";
import KanbanBoard from "../../components/KanbanBoard";

describe("Integration: Multi-client WebSocket sync", () => {
  let sockets;

  beforeEach(() => {
    sockets = createMultipleMockSockets(2);
  });

  it("syncs tasks across multiple clients when server sends sync:tasks", async () => {
    renderWithProviders(<KanbanBoard socket={sockets[0]} />);
    renderWithProviders(<KanbanBoard socket={sockets[1]} />);

    // Server sends tasks to both clients
    sockets[0].simulateEvent("sync:tasks", allSampleTasks);
    sockets[1].simulateEvent("sync:tasks", allSampleTasks);

    await waitFor(() => {
      expect(screen.getAllByText("Implement login feature").length).toBeGreaterThanOrEqual(2);
    });
  });
});
