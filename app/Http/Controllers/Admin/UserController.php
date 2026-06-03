<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Client;
use App\Models\ClientGroup;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Storage;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
public function index()
{
    return Inertia::render('Admin/Users/Index', [
        'users' => User::with('client:id,company_name')
            ->latest()
            ->get(),
    ]);
}


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //Render the create view for user
        return Inertia::render('Admin/Users/Create', [
            'statuses' => User::STATUSES,
            'userRoles' => User::USER_ROLES,
             'clients'    => Client::select('id', 'company_name')->get(), 
            'clientGroups' => ClientGroup::select('id', 'name')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request data
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:225',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20|regex:/^[0-9\+\(\)\s-]+$/',
            'password' => 'required|string|min:8|confirmed',
            'user_role' => 'required|string|in:' . implode(',', User::USER_ROLES),
            'status' => 'required|string|in:' . implode(',', User::STATUSES),
            'company_name' => 'nullable|string|max:255',
            'time_zone' => 'nullable|string|max:255',
               'client_id' => [
                'nullable',
                'required_if:user_role,Client',
                'exists:clients,id',
            ],

            'client_Groups_id' => [
                'nullable',
                'required_if:user_role,Agent',
                'exists:client_groups,id',
            ],
            'data_profile' => 'nullable|string|max:255',
        ]);

        if ($validated['user_role'] === 'Client') {
            $validated['client_Groups_id'] = null;
        } elseif ($validated['user_role'] === 'Agent') {
            $validated['client_id'] = null;
        } else {
            $validated['client_id'] = null;
            $validated['client_Groups_id'] = null;
        }
       
        // Crate the user
        User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => bcrypt($validated['password']),
            'user_role' => $validated['user_role'],
            'status' => $validated['status'],
            'company_name' => $validated['company_name'],
            'time_zone' => $validated['time_zone'],
            'client_id' => $validated['client_id'] ?? null,
            'client_Groups_id' => $validated['client_Groups_id'] ?? null,
            'data_profile' => $validated['data_profile'] ?? null,
        ]);

        // Redirect back with success message
        return redirect()->route('admin.users.index')->with('success', 'User created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // Render the user show page
        return Inertia::render('Admin/Users/View', [
            'user' => User::findOrFail($id),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {

        
        // Validate the request data
        return Inertia::render('Admin/Users/Edit', [
            'statuses' => User::STATUSES,
            'userRoles' => User::USER_ROLES,
            'user' => User::findOrFail($id),
            'clients'    => Client::select('id', 'company_name')->get(), 
            'clientGroups' => ClientGroup::select('id', 'name')->get(),

        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {


       $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:225',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20|regex:/^[0-9\+\(\)\s-]+$/',
            'password' => 'sometimes|nullable|string|min:8|confirmed',
            'user_role' => 'required|string|in:' . implode(',', User::USER_ROLES),
            'status' => 'required|string|in:' . implode(',', User::STATUSES),
            'company_name' => 'nullable|string|max:255',
            'time_zone' => 'nullable|string|max:255',
               'client_id' => [
                'nullable',
                'required_if:user_role,Client',
                'exists:clients,id',
            ],

            'client_Groups_id' => [
                'nullable',
                'required_if:user_role,Agent',
                'exists:client_groups,id',
            ],
             'data_profile' => 'nullable|string|max:255',
        ]);

       

        // Auto-clear conflicting IDs
        if ($validated['user_role'] === 'Client') {
            $validated['client_Groups_id'] = null;
        } elseif ($validated['user_role'] === 'Agent') {
            $validated['client_id'] = null;
        } else {
            $validated['client_id'] = null;
            $validated['client_Groups_id'] = null;
        }

        $updateData = [
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'user_role' => $validated['user_role'],
            'status' => $validated['status'],
            'company_name' => $validated['company_name'] ?? null,
            'time_zone' => $validated['time_zone'] ?? null,
            'client_id' => $validated['client_id'] ?? null,
            'client_Groups_id' => $validated['client_Groups_id'] ?? null,
            'data_profile' => $validated['data_profile'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = bcrypt($validated['password']);
        }

        $user->update($updateData);

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully!');
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        // Delete the avatar file if it exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->logo);
        }

        // Delete the user
        $user->delete();
    
        // Redirect back with success message
        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully!');
    }
}