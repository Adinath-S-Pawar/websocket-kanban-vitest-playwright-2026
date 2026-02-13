import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts";

const COLORS = {
  todo: "#dfe1e6",       
  inprogress: "#0079bf", 
  done: "#36b37e"        
};

export default function TaskProgressChart({ Tasks }) {
  const Data = useMemo(() => {
    return [
      { name: "To Do", count: Tasks.filter(t => t.status === "todo").length, fill: COLORS.todo },
      { name: "In Progress", count: Tasks.filter(t => t.status === "inprogress").length, fill: COLORS.inprogress },
      { name: "Done", count: Tasks.filter(t => t.status === "done").length, fill: COLORS.done },
    ];
  }, [Tasks]);

  const Completion = useMemo(() => {
    if (!Tasks.length) return 0;
    const done = Tasks.filter(t => t.status === "done").length;
    return Math.round((done / Tasks.length) * 100);
  }, [Tasks]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <h3 style={{ margin: 0, color: "#172b4d", fontSize: "18px" }}>Task Overview</h3>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#42526e" }}>
          Completion: <span style={{ color: "#36b37e" }}>{Completion}%</span>
        </span>
      </div>

      <div style={{ flexGrow: 1, minHeight: 0 }}>
      <div data-testid="bar-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={Data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebecf0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#5e6c84', fontSize: 13, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#5e6c84', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: '#f4f5f7' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              itemStyle={{ color: '#172b4d', fontWeight: 600 }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={60}>
              {Data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
}
