import React from "react";
import { useDrop } from "react-dnd";
import TaskCard from "./TaskCard";
import styles from "./Column.module.css";

export default function Column({ column, tasks, socket }) {
  const [{ IsOver }, dropRef] = useDrop(() => ({
    accept: "TASK",
    drop: (DraggedItem) => {
      if (!DraggedItem?.id) return;
      if (DraggedItem?.isEditing) return;

      socket.emit("task:move", {
        id: DraggedItem.id,
        newStatus: column.key,
      });
    },
    collect: (monitor) => ({
      IsOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={dropRef}
      className={`${styles.column} ${IsOver ? styles.columnHover : ""}`}
    >
      <h3 className={styles.columnTitle}>{column.title}</h3>

      <div className={styles.taskList}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} socket={socket} />
        ))}
      </div>
    </div>
  );
}
