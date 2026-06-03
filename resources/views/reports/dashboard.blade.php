<h1>Dashboard</h1>

<h2>Data Sources</h2>
<ul>
    @foreach($dataSources as $source)
        <li>{{ $source->name }}</li>
    @endforeach
</ul>

<h2>Simplifi Stats</h2>
<ul>
    <li>Impressions: {{ $simplifi['impressions'] }}</li>
    <li>Clicks: {{ $simplifi['clicks'] }}</li>
    <li>CTR: {{ $simplifi['ctr'] }}</li>
    <li>Walk-Ins: {{ $simplifi['walkIns'] }}</li>
</ul>
