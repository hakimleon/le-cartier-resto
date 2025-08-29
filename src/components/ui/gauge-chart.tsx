"use client"

import * as React from "react"
import { Star, CheckCircle2, Shield, AlertTriangle, CircleX } from 'lucide-react';
import { cn } from "@/lib/utils";

const GAUGE_LEVELS = {
    exceptionnel: { label: "Exceptionnel", color: "hsl(var(--chart-1))", icon: Star },
    excellent: { label: "Excellent", color: "hsl(var(--chart-2))", icon: CheckCircle2 },
    bon: { label: "Bon", color: "hsl(var(--chart-3))", icon: Shield },
    moyen: { label: "Moyen", color: "hsl(var(--chart-4))", icon: AlertTriangle },
    mauvais: { label: "Mauvais", color: "hsl(var(--chart-5))", icon: CircleX },
};

type GaugeLevel = keyof typeof GAUGE_LEVELS;

interface GaugeChartProps {
  value: number;
  label: string;
  unit: string;
}

export function GaugeChart({ value, label, unit }: GaugeChartProps) {
    const getLevel = (v: number): GaugeLevel => {
        if (v < 25) return "exceptionnel";
        if (v < 30) return "excellent";
        if (v < 35) return "bon";
        if (v < 40) return "moyen";
        return "mauvais";
    }

    const validValue = isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
    const level = getLevel(validValue);
    const levelInfo = GAUGE_LEVELS[level];
    const LevelIcon = levelInfo.icon;
    
    // Conic gradient requires angles. We map 0-100 to 0-180 degrees.
    const fillPercentage = validValue;
    const gaugeColor = levelInfo.color;
    const emptyColor = "hsl(var(--muted))";

    return (
        <div className="flex w-full max-w-[220px] flex-col items-center gap-2">
            <div
                className="relative h-[110px] w-[220px] overflow-hidden"
            >
                {/* The gauge itself, using conic-gradient */}
                <div
                    className="absolute top-0 left-0 w-full h-[220px] rounded-full"
                    style={{
                        background: `conic-gradient(
                            from -90deg,
                            ${gaugeColor} 0% ${fillPercentage}%, 
                            ${emptyColor} ${fillPercentage}% 100%
                        )`,
                    }}
                ></div>
                
                {/* Center Mask to create the donut shape */}
                <div
                    className="absolute top-[12px] left-[12px] w-[196px] h-[196px] rounded-full bg-card"
                ></div>

                {/* Cover for the bottom half to create a semi-circle */}
                <div
                    className="absolute bottom-0 left-0 w-full h-1/2 bg-card"
                ></div>

                {/* Text Content */}
                <div className="absolute bottom-0 left-0 flex w-full flex-col items-center justify-end pb-2 h-full z-10">
                    <span className="text-3xl font-bold">{validValue.toFixed(0)}<span className="text-xl font-semibold text-muted-foreground">{unit}</span></span>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </div>
            <div className={cn("flex items-center gap-2 text-sm font-medium", `text-[${gaugeColor}]`)}>
                <LevelIcon className="h-4 w-4" style={{color: gaugeColor}} />
                <span style={{color: gaugeColor}}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
            </div>
        </div>
    )
}
