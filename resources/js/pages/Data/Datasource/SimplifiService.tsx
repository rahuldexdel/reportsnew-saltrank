import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BreadcrumbItem, Client } from '@/types';
import { Check, ChevronDown, ChevronRight, LoaderCircle, Pencil, Plus, RefreshCw, UserRoundX } from 'lucide-react';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import axios from 'axios'; // Make sure you import this

import { usePage } from '@inertiajs/react';

import CreateClientPopup from '@/components/CreateClientPopup';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Data',
        href: '#',
    },
    {
        title: 'Data Sources',
        href: '/data/datasource',
    },
    {
        title: 'adfb',
        href: '#',
    },
];

interface Organization {
    id: number;
    name: string;
    custom_id: string | null;
    account_connection: string;
    created_at: string;
    is_assigned: boolean;
    client_id: string;
    client: Client;
    account: {
        id: string;
        name: string;
        email: string;
    }
    campaigns: {
        id: number;
        name: string;
        is_assigned: boolean;
        client_id: number | null;
        created_at: string;
    }[];
}

interface IndexProps {
    organizations: Organization[];
    clients: Client[];
}



const SimplifiService = ({ organizations, clients ,clientGroups,statuses }: IndexProps) => {
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

    //const [syncing, setSyncing] = useState(false); 

    const [syncingList, setSyncingList] = useState(false);
   const [addingConnection, setAddingConnection] = useState(false);


const { props } = usePage<{
  clientGroups: any[];
  statuses: Record<string, string>;
}>();

const [openCreateClient, setOpenCreateClient] = useState(false);




    const [isOpen, setIsOpen] = useState(false);



    const { data, setData, post, processing, reset } = useForm({
        username: "",
        apikey: "",
        Organizationid: "",
    });

    const submit = (e) => {
    e.preventDefault();

    post(route("connect-smplifi-account"), {
        onSuccess: () => {
        setIsOpen(false); // close modal
        reset();
        },
    });
    };






    const handleSyncSimplifi = async () => {
        setSyncingList(true);
        try {
            await axios.post('/sync-smplifi-account', {
                account_id: '44702', 
            });
            toast.success('Data synced successfully.');
        } catch (error) {
            console.error(error);
            toast.error('Failed to sync Simpli.fi data.');
        } finally {
            setSyncingList(false);
        }
    };






    const toggleRow = (orgId: number) => {
        setExpandedRows(prev => ({
            ...prev,
            [orgId]: !prev[orgId]
        }));
    };





    // Flatten the data for the DataTable
    const tableData = organizations.flatMap(org => [
        {
            id: org.id,
            type: 'organization',
            name: org.name,
            account_connection: org.account_connection,
            created_at: org.created_at,
            is_assigned: org.is_assigned,
            client: org.client,
            client_id: org.client_id,
            email: org.account.email,
            hasCampaigns: org.campaigns.length > 0,
            has_assigned_child: org.campaigns.some(c => c.is_assigned),
        },
        ...(expandedRows[org.id] ? org.campaigns.map(campaign => ({
            id: campaign.id,
            type: 'campaign',
            name: campaign.campaign_name,
            account_connection: org.account_connection,
            created_at: campaign.created_at,
            is_assigned: campaign.is_assigned,
            client_id: campaign.client_id,
            client: org.client,
            parentId: org.id,
            email: org.account.email,
            isCampaign: true,
            parent_assigned_client_id: org.client_id,
            parent_has_assigned_child: org.campaigns.some(c => c.is_assigned),
        })) : [])
    ]);

    console.log('expandedRows',expandedRows);
console.log('tableData',tableData);

    const columns: ColumnDef<any>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => {
                return (
                    <div className="flex items-center">
                        {row.original.type === 'organization' && row.original.hasCampaigns && (
                            <button
                                onClick={() => toggleRow(row.original.id)}
                                className="mr-2 text-gray-500 hover:text-gray-700"
                            >
                                {expandedRows[row.original.id] ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>
                        )}
                        {row.original.type === 'campaign' && (
                            <div className="ml-6 w-4"></div> // Spacer for alignment
                        )}
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                        />
                    </div>
                )
            }
        },
        {
            accessorKey: 'name',
            header: 'Account Name',
            cell: ({ row }) => (
                <div className={row.original.type === 'organization' ? 'text-primary font-medium hover:text-primary/90 ml-3' : 'text-gray-700'}>{row.original.name}</div>
            ),
        },
        {
            accessorKey: 'account_connection',
            header: 'Account Connection',
            cell: ({ row }) => (
                <div className="flex items-center">
                    <span className="bg-green-500 text-white rounded-full p-0.5 mr-2">
                        <Check className="h-3 w-3" />
                    </span>
                    {row.original.email}
                </div>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Date First Seen',
            cell: ({ row }) => (
                <div>
                    {new Date(row.getValue('created_at')).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric'
                    })}
                </div>
            ),
        },
        {
            accessorKey: 'is_assigned',
            header: 'Assignment Status',
            cell: ({ row }) => {
                const isAssigned = Number(row.getValue('is_assigned')) === 1;
                return (
                    <Badge variant={isAssigned ? 'default' : 'outline'}>
                        {isAssigned ? 'Assigned' : 'Unassigned'}
                    </Badge>
                );
            },
        },

        {
            accessorKey: 'client_id',
            header: 'Assigned Client',
            cell: ({ row }) => {
                const form = useForm({ clientId: '' });

                const handleAssign = async (type: 'organization' | 'campaign', id: number, clientId: string) => {
                await form.post(
                    route('simplifi.assign', { type, id, client_id: clientId }),
                    {
                    onSuccess: () => {
                        toast.success(`${type === 'organization' ? 'Organization' : 'Campaign'} assigned successfully.`);
                        window.location.reload(); // or router.reload() if using Inertia
                    },
                    onError: () => toast.error(`Failed to assign ${type}.`),
                    }
                );
                };

                const handleUnassign = async (type: 'organization' | 'campaign', id: number) => {
                await form.post(route('simplifi.unassign', { type, id }), {
                    onSuccess: () => {
                    toast.success(`${type === 'organization' ? 'Organization' : 'Campaign'} unassigned successfully.`);
                    window.location.reload();
                    },
                    onError: () => toast.error(`Failed to unassign ${type}.`),
                });
                };

                // 🔍 Determine relationship states
                const parentAssigned = !!row.original.parent_assigned_client_id;
                const hasAssignedChild = !!row.original.has_assigned_child;

                const isLockedParent = row.original.type === 'organization' && hasAssignedChild;
                const isLockedChild = row.original.type === 'campaign' && parentAssigned;

                return (
                <div className="flex items-center gap-2">
                    {/* 🔒 Lock Messages */}
                    {(isLockedParent || isLockedChild) && (
                    <div className="text-gray-500 italic text-sm">
                        {isLockedChild
                        ? 'Already assigned via parent organization'
                        : 'Assignment locked — one or more campaigns already assigned'}
                    </div>
                    )}

                    {/* 🧭 Show Assign dropdown only if not locked */}
                    {!isLockedParent && !isLockedChild && (
                    <>
                        {/* ASSIGN CLIENT SELECT */}
                        <Select
                        value={row.original.client_id?.toString() || ''}
                        onValueChange={(value) => {
                            if (value === '__new_client__') {
                            setOpenCreateClient(true);
                            return;
                            }

                            handleAssign(row.original.type, row.original.id, value);
                        }}
                        >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Assign to" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectGroup>
                            <SelectLabel className="font-semibold">Select Client</SelectLabel>

                            {/* ➕ ADD NEW CLIENT */}
                            <SelectItem value="__new_client__">
                                <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                New Client
                                </div>
                            </SelectItem>

                            {/* EXISTING CLIENTS */}
                            {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                {client.company_name}
                                </SelectItem>
                            ))}
                            </SelectGroup>
                        </SelectContent>
                        </Select>

                        {/* CREATE CLIENT DIALOG (MUST BE OUTSIDE SELECT) */}
                        <Dialog open={openCreateClient} onOpenChange={setOpenCreateClient}>
                        <DialogContent className="sm:max-w-[650px]">
                            <DialogHeader>
                            <DialogTitle>Add New Client</DialogTitle>
                            </DialogHeader>

                            <CreateClientPopup
                            clientGroups={props.clientGroups}
                            statuses={props.statuses}
                            onSuccess={(client) => {
                                setOpenCreateClient(false);
                                handleAssign(
                                row.original.type,
                                row.original.id,
                                client.id.toString()
                                );
                            }}
                            />
                        </DialogContent>
                        </Dialog>
                    </>


                    )}

                    {/* ✏️ Edit & ❌ Unassign buttons — visible only if assigned AND not locked child */}
                  {Boolean(row.original.is_assigned) && !isLockedChild && (
                    <>
                        {/* ✏️ Edit Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant="success"
                                disabled={!row.original.client_id}
                                asChild
                                >
                                {row.original.client_id ? (
                                    <Link href={route('admin.clients.edit', row.original.client_id)}>
                                    <Pencil className="h-4 w-4" />
                                    </Link>
                                ) : (
                                    <span className="opacity-50 cursor-not-allowed">
                                    <Pencil className="h-4 w-4" />
                                    </span>
                                )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                {row.original.client_id
                                    ? 'Edit Client'
                                    : 'No client assigned'}
                                </p>
                            </TooltipContent>
                            </Tooltip>

                        {/* ❌ Unassign Button */}
                        <AlertDialog>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                                <Button variant="danger">
                                <UserRoundX className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>Unassign</p>
                            </TooltipContent>
                        </Tooltip>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                You are about to unassign{' '}
                                <strong>{row.original.client?.company_name ?? 'Unknown Client'}</strong> from this account. Do you
                                wish to continue?
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => handleUnassign(row.original.type, row.original.id)}
                                disabled={form.processing}
                            >
                                Yes, Unassign
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </>
                    )}
                </div>
                );
            },
         }

    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Data Source" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className='flex items-center justify-between mb-4'>
                    <h2 className="text-2xl font-semibold">Simplifi</h2>
                    <div className='flex items-center justify-between gap-2'>
                     {/* ✅ Sync Button */}
                        <Button variant='light' className='cursor-pointer' onClick={handleSyncSimplifi} disabled={syncingList}>
                            {syncingList ? (
                                <>
                                    <LoaderCircle className="h-4 w-4 animate-spin" /> Syncing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4" /> Refresh List
                                </>
                            )}
                        </Button>


                        {/* <Button
                        variant="light"
                        className="cursor-pointer"
                        onClick={() => setIsOpen(true)}
                        disabled={addingConnection}
                        >
                        {addingConnection ? (
                            <>
                            <LoaderCircle className="h-4 w-4 animate-spin" /> Syncing...
                            </>
                        ) : (
                            <>
                            <Plus className="h-4 w-4" /> Add Connection
                            </>
                        )}
                        </Button> */}

                        
                          <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogContent className="sm:max-w-[425px] md:max-w-xl">
                                <form onSubmit={submit}>
                                    <DialogHeader>
                                        <DialogTitle>Connect Simpli.fi Account</DialogTitle>
                                        <DialogDescription>
                                            Enter your credentials to connect this data source and allow the platform to find your accounts
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4">
                                        <div className="grid gap-3">
                                            <Label htmlFor="username">Organization Manager Username</Label>
                                            <Input
                                                id="username"
                                                type="text"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                value={data.username}
                                                onChange={(e) => setData('username', e.target.value)}
                                                placeholder="Please Enter your Organization Manager Username"
                                            />
                                        </div>

                                        <div className="grid gap-3">
                                            <Label htmlFor="apikey">API User Key</Label>
                                            <Input
                                                id="apikey"
                                                type="text"
                                                required
                                                tabIndex={2}
                                                value={data.apikey}
                                                onChange={(e) => setData('apikey', e.target.value)}
                                                placeholder="Please Enter your API User Key"
                                            />
                                        </div>

                                        <div className="grid gap-3">
                                            <Label htmlFor="Organizationid">Top Organization ID (optional)</Label>
                                            <Input
                                                id="Organizationid"
                                                type="text"
                                                tabIndex={3}
                                                value={data.Organizationid}
                                                onChange={(e) => setData('Organizationid', e.target.value)}
                                                placeholder="Please Enter your Top Organization ID"
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter className="pt-4">
                                        <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button type="submit" tabIndex={4} disabled={processing}>
                                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                            Save
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>


                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                {/* <Button variant='light'>Fetch Data</Button> */}
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to fetch data for Simplifi?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Initiating will only request a data fetch for this one connector.If another data fetch is in progress, this request will queue behind the one in progress.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction>Yes, Fetch My Data</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </div>
                </div>

                <h3 className="text-xl font-semibold leading-1">Assign Simplifi accounts to their respective clients</h3>
                <p className='text-md text-gray-500'>You can expand a Simplifi account to reveal the existing campaigns and assign them individually.</p>

                <DataTable
                    data={tableData}
                    columns={columns}
                    searchColumn='name'
                    searchPlaceholder='Account Name'
                />
            </div>
        </AppLayout>
    );
};

export default SimplifiService;