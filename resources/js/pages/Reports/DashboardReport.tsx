import { Bar, BarChart, PieChart, Pie, Cell, ComposedChart,CartesianGrid,AreaChart , Area, Legend,LabelList, Line, LineChart, ResponsiveContainer, XAxis, YAxis,Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ChartNoAxesColumnIncreasing, ChevronDown, ChevronUp, Download, SquareChevronUp, Star, Trash2, TrendingUp } from 'lucide-react';
import { Head, Link, usePage ,router  } from '@inertiajs/react';
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
import { useEffect,useMemo ,useRef } from "react";
import PaginatedTable from './PaginatedTable';
import PaginatedQueryTable from './PaginatedQueryTable';
import PaginatedAdsTable from './PaginatedAdsTable';  
import PaginatedCampaignStatsTable from './PaginatedCampaignStatsTable';
import PaginatedCampPerfomance from './PaginatedCampPerfomance';
import CallRailCalls from "../callrail/calls";
import GoogleAnalytics from "../ga4data/GoogleAnalytics";
import PaginatedSemrushTable from './PaginatedSemrushTable';
import OverviewSaltData from './OverviewSaltData';

import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas-pro'; // This imports the Pro version


const Dashboard = () => {
    const [simplifiData, setSimplifiData] = useState<any>(null); // Store fetched data
    const [loading, setLoading] = useState(true);  // Loading state for data fetch
    const dashboardRef = useRef(null); // Reference to capture the full dashboard content

    useEffect(() => {
        // Fetch data when component mounts
        fetchData();
    }, []);

    // Function to fetch data from backend API
    const fetchData = async () => {
        const range = '2026-02-11:2026-02-17'; // Example date range, modify as needed
        try {
            const response = await fetch(`/dashboard/simplifi-data?range=${range}`);
            const data = await response.json();
            setSimplifiData(data);  // Set the fetched data
            setLoading(false);  // Set loading to false after data is fetched
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);  // Set loading to false on error
        }
    };
    const getChangePercentage = (current, previous) => {
      current = Number(current);
      previous = Number(previous);
      if (previous === 0) return "0.0%";
      const change = ((current - previous) / previous) * 100;
      const sign = change > 0 ? "+" : "−"; // en-dash
      return `${sign}${Math.abs(change).toFixed(1)}%`;
    };
    
    const formatCompact = (num) =>
      Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(num);
    
     const generatePDF = async () => { 
        const input = dashboardRef.current; 

        if (input) {
            html2canvas(input, {
                useCORS: true,  
                logging: true,  
            }).then((canvas) => {
                const imgData = canvas.toDataURL("image/png");
                const doc = new jsPDF();
                doc.addImage(imgData, "PNG", 10, 10, 180, 160);
                doc.save("dashboard_report.pdf");
            }).catch((error) => {
                console.error('Error generating PDF:', error);
            });
        }
    };
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div ref={dashboardRef} className="dashboard-content">
                {/* Key Performance Indicators */}
                <h3 className="font-bold text-4xl text-center bg-black text-white py-2.5">
                    Key Performance Indicators working
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">
                    <StatCard
                        title="Impressions"
                        current={(simplifiData?.totals?.current?.impressions || 0).toLocaleString()}
                        percentage={getChangePercentage(
                            simplifiData?.totals?.current?.impressions || 0,
                            simplifiData?.totals?.previous?.impressions || 0
                        )}
                        previous={`vs ${formatCompact(simplifiData?.totals?.previous?.impressions || 0)} prev.`}
                    />

                    <StatCard
                        title="Clicks"
                        current={(simplifiData?.totals?.current?.clicks || 0).toLocaleString()}
                        percentage={getChangePercentage(
                            simplifiData?.totals?.current?.clicks || 0,
                            simplifiData?.totals?.previous?.clicks || 0
                        )}
                        previous={`vs ${formatCompact(simplifiData?.totals?.previous?.clicks || 0)} prev.`}
                    />

                    <StatCard
                        title="CTR"
                        current={`${((simplifiData?.totals?.current?.ctr || 0) * 100).toFixed(2)}%`}
                        percentage={getChangePercentage(
                            simplifiData?.totals?.current?.ctr || 0,
                            simplifiData?.totals?.previous?.ctr || 0
                        )}
                        previous={`vs ${((simplifiData?.totals?.previous?.ctr || 0) * 100).toFixed(2)}% prev.`}
                    />

                    <StatCard
                        title="Walk-Ins"
                        current={(simplifiData?.totals?.current?.walkIns || 0).toLocaleString()}
                        percentage={getChangePercentage(
                            simplifiData?.totals?.current?.walkIns || 0,
                            simplifiData?.totals?.previous?.walkIns || 0
                        )}
                        previous={`vs ${formatCompact(simplifiData?.totals?.previous?.walkIns || 0)} prev.`}
                    />
                </div>

                {/* Chart */}
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={simplifiData?.totals?.current?.chartData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      angle={-35}
                      textAnchor="end"
                      height={50}
                    />
                    
                    {/* Correctly link the YAxes with corresponding yAxisId */}
                    <YAxis
                      yAxisId="impressions"
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      label={{ value: "Impressions", angle: -90, position: "insideLeft" }}
                    />
                    
                    <YAxis
                      yAxisId="clicks"
                      orientation="right"
                      tickFormatter={(v) => v}
                      label={{ value: "Clicks", angle: 90, position: "insideRight" }}
                    />
                    
                    <YAxis
                      yAxisId="ctr"
                      orientation="right"
                      hide={true}
                      tickFormatter={(v) => `${(v * 100).toFixed(2)}%`}
                    />

                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "CTR") return `${(value * 100).toFixed(2)}%`;
                        return value.toLocaleString();
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />

                    <Legend verticalAlign="top" />

                    {/* Ensure yAxisId matches with corresponding YAxis */}
                    <Line
                      yAxisId="ctr"  // This should match one of the YAxis components
                      type="monotone"
                      dataKey="ctr"
                      stroke="#7f8c8d"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="CTR"
                    />
                    
                    <Bar
                      yAxisId="impressions"  // This should match one of the YAxis components
                      dataKey="impressions"
                      fill="#f36201"
                      name="Impressions"
                      barSize={25}
                    />

                    <Bar
                      yAxisId="clicks"  // This should match one of the YAxis components
                      dataKey="clicks"
                      fill="#000000"
                      name="Clicks"
                      barSize={25}
                    />
                  </ComposedChart>
                </ResponsiveContainer>


                {/* Campaign Performance */}
                <div className="campaign-performance">
                    <h3 className="font-bold text-4xl text-center bg-black text-white py-2.5">
                        Campaign Performance
                    </h3>
                    <PaginatedCampPerfomance Performance={simplifiData?.campaign_performance} />
                </div>

                {/* Geofence Performance */}
                <div className="geofence-performance">
                    <h3 className="font-bold text-4xl text-center bg-black text-white py-2.5">
                        Geofence Performance
                    </h3>
                    <PaginatedCampaignStatsTable stats={simplifiData?.simplifi_ads_data} />
                </div>

                {/* Ad Performance */}
                <div className="ad-performance">
                    <h3 className="font-bold text-4xl text-center bg-black text-white py-2.5">
                        Ad Performance
                    </h3>
                    <PaginatedAdsTable ads={simplifiData?.simplifi_ads_data} />
                </div>
            </div>

            {/* Button to trigger PDF generation */}
            <button onClick={generatePDF} className="btn btn-primary">
                Generate PDF Report
            </button>
        </div>
    );
};

export default Dashboard;




type StatCardProps = {
  title: string;
  current: string;
  previous: string;
  percentage: string;
};

const StatCard = ({ title, current, previous, percentage }: StatCardProps) => {
  const isPositive = percentage?.startsWith("+") ?? true;

  return (
    <Card className="overflow-hidden group border px-5 bg-primary/30 dark:bg-card rounded-none">
      <CardContent className="flex flex-col items-center p-0">
        <div className="w-full flex flex-col">
          <div className="p-4 text-center">
            <p className="text-lg leading-7 mb-5">{title}</p>
            <div className="flex items-center justify-between">
              <h4 className="text-3xl font-semibold">{current}</h4>
              <div className="flex flex-col items-center">
                <p
                  className={`text-2xl flex items-center gap-1 ${
                    isPositive ? "text-green-800" : "text-red-600"
                  }`}
                >
                  {percentage}
                  {isPositive ? <ChevronUp /> : <ChevronDown />}
                </p>
                <p className="text-gray-400">{previous}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



