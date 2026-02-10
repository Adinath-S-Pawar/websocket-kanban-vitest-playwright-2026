import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function TaskProgressChart({ Tasks }) {
  const ChartData = useMemo(() => {
    const TodoCount = Tasks.filter((t) => t.status === "todo").length;
    const InProgressCount = Tasks.filter((t) => t.status === "inprogress").length;
    const DoneCount = Tasks.filter((t) => t.status === "done").length;

    return [
      { name: "To Do", count: TodoCount },
      { name: "In Progress", count: InProgressCount },
      { name: "Done", count: DoneCount },
    ];
  }, [Tasks]);

  const Completion = useMemo(() => {
    const Total = Tasks.length;
    const Done = Tasks.filter((t) => t.status === "done").length;

    if (Total === 0) return 0;
    return Math.round((Done / Total) * 100);
  }, [Tasks]);

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3 style={{ marginBottom: "8px" }}>Task Progress</h3>

      <p style={{ marginBottom: "10px" }}>
        Completion: <b>{Completion}%</b>
      </p>

      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <BarChart data={ChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
