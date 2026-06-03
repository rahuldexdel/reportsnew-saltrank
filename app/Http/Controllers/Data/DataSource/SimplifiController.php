<?php

namespace App\Http\Controllers\Data\DataSource;

use App\Models\SimplifiCampaign;
use App\Models\SimplifiOrganizations;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ClientGroup;
use App\Models\Client;

class SimplifiController extends Controller
{
    public function index(){
        $clients = \App\Models\Client::all();
        $organizations = SimplifiOrganizations::with('account', 'campaigns', 'client')->get();

       // dd($organizations);
        return Inertia::render('Data/Datasource/SimplifiService', [
            'organizations' => $organizations,
            'clients' => $clients,
            'clientGroups' => ClientGroup::latest()->get(),
            'statuses' => Client::STATUSES,
        ]);
    }

    /**
     * Summary of assign
     * @param \Illuminate\Http\Request $request
     * @return void
     */
    public function assign(Request $request)
    {

       
        $validated = $request->validate([
            'type' => 'required',
            'id' => 'required|integer',
            'client_id' => 'required|integer|exists:clients,id',
        ]);


        if($validated['type'] == 'organization'){
            $organization = SimplifiOrganizations::find($validated['id']);
            $organization->update([
                'client_id' => $validated['client_id'],
                'is_assigned' => true,
            ]);


            SimplifiCampaign::where('organization_id', $organization->organization_id)
            ->update([
                'client_id' => $validated['client_id'],
                'is_assigned' => true,
            ]);
        }
        else{
            $organization = SimplifiCampaign::find($validated['id']);
            $organization->update([
                'client_id' => $validated['client_id'],
                'is_assigned' => true,
            ]);
        }
    }

    /**
     * Summary of unAssign
     * @param \Illuminate\Http\Request $request
     * @return void
     */
    public function unAssign(Request $request)
    {

      
        $validated = $request->validate([
            'type' => 'required',
            'id' => 'required|integer',
        ]);

        if($validated['type'] == 'organization'){
            $organization = SimplifiOrganizations::find($validated['id']);
            $organization->update([
            'client_id' => null,
            'is_assigned' => false,
            ]);
        SimplifiCampaign::where('organization_id', $organization->organization_id)
            ->update([
            'client_id' => null,
            'is_assigned' => false,
            ]);

        }
        else{
            $organization = SimplifiCampaign::find($validated['id']);
            $organization->update([
                'client_id' => null,
            'is_assigned' => false,
            ]);
        }
        // return response()->json(['success' => true]);
    }


}
