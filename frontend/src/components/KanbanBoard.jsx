import React, { useEffect, useState,useMemo } from "react";
import { socket } from "../socket";

const COLUMNS = [
  { key: "todo", title: "To Do" },
  { key: "inprogress", title: "In Progress" },
  { key: "done", title: "Done" },
];

function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Group tasks by status.
  const TasksByStatus = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === "todo"),
      inprogress: tasks.filter((t) => t.status === "inprogress"),
      done: tasks.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  useEffect(() => {
    const onConnect = () => {
      console.log("Connected:", socket.id);
      socket.emit("sync:tasks");
    };

    const onSyncTasks = (serverTasks) => {
      setTasks(serverTasks);
      setLoading(false);
    };

    socket.on("connect", onConnect);
    socket.on("sync:tasks", onSyncTasks);

    return () => {
      socket.off("connect", onConnect);
      socket.off("sync:tasks", onSyncTasks);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px" }} >
        <h2>Kanban Board</h2>
        <p>Loading tasks from server...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Kanban Board</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            style={{
              background: "#f4f4f4",
              borderRadius: "10px",
              padding: "12px",
              minHeight: "400px",
            }}
          >
            <h3 style={{ marginBottom: "12px" }}>
              {col.title} ({TasksByStatus[col.key].length})
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {TasksByStatus[col.key].map((task) => (
                <div
                  key={task.id}
                  style={{
                    background: "white",
                    borderRadius: "8px",
                    padding: "10px",
                    border: "1px solid #ddd",
                  }}
                >
                  <h4 style={{ margin: 0 }}>{task.title}</h4>

                  {task.description && (
                    <p style={{ margin: "6px 0", fontSize: "14px" }}>
                      {task.description}
                    </p>
                  )}

                  <p style={{ margin: 0, fontSize: "13px", color: "#444" }}>
                    <b>Priority:</b> {task.priority} | <b>Category:</b> {task.category}
                  </p>
                </div>
              ))}

              {TasksByStatus[col.key].length === 0 && (
                <p style={{ fontSize: "14px", color: "#666" }}>
                  No tasks here.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KanbanBoard;
