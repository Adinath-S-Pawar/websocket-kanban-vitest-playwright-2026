const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let tasks = [];

// Create unique id
function GenerateId() {
  return crypto.randomUUID();
}

// Validate status
function IsValidStatus(status) {
  return ["todo", "inprogress", "done"].includes(status);
}

// Validate priority
function IsValidPriority(priority) {
  return ["low", "medium", "high"].includes(priority);
}

io.on("connection", (socket) => {
  console.log("A user connected :", socket.id);

  // WebSocket events for task management

  // Send all tasks to newly connected client
  socket.on("sync:tasks", () => {
    socket.emit("sync:tasks", tasks);
  });

  // Create new task
  socket.on("task:create", (payload) => {
    try {
      if (!payload?.title || payload.title.trim().length === 0) {
        return;
      }

      const newTask = {

        id: generateId(),
        title: payload.title.trim(),
        description: payload.description?.trim() || "",
        status: IsValidStatus(payload.status) ? payload.status : "todo",
        priority: IsValidPriority(payload.priority) ? payload.priority : "low",
        category: payload.category?.trim() || "general",
        attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      tasks.push(newTask);

      // Broadcast updated tasks to all clients
      io.emit("sync:tasks", tasks);
    } catch (err) {
      console.error("task:create error:", err);
    }
  });

  // Update task
  socket.on("task:update", (payload) => {
    try {
      const { id, updates } = payload || {};
      if (!id || !updates) return;

      const taskIndex = tasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) return;

      const task = tasks[taskIndex];

      // Only update allowed fields
      if (typeof updates.title === "string") {
        task.title = updates.title.trim();
      }

      if (typeof updates.description === "string") {
        task.description = updates.description.trim();
      }

      if (typeof updates.category === "string") {
        task.category = updates.category.trim();
      }

      if (typeof updates.status === "string" && isValidStatus(updates.status)) {
        task.status = updates.status;
      }

      if (typeof updates.priority === "string" && isValidPriority(updates.priority)) {
        task.priority = updates.priority;
      }

      if (Array.isArray(updates.attachments)) {
        task.attachments = updates.attachments;
      }

      task.updatedAt = Date.now();

      io.emit("sync:tasks", tasks);
    } catch (err) {
      console.error("task:update error:", err);
    }
  });

  // Move task between columns
  socket.on("task:move", (payload) => {
    try {
      const { id, newStatus } = payload || {};
      if (!id || !isValidStatus(newStatus)) return;

      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      task.status = newStatus;
      task.updatedAt = Date.now();

      io.emit("sync:tasks", tasks);
    } catch (err) {
      console.error("task:move error:", err);
    }
  });

  // Delete task
  socket.on("task:delete", (payload) => {
    try {
      const { id } = payload || {};
      if (!id) return;

      tasks = tasks.filter((t) => t.id !== id);

      io.emit("sync:tasks", tasks);
    } catch (err) {
      console.error("task:delete error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected :", socket.id);
  });

});

server.listen(5000, () => console.log("Server running on port 5000"));
