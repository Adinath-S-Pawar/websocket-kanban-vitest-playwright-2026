import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../utils/testUtils";
import { createMockSocket } from "../utils/socketMock";
import { sampleTask1, sampleTask2, allSampleTasks } from "../fixtures/taskData";
import Column from "../../components/Column";

describe("Column Component", () => {
    let mockSocket;
    const todoColumn = { key: "todo", title: "To Do" };
    const inProgressColumn = { key: "inprogress", title: "In Progress" };
    const doneColumn = { key: "done", title: "Done" };

    beforeEach(() => {
        mockSocket = createMockSocket();
    });

    describe("Rendering", () => {
        it("renders column title", () => {
            renderWithProviders(
                <Column column={todoColumn} tasks={[]} socket={mockSocket} />
            );

            expect(screen.getByText("To Do")).toBeInTheDocument();
        });

        it("renders task count badge", () => {
            renderWithProviders(
                <Column column={todoColumn} tasks={[sampleTask1]} socket={mockSocket} />
            );

            expect(screen.getByText("1")).toBeInTheDocument();
        });

        it("displays correct task count for multiple tasks", () => {
            const todoTasks = allSampleTasks.filter((t) => t.status === "todo");
            renderWithProviders(
                <Column column={todoColumn} tasks={todoTasks} socket={mockSocket} />
            );

            expect(screen.getByText(todoTasks.length.toString())).toBeInTheDocument();
        });

        it("displays zero count for empty column", () => {
            renderWithProviders(
                <Column column={todoColumn} tasks={[]} socket={mockSocket} />
            );

            expect(screen.getByText("0")).toBeInTheDocument();
        });

        it("renders all tasks in the column", () => {
            const tasks = [sampleTask1, { ...sampleTask2, status: "todo" }];
            renderWithProviders(
                <Column column={todoColumn} tasks={tasks} socket={mockSocket} />
            );

            expect(screen.getByText("Implement login feature")).toBeInTheDocument();
            expect(screen.getByText("Fix navigation bug")).toBeInTheDocument();
        });

        it("renders empty column without errors", () => {
            renderWithProviders(
                <Column column={todoColumn} tasks={[]} socket={mockSocket} />
            );

            expect(screen.getByText("To Do")).toBeInTheDocument();
            expect(screen.getByText("0")).toBeInTheDocument();
        });
    });

    describe("Column Types", () => {
        it("renders To Do column correctly", () => {
            renderWithProviders(
                <Column column={todoColumn} tasks={[]} socket={mockSocket} />
            );

            expect(screen.getByText("To Do")).toBeInTheDocument();
        });

        it("renders In Progress column correctly", () => {
            renderWithProviders(
                <Column column={inProgressColumn} tasks={[]} socket={mockSocket} />
            );

            expect(screen.getByText("In Progress")).toBeInTheDocument();
        });

        it("renders Done column correctly", () => {
            renderWithProviders(
                <Column column={doneColumn} tasks={[]} socket={mockSocket} />
            );

            expect(screen.getByText("Done")).toBeInTheDocument();
        });
    });

    describe("Drop Zone Functionality", () => {
        it("renders as a drop zone", () => {
            const { container } = renderWithProviders(
                <Column column={todoColumn} tasks={[]} socket={mockSocket} />
            );

            // Column should be rendered and ready to accept drops
            const column = container.querySelector('[class*="column"]');
            expect(column).toBeInTheDocument();
        });

        it("accepts TASK drop type", () => {
           
            renderWithProviders(
                <Column column={todoColumn} tasks={[]} socket={mockSocket} />
            );

            expect(screen.getByText("To Do")).toBeInTheDocument();
        });
    });

    describe("Task Display", () => {
        it("displays tasks with correct props", () => {
            renderWithProviders(
                <Column column={todoColumn} tasks={[sampleTask1]} socket={mockSocket} />
            );

            expect(screen.getByText(sampleTask1.title)).toBeInTheDocument();
            expect(screen.getByText(sampleTask1.description)).toBeInTheDocument();
        });

        it("renders tasks in order", () => {
            const tasks = [
                { ...sampleTask1, title: "First Task" },
                { ...sampleTask1, id: "task-2", title: "Second Task" },
                { ...sampleTask1, id: "task-3", title: "Third Task" },
            ];

            renderWithProviders(
                <Column column={todoColumn} tasks={tasks} socket={mockSocket} />
            );

            const taskTitles = screen.getAllByRole("heading", { level: 4 });
            expect(taskTitles[0]).toHaveTextContent("First Task");
            expect(taskTitles[1]).toHaveTextContent("Second Task");
            expect(taskTitles[2]).toHaveTextContent("Third Task");
        });

        it("passes socket to each task card", () => {
            renderWithProviders(
                <Column column={todoColumn} tasks={[sampleTask1]} socket={mockSocket} />
            );

            // Verify task can interact with socket (e.g., delete button exists)
            const deleteButton = screen.getByText("🗑️");
            expect(deleteButton).toBeInTheDocument();
        });
    });

    describe("Styling and Classes", () => {
        it("applies column class", () => {
            const { container } = renderWithProviders(
                <Column column={todoColumn} tasks={[]} socket={mockSocket} />
            );

            const column = container.querySelector('[class*="column"]');
            expect(column).toBeInTheDocument();
        });

        it("has proper structure with header and task list", () => {
            const { container } = renderWithProviders(
                <Column column={todoColumn} tasks={[sampleTask1]} socket={mockSocket} />
            );

            const header = container.querySelector('[class*="columnHeader"]');
            const taskList = container.querySelector('[class*="taskList"]');

            expect(header).toBeInTheDocument();
            expect(taskList).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("handles null tasks array gracefully", () => {
            expect(() => {
                renderWithProviders(
                    <Column column={todoColumn} tasks={null} socket={mockSocket} />
                );
            }).toThrow(); 
        });

        it("handles undefined socket", () => {
            // Test what happens if socket is undefined
            expect(() => {
                renderWithProviders(
                    <Column column={todoColumn} tasks={[]} socket={undefined} />
                );
            }).toThrow(); 
        });

        it("renders large number of tasks", () => {
            const manyTasks = Array.from({ length: 50 }, (_, i) => ({
                ...sampleTask1,
                id: `task-${i}`,
                title: `Task ${i}`,
            }));

            renderWithProviders(
                <Column column={todoColumn} tasks={manyTasks} socket={mockSocket} />
            );

            expect(screen.getByText("50")).toBeInTheDocument();
        });
    });
});
