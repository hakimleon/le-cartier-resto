"use client";

import { cn } from "@/lib/utils";

type FoodCostGaugeProps = {
  percentage: number;
};

const GAUGE_CIRCUMFERENCE = Math.PI * 45; // half circle: PI * r (r=45)

export function FoodCostGauge({ percentage }: FoodCostGaugeProps) {
  const value = isNaN(percentage) || !isFinite(percentage) ? 0 : percentage;

  const offset = GAUGE_CIRCUMFERENCE * (1 - Math.min(value, 100) / 100);

  const colorClass = 
    value < 25 ? "text-teal-500" :
    value <= 30 ? "text-green-500" :
    value <= 35 ? "text-yellow-500" :
    value <= 40 ? "text-orange-500" :
    "text-red-500";
  
  const bgColorClass = 
    value < 25 ? "stroke-teal-500/20" :
    value <= 30 ? "stroke-green-500/20" :
    value <= 35 ? "stroke-yellow-500/20" :
    value <= 40 ? "stroke-orange-500/20" :
    "stroke-red-500/20";
    
  const textDescription =
    value < 25 ? "⭐ Exceptionnel" :
    value <= 30 ? "🟢 Excellent" :
    value <= 35 ? "🟡 Bon" :
    value <= 40 ? "🟠 Moyen" :
    "🔴 Mauvais";


  return (
    <div className="relative flex flex-col items-center justify-center p-3 bg-muted/50 rounded-md col-span-2 md:col-span-1">
      <svg viewBox="0 0 100 57" className="w-48 h-auto -mb-2">
        {/* Background Arc */}
        <path
          d="M 5 50 A 45 45 0 0 1 95 50"
          fill="none"
          strokeWidth="10"
          className={cn("transition-all duration-500", bgColorClass)}
          strokeLinecap="round"
        />
        {/* Foreground Arc */}
        <path
          d="M 5 50 A 45 45 0 0 1 95 50"
          fill="none"
          strokeWidth="10"
          className={cn("transition-all duration-500", colorClass)}
          strokeLinecap="round"
          style={{
            strokeDasharray: GAUGE_CIRCUMFERENCE,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.5s ease-out'
          }}
        />
      </svg>
      <div className="absolute bottom-10 flex flex-col items-center">
         <span className={cn("text-2xl font-bold font-code", colorClass)}>
            {value.toFixed(1)}%
        </span>
        <p className="text-xs text-muted-foreground">Food Cost</p>
      </div>
       <p className={cn("text-sm font-semibold mt-2", colorClass)}>
        {textDescription}
      </p>
    </div>
  );
}
