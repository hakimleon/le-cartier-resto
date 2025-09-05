
"use client"

import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useMemo } from "react";

const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", 
    "#AF19FF", "#FFC0CB", "#FF6347"
];

interface CategoryChartProps {
  data: { name: string; value: number }[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((item, index) => {
        config[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length]
        }
    });
    return config;
  }, [data]);

  if(data.length === 0){
    return (
        <div className="flex h-[350px] w-full items-center justify-center">
            <p className="text-muted-foreground">Aucune donnée à afficher.</p>
        </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Legend 
            verticalAlign="bottom" 
            height={48} 
            iconType="circle"
            layout="horizontal"
            align="center"
            wrapperStyle={{
                fontSize: '12px',
                paddingLeft: '20px', // Add some padding
                paddingRight: '20px'
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={60}
            paddingAngle={2}
            labelLine={false}
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              percent,
            }) => {
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5
              const x = cx + (radius + 15) * Math.cos(-midAngle * (Math.PI / 180))
              const y = cy + (radius + 15) * Math.sin(-midAngle * (Math.PI / 180))
              
              return (
                <text
                  x={x}
                  y={y}
                  fill="hsl(var(--foreground))"
                  textAnchor={x > cx ? "start" : "end"}
                  dominantBaseline="central"
                  className="text-xs font-medium"
                >
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              )
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || '#CCCCCC'} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
