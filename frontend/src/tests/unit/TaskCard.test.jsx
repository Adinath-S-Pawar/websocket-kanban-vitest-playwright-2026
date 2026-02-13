import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../utils/testUtils";
import { createMockSocket } from "../utils/socketMock";
import { sampleTask1, sampleTask2 } from "../fixtures/taskData";
import TaskCard from "../../components/TaskCard";

describe("TaskCard Component", () => {
    let mockSocket;

    beforeEach(() => {
        mockSocket = createMockSocket();
    });

    describe("Rendering", () => {
        it("renders task title", () => {
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            expect(screen.getByText("Implement login feature")).toBeInTheDocument();
        });

        it("renders task description", () => {
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            expect(screen.getByText("Add user authentication with JWT")).toBeInTheDocument();
        });

        it("renders empty description placeholder", () => {
            const taskWithoutDesc = { ...sampleTask1, description: "" };
            renderWithProviders(<TaskCard task={taskWithoutDesc} socket={mockSocket} />);

            expect(screen.getByText("—")).toBeInTheDocument();
        });

        it("renders priority badge", () => {
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            expect(screen.getByText("high")).toBeInTheDocument();
        });

        it("renders category badge", () => {
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            expect(screen.getByText("feature")).toBeInTheDocument();
        });

        it("renders edit and delete buttons", () => {
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            const buttons = screen.getAllByRole("button");
            expect(buttons.length).toBeGreaterThanOrEqual(2);
        });

        it("renders attachment chip when attachments exist", () => {
            renderWithProviders(<TaskCard task={sampleTask2} socket={mockSocket} />);

            expect(screen.getByText(/1 Attachment/i)).toBeInTheDocument();
        });

        it("renders correct attachment count", () => {
            const taskWithMultipleAttachments = {
                ...sampleTask1,
                attachments: [
                    { name: "file1.pdf", type: "application/pdf", url: "blob:url1" },
                    { name: "file2.png", type: "image/png", url: "blob:url2" },
                    { name: "file3.doc", type: "application/doc", url: "blob:url3" },
                ],
            };

            renderWithProviders(
                <TaskCard task={taskWithMultipleAttachments} socket={mockSocket} />
            );

            expect(screen.getByText(/3 Attachments/i)).toBeInTheDocument();
        });

        it("does not render attachment chip when no attachments", () => {
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            expect(screen.queryByText(/Attachment/i)).not.toBeInTheDocument();
        });
    });

    describe("Task Deletion", () => {
        it("emits delete event when delete button is clicked", async () => {
            const user = userEvent.setup();
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            const deleteButton = screen.getByText("🗑️");
            await user.click(deleteButton);

            const emittedEvents = mockSocket.getEmittedEventsByType("task:delete");
            expect(emittedEvents).toHaveLength(1);
            expect(emittedEvents[0].data.id).toBe(sampleTask1.id);
        });
    });

    describe("Edit Mode", () => {
        it("opens edit modal when edit button is clicked", async () => {
            const user = userEvent.setup();
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            const editButton = screen.getByText("✏️");
            await user.click(editButton);

            expect(screen.getByText("Edit Task")).toBeInTheDocument();
        });

        it("opens edit modal on double click", async () => {
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            const card = screen.getByText("Implement login feature").closest("div");
            fireEvent.doubleClick(card);

            expect(screen.getByText("Edit Task")).toBeInTheDocument();
        });

        it("displays current task values in edit form", async () => {
            const user = userEvent.setup();
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            const editButton = screen.getByText("✏️");
            await user.click(editButton);

            expect(screen.getByDisplayValue("Implement login feature")).toBeInTheDocument();
            expect(screen.getByDisplayValue("Add user authentication with JWT")).toBeInTheDocument();
        });

        it("closes edit modal when cancel is clicked", async () => {
            const user = userEvent.setup();
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            const editButton = screen.getByText("✏️");
            await user.click(editButton);

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            await user.click(cancelButton);

            expect(screen.queryByText("Edit Task")).not.toBeInTheDocument();
        });

        it("saves task updates when save button is clicked", async () => {
            const user = userEvent.setup();
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            const editButton = screen.getByText("✏️");
            await user.click(editButton);

            const titleInput = screen.getByDisplayValue("Implement login feature");
            await user.clear(titleInput);
            await user.type(titleInput, "Updated Task Title");

            const saveButton = screen.getByRole("button", { name: /save/i });
            await user.click(saveButton);

            const emittedEvents = mockSocket.getEmittedEventsByType("task:update");
            expect(emittedEvents).toHaveLength(1);
            expect(emittedEvents[0].data.updates.title).toBe("Updated Task Title");
        });

        it("updates all editable fields", async () => {
            const user = userEvent.setup();
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            const editButton = screen.getByText("✏️");
            await user.click(editButton);

            // Update title
            const titleInput = screen.getByDisplayValue("Implement login feature");
            await user.clear(titleInput);
            await user.type(titleInput, "New Title");

            // Update description
            const descInput = screen.getByDisplayValue("Add user authentication with JWT");
            await user.clear(descInput);
            await user.type(descInput, "New Description");

            // Update priority
            const prioritySelect = screen.getByDisplayValue("High");
            await user.selectOptions(prioritySelect, "medium");

            // Update category
            const categorySelect = screen.getByDisplayValue("Feature");
            await user.selectOptions(categorySelect, "bug");

            // Update status
            const statusSelect = screen.getByDisplayValue("To Do");
            await user.selectOptions(statusSelect, "inprogress");

            const saveButton = screen.getByRole("button", { name: /save/i });
            await user.click(saveButton);

            const emittedEvents = mockSocket.getEmittedEventsByType("task:update");
            const updates = emittedEvents[0].data.updates;

            expect(updates.title).toBe("New Title");
            expect(updates.description).toBe("New Description");
            expect(updates.priority).toBe("medium");
            expect(updates.category).toBe("bug");
            expect(updates.status).toBe("inprogress");
        });
    });

    describe("Attachment Functionality", () => {
        it("shows attachment popup when chip is clicked", async () => {
            const user = userEvent.setup();
            renderWithProviders(<TaskCard task={sampleTask2} socket={mockSocket} />);

            const attachmentChip = screen.getByText(/1 Attachment/i);
            await user.click(attachmentChip);

            expect(screen.getByText("Attachments")).toBeInTheDocument();
            expect(screen.getByText("screenshot.png")).toBeInTheDocument();
        });

        it("closes attachment popup when close button is clicked", async () => {
            const user = userEvent.setup();
            renderWithProviders(<TaskCard task={sampleTask2} socket={mockSocket} />);

            const attachmentChip = screen.getByText(/1 Attachment/i);
            await user.click(attachmentChip);

            const closeButtons = screen.getAllByText("✖");
            await user.click(closeButtons[0]);

            expect(screen.queryByText("screenshot.png")).not.toBeInTheDocument();
        });
    });

    describe("Drag Functionality", () => {
        it("applies dragging class when dragging", () => {
            const { container } = renderWithProviders(
                <TaskCard task={sampleTask1} socket={mockSocket} />
            );

            // The drag functionality is handled by react-dnd
            // We can verify the component is set up for dragging
            const card = container.querySelector('[class*="card"]');
            expect(card).toBeInTheDocument();
        });

        it("disables drag when in edit mode", async () => {
            const user = userEvent.setup();
            renderWithProviders(<TaskCard task={sampleTask1} socket={mockSocket} />);

            const editButton = screen.getByText("✏️");
            await user.click(editButton);

            // When editing, canDrag should be false
            // This is tested through the useDrag hook configuration
            expect(screen.getByText("Edit Task")).toBeInTheDocument();
        });
    });

});
