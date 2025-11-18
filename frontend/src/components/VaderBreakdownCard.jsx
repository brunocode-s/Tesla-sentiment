import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function VaderBreakdownCard({ vader }) {
  if (!vader) return null;

  // Ensure values are always safe numeric values
  const avgPos = Math.max(0, vader.average_pos ?? 0);
  const avgNeu = Math.max(0, vader.average_neu ?? 0);
  const avgNeg = Math.max(0, vader.average_neg ?? 0);

  const data = [
    { name: "Positive", value: avgPos },
    { name: "Neutral", value: avgNeu },
    { name: "Negative", value: avgNeg },
  ];

  const COLORS = ["#4ade80", "#a3a3a3", "#f87171"];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm w-full">
      <h3 className="text-lg font-semibold mb-2">VADER Score Breakdown</h3>

      <div className="flex items-center justify-center">
        <PieChart width={220} height={220}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
            label={
              data.every((item) => item.value === 0)
                ? false
                : true
            }
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm text-gray-600">Positive</p>
          <p className="font-bold">{avgPos.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Neutral</p>
          <p className="font-bold">{avgNeu.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Negative</p>
          <p className="font-bold">{avgNeg.toFixed(3)}</p>
        </div>
      </div>

      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          Average Compound Score
        </p>
        <p className="text-xl font-bold text-center">
          {(vader.average_compound || 0).toFixed(3)}
        </p>
      </div>
    </div>
  );
}
