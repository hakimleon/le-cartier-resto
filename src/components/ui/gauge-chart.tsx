
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"
import { Star, CheckCircle2, AlertTriangle, ShieldAlert, CircleX } from 'lucide-react';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const GAUGE_LEVELS = {
    exceptionnel: { label: "Exceptionnel", color: "hsl(var(--chart-1))", icon: Star },
    excellent: { label: "Excellent", color: "hsl(var(--chart-2))", icon: CheckCircle2 },
    bon: { label: "Bon", color: "hsl(var(--chart-3))", icon: ShieldAlert },
    moyen: { label: "Moyen", color: "hsl(var(--chart-4))", icon: AlertTriangle },
    mauvais: { label: "Mauvais", color: "hsl(var(--chart-5))", icon: CircleX },
};

type GaugeLevel = keyof typeof GAUGE_LEVELS;

interface GaugeChartProps {
  value: number; // The main value (0 to 100)
  label: string;
  unit: string;
}

export function GaugeChart({ value, label, unit }: GaugeChartProps) {
    const chartConfig = Object.entries(GAUGE_LEVELS).reduce((acc, [key, val]) => {
        acc[key as GaugeLevel] = { label: val.label, color: val.color };
        return acc;
    }, {} as ChartConfig);

    const getLevel = (v: number): GaugeLevel => {
        if (v < 25) return "exceptionnel";
        if (v < 30) return "excellent";
        if (v < 35) return "bon";
        if (v < 40) return "moyen";
        return "mauvais";
    }

    const level = getLevel(value);
    const fillColor = GAUGE_LEVELS[level].color;

    const chartData = [
        { name: level, value: value, fill: fillColor },
        { name: "background", value: 100 - value, fill: "hsl(var(--muted))" },
    ];
    
    return (
        <div className="flex flex-col items-center">
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
                        strokeWidth={0}
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

    