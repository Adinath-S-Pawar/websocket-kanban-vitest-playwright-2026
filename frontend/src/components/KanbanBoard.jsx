import React, { useEffect, useState,useMemo } from "react";
import { socket } from "../socket";
import styles from "./KanbanBoard.module.css";

const COLUMNS = [
  { key: "todo", title: "To Do" },
  { key: "inprogress", title: "In Progress" },
  { key: "done", title: "Done" },
];

function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("low");
  const [category, setCategory] = useState("Bug");

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

  function HandleCreateTask(e) {
    e.preventDefault();

    if (!title.trim()) return;

    socket.emit("task:create", {
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      status: "todo",
      attachments: [],
    });

    // Reset form
    setTitle("");
    setDescription("");
    setPriority("low");
    setCategory("Bug");
  }

  if (loading) {
    return (
      <div className={styles.kanbanContainer}>
        <h2 className={styles.kanbanHeader}>Kanban Board</h2>
        <p className={styles.loadingText}>Loading tasks from server...</p>
      </div>
    );
  }

  return (
    <div className={styles.kanbanContainer}>
      <h2 className={styles.kanbanHeader}>Kanban Board</h2>

      <form className="task-form" onSubmit={HandleCreateTask}>
        <input
          type="text"
          placeholder="Task title (required)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Bug">Bug</option>
          <option value="Feature">Feature</option>
          <option value="Enhancement">Enhancement</option>
        </select>

        <textarea
          placeholder="Task description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit" disabled={!title.trim()}>
          Add Task
        </button>
      </form>

     <div className="board-grid">
        {COLUMNS.map((col) => (
          <div className="column" key={col.key}>
            <h3 className="column-title">
              {col.title} ({TasksByStatus[col.key].length})
            </h3>

            <div className="task-list">
              {TasksByStatus[col.key].map((task) => (
                <div className="task-card" key={task.id}>
                  <h4 className="task-title">{task.title}</h4>

                  {task.description && (
                    <p className="task-desc">{task.description}</p>
                  )}

                  <p className="task-meta">
                    <b>Priority:</b> {task.priority} | <b>Category:</b>{" "}
                    {task.category}
                  </p>
                </div>
              ))}

              {TasksByStatus[col.key].length === 0 && (
                <p className="empty-text">No tasks here.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KanbanBoard;
