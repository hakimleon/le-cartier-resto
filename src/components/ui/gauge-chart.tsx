"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"
import { Star, CheckCircle2, Shield, AlertTriangle, CircleX } from 'lucide-react';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const GAUGE_LEVELS = {
    exceptionnel: { label: "Exceptionnel (<25%)", color: "hsl(142, 76%, 36%)", icon: Star },
    excellent: { label: "Excellent (25-30%)", color: "hsl(65, 85%, 40%)", icon: CheckCircle2 },
    bon: { label: "Bon (30-35%)", color: "hsl(48, 96%, 47%)", icon: Shield },
    moyen: { label: "Moyen (35-40%)", color: "hsl(25, 95%, 53%)", icon: AlertTriangle },
    mauvais: { label: "Mauvais (>40%)", color: "hsl(0, 84%, 60%)", icon: CircleX },
};

type GaugeLevel = keyof typeof GAUGE_LEVELS;

interface GaugeChartProps {
  value: number; // The main value (e.g. food cost percentage)
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

    const validValue = isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
    const level = getLevel(validValue);
    const fillColor = GAUGE_LEVELS[level].color;
    const LevelIcon = GAUGE_LEVELS[level].icon;

    const chartData = [
        { name: level, value: validValue, fill: fillColor },
        { name: "background", value: 100 - validValue, fill: "#e5e7eb" }, // Fixed gray color
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
                        cy="85%" // Adjusted position
                        strokeWidth={0}
                    >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    </Pie>
                    <text
                        x="50%"
                        y="75%" // Adjusted position
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-4xl font-bold"
                    >
                        {validValue.toFixed(0)}{unit}
                    </text>
                    <text
                        x="50%"
                        y="85%" // Adjusted position
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-muted-foreground text-sm"
                    >
                        {label}
                    </text>
                </PieChart>
            </ChartContainer>
            <div className="flex items-center gap-2 mt-4 text-sm font-medium" style={{ color: fillColor }}>
                <LevelIcon className="h-4 w-4" />
                <span>{GAUGE_LEVELS[level].label}</span>
            </div>
        </div>
    )
}
