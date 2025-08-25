"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

const GAUGE_COLORS = {
    low: "hsl(var(--chart-5))",    // Red-ish
    medium: "hsl(var(--chart-4))", // Yellow-ish
    high: "hsl(var(--chart-1))",   // Green-ish
};

interface GaugeChartProps {
  value: number; // The main value (0 to 100)
  label: string;
  unit: string;
}

export function GaugeChart({ value, label, unit }: GaugeChartProps) {
    const chartConfig = {
        value: {
          label: "Marge",
        },
        low: {
          label: "Faible",
          color: GAUGE_COLORS.low,
        },
        medium: {
          label: "Moyenne",
          color: GAUGE_COLORS.medium,
        },
        high: {
          label: "Élevée",
          color: GAUGE_COLORS.high,
        },
    } satisfies ChartConfig

    const getLevel = (v: number) => {
        if (v < 60) return "low";
        if (v < 75) return "medium";
        return "high";
    }

    const level = getLevel(value);
    const fillColor = GAUGE_COLORS[level];

    const chartData = [
        { name: "value", value: value, fill: fillColor },
        { name: "background", value: 100 - value, fill: "hsl(var(--muted))" },
    ];

    return (
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
    )
}
