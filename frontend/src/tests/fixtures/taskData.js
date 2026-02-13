/**
 * Sample task data for testing
 */

export const sampleTask1 = {
    id: "task-1",
    title: "Implement login feature",
    description: "Add user authentication with JWT",
    status: "todo",
    priority: "high",
    category: "feature",
    attachments: [],
    createdAt: 1707739200000,
    updatedAt: 1707739200000,
};

export const sampleTask2 = {
    id: "task-2",
    title: "Fix navigation bug",
    description: "Navigation menu not responsive on mobile",
    status: "inprogress",
    priority: "medium",
    category: "bug",
    attachments: [
        {
            name: "screenshot.png",
            type: "image/png",
            url: "blob:http://localhost:3000/mock-url-1",
        },
    ],
    createdAt: 1707739300000,
    updatedAt: 1707739400000,
};

export const sampleTask3 = {
    id: "task-3",
    title: "Update documentation",
    description: "Add API documentation for new endpoints",
    status: "done",
    priority: "low",
    category: "enhancement",
    attachments: [],
    createdAt: 1707739500000,
    updatedAt: 1707739600000,
};

export const sampleTask4 = {
    id: "task-4",
    title: "Optimize database queries",
    description: "",
    status: "todo",
    priority: "medium",
    category: "enhancement",
    attachments: [
        {
            name: "performance-report.pdf",
            type: "application/pdf",
            url: "blob:http://localhost:3000/mock-url-2",
        },
        {
            name: "diagram.png",
            type: "image/png",
            url: "blob:http://localhost:3000/mock-url-3",
        },
    ],
    createdAt: 1707739700000,
    updatedAt: 1707739700000,
};

export const allSampleTasks = [
    sampleTask1,
    sampleTask2,
    sampleTask3,
    sampleTask4,
];

/**
 * Helper function to create a new task with custom properties
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Task object
 */
export function createMockTask(overrides = {}) {
    return {
        id: `task-${Date.now()}`,
        title: "Test Task",
        description: "Test Description",
        status: "todo",
        priority: "low",
        category: "feature",
        attachments: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides,
    };
}

/**
 * Get tasks filtered by status
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered tasks
 */
export function getTasksByStatus(status) {
    return allSampleTasks.filter((task) => task.status === status);
}

/**
 * Sample task creation payload
 */
export const newTaskPayload = {
    title: "New Test Task",
    description: "This is a new task for testing",
    status: "todo",
    priority: "medium",
    category: "feature",
    attachments: [],
};

/**
 * Sample task update payload
 */
export const taskUpdatePayload = {
    id: "task-1",
    updates: {
        title: "Updated Task Title",
        description: "Updated description",
        priority: "high",
    },
};
