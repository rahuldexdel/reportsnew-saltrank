import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ArrowUpDown, Check, CheckCircle2, LoaderCircle, Pencil, Plus, RefreshCw,ChevronRight,ChevronDown , UserRoundX } from 'lucide-react'
import { BreadcrumbItem, Client, Datasource, Property } from '@/types'
import { Head, Link, useForm } from '@inertiajs/react'
import React, { useState } from 'react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider,TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table'
import { toast } from 'sonner'
import axios from 'axios'; 
import CreateClientPopup from '@/components/CreateClientPopup';
import { usePage } from '@inertiajs/react';

interface IndexProps {
  service: Datasource;
  properties: Property[];
  clients: Client[];
}

const GoogleService = ({ service, properties, clients }: IndexProps) => {

  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };


    const { data, post, errors } = useForm();
    const [openCreateClient, setOpenCreateClient] = useState(false);
    const { clientGroups, statuses } = usePage<{
    clientGroups: any[];
    statuses: Record<string, string>;
    }>().props;
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
            title: service.title,
            href: '#',
        },
    ];


    
  // ✅ FLATTEN DATA (LIKE SIMPLIFI)
  const tableData = properties.flatMap(property => [
    {
      id: property.id,
      type: 'property',
      property_name: property.property_name,
      property_id: property.property_id,
      account: property.account,
      created_at: property.created_at,
      client_id: property.client_id,
      is_assigned: !!property.client_id,
      hasCampaigns: property.campaigns?.length > 0,
      has_assigned_child: property.campaigns?.some(c => c.client_id),
      assignedCampaignCount: property.campaigns?.filter(c => c.client_id).length || 0,
      has_assigned_child: property.campaigns?.some(c => c.client_id),
    },

    ...(expandedRows[property.id]
      ? property.campaigns.map(campaign => ({
          id: campaign.id,
          type: 'campaign',
            property_name: property.property_name,
          name: campaign.name,
          created_at: campaign.created_at,
          client_id: campaign.client_id,
          is_assigned: !!campaign.client_id,
          parentId: property.id,
          parent_assigned_client_id: property.client_id,
          parent_has_assigned_child: property.campaigns.some(c => c.client_id),
        }))
      : [])
  ]);


console.log('expandedRows',expandedRows);
console.log('tableData',tableData);


  const columns: ColumnDef<any>[] = [



    // ✅ EXPAND + CHECKBOX
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <div className="flex items-center">

          {row.original.type === 'property' && row.original.hasCampaigns && (
            <button
              onClick={() => toggleRow(row.original.id)}
              className="flex items-center justify-center w-5 h-5"
            >
              {expandedRows[row.original.id]
                ? <ChevronDown className="h-4 w-4" />
                : <ChevronRight className="h-4 w-4" />}
            </button>
          )}

          {row.original.type === 'campaign' && <div className="ml-6 w-4" />}

          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
          />
        </div>
      )
    },

    // ✅ NAME
    {
      accessorKey: 'property_name',
      header: 'Account Name',
        cell: ({ row }) => (
        <div
            className={
            row.original.type === 'property'
                ? 'text-primary font-medium hover:text-primary/90 ml-3'
                : 'text-gray-700 ml-8 pl-2 border-l-2 border-gray-200'
            }
        >
            {row.original.type === 'property'
            ? row.original.property_name
            : row.original.name}
        </div>
        )
    },

    // ✅ CONNECTION
    {
      accessorKey: 'account',
      header: 'Account Connection',
      cell: ({ row }) => (
        <div>

          {row.original.account?.name || 'Salt Rank Manager'}
        </div>
      )
    },

    // ✅ DATE
    {
      accessorKey: 'created_at',
      header: 'Date First Seen',
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return date.toLocaleDateString();
      }
    },

    // ✅ STATUS
    {
      accessorKey: 'is_assigned',
      header: 'Assignment Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_assigned ? 'default' : 'outline'}>
          {row.original.is_assigned ? 'Assigned' : 'Unassigned'}
        </Badge>
      )
    },

    // ✅ ASSIGN
    {
      accessorKey: 'client_id',
      header: 'Assigned Client',
      cell: ({ row }) => {

        const form = useForm({});


          const handleAssign = (type, id, clientId) => {
                post(route('properties.assign', {
                    type: type,
                    id: id,
                    client_id: clientId,
                }), {
                    onSuccess: () => { toast.success('Assigned to Client successfully') },
                    onError: () => { toast.error('Failed to save assignment') }
                });
            }

          const handleUnassign = (type, id) => {
            post(route('properties.unassign', {
                  type: type,
                  id: id,
            }), {
                    onSuccess: () => { toast.success('Unassigned to Client successfully') },
                    onError: () => { toast.error('Failed to unassigned assignment') }
                });
            }

        const parentAssigned = !!row.original.parent_assigned_client_id;
        const hasAssignedChild = !!row.original.has_assigned_child;

       const isLockedParent =
      row.original.type === 'property' &&
      hasAssignedChild &&
      !row.original.client_id; // 👈 important
            const isLockedChild = row.original.type === 'campaign' && parentAssigned;

            return (
              <div className="flex items-center gap-1">

      {isLockedParent && (
      <span className="text-gray-500 text-sm">
        {row.original.assignedCampaignCount} campaign
        {row.original.assignedCampaignCount > 1 ? 's' : ''} assigned
      </span>
    )}

            {isLockedChild && (
            <span className="text-gray-500 text-sm">
                Assigned via property
            </span>
            )}

            {!isLockedParent && !isLockedChild && (
              <Select
                value={row.original.client_id?.toString() || ''}
                onValueChange={(value) =>
                  handleAssign(row.original.type, row.original.id, value)
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Assign to" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {row.original.client_id && !isLockedChild && (
              <>
                <Button asChild>
                  <Link href={route('admin.clients.edit', row.original.client_id)}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <UserRoundX className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unassign?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to unassign?
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          handleUnassign(row.original.type, row.original.id)
                        }
                      >
                        Yes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

          </div>
        );
      }
    }
  ];

  return (
     <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Data Source" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">

                <div className='flex items-center justify-between mb-4'>
                    <h2 className="text-2xl font-semibold">{service.title}</h2>
                    <div className='flex items-center justify-between gap-2'>

                        <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button variant="light" className="cursor-pointer" asChild>
                                <Link href={route('data.datasource.syncClients', service.service)}>
                                <RefreshCw className="h-4 w-4" />
                                <span className="ml-1">Sync Clients</span>
                                </Link>
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                            Fetch newly added GA4 properties from Google Analytics
                            </TooltipContent>
                        </Tooltip>
                        </TooltipProvider>


                                    <Button variant='light' className='cursor-pointer' asChild>
                                    <Link href={route('data.datasource.sync', service.service)}>
                                        <RefreshCw className="h-4 w-4" /> Refresh Data
                                    </Link>
                                    </Button>

                                    <Button variant="light" className="cursor-pointer" asChild>
                                        <Link href={route('data.datasource.refreshtoken', service.service)}>
                                        <RefreshCw className="h-4 w-4" />
                                        <span className="ml-1">refresh account</span>
                                        </Link>
                                    </Button>
                    </div>
                </div>

                <h3 className="text-xl font-semibold leading-1">Assign a {service.title} profile to its respective client</h3>
                <p className='text-md text-gray-500'>You can expand a {service.title} profile to reveal the existing campaigns and assign them on a more granular level.</p>

                <DataTable
                  data={tableData}
                  columns={columns}
                  searchColumn="property_name"
                  searchPlaceholder="Search account"      
                />
            </div>
        </AppLayout>
    )
};

export default GoogleService;