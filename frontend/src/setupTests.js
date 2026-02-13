import "@testing-library/jest-dom";
import { vi } from "vitest";

// Robust global mock for socket.io-client
vi.mock("socket.io-client", () => {
    const eventHandlers = new Map();
    const emittedEvents = [];

    const mockSocket = {
        id: "global-mock-socket",
        connected: true,
        on: vi.fn((event, handler) => {
            if (!eventHandlers.has(event)) eventHandlers.set(event, []);
            eventHandlers.get(event).push(handler);
            return mockSocket;
        }),
        off: vi.fn((event, handler) => {
            if (!eventHandlers.has(event)) return mockSocket;
            if (handler) {
                const handlers = eventHandlers.get(event);
                const idx = handlers.indexOf(handler);
                if (idx > -1) handlers.splice(idx, 1);
            } else {
                eventHandlers.delete(event);
            }
            return mockSocket;
        }),
        emit: vi.fn((event, data) => {
            emittedEvents.push({ event, data, timestamp: Date.now() });
            return mockSocket;
        }),
        connect: vi.fn(() => {
            mockSocket.connected = true;
            return mockSocket;
        }),
        disconnect: vi.fn(() => {
            mockSocket.connected = false;
            return mockSocket;
        }),
        simulateEvent: (event, data) => {
            const handlers = eventHandlers.get(event);
            if (handlers) handlers.forEach(h => h(data));
        },
        clear: () => {
            eventHandlers.clear();
            emittedEvents.length = 0;
            mockSocket.on.mockClear();
            mockSocket.off.mockClear();
            mockSocket.emit.mockClear();
        }
    };

    const ioMock = vi.fn(() => mockSocket);
    return {
        io: ioMock,
        default: ioMock,
    };
});
