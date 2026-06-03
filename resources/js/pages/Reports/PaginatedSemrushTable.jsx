import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, PieChart, Pie, Cell, ComposedChart,CartesianGrid,AreaChart , Area, Legend,LabelList, Line, LineChart, ResponsiveContainer, XAxis, YAxis,Tooltip } from "recharts";
import React, { useState } from 'react';

import KeywordRankDistribution from "./semrush/KeywordRankDistribution";
import Page1KeywordsComparison from "./semrush/Page1KeywordsComparison";
import KeywordRankDistributionBar from "./semrush/KeywordRankDistributionBar";
import WebsitePerformanceVsCompetitors from "./semrush/WebsitePerformanceVsCompetitors";
import ComparisonVsCompetitors from "./semrush/ComparisonVsCompetitors";
import KeywordRankTracking from "./semrush/KeywordRankTracking";
import TrackedKeywordsThisMonth from "./semrush/TrackedKeywordsThisMonth";


const COLORS = ["#4caf50", "#2196f3", "#ff9800", "#f44336"]; // Top5, Page1, Page2, Unranked
const PaginatedSemrushTable = ({ semrushData ,filterKey ,range }) => {
  const [currentPage, setCurrentPage] = useState(1);
const semrushData1 = semrushData?.[range]?.[filterKey] || {};

  const multisiteData  =  semrushData1?.data;

  if (!multisiteData) return <p>No data found</p>;

  const allOrganicKeywords = multisiteData.flatMap(site =>
    (site.organic_keywords || []).map(keyword => ({
      ...keyword,
      site_domain: site.domain
    }))
  );

const allCompetitorKeywords = multisiteData.flatMap(site =>
  (site.competitors || []).flatMap(competitor =>
    (competitor.keywords || []).map(keyword => ({
      ...keyword,
      site_domain: site.domain,
      domain: competitor.domain
    }))
  )
);

const allPreviousOrganicKeywords = multisiteData.flatMap(site =>
  (site.previous_organic_keywords || []).map(keyword => ({
    ...keyword,
    site_domain: site.domain
  }))
);

const allPreviousCompetitorKeywords = multisiteData.flatMap(site =>
  (site.competitors || []).flatMap(competitor =>
    (competitor.previous_keywords || []).map(keyword => ({
      ...keyword,
      site_domain: site.domain,
      domain: competitor.domain
    }))
  )
);

const validCurrentKeywords = allOrganicKeywords.filter(k => Number(k.position) > 0);
const validPreviousKeywords = allPreviousOrganicKeywords.filter(k => Number(k.position) > 0);

const getPercentChange = (current, previous, lowerIsBetter = false) => {
  if (!previous || previous === 0) return 0;

  const change = ((current - previous) / previous) * 100;

  return lowerIsBetter
    ? Math.round(change * -1)
    : Math.round(change);
};

const formatNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString() : value;
};

const currentOrganicKeywords = validCurrentKeywords.length;
const previousOrganicKeywords = validPreviousKeywords.length;

const currentTop10 = validCurrentKeywords.filter(k => Number(k.position) <= 10).length;
const previousTop10 = validPreviousKeywords.filter(k => Number(k.position) <= 10).length;

const currentAvgPosition =
  validCurrentKeywords.length > 0
    ? Number(
        (
          validCurrentKeywords.reduce((sum, k) => sum + Number(k.position), 0) /
          validCurrentKeywords.length
        ).toFixed(1)
      )
    : 0;

const previousAvgPosition =
  validPreviousKeywords.length > 0
    ? Number(
        (
          validPreviousKeywords.reduce((sum, k) => sum + Number(k.position), 0) /
          validPreviousKeywords.length
        ).toFixed(1)
      )
    : 0;

const currentCompetitors = new Set(allCompetitorKeywords.map(k => k.domain)).size;
const previousCompetitors = new Set(allPreviousCompetitorKeywords.map(k => k.domain)).size;

const kpiCards = [
  {
    title: "Organic Keywords",
    value: currentOrganicKeywords,
    previous: previousOrganicKeywords,
    change: getPercentChange(currentOrganicKeywords, previousOrganicKeywords),
    description: "Total tracked organic keywords",
  },
  {
    title: "Top 10 Keywords",
    value: currentTop10,
    previous: previousTop10,
    change: getPercentChange(currentTop10, previousTop10),
    description: "Keywords ranking on Google page 1",
  },
  {
    title: "Avg Position",
    value: currentAvgPosition,
    previous: previousAvgPosition,
    change: getPercentChange(currentAvgPosition, previousAvgPosition, true),
    description: "Average ranking position",
  },
  {
    title: "Competitors",
    value: currentCompetitors,
    previous: previousCompetitors,
    change: getPercentChange(currentCompetitors, previousCompetitors),
    description: "Tracked organic competitors",
  },
];

// console.log('semrushData',semrushData);
// console.log('allCompetitorKeywords',allCompetitorKeywords);

  if (!multisiteData) return <p>No keyword data available</p>;

      return (
      <div className="space-y-16">


        <section>
          <h3 className="font-bold text-4xl text-center bg-black text-white py-3 rounded-xl">
            Key Performance Indicators
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 shadow-2xl my-8 rounded-2xl bg-white">
            {kpiCards.map((card, index) => {
              const isUp = card.change > 0;
              const isDown = card.change < 0;

              return (
                <Card key={index} className="bg-orange-100 text-center rounded-xl shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-700 mb-3">{card.title}</p>

                    <div className="flex items-center justify-center gap-6">
                      <h4 className="text-4xl font-semibold text-black">
                        {formatNumber(card.value)}
                      </h4>

                      <div className="text-left min-w-[85px]">
                        <p
                          className={`text-sm ${
                            isUp
                              ? "text-green-600"
                              : isDown
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {Math.abs(card.change)}%
                          {isUp ? " ▲" : isDown ? " ▼" : ""}
                        </p>

                        <p className="text-xs text-gray-500">
                          vs {formatNumber(card.previous)} prev.
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">{card.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
        <section>
          <h3 className="font-bold text-4xl text-center bg-black text-white py-3 rounded-xl">
            Ranking Performance
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 shadow-2xl my-8 rounded-2xl bg-white">
            <div className="overflow-x-auto">
              <KeywordRankDistribution organicData={allOrganicKeywords} />
            </div>
            <div className="overflow-x-auto">
            <Page1KeywordsComparison
              organicData={allOrganicKeywords}
              competitorKeywords={allCompetitorKeywords}
            />
            </div>
          </div>
        </section>
        <section>
          <h3 className="font-bold text-4xl text-center bg-black text-white py-3 rounded-xl">
            Performance Comparison with Competitors
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 shadow-2xl my-8 rounded-2xl bg-white">
            <div className="overflow-x-auto">
            <TrackedKeywordsThisMonth organicData={allOrganicKeywords} />
            </div>
          <div className="overflow-x-auto">
            </div>
          </div>
        </section>
        <section className="bg-white shadow-2xl rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Keyword Rank Distribution
          </h2>
            <div className="overflow-x-auto">
              <WebsitePerformanceVsCompetitors
                competitors={allCompetitorKeywords}
              />
            </div>
        </section>
        <section className="bg-white shadow-xl rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-4">Additional Info</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 shadow-2xl my-8 rounded-2xl bg-white">
            <div className="overflow-x-auto">
            <KeywordRankTracking
            data ={allOrganicKeywords}
            />
            </div>
            <div className="overflow-x-auto">
            <ComparisonVsCompetitors
            organicData={allOrganicKeywords}
            competitorKeywords={allCompetitorKeywords}
          />
            </div>
          </div>
        </section>
      </div>
    );
};

export default PaginatedSemrushTable;
