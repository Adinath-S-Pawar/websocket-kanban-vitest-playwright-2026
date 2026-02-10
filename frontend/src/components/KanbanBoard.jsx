import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import Column from "./Column";
import styles from "./KanbanBoard.module.css";
import TaskProgressChart from "./TaskProgressChart";

const socket = io("http://localhost:5000");

const COLUMNS = [
  { key: "todo", title: "To Do" },
  { key: "inprogress", title: "In Progress" },
  { key: "done", title: "Done" },
];

export default function KanbanBoard() {
  const [Tasks, setTasks] = useState([]);
  const [IsLoading, setIsLoading] = useState(true);

  const [Title, setTitle] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      socket.emit("sync:tasks");
    });

    socket.on("sync:tasks", (ServerTasks) => {
      setTasks(ServerTasks || []);
      setIsLoading(false);
    });

    return () => {
      socket.off("connect");
      socket.off("sync:tasks");
    };
  }, []);

  const TasksByStatus = useMemo(() => {
    return {
      todo: Tasks.filter((t) => t.status === "todo"),
      inprogress: Tasks.filter((t) => t.status === "inprogress"),
      done: Tasks.filter((t) => t.status === "done"),
    };
  }, [Tasks]);

  function HandleCreateTask(e) {
    e.preventDefault();

    if (!Title.trim()) return;

    socket.emit("task:create", {
      title: Title.trim(),
      description: "",
      status: "todo",
      priority: "low",
      category: "feature",
      attachments: [],
    });

    setTitle("");
  }

  return (
    <div className={styles.kanbanContainer}>
      <h2>Kanban Board</h2>

      <form className={styles.createForm} onSubmit={HandleCreateTask}>
        <input
          className={styles.input}
          value={Title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title..."
        />
        <button className={styles.addBtn}>Add</button>
      </form>

      {IsLoading ? (
        <p className={styles.loading}>Loading tasks from server...</p>
      ) : (
        <>
          <TaskProgressChart Tasks={Tasks} />
          
          <div className={styles.board}>
            {COLUMNS.map((col) => (
              <Column
                key={col.key}
                column={col}
                tasks={TasksByStatus[col.key]}
                socket={socket}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
