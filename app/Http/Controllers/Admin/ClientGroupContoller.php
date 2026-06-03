<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use App\Models\Client;
use App\Models\ClientGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ClientGroupContoller extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Render the client group index page
        return Inertia::render('Admin/ClientGroups/Index', [
            'clientGroups' => ClientGroup::with('clients')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
public function create()
{
    $clients = Client::latest()->get();

    // Fetch distinct existing dashboard group names
    // $clientGroups = \App\Models\ClientGroup::select('id', 'client_group_dashboard')
    //     ->whereNotNull('client_group_dashboard')
    //     ->distinct()
    //     ->get();

    return Inertia::render('Admin/ClientGroups/Create', [
        'clients' => $clients,
        //'clientGroups' => $clientGroups,
    ]);
}


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            // 'client_group_dashboard' => 'required|string|max:255',
            'clients' => 'nullable|array',
            'clients.*' => 'exists:clients,id', 
        ]);

        DB::beginTransaction();

        try {

            $clientGroup = ClientGroup::create([
                'name' => $validated['name'],   
                // 'client_group_dashboard' => $validated['client_group_dashboard'],
            ]);

            if (!empty($validated['clients'])) {
                $clientGroup->clients()->sync($validated['clients']);
            }

            DB::commit();

            return redirect()->route('admin.client-groups.index')->with('success', 'Client group created successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withInput()->with('error', 'Error creating client group: ' . $e->getMessage());
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
        public function edit($id)
        {
            return Inertia::render('Admin/ClientGroups/Edit', [
                'clientGroup' => ClientGroup::with('clients:id,company_name')->findOrFail($id),
                'clients' => Client::select('id', 'company_name')->get(),
                // 'clientGroups' => ClientGroup::select('id', 'client_group_dashboard')->get(), // ✅ Added
            ]);
        }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ClientGroup $clientGroup)
    {
        // Validate the request data
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            // 'client_group_dashboard' => 'required|string|max:255',
            'clients' => 'nullable|array',
            'clients.*' => 'exists:clients,id',
        ]);

        DB::beginTransaction();

        try {
            // Update the client group
            $clientGroup->update([
                'name' => $validated['name'],
                // 'client_group_dashboard' => $validated['client_group_dashboard'],
            ]);

            // Sync the clients
            $clientGroup->clients()->sync($validated['clients'] ?? []);

            DB::commit();

            return redirect()->route('admin.client-groups.index')->with('success', 'Client group updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withInput()->with('error', 'Error updating client group: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ClientGroup $clientGroup)
    {

      
        // Validate the client group exists
        DB::beginTransaction();

        try {
            // Detach all clients first
            $clientGroup->clients()->detach();

            \App\Models\User::where('client_Groups_id', $clientGroup->id)
            ->update([
                'client_Groups_id' => null,
            ]);
            $clientGroup->delete();

            DB::commit();

            return redirect()->route('admin.client-groups.index')->with('success', 'Client group deleted successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Error deleting client group: ' . $e->getMessage());
        }
    }
}