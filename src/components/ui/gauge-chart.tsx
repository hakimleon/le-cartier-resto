"use client"

import * as React from "react"
import { Star, CheckCircle2, Shield, AlertTriangle, CircleX } from 'lucide-react';
import { cn } from "@/lib/utils";

const GAUGE_LEVELS = {
    exceptionnel: { label: "Exceptionnel (<25%)", color: "from-chart-1 to-chart-1", textColor: "text-chart-1", icon: Star },
    excellent: { label: "Excellent (25-30%)", color: "from-chart-2 to-chart-2", textColor: "text-chart-2", icon: CheckCircle2 },
    bon: { label: "Bon (30-35%)", color: "from-chart-3 to-chart-3", textColor: "text-chart-3", icon: Shield },
    moyen: { label: "Moyen (35-40%)", color: "from-chart-4 to-chart-4", textColor: "text-chart-4", icon: AlertTriangle },
    mauvais: { label: "Mauvais (>40%)", color: "from-chart-5 to-chart-5", textColor: "text-chart-5", icon: CircleX },
};

type GaugeLevel = keyof typeof GAUGE_LEVELS;

interface GaugeChartProps {
  value: number; // The main value (e.g. food cost percentage)
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
    // Map value (0-100) to an angle (0-180 degrees) for rotation.
    const rotation = validValue * 1.8;

    return (
        <div className="flex w-full max-w-[220px] flex-col items-center gap-2">
            <div
                className="relative h-[110px] w-[220px]"
            >
                {/* Background Arc */}
                <div
                    className="absolute inset-0 rounded-t-full border-[24px] border-muted border-b-0"
                ></div>
                
                {/* Filler Arc */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-t-full border-[24px] border-b-0 border-r-transparent border-l-transparent bg-gradient-to-r",
                        levelInfo.color
                    )}
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: 'bottom center',
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)' // Clip to only show top half
                    }}
                ></div>

                {/* Cover for rotation artifact at 0% */}
                {validValue < 1 &&
                    <div className="absolute bottom-0 left-0 h-[24px] w-1/2 bg-muted"></div>
                }
                {/* Cover for rotation artifact at 100% */}
                {validValue > 99 &&
                    <div className="absolute bottom-0 right-0 h-[24px] w-1/2 bg-transparent"></div>
                }
                
                {/* Center Mask */}
                <div
                    className="absolute inset-[12px] rounded-t-full bg-card"
                ></div>

                {/* Text Content */}
                <div className="absolute bottom-0 left-0 flex w-full flex-col items-center justify-end pb-2 h-2/3">
                    <span className="text-3xl font-bold">{validValue.toFixed(0)}<span className="text-xl font-semibold text-muted-foreground">{unit}</span></span>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </div>
            <div className={cn("flex items-center gap-2 text-sm font-medium", levelInfo.textColor)}>
                <LevelIcon className="h-4 w-4" />
                <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
            </div>
        </div>
    )
}
