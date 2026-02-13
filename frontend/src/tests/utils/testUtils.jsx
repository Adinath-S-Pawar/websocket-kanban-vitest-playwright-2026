import { render } from "@testing-library/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Additional render options
 * @returns {Object} - Render result from @testing-library/react
 */
export function renderWithProviders(ui, options = {}) {
    const Wrapper = ({ children }) => (
        <DndProvider backend={HTML5Backend}>{children}</DndProvider>
    );

    return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
export const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create a mock socket emit function that tracks calls
 * @returns {Object} - Mock emit function with call tracking
 */
export function createMockEmit() {
    const calls = [];
    const emit = vi.fn((event, data) => {
        calls.push({ event, data, timestamp: Date.now() });
    });

    emit.getCalls = () => calls;
    emit.getCallsByEvent = (event) => calls.filter(c => c.event === event);
    emit.clear = () => calls.length = 0;

    return emit;
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
