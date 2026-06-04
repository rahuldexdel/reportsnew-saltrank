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

import GoogleAds from "../adsdata/GoogleAds";


import PaginatedSemrushTable from './PaginatedSemrushTable';
import OverviewSaltData from './OverviewSaltData';
import DashboardReport from './DashboardReport';
import WalkInsChart from './WalkInsChart';
import DonutChart from './DonutChart';
import { format, parseISO } from 'date-fns';
import { Inertia } from '@inertiajs/inertia';
import AIPopup from "./AIPopup";
import { DateRange } from "react-day-picker"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { group } from "console";
import saltrank from './saltrank.css';

import SimplifiKPIWidget from "@/components/widgets/SimplifiKPIWidget"


import {
  generateSinglePDF,
  generateSinglePPT,
  generateBothTabsPDF,
  generateBothTabsPPT,
  generateOverviewExcel,
  previewBothTabsPDF
} from "./utils/reportExport";
import axios from 'axios'

const breadcrumbs: BreadcrumbItem[] = [
    {
     //   title: 'Pilot the new Manage Data Sources experience today:',
        href: '/dashboard',
    },
];

interface Client {
  id: number;
  company_name: string;
}

interface ClientGroup {
  id: number;
  name: string;
}


interface DataSource {
  id: number;
  title: string;
  image: string | null;
  service: string;
  is_connected: boolean;
  total_connections: number;
  is_active: boolean;
}

interface DataSourcesProps {
  dataSources: DataSource[];
  clients: Client[];
  clientGroups: ClientGroup[];
}
 
interface PageProps {
  totals:any,
  userRole: string,
  profile_type: string,
}    

export default function Dashboard({ dataSources , clients, clientGroups }: DataSourcesProps) {
  const baseUrl = "http://127.0.0.1:8000"    
 // const baseUrl = "https://reportsnew.saltrank.com"
  const [tabData, setTabData] = useState<Record<string, any>>({})
  const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({})
  const { totals,activeRange ,userRole , profile_type  } = usePage<PageProps>().props;
  const [compareEnabled, setCompareEnabled] = useState(false);
  const dashboardRef = useRef(null); 
  const fullPdfRef = useRef(null);
  const [isPdfMode, setIsPdfMode] = useState(false);
  const [range, setRange] = useState("7");
  const [customRange, setCustomRange] = useState(null); 
  const [tempRange, setTempRange] = useState(customRange ?? null);
  const [open1, setOpen1] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [auto7Days, setAuto7Days] = useState(false); // toggle
  // const [selectedClientId, setSelectedClientId] = useState("");
  // const [selectedGroupId, setSelectedGroupId] = useState("");
  const [zoomLevel, setZoomLevel] = useState(7);
  const [startIndex, setStartIndex] = useState(0);
  const [filterKey, setFilterKey] = useState("default");
  const [aiSummary, setAiSummary] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [removeH9, setRemoveH9] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [downloadType, setDownloadType] = useState<"pdf" | "ppt" | "excel">("pdf");
  const [includeAll, setIncludeAll] = useState(false);

  const [summaries, setSummaries] = useState<any[]>([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState<number | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<any | null>(null);
  const [summaryTitle, setSummaryTitle] = useState("");
  const [summaryContent, setSummaryContent] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [currentSourceId, setCurrentSourceId] = useState<number | null>(null);

  const [summaryClientGroupId, setSummaryClientGroupId] = useState<number | "">("");
  const [summaryClientId, setSummaryClientId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { dashboard ,clientName ,groupName } = usePage().props

const [selectedClientId, setSelectedClientId] = useState(
  dashboard?.client_id ? String(dashboard.client_id) : ""
)

const [selectedGroupId, setSelectedGroupId] = useState(
  dashboard?.client_group_id ? String(dashboard.client_group_id) : ""
)






useEffect(() => {
  if (dashboard?.client_id) {
    setSelectedClientId(String(dashboard.client_id))
    fetchData(activeTab, range, null, dashboard.client_id)
  }
  if (dashboard?.client_group_id) {
    setSelectedGroupId(String(dashboard.client_group_id))
    fetchData(activeTab, range, dashboard.client_group_id, null)
  }
}, [])


  const fetchBothTabs = async () => { 
  await Promise.all([ 
  fetchData("overview", range, selectedGroupId, selectedClientId),
    fetchData("analytics", range, selectedGroupId, selectedClientId), 
    fetchData("semrush", range, selectedGroupId, selectedClientId), 
    fetchData("simplifi", range, selectedGroupId, selectedClientId),
    fetchData("call-tracking", range, selectedGroupId, selectedClientId), 
     fetchData("ads", range, selectedGroupId, selectedClientId), 
    ]); 
  };

  const waitForRender = () =>
    new Promise(resolve => {
      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      }, 800);
    });

  const handleSinglePDF = async () => {

    if (!dashboardRef.current) return;
    await generateSinglePDF(dashboardRef.current, activeTab);
  };

  const handleAllPDF = async () => {
    await generateBothTabsPDF(fetchBothTabs, waitForRender);
  };

  const handleSinglePPT = async () => {
    if (!dashboardRef.current) return;
    await generateSinglePPT(dashboardRef.current, activeTab);
  };

  const handleAllPPT = async () => {
    await generateBothTabsPPT(fetchBothTabs, waitForRender);
  };

  const handleOverviewExcel = () => {
    generateOverviewExcel(
      tabData["overview"],
      range,
      filterKey
    );
  };

const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [showPreview, setShowPreview] = useState(false);

const handlePreviewPDF = async () => {
  try {
    setIsGeneratingPDF(true);

    const blob = await previewBothTabsPDF(fetchBothTabs, waitForRender);

    const url = URL.createObjectURL(blob);

    setPreviewUrl(url);
    setShowPreview(true);
  } catch (error) {
    console.error(error);
  } finally {
    setIsGeneratingPDF(false);
  }
};



    const buttonStyle = {
      backgroundColor: "#b45309",
      color: "#ffffff",
      padding: "10px 20px",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "0.3s ease"
    };
    const sectionHeadingStyle = {
      fontSize: "35px",
      fontWeight: "700",
      textAlign: "center",
      marginTop: "40px",
      marginBottom: "30px",
      paddingBottom: "12px",
      borderBottom: "3px solid #000",
      letterSpacing: "1px"
    };
    const sectionHeadingStylesingle = {
      fontSize: "35px",
      fontWeight: "700",
      textAlign: "center",
      marginTop: "40px",
      marginBottom: "30px",
      paddingBottom: "12px",
      borderBottom: "3px solid #000",
      letterSpacing: "1px"
    };

  useEffect(() => {
    setRemoveH9(true);
  }, []);

  
  function handleGroupChange(e) {
      const groupId = e.target.value;
      setSelectedGroupId(groupId);
      setSelectedClientId("");
      if(activeTab == 'simplifi'){
        fetchAiSummary(activeTab, range, groupId, null );
      }
      fetchData(activeTab, range, groupId, null);
  }

  function handleClientChange(e) {
      const clientId = e.target.value;
      setSelectedClientId(clientId);
      setSelectedGroupId(""); 
      if(activeTab == 'simplifi'){
      fetchAiSummary(activeTab, range, null, clientId);
    
      }
        fetchData(activeTab, range, null, clientId);
  }

  const fetchAiSummary = async (tab, selectedRange = range, groupId = null, clientId = null) => {
  if (!clientId && !groupId) return;
    setAiSummaryLoading(true);
    try {
      // previous month (example)
    // const month = dayjs().subtract(1, "month").format("YYYY-MM");
      let url = `${baseUrl}/dashboard/ai-summary?tab=simplifi&range=last_month`;
      if (clientId) {
        url += `&client_id=${clientId}`;
      }
      if (groupId) {
        url += `&group_id=${groupId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setAiSummary(data);
    } catch (err) {
      console.error("AI Summary fetch failed", err);
      setAiSummary(null);
    } finally {
      setAiSummaryLoading(false);
    }
  };


    const fetchData = async (tab, selectedRange = range, groupId = null, clientId = null) => {
      const localFilterKey = (groupId || clientId)
        ? `${groupId || ''}_${clientId || ''}`
        : "default";
        setAiSummary(null);
      setFilterKey(localFilterKey);
      if (tabData[tab]?.[selectedRange]?.[localFilterKey]) return;
      setLoadingTabs(prev => ({ ...prev, [tab]: true }));
      try {
        let data;


      
        if (tab === "ads") {
          const params = new URLSearchParams({
            range: selectedRange,
          });

          if (groupId) params.append("group_id", groupId);
          if (clientId) params.append("client_id", clientId);

          const [
            demographics,
            overview,
            timeseries,
            campaigns,
            keywords,
            searchTerms,
            ads,
            // devices,
             locations,
          
            calls,
          ] = await Promise.all([
            fetch(`${baseUrl}/dashboard/google-ads/demographics?${params}`).then(r => r.json()),
            fetch(`${baseUrl}/dashboard/google-ads/overview?${params}`).then(r => r.json()),
            fetch(`${baseUrl}/dashboard/google-ads/timeseries?${params}`).then(r => r.json()),
            fetch(`${baseUrl}/dashboard/google-ads/campaigns?${params}`).then(r => r.json()),
            fetch(`${baseUrl}/dashboard/google-ads/keywords?${params}`).then(r => r.json()),
            fetch(`${baseUrl}/dashboard/google-ads/search-terms?${params}`).then(r => r.json()),
            fetch(`${baseUrl}/dashboard/google-ads/ads?${params}`).then(r => r.json()),
            // fetch(`${baseUrl}/dashboard/google-ads/devices?${params}`).then(r => r.json()),
            fetch(`${baseUrl}/dashboard/google-ads/locations?${params}`).then(r => r.json()),
          
            fetch(`${baseUrl}/dashboard/google-ads/calls?${params}`).then(r => r.json()),
          ]);

          data = {
            demographics,
            overview,
            timeseries, 
            campaigns,
            keywords,
            searchTerms,
            ads,
            // devices,
             locations,
          
            calls,
          };

        } else  if (tab === "call-tracking") {
        const params = new URLSearchParams({
            range: selectedRange,
          });
        if (groupId) params.append("group_id", groupId);
        if (clientId) params.append("client_id", clientId);
          const [
            currentTS,
            previousTS,
            sources,
            campaign,
            calls
          ] = await Promise.all([
            fetch(`${baseUrl}/dashboard/callrail/timeseries/current?range=${params.toString()}`).then(r => r.json()),
            fetch(`${baseUrl}/dashboard/callrail/timeseries/previous?range=${params.toString()}`).then(r => r.json()),
            fetch(`${baseUrl}/dashboard/callrail/sources?range=${params.toString()}`).then(r => r.json()),
              fetch(`${baseUrl}/dashboard/callrail/campaign?range=${params.toString()}`).then(r => r.json()),
            fetch(`${baseUrl}/dashboard/callrail/calls?range=${params.toString()}`).then(r => r.json()),
          ]);
          data = {
            calls,
            timeseries: {
              current: currentTS,
              previous: previousTS,
            },
            sources,
            campaign,
          };

        } else if (tab === "analytics") {
      const params = new URLSearchParams({
        range: selectedRange,
      });

      if (groupId) params.append("group_id", groupId);
      if (clientId) params.append("client_id", clientId);

      const [
        overview,
        timeseries,
        channels,
        pages,
        events,
        devices,
        locations,
        referrer,
        monthlyAnalytics,
        channelMonthlyAnalytics,
      ] = await Promise.all([
        fetch(`${baseUrl}/dashboard/ga4/overview?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/dashboard/ga4/timeseries?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/dashboard/ga4/channels?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/dashboard/ga4/pages?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/dashboard/ga4/events?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/dashboard/ga4/devices?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/dashboard/ga4/locations?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/dashboard/ga4/referrer?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/dashboard/ga4/monthlyAnalytics?${params}`).then(r => r.json()),
        fetch(`${baseUrl}/dashboard/ga4/channelMonthlyAnalytics?${params}`).then(r => r.json()),
      ]);

      data = {
        overview,
        timeseries,
        channels,
        pages,
        events,
        devices,
        locations,
        referrer,
        monthlyAnalytics,
        channelMonthlyAnalytics,
      };
    } else {
          // 🔁 Existing logic for other tabs
          let url =
            tab === "overview"
              ? `${baseUrl}/dashboard/overview-data?range=${selectedRange}${groupId ? `&group_id=${groupId}` : ''}${clientId ? `&client_id=${clientId}` : ''}`
              : tab === "semrush"
                ? `${baseUrl}/dashboard/semrush?range=${selectedRange}`
                : `${baseUrl}/dashboard/${tab}-data?range=${selectedRange}`;

          if (groupId) url += `&group_id=${groupId}`;
          if (clientId) url += `&client_id=${clientId}`;
          const res = await fetch(url);
          data = await res.json();
        }
        setTabData(prev => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            [selectedRange]: {
              ...(prev[tab]?.[selectedRange] || {}),
              [localFilterKey]: data,
            }
          }
        }));
      } finally {
        setLoadingTabs(prev => ({ ...prev, [tab]: false }));
      }
    };

  // useEffect(() => {
  //   fetchData("overview")
  // }, [])


  console.log('tabData',tabData);

  const searchConsoleRangeData = tabData["search-console"]?.[range] || {};
  const siteArray = searchConsoleRangeData.current_search_console || [];
  const previousDatas = searchConsoleRangeData.previous_search_console || [];
  const siteDataMap = siteArray.reduce((acc, site) => { 
    const siteUrl = site.site_url;
    if (!acc[siteUrl]) {
      acc[siteUrl] = [];
    }
    acc[siteUrl].push(site); 
    return acc;
  }, {});

  const previousDataMap = previousDatas.reduce((acc, site) => {
    const siteUrl = site.site_url;
    if (!acc[siteUrl]) {
      acc[siteUrl] = [];
    }
    acc[siteUrl].push(site); 
    return acc;
  }, {});


  const allStats = Object.values(siteDataMap).flat();
  const previousStats = Object.values(previousDataMap).flat();

  const totalImpressions = allStats.reduce((sum, row) => sum + (row.impressions || 0), 0);
  const totalClicks = allStats.reduce((sum, row) => sum + (row.clicks || 0), 0);
  const uniquePages = new Set(allStats.map(row => row.page_url)).size;
  const totalQueries = allStats.length;

  const prevImpressions = previousStats.reduce((sum, row) => sum + (row.impressions || 0), 0);
  const prevClicks = previousStats.reduce((sum, row) => sum + (row.clicks || 0), 0);
  const prevPages = new Set(previousStats.map(row => row.page_url)).size;
  const prevQueries = previousStats.length;

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

  const trendByDate = {};
    allStats.forEach(row => {
      const date = row.date; 
      const query = row.query;
      const clicks = parseInt(row.clicks) || 0;
      const impressions = parseInt(row.impressions) || 0;

      if (!trendByDate[date]) {
        trendByDate[date] = {
          clicks: 0,
          impressions: 0,
          queries: new Set()
        };
      }
    trendByDate[date].clicks += clicks;
    trendByDate[date].impressions += impressions;
    if (query) trendByDate[date].queries.add(query);
  });

  const chartData1 = Object.entries(trendByDate).map(([date, metrics]) => {
    const d = new Date(date);
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g. "Aug 20"
    return {
      date: formattedDate,
      clicks: metrics.clicks,
      impressions: metrics.impressions,
      queryCount: metrics.queries.size
    };
  });
  const limitedChartData = chartData1.slice(-7);

  // Step 2: Query count trend by Date
  const queryTrendByDate = {};
  allStats.forEach(row => {
    const date = row.date;
    const query = row.query;

    if (!queryTrendByDate[date]) {
      queryTrendByDate[date] = new Set();
    }
    if (query) {
      queryTrendByDate[date].add(query);
    }
  });

  const queryChartData = Object.entries(queryTrendByDate).map(([date, queries]) => {
    const d = new Date(date);
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date: formattedDate,
      queryCount: queries.size
    };
  });
  const limitedQueryData = queryChartData.slice(-7);

// Step 3: Query trend by Day of Week
  const queryTrendByDay = {};
  allStats.forEach(row => {
    const dateStr = row.date;
    const query = row.query;

    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    if (!queryTrendByDay[dayName]) {
      queryTrendByDay[dayName] = new Set();
    }
    if (query) {
      queryTrendByDay[dayName].add(query);
    }
  });

// Ensure fixed weekday order
  const orderedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const queryChartDataByDay = orderedDays.map(day => ({
    day,
    queryCount: queryTrendByDay[day] ? queryTrendByDay[day].size : 0
  }));


// Step 4: Query Table
const formattedQueryData = allStats.map(row => ({
  query: row.query,
  page: row.page_url,
  device: row.device,
  clicks: row.clicks,
  impressions: row.impressions,
  ctr: parseFloat(row.ctr).toFixed(2) + '%',
  position: parseFloat(row.position).toFixed(1),
}));


// Step 5: Device Breakdown
const deviceBreakdown = {
  DESKTOP: { impressions: 0, clicks: 0, positionSum: 0, count: 0 },
  MOBILE: { impressions: 0, clicks: 0, positionSum: 0, count: 0 },
  TABLET: { impressions: 0, clicks: 0, positionSum: 0, count: 0 }
};

allStats.forEach(row => {
  const device = row.device?.toUpperCase(); // normalize
  if (deviceBreakdown[device]) {
    deviceBreakdown[device].impressions += parseInt(row.impressions) || 0;
    deviceBreakdown[device].clicks += parseInt(row.clicks) || 0;
    deviceBreakdown[device].positionSum += parseFloat(row.position) || 0;
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

// Add Totals row
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



const simplifi_data = tabData["simplifi"]?.[range]?.[filterKey] || {};

console.log('tabData',tabData);


// Flatten stats from all campaigns
const allStats_simpli = simplifi_data?.campaigns_with_stats?.flatMap(campaign =>
campaign.stats.map(stat => ({
  date: stat.stat_date,
  impressions: Number(stat.impressions) || 0,
  clicks: Number(stat.clicks) || 0,
}))
) || [];

// Group by date
const groupedStats = allStats_simpli.reduce((acc, { date, impressions, clicks }) => {
  if (!acc[date]) {
    acc[date] = { date, impressions: 0, clicks: 0 };
  }
  acc[date].impressions += impressions;
  acc[date].clicks += clicks;
  return acc;
}, {});

// Convert to array + calculate CTR
const chartData = Object.values(groupedStats).map(d => ({
  ...d,
  impressions: Number(d.impressions) || 0,
  clicks: Number(d.clicks) || 0,
  ctr:
    Number(d.impressions) > 0
      ? (Number(d.clicks) / Number(d.impressions)) * 100
      : 0,
}));

const limitedChartData_simpli = useMemo(() => {
  return [...chartData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}, [chartData]);


  const visibleData = useMemo(() => {
    return limitedChartData_simpli.slice(startIndex, startIndex + zoomLevel);
  }, [limitedChartData_simpli, zoomLevel, startIndex]);

  useEffect(() => {
    setStartIndex(0);
    setZoomLevel(limitedChartData_simpli.length);
  }, [limitedChartData_simpli]);

  const chartContainerRef = useRef(null);


  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();   
      e.stopPropagation();

      if (e.deltaY < 0) {
        setZoomLevel((z) => Math.max(5, z - 5));
      } else {
        setZoomLevel((z) => Math.min(limitedChartData_simpli.length, z + 5));
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [limitedChartData_simpli.length]);

useEffect(() => {
  const today = new Date();

  // End date = yesterday
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Start date = 7 days before today
  const past = new Date(today);
  past.setDate(today.getDate() - 7);

  const sevenDays = {
    from: past,
    to: yesterday,
  };

  const formatted = `${past.toLocaleDateString("en-CA")}:${yesterday.toLocaleDateString("en-CA")}`;

  setCustomRange(sevenDays);
  setTempRange(sevenDays);
  setRange(formatted);

  if (profile_type === "salt_rank_geofencing") {
    const simpliFi = dataSources.find(
      (s) => s.title?.toLowerCase() === "simpli.fi"
    );

    if (simpliFi) {
      setActiveTab(simpliFi.service);
      fetchData(simpliFi.service, formatted, selectedGroupId, selectedClientId);
      return;
    }
  }

  if (auto7Days) {
    fetchData(activeTab, formatted, selectedGroupId, selectedClientId);
  }
}, [auto7Days, profile_type, dataSources]);

    const formatDisplayRange = (range) => {
      if (!range?.from || !range?.to) return "Select the Date";

      const options = { month: "short", day: "2-digit", year: "numeric" };
      const start = range.from.toLocaleDateString("en-US", options);
      const end = range.to.toLocaleDateString("en-US", options);

      return `${start} - ${end}`;
    };

const getDateRangeFromPreset = (preset) => {
  const today = new Date();

  let from;
  let to;

  switch (preset) {
    case "7":
      // Last complete 7 days, excluding today
      to = new Date(today);
      to.setDate(today.getDate() - 1);

      from = new Date(today);
      from.setDate(today.getDate() - 7);
      break;

    case "30":
      // Last complete 30 days, excluding today
      to = new Date(today);
      to.setDate(today.getDate() - 1);

      from = new Date(today);
      from.setDate(today.getDate() - 30);
      break;

    case "this_month":
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today);
      break;

    case "last_month":
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      to = new Date(today.getFullYear(), today.getMonth(), 0);
      break;

    default:
      return null;
  }

  return { from, to };
};
  const callRailData =
    tabData["call-tracking"]?.[range]?.[filterKey] ?? null;

  const analytics =
    tabData["analytics"]?.[range]?.[filterKey] ?? null;

      const googleads =
    tabData["ads"]?.[range]?.[filterKey] ?? null;


   

const loadSummaries = async () => {
  const res = await axios.get("/dashboard/tab-summaries", {
    params: {
      tab_key: activeTab,
      data_source_id: currentSourceId,
      client_group_id: selectedGroupId || null,
      client_id: selectedClientId || null,
    },
  });

  const data = res.data;

  setSummaries(data);

  // 🔥 Auto-select first summary if exists
  if (data.length > 0) {
    setSelectedSummaryId(data[0].id);
    setSelectedSummary(data[0]);
  } else {
    setSelectedSummaryId(null);
    setSelectedSummary(null);
  }
};


// useEffect(() => {
//   loadSummaries();
// }, [activeTab, selectedGroupId, selectedClientId]);

const saveSummary = async () => {
  try {

    const selectedClient = clients.find(
      c => Number(c.id) === Number(summaryClientId)
    );

    const selectedGroup = clientGroups.find(
      g => Number(g.id) === Number(summaryClientGroupId)
    );

    const isEditing = !!selectedSummaryId; // safer check

    const response = await axios.post("/dashboard/tab-summary", {
      id: isEditing ? selectedSummaryId : null,
      tab_key: activeTab,
      data_source_id: currentSourceId,
      client_group_id: summaryClientGroupId || null,
      client_id: summaryClientId || null,
      client_name: selectedClient?.company_name || null,
      client_group_name: selectedGroup?.name || null,
      title: summaryTitle,
      summary: summaryContent,
      start_date: startDate || null,
      end_date: endDate || null,
    });

    const savedSummary = response.data.summary;

    if (isEditing) {
      setSummaries(prev =>
        prev.map(s =>
          s.id === savedSummary.id ? savedSummary : s
        )
      );
    } else {
      setSummaries(prev => [savedSummary, ...prev]);
      setSelectedSummaryId(savedSummary.id);
    }

    setSelectedSummary(savedSummary);
    setShowEditor(false);

  } catch (error) {
    console.error("Error saving summary:", error);
  }

};

const formatDate = (dateString) => {
  if (!dateString) return "";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

return (

     <AppLayout breadcrumbs={breadcrumbs}>

      {open && <AIPopup onClose={() => setOpen(false)} />}
      <style>{`

.flex.flex-col.items-end {
    display: contents;
}
          .flex.items-center.gap-3 {
                margin-left: 15px;
                margin-top: -23px;
            }
            svg.lucide.lucide-star.text-orange-400.ml-2 {
                display: none;
            }

            .flex.flex-col.items-end.gap-2.-mt-10 {
                display: ruby;
            }
          .tab-menu-bar {
              flex-wrap: wrap;
              justify-content: start !important;
          }
              
          .tab-menu-bar button {
              max-width: fit-content !important;
          }
          `}</style>

        {!aiSummaryLoading && Array.isArray(aiSummary) && aiSummary.length > 0 && (
          <>
            {aiSummary.map((summary) => (
              <div
                key={summary.id}
                className="mb-4 p-4 bg-gray-50 border rounded"
              >
                <h3 className="font-semibold mb-3">
                  AI Summary – {summary.month}
                </h3>

                <div className="space-y-2 text-sm text-gray-700">
                  {summary.summary_text
                    .split(/\n\s*-\s*/)
                    .filter(line => line.trim() !== "")
                    .map((line, index) => (
                      <div key={index}>- {line.trim()}</div>
                    ))}
                </div>
              </div>
            ))}
          </>
        )}

      <div
        style={{
          padding: "12px 16px",
          cursor: isGeneratingPDF ? "not-allowed" : "pointer",
          opacity: isGeneratingPDF ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        {isGeneratingPDF && (
          <div
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid #ccc",
              borderTop: "2px solid #f97316",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}
          />
        )}

        {isGeneratingPDF ? "Generating Preview..." : ""}
      </div>

      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] h-[90%] rounded-lg shadow-lg flex flex-col">

            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">PDF Preview</h3>

              <div className="flex gap-3">
                <a
                  href={previewUrl}
                  download="dashboard_report.pdf"
                  className="bg-orange-500 text-white px-4 py-2 rounded"
                >
                  Download
                </a>

                <button
                  onClick={() => {
                    setShowPreview(false);
                    URL.revokeObjectURL(previewUrl);
                  }}
                  className="border px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1">
              <iframe
                src={previewUrl}
                className="w-full h-full"
              />
            </div>

          </div>
        </div>
      )}


        {showEditor && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

            <div className="bg-white p-6 rounded-lg w-[750px] shadow-xl">

              {/* TITLE */}
                  <label className="block text-sm mb-1 font-medium">
                  Title
                  </label>
              <input
                type="text"
                placeholder="Executive Summary Title"
                value={summaryTitle}
                onChange={(e) => setSummaryTitle(e.target.value)}
                className="border p-2 w-full mb-4 rounded"
              />
              {/* DATE GRID */}
              <div className="grid grid-cols-2 gap-4 mb-4">

                <div>
                  <label className="block text-sm mb-1 font-medium">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>
              {/* CLIENT + GROUP GRID */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Assign Client */}
                <div>
                  <label className="block text-sm mb-1 font-medium">
                    Assign Summary to Client
                  </label>
                  <select
                    className="border p-2 rounded w-full"
                    value={summaryClientId}
                    onChange={(e) => {
                      setSummaryClientId(
                        e.target.value ? Number(e.target.value) : ""
                      );
                      setSummaryClientGroupId(""); // optional exclusive logic
                    }}
                  >
                    <option value="">Select a Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assign Group */}
                <div>
                  <label className="block text-sm mb-1 font-medium">
                    Or Assign to Client Group
                  </label>
                  <select
                    className="border p-2 rounded w-full"
                    value={summaryClientGroupId}
                    onChange={(e) => {
                      setSummaryClientGroupId(
                        e.target.value ? Number(e.target.value) : ""
                      );
                      setSummaryClientId(""); // optional exclusive logic
                    }}
                  >
                    <option value="">Select a Client Group</option>
                    {clientGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* SUMMARY TEXT */}
              <textarea
                rows={8}
                value={summaryContent}
                onChange={(e) => setSummaryContent(e.target.value)}
                className="border p-2 w-full mb-4 rounded"
                placeholder="Enter your Executive Summary here..."
              />

              {/* BUTTONS */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  className="bg-orange-500 text-white px-4 py-2 rounded"
                  onClick={saveSummary}
                >
                  Save
                </button>
              </div>

            </div>
          </div>
        )}


       <Head title='Dashboard Single' />
       
          <div className="flex flex-1 flex-col gap-4 rounded-xl p-4">
                {/* HEADER */}
                <div className="flex w-full justify-between items-start mb-4">

                  {/* LEFT: TITLE */}
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold">
                      {dashboard?.name}
                    </h2>

                    {(clientName || groupName) && (
                      <>
                        <span className="text-gray-500 text-lg">| Viewing</span>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
                          {clientName ?? groupName}
                        </span>
                        <span className="text-gray-500 text-lg">Data</span>
                      </>
                    )}

                    <Star className="text-orange-400 ml-2" />
                      {/* TOP ROW: FILTERS + SHARE */}
                    <div className="flex items-center gap-3">

                      {(userRole === "Super Admin" || userRole === "Agent") && (
                        <>
                          <select
                            className="border p-2 rounded text-sm"
                            value={selectedGroupId}
                            onChange={handleGroupChange}
                          >
                            <option value="">Select Client Group</option>
                            {clientGroups.map(group => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>

                          <select
                            className="border p-2 rounded text-sm"
                            value={selectedClientId}
                            onChange={handleClientChange}
                          >
                            <option value="">Select Client</option>
                            {clients.map(client => (
                              <option key={client.id} value={client.id}>
                                {client.company_name}
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      {/* KEEP YOUR SHARE BUTTON EXACT */}
                      <div style={{ position: "relative", paddingBottom: "10px" }}>
                        <button
                          style={{
                            background: "#e78645",
                            color: "#fff",
                            padding: "5px 12px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            marginTop: "9px",
                          }}
                          onClick={() => setShowMenu(!showMenu)}
                        >
                          Share
                        </button>

                        {showMenu && (
                          <div
                            style={{
                              position: "absolute",
                              right: 0,
                              top: "45px",
                              background: "#fff",
                              borderRadius: "8px",
                              boxShadow: "0 5px 15px rgba(0,0,0,0.15)",
                              width: "220px",
                              zIndex: 1000
                            }}
                          >
                            <div
                              style={{ padding: "12px 16px", cursor: "pointer" }}
                              onClick={() => {
                                setShowMenu(false);
                                setShowModal(true);
                              }}
                            >
                              Quick Download
                            </div>

                            <div
                              style={{ padding: "12px 16px", cursor: "pointer" }}
                              onClick={() => {
                                setShowMenu(false);
                                handlePreviewPDF();
                              }}
                            >
                              Build PDF Report
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* RIGHT SIDE */}
             <div className="flex flex-col items-end gap-2 -mt-10">

                  
                    {/* DATE + PRESETS */}
                    <div className="flex flex-col items-end">

                      {/* DATE PICKER */}
                      <div className="flex items-center gap-3">
                        <Popover open={open1} onOpenChange={setOpen1}>
                          <PopoverTrigger asChild>
                            <button
                                className={`text-sm font-semibold border-b-2 ${
                                  customRange
                                    ? "text-black text-gray-700"
                                    : "text-gray-400 border-transparent"  
                                }`}
                              >
                              {formatDisplayRange(customRange)}
                            </button>
                          </PopoverTrigger>

                           <PopoverContent className="p-2 rounded-xl shadow-xl border bg-white w-auto">
                                    <div className="flex flex-col gap-3">

                                      <Calendar
                                        mode="range"
                                        numberOfMonths={2}
                                        selected={tempRange}
                                        onSelect={setTempRange}
                                        className="rounded-md border shadow-sm"
                                        classNames={{
                                          day_selected: "bg-primary text-white hover:bg-primary hover:text-white",
                                          day_today: "bg-muted text-primary font-semibold",
                                          day: "w-9 h-9 p-0 text-sm hover:bg-accent hover:text-accent-foreground rounded-md",
                                          head_cell: "text-xs text-muted-foreground font-medium",
                                          nav_button: "h-7 w-7 bg-transparent hover:bg-accent hover:text-accent-foreground rounded-md",
                                          caption: "text-sm font-semibold text-center mb-2",
                                        }}
                                      />

                                      {/* Buttons */}
                                      <div className="flex justify-end gap-2 px-1 pb-1">
                                        <button
                                          className="px-3 py-1 text-xs rounded-md border bg-gray-100 hover:bg-gray-200"
                                          onClick={() => setOpen1(false)}
                                        >
                                          Cancel
                                        </button>

                                        <button
                                          disabled={!tempRange?.from || !tempRange?.to}
                                          className="px-3 py-1 text-xs rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-40"
                                          onClick={() => {
                                            const start = tempRange.from.toLocaleDateString("en-CA");
                                            const end = tempRange.to.toLocaleDateString("en-CA");
                                            const formatted = `${start}:${end}`;

                                            setCustomRange(tempRange);
                                            setRange(formatted);

                                            fetchData(activeTab, formatted, selectedGroupId, selectedClientId);

                                            setOpen1(false); // close popover
                                          }}
                                        >
                                          Apply
                                        </button>
                                      </div>

                                    </div>
                                  </PopoverContent>
                        </Popover>
                      </div>

                      {/* PRESETS */}
                      <div className="flex items-center mt-1.5 gap-3">
                        {["7", "30", "this_month", "last_month"].map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              const dateRange = getDateRangeFromPreset(r);
                              setCustomRange(dateRange);
                              setTempRange(dateRange);
                              setRange(r);
                              fetchData(activeTab, r, selectedGroupId, selectedClientId);
                            }}
                            className={`text-xs border-b-2 ${
                              range === r
                                ? "text-primary border-b-primary"
                                : "text-gray-600 border-b-transparent"
                            }`}
                          >
                            {r === "7"
                              ? "7 Days"
                              : r === "30"
                              ? "30 Days"
                              : r === "this_month"
                              ? "This Month"
                              : "Last Month"}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

              {showModal && (
                  <div
                    style={{
                      position: "fixed",
                      display: "flex",
                      inset: 0,
                      background: "rgba(0,0,0,0.5)",
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 2000
                    }}
                  >
                    <div
                      style={{
                        background: "#fff",
                        padding: "30px",
                        borderRadius: "12px",
                        width: "400px"
                      }}
                    >
                      <h3 style={{ marginBottom: "20px" }}>Quick Download</h3>

                      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                        <button
                          onClick={() => setDownloadType("pdf")}
                          style={{
                            flex: 1,
                            padding: "10px",
                            borderRadius: "6px",
                            border: downloadType === "pdf" ? "2px solid #c46a2f" : "1px solid #ddd",
                            background: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          PDF
                        </button>
                        <button
                            onClick={() => setDownloadType("excel")}
                              style={{
                            flex: 1,
                            padding: "10px",
                            borderRadius: "6px",
                            border: downloadType === "excel" ? "2px solid #c46a2f" : "1px solid #ddd",
                            background: "#fff",
                            cursor: "pointer"
                          }}
                          >
                            Excel
                          </button>
                        <button
                          onClick={() => setDownloadType("ppt")}
                          style={{
                            flex: 1,
                            padding: "10px",
                            borderRadius: "6px",
                            border: downloadType === "ppt" ? "2px solid #c46a2f" : "1px solid #ddd",
                            background: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          PowerPoint
                        </button>

                      </div>

                      <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <input
                            type="checkbox"
                            checked={includeAll}
                            onChange={(e) => setIncludeAll(e.target.checked)}
                          />
                          Include all sections in download?
                        </label>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                          onClick={() => setShowModal(false)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "6px",
                            border: "1px solid #ddd",
                            background: "#fff"
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          onClick={async () => {
                            setShowModal(false);

                            if (downloadType === "pdf") {
                              if (includeAll) {
                                await handleAllPDF();
                              } else {
                                await handleSinglePDF();
                              }
                            }

                            if (downloadType === "ppt") {
                              if (includeAll) {
                                await handleAllPPT();
                              } else {
                                await handleSinglePPT();
                              }
                            }

                        if (downloadType === "excel") {
                          handleOverviewExcel();
                        }

                          }}
                          style={{
                            padding: "8px 18px",
                            borderRadius: "6px",
                            background: "#c46a2f",
                            color: "#fff",
                            border: "none"
                          }}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

      <Tabs value={activeTab}
       defaultValue={profile_type === "salt_rank_geofencing" ? undefined : "overview"} onValueChange={(tab) => {
              setActiveTab(tab);
              const source = dataSources.find(
                (s) => s.service === tab
              );
              const sourceId = source?.id ?? null;
              setCurrentSourceId(sourceId);
              fetchData(tab, range, selectedGroupId, selectedClientId);
              loadSummaries(tab, sourceId);
              setSelectedSummary(null);
        }} className="w-full">
          <TabsList className="bg-transparent tab-menu-bar !h-auto !min-h-0">
            {profile_type === "salt_rank_geofencing" ? (
              // Show only Simpli.fi for salt_rank_geofencing
              dataSources
                .filter((source) => source.title?.toLowerCase() === "simpli.fi")
                .map((source) => (
                  <TabsTrigger
                    key={source.id}
                    value={source.service}
                    className="tab-custom-class border-0 px-3"
                  >
                    <img
                      className="w-4 h-4 rounded-full mr-2"
                      src={
                        source.image
                          ? `${baseUrl}/images/${source.image}`
                          : `${baseUrl}/placeholder.svg`
                      }
                      alt={source.title}
                    />
                    {source.title}
                  </TabsTrigger>
                ))
            ) : (
              <>
                {/* Always show Overview for other profile types */}
                <TabsTrigger value="overview" className="tab-custom-class border-0">
                  Overview
                </TabsTrigger>

                {/* Show all data sources */}
                {dataSources.map((source) => (
                  <TabsTrigger
                    key={source.id}
                    value={source.service}
                    className="tab-custom-class border-0 px-3"
                  >
                    <img
                      className="w-4 h-4 rounded-full mr-2"
                      src={
                        source.image
                          ? `${baseUrl}/images/${source.image}`
                          : `${baseUrl}/placeholder.svg`
                      }
                      alt={source.title}
                    />
                    {source.title}
                  </TabsTrigger>
                ))}
              </>
            )}
          </TabsList>

                {selectedSummary && (
                <div className="bg-white border rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-start p-4 bg-gray-50 relative group">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {selectedSummary.title}
                    </h3>

                    <div className="text-sm text-gray-600">
                      {selectedSummary.client_group_name
                        ? `Client Group: ${selectedSummary.client_group_name}`
                        : selectedSummary.client_name
                        ? `Client: ${selectedSummary.client_name}`
                        : ""}
                    </div>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="flex items-center gap-3">

                    {/* Date */}
                    {(selectedSummary.start_date && selectedSummary.end_date) && (
                      <div className="text-sm text-gray-500 mr-4">
                        {formatDate(selectedSummary.start_date)} to {formatDate(selectedSummary.end_date)}
                      </div>
                    )}

                    {/* Edit */}
                    <div className="relative group">
                      <button
                   onClick={() => {
                      setSelectedSummaryId(selectedSummary.id); // MUST be set
                      setSummaryTitle(selectedSummary.title);
                      setSummaryContent(selectedSummary.summary);
                      setSummaryClientId(selectedSummary.client_id || "");
                      setSummaryClientGroupId(selectedSummary.client_group_id || "");
                      setStartDate(selectedSummary.start_date || "");
                      setEndDate(selectedSummary.end_date || "");
                      setShowEditor(true);
                    }}
                        className="bg-orange-100 hover:bg-orange-200 p-2 rounded"
                      >
                        ✏️
                      </button>

                      {/* Tooltip */}
                      <div className="absolute right-0 mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded">
                        Edit Summary
                      </div>
                    </div>

                    {/* Delete */}
                    <div className="relative group">
                      <button
                        onClick={async () => {
                          await axios.delete(`/dashboard/tab-summary/${selectedSummary.id}`);
                          setSelectedSummary(null);
                          setSelectedSummaryId(null);
                          loadSummaries();
                        }}
                        className="bg-red-100 hover:bg-red-200 p-2 rounded"
                      >
                        🗑
                      </button>

                      {/* Tooltip */}
                      <div className="absolute right-0 mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded">
                        Delete Summary
                      </div>
                    </div>

                  </div>
                </div>
                  {/* Body */}
                  <div
                    className="p-4 border-t text-gray-700"
                    dangerouslySetInnerHTML={{ __html: selectedSummary.summary }}
                  />
                </div>
              )}

              {summaries.length === 0 ? (
                <div className="bg-gray-100 rounded-lg p-8 text-center mb-6">
                  <p className="text-gray-600 mb-4">
                    Let’s get started by adding an executive summary to this section.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSummaryId(null);
                      setSelectedSummary(null);
                      setSummaryTitle("");
                      setSummaryContent("");
                      setSummaryClientId("");
                      setSummaryClientGroupId("");
                      setStartDate("");
                      setEndDate("");
                      setShowEditor(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-medium"
                  >
                    ADD AN EXECUTIVE SUMMARY
                  </button>
                </div>

              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <select
                    value={selectedSummaryId ?? ""}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const selected = summaries.find(s => s.id === id);

                      setSelectedSummaryId(id);
                      setSelectedSummary(selected || null);
                    }}
                    className="border rounded px-3 py-2"
                  >
                    <option value="">Select Summary</option>
                    {summaries.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setSelectedSummaryId(null);
                      setSelectedSummary(null);
                      setSummaryTitle("");
                      setSummaryContent("");
                      setSummaryClientId("");
                      setSummaryClientGroupId("");
                      setStartDate("");
                      setEndDate("");
                      setShowEditor(true);
                    }}
                    className="bg-orange-500 text-white px-3 py-2 rounded"
                  >
                    Add
                  </button>
                  {selectedSummaryId && (
                    <button
                      onClick={async () => {
                        await axios.delete(`/dashboard/tab-summary/${selectedSummaryId}`);
                        setSelectedSummaryId(null);
                        setSelectedSummary(null);
                        loadSummaries();
                      }}
                      className="bg-red-500 text-white px-3 py-2 rounded"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}



         <TabsContent value="simplifi" className="border-t-2 px-4 py-6">
            <div ref={dashboardRef} className="dashboard-content">
          {/* Loader or Content */}
                {loadingTabs["simplifi"] ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
            

                   {/* <SimplifiKPIWidget
                      simplifi_data={simplifi_data}
                      getChangePercentage={getChangePercentage}
                      formatCompact={formatCompact}
                    /> */}


                 <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>Key Performance Indicators working </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">
                      <StatCard
                        title="Impressions"
                        current={(simplifi_data?.totals?.current?.impressions || 0).toLocaleString()}
                        percentage={getChangePercentage(
                          simplifi_data?.totals?.current?.impressions || 0,
                          simplifi_data?.totals?.previous?.impressions || 0
                        )}
                        previous={`vs ${formatCompact(simplifi_data?.totals?.previous?.impressions || 0)} prev.`}
                      />

                      <StatCard
                        title="Clicks"
                        current={(simplifi_data?.totals?.current?.clicks || 0).toLocaleString()}
                        percentage={getChangePercentage(
                          simplifi_data?.totals?.current?.clicks || 0,
                          simplifi_data?.totals?.previous?.clicks || 0
                        )}
                        previous={`vs ${formatCompact(simplifi_data?.totals?.previous?.clicks || 0)} prev.`}
                      />

                      <StatCard
                        title="CTR"
                        current={`${((simplifi_data?.totals?.current?.ctr || 0) * 100).toFixed(2)}%`}
                        percentage={getChangePercentage(
                          simplifi_data?.totals?.current?.ctr || 0,
                          simplifi_data?.totals?.previous?.ctr || 0
                        )}
                        previous={`vs ${((simplifi_data?.totals?.previous?.ctr || 0) * 100).toFixed(2)}% prev.`}
                      />
                      
                      <StatCard
                        title="Walk-Ins"
                        current={(simplifi_data?.totals?.current?.walkIns || 0).toLocaleString()}
                        percentage={getChangePercentage(
                          simplifi_data?.totals?.current?.walkIns || 0,
                          simplifi_data?.totals?.previous?.walkIns || 0
                        )}
                        previous={`vs ${formatCompact(simplifi_data?.totals?.previous?.walkIns || 0)} prev.`}
                      />
                    </div>

                           <div className="grid grid-cols-12 gap-6 mt-6">
                               <div className="col-span-12 lg:col-span-6">
                                <WalkInsChart simplifi_data={simplifi_data} />
                              </div>
                                    {/* ================= RIGHT COLUMN ================= */}
                                  <div className="col-span-12 lg:col-span-6">
                                    <div
                                      ref={chartContainerRef}
                                      tabIndex={0}
                                      className="bg-white rounded-xl border border-gray-200 p-6 h-full"
                                      style={{
                                        overscrollBehaviorY: "none",
                                        overscrollBehaviorX: "none",
                                        touchAction: "none",
                                        cursor: "zoom-in",
                                      }}
                                    >
                                      <h3 className="text-lg font-semibold mb-4 text-gray-800">
                                        Performance Trend Over Time
                                      </h3>

                                      <ResponsiveContainer width="100%" height={350}>
                                        <ComposedChart data={visibleData}>
                                          
                                          <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 12 }}
                                            angle={-35}
                                            textAnchor="end"
                                            height={60}
                                          />

                                          <YAxis
                                            yAxisId="impressions"
                                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                          />

                                          <YAxis
                                            yAxisId="clicks"
                                            orientation="right"
                                          />

                                          <YAxis
                                            yAxisId="ctr"
                                            orientation="right"
                                            hide
                                          />

                                          <Tooltip
                                            formatter={(value, name) => {
                                              if (name === "CTR") return `${(value * 100).toFixed(2)}%`;
                                              return value.toLocaleString();
                                            }}
                                          />

                                          <Legend verticalAlign="top" />

                                          <Bar
                                            yAxisId="impressions"
                                            dataKey="impressions"
                                            fill="#f36201"
                                            barSize={22}
                                            radius={[4, 4, 0, 0]}
                                          />

                                          <Bar
                                            yAxisId="clicks"
                                            dataKey="clicks"
                                            fill="#000000"
                                            barSize={22}
                                            radius={[4, 4, 0, 0]}
                                          />

                                          <Line
                                            yAxisId="ctr"
                                            type="monotone"
                                            dataKey="ctr"
                                            stroke="#7f8c8d"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                          />

                                        </ComposedChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                          </div>                                              
                    <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>Campaign Performance </h3>
                        <div className="overflow-x-auto mt-6">
                                      <div className="overflow-x-auto">
                                        <div className="overflow-x-auto mt-6">
                                            { <PaginatedCampPerfomance Performance={simplifi_data?.campaign_performance} /> }
                                          </div>
                                      </div>
                                  </div>
                        <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>Geofence Performance </h3>
                          <div className="overflow-x-auto mt-6">
                              <div className="overflow-x-auto">
                                <div className="overflow-x-auto mt-6">
                                      { <PaginatedCampaignStatsTable stats={simplifi_data?.simplifi_ads_data} /> }
                                  </div>
                              </div>
                          </div>

                      <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>Ad Performance </h3>
                       <div className="relative p-12 shadow-2xl my-12 rounded-2xl">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold mb-4">Campaign Ads</h1>
                            <div className="overflow-x-auto">
                               { <PaginatedAdsTable ads={simplifi_data?.simplifi_ads_data} />  }
                            </div>
                        </div>
                      </div>
                        </>
              )}
            </div>
        </TabsContent>

          <TabsContent value="overview" className="border-t-2 px-4 py-6">
              <div ref={dashboardRef} className="dashboard-content">
                {isPdfMode && (
                  <h2 style={sectionHeadingStylesingle}>Overview</h2>
                )}

            {loadingTabs["overview"] ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {!tabData["overview"] ? (
                  <p>No overview data</p>
                ) : (
                  <OverviewSaltData
                    overviewData={tabData["overview"]}
                    range={range}
                    filterKey={filterKey}
                  />
                )}
              </>
            )}
            </div>
          </TabsContent>


             <TabsContent value="ads" className="border-t-2 px-4 py-6">
                  <div ref={dashboardRef} className="dashboard-content">
              {loadingTabs["ads"] ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                  <>
                        {!googleads ? (
                          <p></p>
                        ) : (
                          <GoogleAds data={googleads} />
                        )}
                        </>
                  )}
                  </div>
             </TabsContent>


          <TabsContent value="semrush" className="border-t-2 px-4 py-6">
            <div ref={dashboardRef} className="dashboard-content">
             {loadingTabs["semrush"] ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-spin" />
                  </div>
                ) : (
                 <>
                      {!tabData["semrush"] ? (
                        <p></p>
                      ) : (
                      <PaginatedSemrushTable semrushData={tabData["semrush"]}  filterKey={filterKey}  range={range}/>
                      )}
                       </>
                )}
                </div>
          </TabsContent>
   
            <TabsContent value="call-tracking" className="border-t-2 px-4 py-6">
               <div ref={dashboardRef} className="dashboard-content">
                {loadingTabs["call-tracking"] ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-spin" />
                      </div>
                    ) : (
                    <>
                          <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>Call Tracking  </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl"></div>

                          {!callRailData ? (
                            <p></p>
                          ) : (
                            <CallRailCalls data={callRailData} />
                          )}
                          </>
                    )}
                  </div>
            </TabsContent>

             <TabsContent value="analytics" className="border-t-2 px-4 py-6">
                  <div ref={dashboardRef} className="dashboard-content">
              {loadingTabs["analytics"] ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                  <>
                      
                        {!analytics ? (
                          <p></p>
                        ) : (
                          <GoogleAnalytics data={analytics} />
                        )}
                        </>
                  )}
                  </div>
             </TabsContent>



            <TabsContent value="sheets" className="border-t-2 px-4 py-6">
                <h2> sheet data</h2>
              {loadingTabs["sheets"]
                ? <p>Loading...</p>
                : <pre>{JSON.stringify(tabData["sheets"], null, 2)}</pre>}
            </TabsContent>
            <TabsContent value="facebook_insights" className="border-t-2 px-4 py-6">
                <h2> facebook data</h2>
              {loadingTabs["facebook_insights"]
                ? <p>Loading...</p>
                : <pre>{JSON.stringify(tabData["facebook_insights"], null, 2)}</pre>}
            </TabsContent>
            <TabsContent value="facebook_ads" className="border-t-2 px-4 py-6">
                <h2> fbads data</h2>
              {loadingTabs["facebook_ads"]
                ? <p>Loading...</p>
                : <pre>{JSON.stringify(tabData["facebook_ads"], null, 2)}</pre>}
            </TabsContent>
            <TabsContent value="search-console" className="border-t-2 px-4 py-6">
                <h2> facebook data</h2>
              {loadingTabs["search-console"]
                ? <p>Loading...</p>
                : <pre>{JSON.stringify(tabData["search-console"], null, 2)}</pre>}
            </TabsContent>


          </Tabs>



              <div
                ref={fullPdfRef}
                style={{
                  position: "fixed",
                  left: "-9999px",
                  top: 0,
                  width: "1200px",
                  background: "#ffffff",
                }}
              >
                <div className="pdf-section">
                    <h2 style={sectionHeadingStyle}>Overview</h2>
                    {loadingTabs["overview"] ? (
                      <div className="flex justify-center items-center h-64">
                          <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <>
                          {!tabData["overview"] ? (
                            <p>No overview data</p>
                          ) : (
                            <OverviewSaltData
                              overviewData={tabData["overview"]}
                              range={range}
                              filterKey={filterKey}
                            />
                          )}
                        </>
                      )}
                </div>
                <div className="pdf-section">
                  <h2 style={sectionHeadingStyle}>Analytics</h2>
                          {loadingTabs["analytics"] ? (
                            <div className="flex justify-center items-center h-64">
                              <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                          <>
                                {!analytics ? (
                                  <p></p>
                                ) : (
                                  <GoogleAnalytics data={analytics} />
                                )}
                                </>
                          )}
                </div>     
                <div className="pdf-section">
                     <h2 style={sectionHeadingStyle}>google ads</h2>

                      {loadingTabs["ads"] ? (
                            <div className="flex justify-center items-center h-64">
                              <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                          <>
                                {!googleads ? (
                                  <p></p>
                                ) : (
                                  <GoogleAds data={googleads} />
                                )}
                                </>
                          )}

                </div>    


                <div className="pdf-section">
                    <h2 style={sectionHeadingStyle}>Semrush</h2>
                    {/* SEMRUSH */}
                    {tabData["semrush"]?.[range]?.[filterKey] && (
                      <PaginatedSemrushTable
                        semrushData={tabData["semrush"]}
                        filterKey={filterKey}
                        range={range}
                      />
                    )}
                  </div>
                  <div className="pdf-section">        
                    <h2 style={sectionHeadingStyle}>Simplifi</h2>

                            {/* Loader or Content */}
                      {loadingTabs["simplifi"] ? (
                        <div className="flex justify-center items-center h-64">
                          <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <>
                          <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>
                            Key Performance Indicators working
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">
                            <StatCard
                              title="Impressions"
                              current={(simplifi_data?.totals?.current?.impressions || 0).toLocaleString()}
                              percentage={getChangePercentage(
                                simplifi_data?.totals?.current?.impressions || 0,
                                simplifi_data?.totals?.previous?.impressions || 0
                              )}
                              previous={`vs ${formatCompact(simplifi_data?.totals?.previous?.impressions || 0)} prev.`}
                            />

                            <StatCard
                              title="Clicks"
                              current={(simplifi_data?.totals?.current?.clicks || 0).toLocaleString()}
                              percentage={getChangePercentage(
                                simplifi_data?.totals?.current?.clicks || 0,
                                simplifi_data?.totals?.previous?.clicks || 0
                              )}
                              previous={`vs ${formatCompact(simplifi_data?.totals?.previous?.clicks || 0)} prev.`}
                            />

                            <StatCard
                              title="CTR"
                              current={`${((simplifi_data?.totals?.current?.ctr || 0) * 100).toFixed(2)}%`}
                              percentage={getChangePercentage(
                                simplifi_data?.totals?.current?.ctr || 0,
                                simplifi_data?.totals?.previous?.ctr || 0
                              )}
                              previous={`vs ${((simplifi_data?.totals?.previous?.ctr || 0) * 100).toFixed(2)}% prev.`}
                            />

                            <StatCard
                              title="Walk-Ins"
                              current={(simplifi_data?.totals?.current?.walkIns || 0).toLocaleString()}
                              percentage={getChangePercentage(
                                simplifi_data?.totals?.current?.walkIns || 0,
                                simplifi_data?.totals?.previous?.walkIns || 0
                              )}
                              previous={`vs ${formatCompact(simplifi_data?.totals?.previous?.walkIns || 0)} prev.`}
                            />
                          </div>

                            <div
                              ref={chartContainerRef}
                              tabIndex={0}
                              className="overflow-x-auto mt-6"
                              style={{
                                overscrollBehavior: "contain",
                                touchAction: "pan-x pan-y",
                                cursor: "default",
                              }}
                            >
                            <ResponsiveContainer width="100%" height={350}>
                              <ComposedChart data={visibleData}>
                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 12 }}
                                  angle={-35}
                                  textAnchor="end"
                                  height={50}
                                />

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

                                <Bar
                                  yAxisId="impressions"
                                  dataKey="impressions"
                                  fill="#f36201"
                                  name="Impressions"
                                  barSize={25}
                                />

                                <Bar
                                  yAxisId="clicks"
                                  dataKey="clicks"
                                  fill="#000000"
                                  name="Clicks"
                                  barSize={25}
                                />

                                <Line
                                  yAxisId="ctr"
                                  type="monotone"
                                  dataKey="ctr"
                                  stroke="#7f8c8d"
                                  strokeWidth={2}
                                  dot={{ r: 4 }}
                                  activeDot={{ r: 6 }}
                                  name="CTR"
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                          <WalkInsChart simplifi_data={simplifi_data} />
                          <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>
                            Campaign Performance
                          </h3>
                          <div className="overflow-x-auto mt-6">
                            <PaginatedCampPerfomance Performance={simplifi_data?.campaign_performance} />
                          </div>

                          <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>
                            Geofence Performance
                          </h3>
                          <div className="overflow-x-auto mt-6">
                            <PaginatedCampaignStatsTable stats={simplifi_data?.simplifi_ads_data} />
                          </div>

                          <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>
                            Ad Performance
                          </h3>
                          <div className="relative p-12 shadow-2xl my-12 rounded-2xl">
                            <div className="p-6">
                              <h1 className="text-2xl font-bold mb-4">Campaign Ads</h1>
                              <div className="overflow-x-auto">
                                <PaginatedAdsTable ads={simplifi_data?.simplifi_ads_data} />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                </div>
                <div className="pdf-section">
                      <h2 style={sectionHeadingStyle}>Call Tracking </h2>
                      {/* CALL TRACKING */}
                      {tabData["call-tracking"]?.[range]?.[filterKey] && (
                        <>
                          <h3 className="font-bold text-4xl text-center bg-black text-white py-2.5">
                            Call Tracking
                          </h3>
                          <CallRailCalls
                            data={
                              tabData["call-tracking"]?.[range]?.[filterKey]
                            }
                          />
                        </>
                      )}
                  </div>
           </div>

    </AppLayout>
  )
}




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



