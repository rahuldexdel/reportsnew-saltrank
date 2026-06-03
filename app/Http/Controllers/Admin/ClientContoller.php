<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use App\Models\Client;
use App\Models\SimplifiCampaign;
use App\Models\SimplifiOrganizations;

use App\Models\ClientGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Data\DataSourceController;
use App\Models\Site;
use App\Models\SemrushAccount;
use App\Jobs\FetchSemrushDataJob;
use App\Models\OrganicKeyword;
use App\Models\Competitor;

class ClientContoller extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // render the client Index page
        return Inertia::render('Admin/Clients/Index', [
            'clients' => Client::with(['groups:id,name'])->latest()->get(),
            'statuses' => Client::STATUSES,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // render the client create page
        return Inertia::render('Admin/Clients/Create', [
            'clientGroups' => ClientGroup::latest()->get(),
            'statuses' => Client::STATUSES,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => '|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'client_groups' => 'array',
            'client_groups.*' => 'exists:client_groups,id', // Validate each group exists
            // 'data_dashboard' => 'required|string|max:255',
            'status' => 'in:' . implode(',', Client::STATUSES),
        ]);
        try {
            DB::beginTransaction();
            $path = null;
            if ($request->hasFile('logo')) {
                $path = $request->file('logo')->store('client-logos', 'public');
            }
            $client = Client::create([
                'company_name' => $validated['company_name'],
                'logo' => $path,
                // 'data_dashboard' => $validated['data_dashboard'],
                'status' => $validated['status'],
            ]);
            $client->groups()->sync($validated['client_groups']);
            DB::commit();

            if ($request->filled('domain')) {
                $dataSourceController = new DataSourceController();
                $dataSourceController->addDomainToSemrush(
                    $client->id,
                    $request->domain
                );
            }
            return redirect()->route('admin.clients.index')->with('success', 'Client created successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            if (isset($path)) {
                Storage::disk('public')->delete($path);
            }

            return back()->withInput()->with('error', 'Error creating client: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        // render the client edit page
        $client = Client::with(['groups:id,name'])->findOrFail($id);
        $site = Site::where('client_id',$client->id)->first();
        return Inertia::render('Admin/Clients/Edit', [
            'client' => $client,
            'domain' => $site?->domain,
            'clientGroups' => ClientGroup::all(['id', 'name']),
            'statuses' => Client::STATUSES,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Client $client)
    {
        // validate the request
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
             'client_groups' => 'nullable|array',
            'client_groups.*' => 'exists:client_groups,id',
            // 'data_dashboard' => 'required|string|max:255',
            'status' => 'required|string|in:' . implode(',', Client::STATUSES),
            'domain' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();

        try {
            $path = $client->logo;

            // Handle new logo upload
            if ($request->hasFile('logo')) {
                // Delete old logo if it exists
                if ($path) {
                    Storage::disk('public')->delete($path);
                }
                $path = $request->file('logo')->store('client-logos', 'public');
            }

            // Update client
            $client->update([
                'company_name' => $validated['company_name'],
                'logo' => $path,
                // 'data_dashboard' => $validated['data_dashboard'],
                'status' => $validated['status'],
            ]);

            // Sync client groups
            $client->groups()->sync($validated['client_groups']);
            if ($request->filled('domain')) {
                $account = SemrushAccount::where('user_id', auth()->id())
                    ->where('status', 'connected')
                    ->first();

                if ($account) {
                    $site = Site::where('client_id', $client->id)->first();
                    $newDomain = trim($request->domain);

                    if ($site) {
                        $oldDomain = trim($site->domain);

                        if ($oldDomain !== $newDomain) {

                            $site->update([
                                'client_id' => null
                            ]);
                            $newSite = Site::create([
                                'semrush_account_id' => $account->id,
                                'domain' => $newDomain,
                                'client_id' => $client->id,
                                'database' => 'us',
                            ]);

                       FetchSemrushDataJob::dispatch($newSite->id, true);
                        }

                    } else {
                        $site = Site::create([
                            'semrush_account_id' => $account->id,
                            'domain' => $newDomain,
                            'client_id' => $client->id,
                            'database' => 'us',
                        ]);

                   FetchSemrushDataJob::dispatch($site->id, true);
                    }
                }
            }
            DB::commit();

            return redirect()->route('admin.clients.index')->with('success', 'Client updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withInput()->with('error', 'Error updating client: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Client $client)
    {
       
      
        DB::beginTransaction();

        try {
            // Delete the logo file if it exists
            if ($client->logo) {
                Storage::disk('public')->delete($client->logo);
            }


        SimplifiOrganizations::where('client_id', $client->id)
            ->update(['client_id' => null, 'is_assigned' => null]);

        SimplifiCampaign::where('client_id', $client->id)
            ->update(['client_id' => null, 'is_assigned' => null]);


            // Detach all groups first
            $client->groups()->detach();

            // Delete the client
            $client->delete();

            DB::commit();

            return redirect()->route('admin.clients.index')->with('success', 'Client deleted successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error deleting client: ' . $e->getMessage());
        }
    }
}
