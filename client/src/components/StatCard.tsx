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
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-3">
        <div className="p-2.5 rounded-lg bg-muted">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </div>
      <div>
        <p className="text-3xl font-bold mb-1">{value}</p>
        {trend && (
          <p className={`text-sm ${trendUp ? 'text-secondary' : 'text-muted-foreground'}`}>
            {trend}
          </p>
        )}
      </div>
    </Card>
  );
}
