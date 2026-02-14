import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../utils/testUtils";
import { createMockSocket, createMultipleMockSockets } from "../utils/socketMock";
import { cleanup } from "@testing-library/react";

import {
  allSampleTasks,
  sampleTask1,
  sampleTask2,
  createMockTask,
} from "../fixtures/taskData";
import KanbanBoard from "../../components/KanbanBoard";
import { io } from "socket.io-client";

vi.mock("socket.io-client", () => {
  return {
    io: vi.fn(),
  };
});


describe("WebSocket Integration Tests", () => {
  let mockSocket;

  beforeEach( () => {
    mockSocket = createMockSocket();
    io.mockReturnValue(mockSocket);

    mockSocket.connected = true;
    mockSocket.clearEmittedEvents();
    mockSocket.clearAllHandlers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockSocket.clearEmittedEvents();
    mockSocket.clearAllHandlers();
    cleanup();
  });

  vi.mock("socket.io-client", () => {
    return {
      io: vi.fn(),
    };
  });

  describe("Connection and Initial Sync", () => {
    it("establishes WebSocket connection on component mount", () => {
      renderWithProviders(<KanbanBoard />);

      expect(io).toHaveBeenCalledWith("http://localhost:5000");
      expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    });

    it("requests initial task sync after connection", () => {
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("connect");

      const syncEvents = mockSocket.getEmittedEventsByType("sync:tasks");
      expect(syncEvents.length).toBeGreaterThan(0);
    });

    it("receives and displays initial task list", async () => {
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Fix navigation bug").length).toBeGreaterThan(0);
      });
    });

    it("handles connection with empty task list", async () => {
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", []);

      await waitFor(() => {
        const columns = screen.getAllByRole("heading", { level: 3 });
        expect(columns).toHaveLength(3);
      });
    });
  });

  describe("Task Creation via WebSocket", () => {
    it("emits task:create event when creating a task", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      const input = screen.getAllByPlaceholderText("Enter task title...")[0];
      const addButton = screen.getAllByRole("button", { name: /add/i })[0];

      await user.type(input, "New WebSocket Task");
      await user.click(addButton);

      const createEvents = mockSocket.getEmittedEventsByType("task:create");
      expect(createEvents).toHaveLength(1);
      expect(createEvents[0].data.title).toBe("New WebSocket Task");
    });

    it("updates UI after server broadcasts new task", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      // Initial state
      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      // Create new task
      const input = screen.getAllByPlaceholderText("Enter task title...")[0];
      const addButton = screen.getAllByRole("button", { name: /add/i })[0];

      await user.type(input, "Another Task");
      await user.click(addButton);

      // Simulate server broadcasting updated task list
      const newTask = createMockTask({
        id: "new-task-id",
        title: "Another Task",
      });
      mockSocket.simulateEvent("sync:tasks", [...allSampleTasks, newTask]);

      await waitFor(() => {
        expect(screen.getByText("Another Task")).toBeInTheDocument();
      });
    });
  });

  describe("Task Update via WebSocket", () => {
    it("emits task:update event when editing a task", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      // Open edit modal
      const editButton = screen.getAllByText("✏️")[0]
        ;
      await user.click(editButton);

      // Update title
      const titleInput = screen.getByDisplayValue("Implement login feature");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Login Feature");

      // Save
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      const updateEvents = mockSocket.getEmittedEventsByType("task:update");
      expect(updateEvents).toHaveLength(1);
      expect(updateEvents[0].data.id).toBe(sampleTask1.id);
      expect(updateEvents[0].data.updates.title).toBe("Updated Login Feature");
    });

    it("reflects updates from server in UI", async () => {
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      // Simulate server sending updated task
      const updatedTask = {
        ...sampleTask1,
        title: "Updated by Server",
        priority: "medium",
      };
      mockSocket.simulateEvent("sync:tasks", [updatedTask]);

      await waitFor(() => {
        expect(screen.getByText("Updated by Server")).toBeInTheDocument();
        expect(screen.getByText("medium")).toBeInTheDocument();
      });
    });
  });

  describe("Task Deletion via WebSocket", () => {
    it("emits task:delete event when deleting a task", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      const deleteButton = screen.getByText("🗑️");
      await user.click(deleteButton);

      const deleteEvents = mockSocket.getEmittedEventsByType("task:delete");
      expect(deleteEvents).toHaveLength(1);
      expect(deleteEvents[0].data.id).toBe(sampleTask1.id);
    });

    it("removes task from UI after server confirms deletion", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      // Delete task
      const deleteButtons = screen.getAllByText("🗑️");
      await user.click(deleteButtons[0]);

      // Simulate server broadcasting updated list without deleted task
      const remainingTasks = allSampleTasks.filter(t => t.id !== sampleTask1.id);
      mockSocket.simulateEvent("sync:tasks", remainingTasks);

      await waitFor(() => {
        expect(screen.queryByText("Implement login feature")).not.toBeInTheDocument();
      });
    });
  });

  describe("Multi-Client Synchronization", () => {
    it("synchronizes task creation across multiple clients", async () => {
      const [client1Socket, client2Socket] = createMultipleMockSockets(2);

      // Setup first client
      io.mockReturnValue(client1Socket);
      const { unmount: unmount1 } = renderWithProviders(<KanbanBoard />);

      client1Socket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      // Simulate another client creating a task
      // Server broadcasts to all clients
      const newTask = createMockTask({ title: "Task from Client 2" });
      client1Socket.simulateEvent("sync:tasks", [sampleTask1, newTask]);

      await waitFor(() => {
        expect(screen.getByText("Task from Client 2")).toBeInTheDocument();
      });

      unmount1();
    });

    it("synchronizes task updates across clients", async () => {
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      // Simulate update from another client
      const updatedTask = {
        ...sampleTask1,
        title: "Updated by Another Client",
        description: "Changed remotely",
      };
      mockSocket.simulateEvent("sync:tasks", [updatedTask]);

      await waitFor(() => {
        expect(screen.getByText("Updated by Another Client")).toBeInTheDocument();
        expect(screen.getByText("Changed remotely")).toBeInTheDocument();
      });
    });

    it("synchronizes task deletion across clients", async () => {
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Fix navigation bug").length).toBeGreaterThan(0);
      });

      // Simulate deletion from another client
      const remainingTasks = allSampleTasks.filter(t => t.id !== sampleTask1.id);
      mockSocket.simulateEvent("sync:tasks", remainingTasks);

      await waitFor(() => {
        expect(screen.queryByText("Implement login feature")).not.toBeInTheDocument();
        expect(screen.getAllByText("Fix navigation bug").length).toBeGreaterThan(0);
      });
    });

    it("handles rapid successive updates from multiple clients", async () => {
      renderWithProviders(<KanbanBoard />);

      // Initial state
      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      // Rapid updates
      mockSocket.simulateEvent("sync:tasks", [sampleTask1, sampleTask2]);
      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Fix navigation bug").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Update documentation").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Task Movement via WebSocket", () => {
    it("emits task:move event when task status changes", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      // Open edit modal and change status
      const editButton = screen.getAllByText("✏️")[0];
      await user.click(editButton);

      const statusSelect = screen.getAllByRole("combobox")[2];
      await user.selectOptions(statusSelect, "inprogress");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      const updateEvents = mockSocket.getEmittedEventsByType("task:update");
      expect(updateEvents[0].data.updates.status).toBe("inprogress");
    });

    it("updates task position after server confirms move", async () => {
      renderWithProviders(<KanbanBoard />);

      // Task starts in "todo"
      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      // Simulate server moving task to "inprogress"
      const movedTask = { ...sampleTask1, status: "inprogress" };
      mockSocket.simulateEvent("sync:tasks", [movedTask]);

      await waitFor(() => {
        // Task should still be visible but in different column
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Real-time State Consistency", () => {
    it("maintains consistent state across rapid updates", async () => {
      renderWithProviders(<KanbanBoard />);

      // Rapid fire multiple sync events
      mockSocket.simulateEvent("sync:tasks", []);
      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);
      mockSocket.simulateEvent("sync:tasks", [sampleTask1, sampleTask2]);
      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Fix navigation bug").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Update documentation").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Optimize database queries").length).toBeGreaterThan(0);
      });
    });

    it("handles out-of-order updates gracefully", async () => {
      renderWithProviders(<KanbanBoard />);

      // Simulate out-of-order updates (newer update arrives first)
      mockSocket.simulateEvent("sync:tasks", allSampleTasks);
      mockSocket.simulateEvent("sync:tasks", [sampleTask1]); // Older state

      await waitFor(() => {
        // Should show the last received state
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });
    });

    it("recovers from connection interruption", async () => {
      renderWithProviders(<KanbanBoard />);

      // Initial sync
      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      // Simulate disconnect
      mockSocket.simulateEvent("disconnect");

      // Reconnect and resync
      mockSocket.simulateEvent("connect");
      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      await waitFor(() => {
        expect(screen.getAllByText("Fix navigation bug").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Update documentation").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Error Handling", () => {
    it("handles malformed sync data gracefully", async () => {
      renderWithProviders(<KanbanBoard />);

      // Send malformed data
      mockSocket.simulateEvent("sync:tasks", null);

      // Should not crash
      expect(screen.getAllByText("Kanban Board").length).toBeGreaterThan(0);
    });

    it("continues functioning after failed operations", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getAllByText("Implement login feature").length).toBeGreaterThan(0);
      });

      // Try to create a task (might fail on server)
      const input = screen.getAllByPlaceholderText("Enter task title...")[0];
      const addButton = screen.getAllByRole("button", { name: /add/i })[0];

      await user.type(input, "Test Task");
      await user.click(addButton);

      // Server doesn't add the task (error scenario)
      // But sends back the same list
      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      // UI should still be functional
      await user.type(input, "Another Task");
      await user.click(addButton);

      const createEvents = mockSocket.getEmittedEventsByType("task:create");
      expect(createEvents.length).toBeGreaterThanOrEqual(2);
    });
  });
});
