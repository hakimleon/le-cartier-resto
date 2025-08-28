
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
    
    const legendData: {level: GaugeLevel; range: string, description: string }[] = [
        { level: 'exceptionnel', range: '< 25%', description: 'Performance rare. Maîtrise parfaite ou prix très élevés.' },
        { level: 'excellent', range: '25-30%', description: 'Performance optimale. Très bonne maîtrise des coûts.' },
        { level: 'bon', range: '30-35%', description: 'Performance correcte. Standard du secteur.' },
        { level: 'moyen', range: '35-40%', description: 'Acceptable mais perfectible. Surveillance requise.' },
        { level: 'mauvais', range: '> 40%', description: 'Gestion défaillante. Action corrective urgente.' },
    ]

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
            <div className="w-full mt-4 space-y-2 text-xs text-muted-foreground">
                {legendData.map(item => {
                    const Icon = GAUGE_LEVELS[item.level].icon;
                    return (
                        <div key={item.level} className="flex items-start gap-2">
                             <Icon className="h-3 w-3 mt-0.5 shrink-0" style={{color: GAUGE_LEVELS[item.level].color}}/>
                             <div>
                                <span className="font-semibold text-foreground">{item.range}</span> - <span className="font-medium">{GAUGE_LEVELS[item.level].label}:</span> {item.description}
                             </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
