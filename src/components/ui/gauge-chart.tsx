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
  label?: string;
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
    
    const gaugeColor = levelInfo.color;
    
    const gaugeRotation = (validValue / 100) * 180;

    return (
        <div className="flex w-full max-w-[200px] flex-col items-center gap-2">
            <div
                className="relative h-[100px] w-[200px] overflow-hidden"
            >
                {/* Background Arc */}
                <div className="w-full h-full rounded-t-full border-[16px] border-b-0 border-muted"></div>
                
                {/* Value Arc */}
                <div 
                    className="absolute top-0 left-0 w-full h-full rounded-t-full border-[16px] border-b-0 border-transparent border-t-primary"
                    style={{
                        borderColor: gaugeColor,
                        transform: `rotate(${gaugeRotation}deg)`,
                        transformOrigin: '50% 100%',
                        clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', // Only show top half after rotation
                    }}
                ></div>

                {/* Cover for the center part */}
                 <div className="absolute bottom-0 left-[8px] right-[8px] top-[8px] bg-card rounded-t-full"></div>


                {/* Text Content */}
                <div className="absolute bottom-0 left-0 flex w-full flex-col items-center justify-end pb-2 h-full z-10">
                    <span className="text-3xl font-bold">{validValue.toFixed(0)}<span className="text-xl font-semibold text-muted-foreground">{unit}</span></span>
                    {label && <p className="text-xs text-muted-foreground">{label}</p>}
                </div>
            </div>
            <div className={cn("flex items-center gap-2 text-sm font-medium")} style={{color: gaugeColor}}>
                <LevelIcon className="h-4 w-4" />
                <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
            </div>
        </div>
    )
}
