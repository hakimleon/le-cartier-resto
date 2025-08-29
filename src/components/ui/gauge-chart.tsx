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
    
    // Angle from -90deg (start) to 90deg (end)
    const angle = (validValue / 100) * 180 - 90;

    return (
        <div className="flex w-full max-w-[200px] flex-col items-center gap-2">
            <div
                className="relative h-[100px] w-[200px] overflow-hidden"
            >
                {/* Background Arc */}
                <div 
                    className="absolute h-[100px] w-[200px] rounded-t-full border-[16px] border-b-0 border-muted"
                ></div>
                
                {/* Value Arc - This is a container that rotates, with the color on one side */}
                <div 
                    className="absolute h-[100px] w-[200px]"
                    style={{
                        transform: `rotate(${angle}deg)`,
                        transformOrigin: '50% 100%',
                    }}
                >
                    <div 
                        className="absolute h-[100px] w-[200px] rounded-t-full border-[16px] border-b-0 border-r-[16px]"
                        style={{
                            borderColor: gaugeColor,
                            clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
                        }}
                    ></div>
                </div>

                {/* Cover for the center part to create the donut effect */}
                <div className="absolute bottom-0 left-[16px] right-[16px] top-[16px] bg-card rounded-t-full"></div>


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
