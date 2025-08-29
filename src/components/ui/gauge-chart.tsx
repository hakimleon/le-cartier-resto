"use client"

import * as React from "react"
import { Star, CheckCircle2, Shield, AlertTriangle, CircleX } from 'lucide-react';
import { cn } from "@/lib/utils";

const GAUGE_LEVELS = {
    exceptionnel: { label: "Exceptionnel (<25%)", color: "bg-green-600", textColor: "text-green-600", icon: Star },
    excellent: { label: "Excellent (25-30%)", color: "bg-lime-500", textColor: "text-lime-500", icon: CheckCircle2 },
    bon: { label: "Bon (30-35%)", color: "bg-yellow-400", textColor: "text-yellow-400", icon: Shield },
    moyen: { label: "Moyen (35-40%)", color: "bg-orange-500", textColor: "text-orange-500", icon: AlertTriangle },
    mauvais: { label: "Mauvais (>40%)", color: "bg-red-600", textColor: "text-red-600", icon: CircleX },
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
    const rotation = Math.min(180, Math.max(0, validValue * 1.8)); // map 0-100 to 0-180 degrees

    return (
        <div className="flex w-full max-w-xs flex-col items-center gap-4 p-4">
            <div className="relative h-28 w-56 overflow-hidden">
                {/* Background arc */}
                <div className="absolute left-0 top-0 h-full w-full rounded-t-full border-[24px] border-b-0 border-gray-200"></div>

                {/* Foreground arc */}
                <div className="absolute left-0 top-0 h-full w-full overflow-hidden">
                    <div
                        className={cn(
                            "absolute left-[-50%] top-0 h-full w-full origin-[100%_100%] rounded-t-full border-[24px] border-b-0 border-r-[24px] border-transparent transition-transform duration-500",
                            levelInfo.color
                        )}
                        style={{ transform: `rotate(${rotation}deg)` }}
                    ></div>
                </div>

                {/* Center circle */}
                <div className="absolute bottom-0 left-1/2 flex h-28 w-56 -translate-x-1/2 items-start justify-center">
                     <div className="flex h-full w-full items-center justify-center rounded-t-full bg-card pt-4 text-center">
                        <div>
                            <span className="text-4xl font-bold">{validValue.toFixed(0)}</span>
                            <span className="text-xl font-semibold text-muted-foreground">{unit}</span>
                            <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                     </div>
                </div>
            </div>
             <div className={cn("flex items-center gap-2 text-sm font-medium", levelInfo.textColor)}>
                <LevelIcon className="h-4 w-4" />
                <span>{levelInfo.label}</span>
            </div>
        </div>
    )
}