<?php

namespace Database\Seeders;

use App\Models\DataSource;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DataSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dataSources = [
            [
                'title' => 'Google Analytics 4',
                'image' => 'google-analytics.svg',
                'service' => 'analytics',
                'is_connected' => false,
                'total_connections' => 0,
                'is_active' => true,
            ],
            [
                'title' => 'Google Business Profile',
                'image' => 'google-business-profile.svg',
                'service' => 'business-profile',
                'is_connected' => false,
                'total_connections' => 0,
                'is_active' => true,
            ],
            [
                'title' => 'Google Search Console',
                'image' => 'google-search-console.svg',
                'service' => 'search-console',
                'is_connected' => false,
                'total_connections' => 0,
                'is_active' => true,
            ],
            [
                'title' => 'Google Ads',
                'image' => 'google-ads.svg',
                'service' => 'ads',
                'is_connected' => false,
                'total_connections' => 0,
                'is_active' => true,
            ], 
            [
                'title' => 'SEMRush',
                'image' => 'semrush.svg',
                'service' => 'semrush',
                'is_connected' => false,
                'total_connections' => 0,
                'is_active' => true,
            ],
            [
                'title' => 'Simpli.fi',
                'image' => 'simplifi.svg',
                'service' => 'simplifi',
                'is_connected' => false,
                'total_connections' => 0,
                'is_active' => true,
            ],
            [
                'title' => 'Google Sheets',
                'image' => 'google-sheets.svg',
                'service' => 'sheets',
                'is_connected' => false,
                'total_connections' => 0,
                'is_active' => true,
            ],
            [
                'title' => 'Facebook Insights',
                'image' => 'facebook-Insights.svg',
                'service' => 'facebook_insights',
                'is_connected' => false,
                'total_connections' => 0,
                'is_active' => true,
            ],
            [
                'title' => 'Facebook Ads',
                'image' => 'facebook-ads.svg',
                'service' => 'facebook_ads',
                'is_connected' => false,
                'total_connections' => 0,
                'is_active' => true,
            ],
            
        ];

        foreach ($dataSources as $dataSource) {
            DataSource::create($dataSource);
        }
    }
}
