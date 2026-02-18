"use client"

import { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    AreaChart,
    Area
} from 'recharts';
import { Loader2, AlertTriangle, ShieldCheck, Activity, Users, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch('/api/admin/metrics')
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch data");
                return res.json();
            })
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Failed to load dashboard data. Ensure you are an admin.");
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-screen w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-screen w-full flex-col gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium text-destructive">{error}</p>
        </div>
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Real-time overview of system security and usage.</p>
                </div>
                <Badge variant="outline" className="px-4 py-1 text-sm">
                    Live
                </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Total Requests (24h)"
                    value={data.summary.totalRequests.toLocaleString()}
                    icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                    description="Across all endpoints"
                />
                <StatsCard
                    title="Rate Limit Hits"
                    value={data.summary.rateLimitHits.toLocaleString()}
                    icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
                    description="Requests blocked by policy"
                />
                <StatsCard
                    title="Block Rate"
                    value={`${data.summary.errorRate}%`}
                    icon={<ShieldCheck className="h-4 w-4 text-green-500" />}
                    description="Percentage of blocked traffic"
                />
            </div>

            {/* Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Traffic Overview</CardTitle>
                        <CardDescription>Requests per hour over the last 24 hours</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.graph}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="time"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value, index) => index % 4 === 0 ? value : ''}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Area type="monotone" dataKey="requests" stroke="#8884d8" fillOpacity={1} fill="url(#colorRequests)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Security Status</CardTitle>
                        <CardDescription>System health indicators</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                                    <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Encryption</p>
                                    <p className="text-xs text-muted-foreground">AES-256-GCM Active</p>
                                </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Secure</Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                    <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">WAF / Rate Limit</p>
                                    <p className="text-xs text-muted-foreground">Middleware Active</p>
                                </div>
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Active</Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">RBAC Policy</p>
                                    <p className="text-xs text-muted-foreground">Standard Ruleset</p>
                                </div>
                            </div>
                            <Badge variant="secondary">Enforced</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Events Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Security Events</CardTitle>
                    <CardDescription>Latest 20 security logs from the system</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Path</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>User / IP</TableHead>
                                <TableHead className="text-right">Latency</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.events.map((event: any) => (
                                <TableRow key={event.id || event.eventId}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {new Date(event.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-xs">{event.method}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={event.endpoint}>
                                        {event.endpoint}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={event.statusCode >= 500 ? "destructive" : event.statusCode >= 400 ? "secondary" : "default"}
                                            className={event.statusCode >= 500 ? "" : event.statusCode >= 400 ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200" : "bg-green-100 text-green-800 hover:bg-green-100 border-green-200 shadow-none"}
                                        >
                                            {event.statusCode}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{event.userEmail || 'Anonymous'}</span>
                                            <span className="text-xs text-muted-foreground">{event.ipAddress}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">
                                        {event.duration}ms
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function StatsCard({ title, value, icon, description }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}
