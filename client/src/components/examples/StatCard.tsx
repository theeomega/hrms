import StatCard from '../StatCard';
import { Users } from 'lucide-react';

export default function StatCardExample() {
  return <StatCard title="Total Employees" value={248} icon={Users} trend="+12% from last month" trendUp={true} />;
}
