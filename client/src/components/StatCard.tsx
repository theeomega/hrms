import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp }: StatCardProps) {
  return (
    <Card className="p-6 hover-elevate transition-all duration-200 border-l-4 border-l-primary">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trendUp ? 'text-secondary' : 'text-accent'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Icon className="w-7 h-7 text-primary" />
        </div>
      </div>
    </Card>
  );
}
