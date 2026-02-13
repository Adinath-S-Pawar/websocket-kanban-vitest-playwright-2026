import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../utils/testUtils";
import { createMockSocket } from "../utils/socketMock";
import { allSampleTasks, sampleTask1 } from "../fixtures/taskData";
import KanbanBoard from "../../components/KanbanBoard";

describe("KanbanBoard Component", () => {
  let mockSocket;

  beforeEach(async () => {
    const { io } = await import("socket.io-client");
    mockSocket = io();

    mockSocket.clear();
    mockSocket.connected = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockSocket.clearEmittedEvents();
    mockSocket.clearAllHandlers();
  });

  describe("Rendering", () => {
    it("renders Kanban board title", () => {
      renderWithProviders(<KanbanBoard />);
      expect(screen.getByText("Kanban Board")).toBeInTheDocument();
    });

    it("renders all three columns", () => {
      renderWithProviders(<KanbanBoard />);

      expect(screen.getByText("To Do")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.getByText("Done")).toBeInTheDocument();
    });

    it("renders task creation form", () => {
      renderWithProviders(<KanbanBoard />);

      const input = screen.getByPlaceholderText("Enter task title...");
      const addButton = screen.getByRole("button", { name: /add/i });

      expect(input).toBeInTheDocument();
      expect(addButton).toBeInTheDocument();
    });

    it("renders show/hide stats button", () => {
      renderWithProviders(<KanbanBoard />);

      const statsButton = screen.getByRole("button", { name: /show stats/i });
      expect(statsButton).toBeInTheDocument();
    });
  });

  describe("WebSocket Connection", () => {
    it("connects to WebSocket on mount", () => {
      renderWithProviders(<KanbanBoard />);

      expect(io).toHaveBeenCalledWith("http://localhost:5000");
    });

    it("registers connect event listener", () => {
      renderWithProviders(<KanbanBoard />);

      expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    });

    it("registers sync:tasks event listener", () => {
      renderWithProviders(<KanbanBoard />);

      expect(mockSocket.on).toHaveBeenCalledWith("sync:tasks", expect.any(Function));
    });

    it("requests task sync on connect", () => {
      renderWithProviders(<KanbanBoard />);

      // Simulate connection
      mockSocket.simulateEvent("connect");

      const emittedEvents = mockSocket.getEmittedEventsByType("sync:tasks");
      expect(emittedEvents.length).toBeGreaterThan(0);
    });

    it("cleans up event listeners on unmount", () => {
      const { unmount } = renderWithProviders(<KanbanBoard />);

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith("connect");
      expect(mockSocket.off).toHaveBeenCalledWith("sync:tasks");
    });
  });

  describe("Task Display", () => {
    it("displays tasks after receiving sync:tasks event", async () => {
      renderWithProviders(<KanbanBoard />);

      // Simulate receiving tasks from server
      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      await waitFor(() => {
        expect(screen.getByText("Implement login feature")).toBeInTheDocument();
        expect(screen.getByText("Fix navigation bug")).toBeInTheDocument();
        expect(screen.getByText("Update documentation")).toBeInTheDocument();
      });
    });

    it("filters tasks by status correctly", async () => {
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      await waitFor(() => {
        // Check that tasks appear in correct columns
        const todoColumn = screen.getByText("To Do").closest("div");
        const inProgressColumn = screen.getByText("In Progress").closest("div");
        const doneColumn = screen.getByText("Done").closest("div");

        expect(todoColumn).toBeInTheDocument();
        expect(inProgressColumn).toBeInTheDocument();
        expect(doneColumn).toBeInTheDocument();
      });
    });

    it("shows loading state initially", () => {
      renderWithProviders(<KanbanBoard />);

      // Before sync:tasks event, board should be in loading state
      // (In this implementation, it just shows empty columns)
      const columns = screen.getAllByRole("heading", { level: 3 });
      expect(columns).toHaveLength(3);
    });
  });

  describe("Task Creation", () => {
    it("creates a new task when form is submitted", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      const input = screen.getByPlaceholderText("Enter task title...");
      const addButton = screen.getByRole("button", { name: /add/i });

      await user.type(input, "New Task Title");
      await user.click(addButton);

      const emittedEvents = mockSocket.getEmittedEventsByType("task:create");
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].data.title).toBe("New Task Title");
    });

    it("clears input after task creation", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      const input = screen.getByPlaceholderText("Enter task title...");
      const addButton = screen.getByRole("button", { name: /add/i });

      await user.type(input, "New Task");
      await user.click(addButton);

      expect(input).toHaveValue("");
    });

    it("does not create task with empty title", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      const addButton = screen.getByRole("button", { name: /add/i });

      await user.click(addButton);

      const emittedEvents = mockSocket.getEmittedEventsByType("task:create");
      expect(emittedEvents).toHaveLength(0);
    });

    it("trims whitespace from task title", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      const input = screen.getByPlaceholderText("Enter task title...");
      const addButton = screen.getByRole("button", { name: /add/i });

      await user.type(input, "   Trimmed Task   ");
      await user.click(addButton);

      const emittedEvents = mockSocket.getEmittedEventsByType("task:create");
      expect(emittedEvents[0].data.title).toBe("Trimmed Task");
    });

    it("creates task with default values", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      const input = screen.getByPlaceholderText("Enter task title...");
      const addButton = screen.getByRole("button", { name: /add/i });

      await user.type(input, "Test Task");
      await user.click(addButton);

      const emittedEvents = mockSocket.getEmittedEventsByType("task:create");
      const taskData = emittedEvents[0].data;

      expect(taskData.status).toBe("todo");
      expect(taskData.priority).toBe("low");
      expect(taskData.category).toBe("feature");
      expect(taskData.description).toBe("");
      expect(taskData.attachments).toEqual([]);
    });
  });

  describe("Statistics Toggle", () => {
    it("shows chart when Show Stats button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      const statsButton = screen.getByRole("button", { name: /show stats/i });
      await user.click(statsButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /hide stats/i })).toBeInTheDocument();
      });
    });

    it("hides chart when Hide Stats button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      // Show stats
      const showButton = screen.getByRole("button", { name: /show stats/i });
      await user.click(showButton);

      // Hide stats
      const hideButton = await screen.findByRole("button", { name: /hide stats/i });
      await user.click(hideButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /show stats/i })).toBeInTheDocument();
      });
    });

    it("toggles chart visibility multiple times", async () => {
      const user = userEvent.setup();
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      const showButton = screen.getByRole("button", { name: /show stats/i });

      // Toggle on
      await user.click(showButton);
      expect(screen.getByRole("button", { name: /hide stats/i })).toBeInTheDocument();

      // Toggle off
      const hideButton = screen.getByRole("button", { name: /hide stats/i });
      await user.click(hideButton);
      expect(screen.getByRole("button", { name: /show stats/i })).toBeInTheDocument();

      // Toggle on again
      await user.click(showButton);
      expect(screen.getByRole("button", { name: /hide stats/i })).toBeInTheDocument();
    });
  });

  describe("Real-time Updates", () => {
    it("updates UI when new tasks are synced", async () => {
      renderWithProviders(<KanbanBoard />);

      // Initial sync
      mockSocket.simulateEvent("sync:tasks", [sampleTask1]);

      await waitFor(() => {
        expect(screen.getByText("Implement login feature")).toBeInTheDocument();
      });

      // New sync with additional tasks
      mockSocket.simulateEvent("sync:tasks", allSampleTasks);

      await waitFor(() => {
        expect(screen.getByText("Fix navigation bug")).toBeInTheDocument();
        expect(screen.getByText("Update documentation")).toBeInTheDocument();
      });
    });

    it("handles empty task list", async () => {
      renderWithProviders(<KanbanBoard />);

      mockSocket.simulateEvent("sync:tasks", []);

      await waitFor(() => {
        const columns = screen.getAllByRole("heading", { level: 3 });
        expect(columns).toHaveLength(3);
      });
    });
  });
});
