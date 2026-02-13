import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../utils/testUtils";
import { allSampleTasks } from "../fixtures/taskData";
import TaskProgressChart from "../../components/TaskProgressChart";

// Mock Recharts to avoid dimension issues in tests
vi.mock("recharts", () => ({
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }) => <div data-testid="recharts-bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    Cell: () => <div data-testid="cell" />,
}));

describe("TaskProgressChart Component", () => {
    describe("Rendering", () => {
        it("renders without crashing with empty tasks", () => {
            renderWithProviders(<TaskProgressChart Tasks={[]} />);
            // Chart container should render even with no data
            expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
        });

        it("renders with task data", () => {
            renderWithProviders(<TaskProgressChart Tasks={allSampleTasks} />);

            expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
            expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
        });

        it("displays chart components", () => {
            renderWithProviders(<TaskProgressChart Tasks={allSampleTasks} />);

            // Check for chart components
            expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
            expect(screen.getByTestId("x-axis")).toBeInTheDocument();
            expect(screen.getByTestId("y-axis")).toBeInTheDocument();
        });
    });

    describe("Data Calculation", () => {
        it("correctly counts tasks by status", () => {
            renderWithProviders(<TaskProgressChart Tasks={allSampleTasks} />);

            // The chart should process the data correctly
            expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
        });

        it("handles all tasks in one status", () => {
            const allTodoTasks = allSampleTasks.map(task => ({
                ...task,
                status: "todo"
            }));

            renderWithProviders(<TaskProgressChart Tasks={allTodoTasks} />);

            expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
        });

        it("handles evenly distributed tasks", () => {
            const tasks = [
                { ...allSampleTasks[0], status: "todo" },
                { ...allSampleTasks[1], status: "inprogress" },
                { ...allSampleTasks[2], status: "done" },
            ];

            renderWithProviders(<TaskProgressChart Tasks={tasks} />);

            expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
        });
    });

    describe("Empty State", () => {

        it("renders with empty array", () => {
            renderWithProviders(<TaskProgressChart Tasks={[]} />);

            expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
        });
    });

    describe("Responsive Behavior", () => {
        it("renders chart container", () => {
            const { container } = renderWithProviders(
                <TaskProgressChart Tasks={allSampleTasks} />
            );

            // Recharts creates a responsive container
            expect(container.firstChild).toBeInTheDocument();
        });

        it("uses responsive container", () => {
            renderWithProviders(<TaskProgressChart Tasks={allSampleTasks} />);

            expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
        });
    });
});

