import React, { useEffect, useState } from 'react'

import { router } from '@inertiajs/react';

interface CampaignStatsData {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    [key: string]: any;
}

export const Simplifi = async() => {
    const [stats, setStats] = useState<CampaignStatsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const fetchCampaignStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await router.get('/simplifi/campaign-stats', {
                from: '2023-01-01',         // Dynamic in real app
                to: '2023-12-31'            // Dynamic in real app
            }, {
                preserveState: true,
                replace: false,
            });
            console.log(response);

            //Inertia returns data in props
            // if (response.props.stats) {
            //     setStats(response.props.stats);
            // } else {
            //     throw new Error('No stats data received');
            // }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    }

    console.log(stats);
    return (
        <div>
            testingdsfg
        </div>
    )
}