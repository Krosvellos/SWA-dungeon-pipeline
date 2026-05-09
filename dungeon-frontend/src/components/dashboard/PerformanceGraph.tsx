"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DungeonRawStats } from "@/types/dashboard";

interface PerformanceGraphProps {
  stats: DungeonRawStats[];
}

const PerformanceGraph: React.FC<PerformanceGraphProps> = ({ stats }) => {
  const chartData = useMemo(() => {
    // Group stats by date and calculate aggregate win rate
    const grouped = stats.reduce((acc, curr) => {
      if (!acc[curr.date]) {
        acc[curr.date] = { date: curr.date, totalRuns: 0, successCount: 0 };
      }
      acc[curr.date].totalRuns += curr.totalRuns;
      acc[curr.date].successCount += curr.successCount;
      return acc;
    }, {} as Record<string, { date: string; totalRuns: number; successCount: number }>);

    return Object.values(grouped)
      .map((d) => ({
        date: d.date,
        winRate: Number(((d.successCount / d.totalRuns) * 100).toFixed(1)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [stats]);

  if (chartData.length === 0) return null;

  return (
    <section className="mt-8 border-t-2 border-[#332211] pt-8">
      <h2 className="text-3xl font-bold mb-8 text-[#ffd100] uppercase tracking-widest text-center" style={{ textShadow: "1px 1px 2px #000" }}>
        Win Rate Performance
      </h2>
      <div className="h-[400px] w-full p-6 rounded-md border-2 border-[#332211] bg-[#111111] shadow-lg">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#332211" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#ffd100" 
              fontSize={12} 
              tickFormatter={(str) => str.split('-').slice(1).join('/')}
            />
            <YAxis 
              stroke="#ffd100" 
              fontSize={12} 
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #332211", color: "#ffd100" }}
              itemStyle={{ color: "#ffd100" }}
              labelStyle={{ color: "#888" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="winRate"
              name="Overall Win Rate"
              stroke="#ffd100"
              strokeWidth={3}
              dot={{ fill: "#ffd100", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 8, stroke: "#ffffff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default PerformanceGraph;
