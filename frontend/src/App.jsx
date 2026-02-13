import React from "react";
import KanbanBoard from "./components/KanbanBoard";

function App() {
  return (
    <div className="App">
      <h1
      style={{
          textAlign: "center",
          margin: "0",
          padding: "18px 0",
          fontSize: "32px",
          fontWeight: "700",
          letterSpacing: "0.5px",
          backgroundColor: "#ffffff",
          color: "#172b4d",
          borderBottom: "1px solid #dfe1e6",
      }}
      >Real-time Kanban Board</h1>
      <KanbanBoard />
    </div>
  );
}

export default App;
