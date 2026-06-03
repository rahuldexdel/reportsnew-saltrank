<?php
namespace App\Jobs\Analytics;

use App\Models\GoogleAccount;
use App\Services\Ga4Service;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncGa4DataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;
    public $timeout = 300;

    protected int $propertyId;

    public function __construct(int $propertyId)
    {
        $this->propertyId = $propertyId;
    }

    public function handle(Ga4Service $ga4Service)
    {
        $property = \App\Models\GoogleServiceProperty::findOrFail($this->propertyId);


         Log::info('GA4 Sync START', [
            'property_id' => $property->id,
            'property_name' => $property->property_name,
        ]);

        // 🔒 LOCK (VERY IMPORTANT)
        \Cache::lock('ga4_property_' . $property->id, 300)->block(5, function () use ($ga4Service, $property) {

            $ga4Service->syncSingleProperty($property);

        });
    }
}