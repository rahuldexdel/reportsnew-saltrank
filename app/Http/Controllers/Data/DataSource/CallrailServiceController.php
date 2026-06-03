<?php

namespace App\Http\Controllers\Data\DataSource;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Client;
use App\Models\ClientGroup;
use App\Models\CallrailCompany;

class CallrailServiceController extends Controller
{
    public function index()
    {
        $clients = Client::all();

        $companies = CallrailCompany::latest()->get()->map(function ($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
                'property_id' => $company->property_id,
                'client_id' => $company->client_id,
                'is_assigned' => !is_null($company->client_id),
                'created_at' => $company->created_at->format('M d, Y'),
            ];
        });

        return Inertia::render('Data/Datasource/CallrailService', [
            'companies' => $companies,
            'clients' => $clients,
            'clientGroups' => ClientGroup::latest()->get(),
            'statuses' => Client::STATUSES,
        ]);
    }

    public function assignClient(Request $request)
    {


        $request->validate([
            'company_id' => 'required|exists:callrail_companies,id',
            'client_id' => 'required|exists:clients,id',
        ]);

        CallrailCompany::where('id', $request->company_id)
            ->update([
                'client_id' => $request->client_id,
                'is_assigned' => true,
            ]);

        return back()->with('success', 'Assigned successfully');
    }

    public function unassignClient(Request $request)
    {
        $request->validate([
            'company_id' => 'required|exists:callrail_companies,id',
        ]);

        CallrailCompany::where('id', $request->company_id)
            ->update([
                'client_id' => null,
                'is_assigned' => false,
            ]);

        return back()->with('success', 'Unassigned successfully');
    }
}