"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const GAUGE_COLORS = {
    excellent: "hsl(var(--chart-1))", // Green
    correct: "hsl(var(--chart-4))",   // Orange/Yellow
    bad: "hsl(var(--chart-5))",       // Red
};

interface GaugeChartProps {
  value: number; // The main value (0 to 100)
  label: string;
  unit: string;
}

export function GaugeChart({ value, label, unit }: GaugeChartProps) {
    const chartConfig = {
        value: {
          label: "Food Cost",
        },
        excellent: {
          label: "Excellent",
          color: GAUGE_COLORS.excellent,
        },
        correct: {
          label: "Correct",
          color: GAUGE_COLORS.correct,
        },
        bad: {
          label: "Mauvais",
          color: GAUGE_COLORS.bad,
        },
    } satisfies ChartConfig

    const getLevel = (v: number) => {
        if (v < 25) return "excellent";
        if (v <= 35) return "correct";
        return "bad";
    }

    const level = getLevel(value);
    const fillColor = GAUGE_COLORS[level];

    const chartData = [
        { name: "value", value: value, fill: fillColor },
        { name: "background", value: 100 - value, fill: "hsl(var(--muted))" },
    ];

    return (
        <div className="flex flex-col items-center gap-3 w-full">
            <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-full max-h-[250px]"
            >
                <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={80}
                        startAngle={180}
                        endAngle={0}
                        cy="80%" // Move chart down to create semi-circle
                    >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    </Pie>
                    <text
                        x="50%"
                        y="75%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-4xl font-bold"
                    >
                        {value.toFixed(0)}{unit}
                    </text>
                    <text
                        x="50%"
                        y="90%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-muted-foreground text-sm"
                    >
                        {label}
                    </text>
                </PieChart>
            </ChartContainer>
        </div>
    )
}
