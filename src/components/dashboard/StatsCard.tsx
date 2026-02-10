import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    trend?: {
        value: string;
        isUp: boolean;
        label: string;
    };
    iconClassName?: string;
    iconContainerClassName?: string;
    children?: React.ReactNode; // For extra content like avatars
}

export function StatsCard({
    icon: Icon,
    label,
    value,
    trend,
    iconClassName = "text-green-600",
    iconContainerClassName = "bg-green-100",
    children
}: StatsCardProps) {
    return (
        <div className="bg-white p-6 rounded-[30px] shadow-sm flex items-center gap-6 min-w-[250px]">
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shrink-0", iconContainerClassName)}>
                <Icon className={cn("w-8 h-8", iconClassName)} />
            </div>

            <div className="flex-1">
                <p className="text-sm text-slate-400 font-medium mb-1">{label}</p>
                <h3 className="text-3xl font-bold text-slate-900 mb-1">{value}</h3>

                {trend && (
                    <div className="flex items-center text-xs font-bold">
                        <span className={cn("flex items-center gap-1 mr-1", trend.isUp ? "text-[#16c098]" : "text-[#df0404]")}>
                            {trend.isUp ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            {trend.value}
                        </span>
                        <span className="text-slate-900 font-normal">{trend.label}</span>
                    </div>
                )}

                {children}
            </div>
        </div>
    );
}
