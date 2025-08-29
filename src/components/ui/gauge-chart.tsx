"use client"

import * as React from "react"
import { Star, CheckCircle2, Shield, AlertTriangle, CircleX } from 'lucide-react';
import { cn } from "@/lib/utils";

const GAUGE_LEVELS = {
    exceptionnel: { label: "Exceptionnel (<25%)", color: "bg-chart-1", textColor: "text-chart-1", icon: Star },
    excellent: { label: "Excellent (25-30%)", color: "bg-chart-2", textColor: "text-chart-2", icon: CheckCircle2 },
    bon: { label: "Bon (30-35%)", color: "bg-chart-3", textColor: "text-chart-3", icon: Shield },
    moyen: { label: "Moyen (35-40%)", color: "bg-chart-4", textColor: "text-chart-4", icon: AlertTriangle },
    mauvais: { label: "Mauvais (>40%)", color: "bg-chart-5", textColor: "text-chart-5", icon: CircleX },
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
        <div className="flex w-full max-w-[220px] flex-col items-center gap-2">
            <div className="relative h-[110px] w-[220px] overflow-hidden">
                {/* Background arc */}
                <div className="absolute left-0 top-0 h-full w-full rounded-t-[110px] border-[24px] border-b-0 border-muted z-0"></div>

                {/* Foreground arc container */}
                <div 
                    className="absolute left-0 top-0 h-full w-full z-10"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <div className={cn("absolute left-0 top-0 h-full w-1/2 origin-right rounded-l-full", levelInfo.color)}></div>
                </div>

                {/* Center mask to create the donut effect */}
                <div className="absolute left-[12px] top-[12px] h-[98px] w-[196px] rounded-t-[98px] bg-card z-20"></div>

                 {/* Text Content */}
                <div className="absolute bottom-0 left-0 w-full h-[65px] flex flex-col items-center justify-center z-30">
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
