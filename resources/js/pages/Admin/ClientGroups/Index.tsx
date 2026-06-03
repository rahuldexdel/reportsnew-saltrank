import { ArrowUpDown, Download, MoreHorizontal, PencilIcon, PlusIcon, Trash2, Upload } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Head, Link, router } from '@inertiajs/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import AppLayout from '@/layouts/app-layout'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table'
import React from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: route('admin.client-groups.index')
    },
    {
        title: 'Client Groups',
        href: route('admin.client-groups.index')
    }
];

interface ClientGroups {
    'id': number;
    'name': string;
    'clients': {
        id: number;
        company_name: string;
    }[];
    'client_group_dashboard': string;
    'created_at': string;
    'updated_at': string;
}

interface ClientGroupsProps{
    clientGroups: ClientGroups[];
}


const columns: ColumnDef<ClientGroups>[] = [
    {
        id: "id",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Group Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return (
                    <Link href={route('admin.client-groups.index')} className='text-primary font-medium hover:text-primary/90 ml-3'>{row.original.name}</Link>
            )
        },
        enableSorting: true,
        enableHiding: false,
    },
    {
        accessorKey: 'client',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Client Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            // Check if groups exist and are loaded
            if (!row.original.clients || row.original.clients.length === 0) {
                return <div className="text-gray-400">-</div>;
            }

            return (
                <div className="flex flex-wrap gap-1">
                    {row.original.clients.map(group => (
                        <Badge
                            key={group.id}
                            variant="outline"
                            className="text-xs"
                        >
                            {group.company_name}
                        </Badge>
                    ))}
                </div>
            );
        },
        enableHiding: false,
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Created At
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div>{new Date(row.original.created_at).toLocaleDateString()}</div>
        ),
    },
    {
        accessorKey: 'updated_at',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Updated At
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div>{new Date(row.original.updated_at).toLocaleDateString()}</div>
        ),
    },
    {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const client = row.original; // Get the current client data
            return (
                <>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href={route('admin.client-groups.edit', client.id)} className="inline-block mr-2 hover:text-primary">
                                    <PencilIcon className="h-4 w-4" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Edit Client</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Delete Client */}
                    <AlertDialog>
                        <AlertDialogTrigger>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="text-red-600 hover:text-red-700" asChild>
                                        <Trash2 className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Delete Client</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the client Group.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => router.delete(route('admin.client-groups.destroy', client.id))}
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            );
        },
    }
];

const Index = ({clientGroups}: ClientGroupsProps ) => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Client Groups' />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className='flex items-center justify-between mb-4'>
                    <h2 className="text-2xl font-semibold">All Client Groups</h2>
                    <div className='flex items-center justify-between gap-2'>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button asChild>
                                        <Link href={route('admin.client-groups.create')}><PlusIcon /></Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Add Client Group</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button variant='outline' asChild>
                                        <Link href='#'><Download /></Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Download Client Groups</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button variant='outline' asChild>
                                        <Link href='#'><Upload /></Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Upload Client Groups</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <DataTable
                    data={clientGroups}
                    columns={columns}
                    searchColumn='name'
                    searchPlaceholder='Group Name'
                />
            </div>
        </AppLayout>
    )
}

export default Index
