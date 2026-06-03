import { Bar, BarChart, CartesianGrid, ComposedChart,AreaChart , Area, Legend,LabelList, Line, LineChart, ResponsiveContainer, XAxis, YAxis,Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ChartNoAxesColumnIncreasing, ChevronDown, ChevronUp, Download, SquareChevronUp, Star, Trash2, TrendingUp } from 'lucide-react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Simplifi } from '@/components/reports/simplifi';

import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Datasource } from '@/types';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { Label } from '@/components/ui/label';
import React from 'react'
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { SimplifiCampaignPerformance } from "@/components/reports/simplifi-campaign-performance";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";

const breadcrumbs: BreadcrumbItem[] = [
    {
       // title: 'Pilot the new Manage Data Sources experience today:',
        href: '/dashboard',
    },
];
interface DataSourcesProps {
    dataSources: Datasource[];
    simplifi: {
        impressions: number;
        clicks: number;
        ctr: number;
        walkIns: number;
        prevImpressions: number;
        prevCtr: number;
        prevClicks: number;
        prevWalkIns: number;
    };
}


interface PageProps {
  campaignStats1: any,
  getCampaignStats: any,
  search_console_data: any
}

const dashboard = ({ dataSources, simplifi }: DataSourcesProps) => {
    const { baseUrl } = usePage().props;
    const { campaignStats1 , getCampaignStats , search_console_data } = usePage<PageProps>().props;
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

    const data: Payment[] = [
        {
            id: "m5gr84i9",
            amount: 316,
            status: "success",
            email: "ken99@example.com",
        },
        {
            id: "3u1reuv4",
            amount: 242,
            status: "success",
            email: "Abe45@example.com",
        },
        {
            id: "derv1ws0",
            amount: 837,
            status: "processing",
            email: "Monserrat44@example.com",
        },
        {
            id: "5kma53ae",
            amount: 874,
            status: "success",
            email: "Silas22@example.com",
        },
        {
            id: "bhqecj4p",
            amount: 721,
            status: "failed",
            email: "carmella@example.com",
        },
    ]
    type Payment = {
        id: string
        amount: number
        status: "pending" | "processing" | "success" | "failed"
        email: string
    }
    
  const stats = search_console_data?.rows || [];

    const totalImpressions = stats.reduce((sum, row) => sum + row.impressions, 0);
    const totalClicks = stats.reduce((sum, row) => sum + row.clicks, 0);
    const uniquePages = new Set(stats.map(row => row.keys[2])).size;
    const totalQueries = stats.length;



const trendByDate: { [date: string]: { clicks: number; impressions: number } } = {};

stats.forEach((row: any) => {
  const date = row.keys[0]; // "2025-07-24"
  const clicks = row.clicks;
  const impressions = row.impressions;

  if (!trendByDate[date]) {
    trendByDate[date] = { clicks: 0, impressions: 0 };
  }

  trendByDate[date].clicks += clicks;
  trendByDate[date].impressions += impressions;
});
const chartData1 = Object.entries(trendByDate).map(([date, metrics]) => ({
  date,
  clicks: metrics.clicks,
  impressions: metrics.impressions,
}));

const limitedChartData = chartData1.slice(-5);


// const pagesVsQueriesTrend: Record<
//   string,
//   { pages: Set<string>; queries: Set<string> }
// > = {};

// stats.forEach((row: any) => {
//   const date = row.keys[0];
//   const query = row.keys[1];
//   const page = row.keys[2];

//   if (!pagesVsQueriesTrend[date]) {
//     pagesVsQueriesTrend[date] = {
//       pages: new Set(),
//       queries: new Set(),
//     };
//   }

//   pagesVsQueriesTrend[date].pages.add(page);
//   pagesVsQueriesTrend[date].queries.add(query);
// });

// // Convert to chart-ready array
// let pagesVsQueriesChartData = Object.entries(pagesVsQueriesTrend).map(
//   ([date, data]) => ({
//     date,
//     pagesCount: data.pages.size,
//     queriesCount: data.queries.size,
//   })
// );

// // Sort by date ascending
// pagesVsQueriesChartData.sort(
//   (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
// );

// // Limit to last 5 days
// const last5DaysData = pagesVsQueriesChartData.slice(-5);



console.log(stats);

const formattedQueryData = stats.map((row: any) => ({
  query: row.keys[1],
  searchType: row.keys[3],// default unless you queried for image/news
  clicks: row.clicks,
  impressions: row.impressions,
  ctr: (row.ctr * 100).toFixed(2) + '%',
  position: row.position.toFixed(1),
}));

const deviceBreakdown = {
  DESKTOP: { impressions: 0, clicks: 0, positionSum: 0, count: 0 },
  MOBILE: { impressions: 0, clicks: 0, positionSum: 0, count: 0 },
  TABLET: { impressions: 0, clicks: 0, positionSum: 0, count: 0 }
};

stats.forEach(row => {
  const device = row.keys[3]; // DESKTOP, MOBILE, TABLET
  if (deviceBreakdown[device]) {
    deviceBreakdown[device].impressions += row.impressions;
    deviceBreakdown[device].clicks += row.clicks;
    deviceBreakdown[device].positionSum += row.position;
    deviceBreakdown[device].count += 1;
  }
});

const finalDeviceStats = Object.entries(deviceBreakdown).map(([device, data]) => {
  const avgPosition = data.count ? (data.positionSum / data.count).toFixed(1) : "0.0";
  const ctr = data.impressions ? ((data.clicks / data.impressions) * 100).toFixed(2) + "%" : "0.00%";

  return {
    device,
    avgPosition,
    impressions: data.impressions.toLocaleString(),
    clicks: data.clicks.toLocaleString(),
    ctr
  };
});

const totalImpressions1 = Object.values(deviceBreakdown).reduce((sum, d) => sum + d.impressions, 0);
const totalClicks1 = Object.values(deviceBreakdown).reduce((sum, d) => sum + d.clicks, 0);
const totalPositionSum = Object.values(deviceBreakdown).reduce((sum, d) => sum + d.positionSum, 0);
const totalCount = Object.values(deviceBreakdown).reduce((sum, d) => sum + d.count, 0);
const totalAvgPosition = totalCount ? (totalPositionSum / totalCount).toFixed(1) : "0.0";
const totalCTR = totalImpressions1 ? ((totalClicks1 / totalImpressions1) * 100).toFixed(2) + "%" : "0.00%";

finalDeviceStats.push({
  device: "Total",
  avgPosition: totalAvgPosition,
  impressions: totalImpressions1.toLocaleString(),
  clicks: totalClicks1.toLocaleString(),
  ctr: totalCTR
});




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
                                    <Button variant='outline' asChild><Link href={route('admin.clients.create')}><Download /></Link></Button>
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
                <Tabs defaultValue="simplifi" className="w-full bg-red">
                    <TabsList className='bg-transparent'>
                        <TabsTrigger className='tab-custom-class data-[state=active]:shadow-none border-0' value="overview"><ChartNoAxesColumnIncreasing className='text-blue-800' /> Overview</TabsTrigger>
                        {dataSources.map((source) => (
                            <TabsTrigger key={source.id} className='tab-custom-class data-[state=active]:shadow-none border-0 px-5' value={source.service}>
                                <img className="w-4.5 rounded-full" src={source.image ? `${baseUrl}/images/${source.image}` : `${baseUrl}/placeholder.svg`} alt={source.title} />
                                {source.title}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="overview" className='border-t-2 px-4 py-6'>
                        <h3 className='font-bold text-4xl text-center bg-black/80 text-white py-2.5'>Key Performance Indicators</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">
                            <Card className='overflow-hidden group border px-5 bg-orange-200 rounded-none'>
                                <CardContent className="flex flex-col items-center p-0">
                                    <div className=" w-full flex flex-col">
                                        <div className='p-4 text-center'>
                                            <p className='text-lg leading-7 mb-5'>Total Impressions</p>
                                            <div className='flex items-center justify-between'>
                                                <h4 className='text-3xl font-semibold'>279,260</h4>
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


                    <TabsContent value="simplifi" className='border-t-2 px-4 py-6'>
                        {/* <Simplifi /> */}
                        <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>Key Performance Indicators working </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">

                            <StatCard title="Impressions" current={simplifi.impressions} previous={simplifi.prevImpressions} />
                            <StatCard title="Clicks" current={simplifi.clicks} previous={simplifi.prevClicks} />
                            <StatCard title="CTR" current={simplifi.ctr} previous={simplifi.prevCtr} />
                            <StatCard title="Walk-Ins" current={simplifi.walkIns} previous={simplifi.prevWalkIns} />
                        </div>
                       <div className="overflow-x-auto mt-6">
                            <table className="min-w-full text-sm border border-gray-300">
                                <thead className="bg-gray-100 text-xs font-semibold">
                                <tr>
                                    <th className="px-4 py-2 text-left">Campaign Name</th>
                                    <th className="px-4 py-2 text-right">Impressions</th>
                                    <th className="px-4 py-2 text-right">Clicks</th>
                                    <th className="px-4 py-2 text-right">CTR</th>
                                    <th className="px-4 py-2 text-right">CPM</th>
                                    <th className="px-4 py-2 text-right">CPC</th>
                                    <th className="px-4 py-2 text-right">VCR</th>
                                    <th className="px-4 py-2 text-right">Spend ($)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {getCampaignStats?.campaign_stats?.map((stat) => (
                                    <tr key={stat.campaign_id} className="border-t">
                                    <td className="px-4 py-2">{stat.name}</td>
                                    <td className="px-4 py-2 text-right">{stat.impressions.toLocaleString()}</td>
                                    <td className="px-4 py-2 text-right">{stat.clicks}</td>
                                    <td className="px-4 py-2 text-right">{(stat.ctr * 100).toFixed(2)}%</td>
                                    <td className="px-4 py-2 text-right">${stat.cpm.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right">${stat.cpc.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right">{(stat.vcr * 100).toFixed(1)}%</td>
                                    <td className="px-4 py-2 text-right">${stat.total_spend.toFixed(2)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            </div>
                        <div className="p-6">
                            <h1 className="text-2xl font-bold mb-4">Campaign Ads</h1>

                            <div className="overflow-x-auto">
                                <table className="table-auto min-w-full border border-gray-300 text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                    <th className="px-4 py-2 border">ID</th>
                                    <th className="px-4 py-2 border">Name</th>
                                    <th className="px-4 py-2 border">Status</th>
                                    <th className="px-4 py-2 border">Creative</th>
                                    <th className="px-4 py-2 border">Video</th>
                                    <th className="px-4 py-2 border">Target URL</th>
                                    <th className="px-4 py-2 border">Duration</th>
                                    <th className="px-4 py-2 border">Video Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaignStats1.ads.map((ad) => (
                                    <tr key={ad.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 border">{ad.id}</td>
                                        <td className="px-4 py-2 border">{ad.name}</td>
                                        <td className="px-4 py-2 border">{ad.status}</td>
                                        <td className="px-4 py-2 border">{ad.primary_creative}</td>
                                        <td className="px-4 py-2 border">
                                        <video width="150" height="100" controls>
                                            <source src={ad.primary_creative_url} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                        </td>
                                        <td className="px-4 py-2 border">
                                        <a href={ad.target_url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                                            Link
                                        </a>
                                        </td>
                                        <td className="px-4 py-2 border">{ad.duration}</td>
                                        <td className="px-4 py-2 border">{ad.video_status}</td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                            </div>

                        <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>Campaign Performance yeyeyyey</h3>
                        <div className="relative p-12 shadow-2xl my-12 rounded-2xl">
                            <Card className="mt-6">
                                <CardHeader>
                                    {/* <CardTitle>Conversion</CardTitle> */}
                                </CardHeader>
                                <CardContent>
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
                                            {/* {platformData.map((sourcedata) => ( */}
                                                <TableRow>
                                                    <TableCell className="font-medium">10</TableCell>
                                                    <TableCell className="text-right">3</TableCell>
                                                    <TableCell className='text-right'>346</TableCell>
                                                    <TableCell className='text-right'>3456</TableCell>
                                                    <TableCell className="text-right">860</TableCell>
                                                </TableRow>
                                            {/* ))} */}
                                        </TableBody>
                                    </Table>
                                    {/* <SimplifiCampaignPerformance data={data} /> */}
                                </CardContent>
                            </Card>
                        </div>               

                    </TabsContent>



                    <TabsContent value="search-console" className='border-t-2 px-4 py-6'>
                        {/* <Simplifi /> */}

                             {/* <pre className="bg-gray-100 p-4 rounded text-sm">
                            {JSON.stringify(search_console_data, null, 2)}
                             </pre> */}
                        <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>Key Performance Indicators GSC </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">

                                <StatCard
                                    title="Impressions"
                                    current={totalImpressions.toLocaleString()}
                                    percentage="-13%"
                                    previous="238.10K"
                                />
                                <StatCard
                                    title="Clicks"
                                    current={totalClicks.toLocaleString()}
                                    percentage="-16%"
                                    previous="4.00K"
                                />
                                <StatCard
                                    title="# of Pages"
                                    current={uniquePages.toLocaleString()}
                                    percentage="-16%"
                                    previous="3.81K"
                                />
                                <StatCard
                                    title="# of Queries"
                                    current={totalQueries.toLocaleString()}
                                    percentage="-16%"
                                    previous="26.08K"
                                />


                        </div>    
                 <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>Impressions vs Clicks Trend</h3>
                     <div className="overflow-x-auto mt-10">
                       <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={limitedChartData}>
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="impressions" fill="#f36201ff" name="Impressions" />
                            <Bar yAxisId="right" dataKey="clicks" fill="#5a0303ff" name="Clicks" />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>   

                        <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>Query & Search Types</h3>
                        <div className="overflow-x-auto mt-10">
                              <table className="min-w-full text-sm border border-gray-300 rounded-lg shadow-md">
                                <thead className="bg-gray-100 text-xs font-semibold">
                                    <tr>
                                    <th className="px-4 py-2 text-left">Queries</th>
                                    <th className="px-4 py-2 text-left">Search Type</th>
                                    <th className="px-4 py-2 text-right">Avg. Position</th>
                                    <th className="px-4 py-2 text-right">Impressions</th>
                                    <th className="px-4 py-2 text-right">Clicks</th>
                                    <th className="px-4 py-2 text-right">CTR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formattedQueryData.slice(0, 10).map((item, idx) => (
                                    <tr key={idx} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-2">{item.query}</td>
                                        <td className="px-4 py-2">{item.searchType}</td>
                                        <td className="px-4 py-2 text-right">{item.position}</td>
                                        <td className="px-4 py-2 text-right">{item.impressions}</td>
                                        <td className="px-4 py-2 text-right">{item.clicks}</td>
                                        <td className="px-4 py-2 text-right">{item.ctr}</td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>


                                </div>  

                         <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'> Campaigns & Pages</h3>
                         <div className="overflow-x-auto mt-10">

                            <table className="min-w-full border border-gray-300 text-sm rounded-lg shadow-md">
                            <thead className="bg-gray-100 text-xs font-semibold uppercase">
                                <tr>        
                                <th className="px-4 py-2 text-left">Page</th>
                                <th className="px-4 py-2 text-left">Avg. Position</th>
                                <th className="px-4 py-2 text-right">Impressions</th>
                                <th className="px-4 py-2 text-right">Clicks</th>
                                <th className="px-4 py-2 text-right">CTR</th>
                                </tr>
                            </thead>
                            <tbody>
                             {stats.slice(0, 10).map((row, index) => (
                                <tr key={index} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2">
                                    <a
                                        href={row.keys[2]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        {row.keys[2]}
                                    </a>
                                    </td>
                                    <td className="px-4 py-2">{row.position}</td>
                                    <td className="px-4 py-2 text-right">{row.impressions}</td>
                                    <td className="px-4 py-2 text-right">{row.clicks}</td>
                                    <td className="px-4 py-2 text-right">{(row.ctr * 100).toFixed(2)}%</td>
                                </tr>
                                ))}
                            </tbody>
                            </table>


                            </div>
                               

                               <table className="min-w-full text-sm border border-gray-300 shadow-md rounded-lg">
                                <thead className="bg-gray-100 text-xs uppercase font-semibold">
                                    <tr>
                                    <th className="px-4 py-2 text-left text-red-600">Devices</th>
                                    <th className="px-4 py-2 text-right">Avg. position</th>
                                    <th className="px-4 py-2 text-right">Impressions</th>
                                    <th className="px-4 py-2 text-right">Clicks</th>
                                    <th className="px-4 py-2 text-right">CTR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {finalDeviceStats.map((row, index) => (
                                    <tr
                                        key={index}
                                        className={`border-t ${row.device === "Total" ? "bg-orange-100 font-bold" : "hover:bg-gray-50"}`}
                                    >
                                        <td className="px-4 py-2">{row.device}</td>
                                        <td className="px-4 py-2 text-right">{row.avgPosition}</td>
                                        <td className="px-4 py-2 text-right">{row.impressions}</td>
                                        <td className="px-4 py-2 text-right">{row.clicks}</td>
                                        <td className="px-4 py-2 text-right">{row.ctr}</td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>


                                


  

                    </TabsContent>


                </Tabs>
            </div>
        </AppLayout>
    )
}

export default dashboard


type StatCardProps = {
    title: string;
    current: number;
    previous: number;
};

const StatCard = ({ title, current, previous }: StatCardProps) => {
    const percentChange = previous > 0 ? (100 * (current - previous)) / previous : 0;
    const isPositive = current >= previous;
    return (
        <Card className='overflow-hidden group border px-5 bg-primary/30 dark:bg-card rounded-none'>
            <CardContent className="flex flex-col items-center p-0">
                <div className="w-full flex flex-col">
                    <div className='p-4 text-center'>
                        <p className='text-lg leading-7 mb-5'>{title}</p>
                        <div className='flex items-center justify-between'>
                            <h4 className='text-3xl font-semibold'>{current}</h4>
                            <div className='flex flex-col items-center'>
                                <p className={`text-2xl flex items-center gap-1 ${isPositive ? 'text-green-800' : 'text-red-600'}`}>
                                    {Math.abs(percentChange).toFixed(1)}%
                                    {isPositive ? <ChevronUp /> : <ChevronDown />}
                                </p>
                                <p className='text-gray-400'>vs {previous} prev.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}