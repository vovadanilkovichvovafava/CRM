'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, DollarSign, CheckSquare, TrendingUp, TrendingDown } from 'lucide-react';

const stats = [
  {
    title: 'Total Contacts',
    value: '2,847',
    change: '+12%',
    trend: 'up',
    icon: Users,
    color: '#3B82F6',
  },
  {
    title: 'Companies',
    value: '423',
    change: '+8%',
    trend: 'up',
    icon: Building2,
    color: '#10B981',
  },
  {
    title: 'Open Deals',
    value: '$1.2M',
    change: '+23%',
    trend: 'up',
    icon: DollarSign,
    color: '#F59E0B',
  },
  {
    title: 'Tasks Due',
    value: '18',
    change: '-5%',
    trend: 'down',
    icon: CheckSquare,
    color: '#8B5CF6',
  },
];

const recentActivities = [
  { id: 1, action: 'New contact added', name: 'John Smith', time: '5 minutes ago' },
  { id: 2, action: 'Deal moved to Negotiation', name: 'Enterprise License', time: '15 minutes ago' },
  { id: 3, action: 'Task completed', name: 'Follow up with client', time: '1 hour ago' },
  { id: 4, action: 'New webmaster registered', name: 'TrafficKing', time: '2 hours ago' },
  { id: 5, action: 'Meeting scheduled', name: 'Product Demo', time: '3 hours ago' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here is your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span
                  className={
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {stat.trend === 'up' ? (
                    <TrendingUp className="mr-1 inline h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 inline h-3 w-3" />
                  )}
                  {stat.change}
                </span>{' '}
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center gap-2 rounded-lg border p-3 text-left text-sm hover:bg-accent">
                <Users className="h-4 w-4 text-blue-500" />
                Add Contact
              </button>
              <button className="flex items-center gap-2 rounded-lg border p-3 text-left text-sm hover:bg-accent">
                <Building2 className="h-4 w-4 text-green-500" />
                Add Company
              </button>
              <button className="flex items-center gap-2 rounded-lg border p-3 text-left text-sm hover:bg-accent">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                Create Deal
              </button>
              <button className="flex items-center gap-2 rounded-lg border p-3 text-left text-sm hover:bg-accent">
                <CheckSquare className="h-4 w-4 text-purple-500" />
                Add Task
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
