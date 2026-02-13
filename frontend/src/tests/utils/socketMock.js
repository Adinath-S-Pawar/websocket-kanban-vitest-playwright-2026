import { vi } from "vitest";

/**
 * Creates a mock socket.io-client instance for testing
 * @returns {Object} Mock socket with event emitter functionality
 */
export function createMockSocket() {
    const eventHandlers = new Map();
    const emittedEvents = [];

    const socket = {
        id: "mock-socket-id",
        connected: false,

        // Register event listener
        on: vi.fn((event, handler) => {
            if (!eventHandlers.has(event)) {
                eventHandlers.set(event, []);
            }
            eventHandlers.get(event).push(handler);
        }),

        // Remove event listener
        off: vi.fn((event, handler) => {
            if (!eventHandlers.has(event)) return;

            if (handler) {
                const handlers = eventHandlers.get(event);
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            } else {
                eventHandlers.delete(event);
            }
        }),

        // Emit event to server (tracked for assertions)
        emit: vi.fn((event, data) => {
            emittedEvents.push({ event, data, timestamp: Date.now() });
        }),

        // Simulate receiving event from server
        simulateEvent: (event, data) => {
            const handlers = eventHandlers.get(event);
            if (handlers) {
                handlers.forEach((handler) => handler(data));
            }
        },

        // Connect the socket
        connect: vi.fn(() => {
            socket.connected = true;
            socket.simulateEvent("connect");
        }),

        // Disconnect the socket
        disconnect: vi.fn(() => {
            socket.connected = false;
            socket.simulateEvent("disconnect");
        }),

        // Helper methods for testing
        getEmittedEvents: () => emittedEvents,
        getEmittedEventsByType: (event) =>
            emittedEvents.filter((e) => e.event === event),
        clearEmittedEvents: () => {
            emittedEvents.length = 0;
        },
        getEventHandlers: (event) => eventHandlers.get(event) || [],
        clearAllHandlers: () => {
            eventHandlers.clear();
        },
    };

    return socket;
}

/**
 * Creates multiple mock sockets to simulate multi-client scenarios
 * @param {number} count - Number of mock clients to create
 * @returns {Array} Array of mock sockets
 */
export function createMultipleMockSockets(count = 2) {
    return Array.from({ length: count }, (_, i) => {
        const socket = createMockSocket();
        socket.id = `mock-socket-${i + 1}`;
        return socket;
    });
}
