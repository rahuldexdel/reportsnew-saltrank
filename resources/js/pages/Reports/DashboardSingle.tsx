import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChartNoAxesColumn, ChartNoAxesColumnIncreasing, Download, Facebook, MapPin, PlusIcon, SquareChevronUp, Star, Trash2, TrendingUp } from 'lucide-react';
import React from 'react'
import gaIcon from '@/images/google-logo.svg';
import fbIcon from '@/images/facebook-Insights.svg'
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    {
       // title: 'Pilot the new Manage Data Sources experience today:',
        href: '/dashboard',
    },
];

export default function DashboardSingle() {

    const [compareEnabled, setCompareEnabled] = useState(false);
    const chartData = [
        { day: "Jun 01", imp: 51500, spend: 540, calls: 217 },
        { day: "Jun 02", imp: 50700, spend: 480, calls: 245 },
        { day: "Jun 03", imp: 41400, spend: 490, calls: 154 },
        { day: "Jun 04", imp: 49600, spend: 500, calls: 96 },
        { day: "Jun 05", imp: 47900, spend: 580, calls: 280 },
        { day: "Jun 06", imp: 46800, spend: 540, calls: 242 },
        { day: "Jun 07", imp: 44675, spend: 610, calls: 245 },
    ]
    const chartConfig = {
        imp: {
            label: "Impressions",
            color: "var(--chart-1)",
        },
        spend: {
            label: "Spend",
            color: "var(--chart-2)",
        },
        calls: {
            label: "calls",
            color: "var(--chart-3)",
        },
    } satisfies ChartConfig

    const conversationData = [
        { day: "Sunday", convo: 183 },
        { day: "Monday", convo: 289 },
        { day: "Tuesday", convo: 257 },
        { day: "Webnesday", convo: 256 },
        { day: "Thursday", convo: 283 },
        { day: "Friday", convo: 256 },
        { day: "Saturday", convo: 168 },
    ]
    const ChartConfig = {
        convo: {
            label: "Conversations",
            color: "var(--chart-2)",
        },
        label: {
            color: "var(--background)",
        },
    } satisfies ChartConfig

    const platformData = [
        {
            source: "Call Tracking",
            impressions: "1,534",
            conversations: "1,534",
            calls: "1,534",
            spend: "$0.00",
        },
        {
            source: "Facebook Ads",
            impressions: "0",
            conversations: "0",
            calls: "0",
            spend: "$0.00",
        },
        {
            source: "Facebook Insights",
            impressions: "0",
            conversations: "0",
            calls: "0",
            spend: "$0.00",
        },
        {
            source: "Geofencing",
            impressions: "0",
            conversations: "0",
            calls: "0",
            spend: "$0.00",
        },
        {
            source: "Google Ads",
            impressions: "73,444",
            conversations: "0",
            calls: "0",
            spend: "$1,790.08",
        },
        {
            source: "Google Business Profile",
            impressions: "10,658",
            conversations: "0",
            calls: "0",
            spend: "$0.00",
        },
        {
            source: "Google Search Console",
            impressions: "236,400",
            conversations: "0",
            calls: "0",
            spend: "$0.00",
        },
        {
            source: "Simpli.fi",
            impressions: "0",
            conversations: "94",
            calls: "0",
            spend: "$2,055.24",
        },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Dashboard Single' />
            <div className="flex flex-1 flex-col gap-4 rounded-xl p-4">

                <div className='flex items-center justify-between mb-4'>
                    <div className='flex'>
                        <h2 className="text-2xl font-semibold ">*In Progress* Salt Rank Master Dashboard </h2>
                        <Star className='mx-4 pt-2' />
                    </div>
                    <div className='flex items-center justify-between gap-2'>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button asChild>
                                        <Link href={route('admin.clients.create')}><PlusIcon /></Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Add</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button variant='outline' asChild>
                                        <Link href={route('admin.clients.create')}><Download /></Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Quick Download</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <div className='datearea mx-6'>
                            <p className='font-bold'>May 26, 2025 - Jun 01, 2025</p>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="compare-data" className='text-sm text-gray-500' >{compareEnabled ? 'Comparing to May 01, 2025 - May 20, 2025' : 'Compare data to prior period?'}</Label>
                                <Switch id="compare-data" checked={compareEnabled} onCheckedChange={setCompareEnabled} />
                            </div>
                            <div className='flex items-center mt-1.5 gap-3'>
                                <button className='text-xs text-gray-400 border-b-2 border-b-transparent hover:border-b-primary'>7 Days</button>
                                <button className='text-xs text-gray-400 border-b-2 border-b-transparent hover:border-b-primary'>30 Days</button>
                                <button className='text-xs text-gray-400 border-b-2 border-b-transparent hover:border-b-primary'>This Month</button>
                                <button className='text-xs text-gray-400 border-b-2 border-b-transparent hover:border-b-primary'>Last Month</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <Tabs defaultValue="overview2" className="w-full bg-red">
                    <TabsList className='bg-transparent'>
                        <TabsTrigger className='tab-custom-class data-[state=active]:shadow-none border-0 px-5' value="overview2"><ChartNoAxesColumn className='text-blue-800' /> Overview V2</TabsTrigger>
                        <TabsTrigger className='tab-custom-class data-[state=active]:shadow-none border-0 px-5' value="overview"><ChartNoAxesColumnIncreasing className='text-blue-800' /> Overview</TabsTrigger>
                        <TabsTrigger className='tab-custom-class data-[state=active]:shadow-none border-0 px-5' value="analytics"><img src={gaIcon} width='14px' /> Google Analytics</TabsTrigger>
                        <TabsTrigger className='tab-custom-class data-[state=active]:shadow-none border-0 px-5' value="googleads"><img src={gaIcon} width='14px' /> Google Ads</TabsTrigger>
                        <TabsTrigger className='tab-custom-class data-[state=active]:shadow-none border-0 px-5' value="fbads"><img src={fbIcon} width='14px' /> Facebook Ads</TabsTrigger>
                        <TabsTrigger className='tab-custom-class data-[state=active]:shadow-none border-0 px-5' value="gbprofile"><img src={gaIcon} width='14px' /> Google Business Profile</TabsTrigger>
                        <TabsTrigger className='tab-custom-class data-[state=active]:shadow-none border-0 px-5' value="fbinsights"><img src={fbIcon} width='14px' /> Facebook Insights</TabsTrigger>
                        <TabsTrigger className='tab-custom-class data-[state=active]:shadow-none border-0 px-5' value="seotracking"><img src={gaIcon} width='14px' /> SEO + Rank Tracking</TabsTrigger>
                        <TabsTrigger className='tab-custom-class data-[state=active]:shadow-none border-0 px-5' value="searchconsole"><img src={gaIcon} width='14px' /> Google Search Console</TabsTrigger>
                        <TabsTrigger className='tab-custom-class data-[state=active]:shadow-none border-0 px-5' value="geofencing"><MapPin className='text-blue-800' /> Geofencing</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview2" className='border-t-2 px-4 py-6'>
                        <h3 className='font-bold text-4xl text-center bg-black/80 text-white py-2.5'>Key Performance Indicators</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">
                            <Card className='overflow-hidden group border px-5 bg-orange-200 rounded-none'>
                                <CardContent className="flex flex-col items-center p-0">
                                    <div className=" w-full flex flex-col">
                                        <div className='p-4 text-center'>
                                            <p className='text-lg leading-7 mb-5'>Total Impressions</p>
                                            <div className='flex items-center justify-between'>
                                                <h4 className='text-3xl font-semibold text-black'>279,260</h4>
                                                <div className='flex flex-col items-center'>
                                                    <p className='text-2xl flex items-center'>3% <SquareChevronUp className='text-green-800' /></p>
                                                    <p className='text-gray-400'>vs 269,872 prev.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className='overflow-hidden group border px-5 bg-orange-200 rounded-none'>
                                <CardContent className="flex flex-col items-center p-0">
                                    <div className=" w-full flex flex-col">
                                        <div className='p-4 text-center'>
                                            <p className='text-lg leading-7 mb-5'>Total Impressions</p>
                                            <div className='flex items-center justify-between'>
                                                <h4 className='text-3xl font-semibold text-black'>279,260</h4>
                                                <div className='flex flex-col items-center'>
                                                    <p className='text-2xl flex items-center'>3% <SquareChevronUp className='text-green-800' /></p>
                                                    <p className='text-gray-400'>vs 269,872 prev.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className='overflow-hidden group border px-5 bg-orange-200 rounded-none'>
                                <CardContent className="flex flex-col items-center p-0">
                                    <div className=" w-full flex flex-col">
                                        <div className='p-4 text-center'>
                                            <p className='text-lg leading-7 mb-5'>Total Impressions</p>
                                            <div className='flex items-center justify-between'>
                                                <h4 className='text-3xl font-semibold text-black'>279,260</h4>
                                                <div className='flex flex-col items-center'>
                                                    <p className='text-2xl flex items-center'>3% <SquareChevronUp className='text-green-800' /></p>
                                                    <p className='text-gray-400'>vs 269,872 prev.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className='overflow-hidden group border px-5 bg-orange-200 rounded-none'>
                                <CardContent className="flex flex-col items-center p-0">
                                    <div className=" w-full flex flex-col">
                                        <div className='p-4 text-center'>
                                            <p className='text-lg leading-7 mb-5'>Total Impressions</p>
                                            <div className='flex items-center justify-between'>
                                                <h4 className='text-3xl font-semibold text-black'>279,260</h4>
                                                <div className='flex flex-col items-center'>
                                                    <p className='text-2xl flex items-center'>3% <SquareChevronUp className='text-green-800' /></p>
                                                    <p className='text-gray-400'>vs 269,872 prev.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <h3 className='font-bold text-4xl text-center bg-black/80 text-white py-2.5'>Platform Performance</h3>
                        <div className='flex items-center gap-5 mt-5'>

                            <Card className='w-[55%]'>
                                <CardHeader>
                                    <CardTitle>Performance Trends over time</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className='h-100 w-full' >
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart accessibilityLayer data={chartData}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    dataKey="day"
                                                    tickLine={false}
                                                    tickMargin={10}
                                                    axisLine={false}
                                                    tickFormatter={(value) => value.slice(0, 15)}
                                                />
                                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" dataKey="imp" axisLine={false} tickLine={false} label={{ value: 'Total Impressions', angle: -90, position: 'insideLeft', offset: -5, style: { textAnchor: 'middle' } }} />
                                                <YAxis yAxisId="leftt" orientation="left" stroke="#8884d8" dataKey="spend" axisLine={false} tickLine={false} tick={{ dx: -10 }} label={{ value: 'Spend', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }} />
                                                <YAxis orientation="right" stroke="#8884d8" dataKey="calls" axisLine={false} tickLine={false} label={{ value: 'Calls', angle: -90, position: 'insideRight', offset: 10, style: { textAnchor: 'middle' } }} />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent indicator="dashed" />}
                                                />
                                                <Bar dataKey="imp" fill="var(--primary)" radius={4} yAxisId="left" />
                                                <Bar dataKey="spend" fill="var(--color-mobile)" radius={4} yAxisId="leftt" />
                                                <Line type="monotone" dataKey="calls" stroke="var(--chart-2)" />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            <Card className='w-[45%]'>
                                <CardHeader>
                                    <CardTitle>Conversation by Day of Week</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={ChartConfig} className='h-full'>
                                        <BarChart
                                            accessibilityLayer
                                            data={conversationData}
                                            layout="vertical"
                                            margin={{
                                                right: 16,
                                            }}
                                        >
                                            <CartesianGrid horizontal={false} />
                                            <YAxis
                                                dataKey="day"
                                                type="category"
                                                tickLine={false}
                                                tickMargin={10}
                                                axisLine={false}
                                                tickFormatter={(value) => value.slice(0, 3)}

                                            />
                                            <XAxis dataKey="convo" type="number" axisLine={false} />
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent indicator="line" />}
                                            />
                                            <Bar
                                                dataKey="convo"
                                                layout="vertical"
                                                fill="var(--primary)"
                                                radius={4}
                                            >

                                                <LabelList
                                                    dataKey="convo"
                                                    position="right"
                                                    offset={8}
                                                    className="fill-foreground"
                                                    fontSize={12}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                                <CardFooter className="flex-col items-start gap-2 text-sm">
                                    <div className="text-muted-foreground leading-none font-semibold">
                                        <p>Conversations</p>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                        <div className='flex items-center gap-5 mt-5'>
                            <Card className='w-full px-6'>
                                <CardHeader>
                                    <CardTitle>Overall Platform Performance</CardTitle>
                                </CardHeader>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/5">Data Source Name</TableHead>
                                            <TableHead className="text-right w-1/5">Total Impressions</TableHead>
                                            <TableHead className="text-right w-1/5">Conversations</TableHead>
                                            <TableHead className="text-right w-1/5">Calls</TableHead>
                                            <TableHead className="text-right w-1/5">Spend</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {platformData.map((sourcedata) => (
                                            <TableRow key={sourcedata.source}>
                                                <TableCell className="font-medium">{sourcedata.source}</TableCell>
                                                <TableCell className="text-right">{sourcedata.impressions}</TableCell>
                                                <TableCell className='text-right'>{sourcedata.conversations}</TableCell>
                                                <TableCell className='text-right'>{sourcedata.calls}</TableCell>
                                                <TableCell className="text-right">{sourcedata.spend}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>

                    </TabsContent>
                    <TabsContent value="overview" className='border-t-2 px-4 py-6'>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                            <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                <CardContent className="flex flex-col items-center p-0">
                                    <div className=" w-full h-80 flex flex-col justify-end">
                                        <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block' />
                                            <div>
                                                <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                            </div>
                                            <Star className='text-primary hidden group-hover:block' />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="analytics" className='border-t-2 px-4 py-6'>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                            <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                <CardContent className="flex flex-col items-center p-0">
                                    <div className=" w-full h-80 flex flex-col justify-end">
                                        <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block' />
                                            <div>
                                                <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                            </div>
                                            <Star className='text-primary hidden group-hover:block' />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="googleads" className='border-t-2 px-4 py-6'>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                            <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                <CardContent className="flex flex-col items-center p-0">
                                    <div className=" w-full h-80 flex flex-col justify-end">
                                        <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block' />
                                            <div>
                                                <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                            </div>
                                            <Star className='text-primary hidden group-hover:block' />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    )
}
