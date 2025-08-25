
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
    // For Food Cost: low is good (green), high is bad (red)
    good: "hsl(var(--chart-1))",      // Green
    average: "hsl(var(--chart-4))",  // Yellow
    bad: "hsl(var(--chart-5))",      // Red-ish
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
        good: {
          label: "Bon",
          color: GAUGE_COLORS.good,
        },
        average: {
          label: "Moyen",
          color: GAUGE_COLORS.average,
        },
        bad: {
          label: "Élevé",
          color: GAUGE_COLORS.bad,
        },
    } satisfies ChartConfig

    // Lower food cost is better.
    const getLevel = (v: number) => {
        if (v < 30) return "good";
        if (v < 40) return "average";
        return "bad";
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

    