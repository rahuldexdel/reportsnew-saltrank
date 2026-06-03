import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowUpDown, Download, PencilIcon, PlusIcon, Trash2, Upload } from 'lucide-react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { BreadcrumbItem, Client } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import AppLayout from '@/layouts/app-layout';
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import clientLogo from '@/images/client-placeholder.png'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: route('admin.clients.index')
    },
    {
        title: 'Clients',
        href: route('admin.clients.index')
    }
];

const columns: ColumnDef<Client>[] = [
    {
        id: "id",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
        accessorKey: 'company_name',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Company Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const { baseUrl } = usePage().props;

            const logo = row.original.logo ? `${baseUrl}/storage/${row.original.logo}` : clientLogo;
            return (
                <div className='flex items-center'>
                    <Avatar>
                        <AvatarImage className='w-8 h-8' src={logo} alt={row.original.company_name}></AvatarImage>
                    </Avatar>
                    <Link href={route('admin.clients.index')} className='text-primary font-medium hover:text-primary/90 ml-3'>{row.original.company_name}</Link>
                </div>
            )
        },
        enableHiding: false,
    },
    {
        accessorKey: 'client_groups',
        header: 'Client Groups',
        cell: ({ row }) => {
            // Check if groups exist and are loaded
            if (!row.original.groups || row.original.groups.length === 0) {
                return <div className="text-gray-400">-</div>;
            }

            return (
                <div className="flex flex-wrap gap-1">
                    {row.original.groups.map(group => (
                        <Badge
                            key={group.id}
                            variant="outline"
                            className="text-xs"
                        >
                            {group.name}
                        </Badge>
                    ))}
                </div>
            );
        },
        enableHiding: false,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const status = row.original.status;
            const variant = {
                'Active': 'default',
                'Pending Assignment': 'secondary',
                'Hold': 'outline',
                'Terminated': 'destructive'
            }[status] as 'default' | 'secondary' | 'outline' | 'destructive';

            return (
                <Badge variant={variant} className='ml-3'>
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Created At
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className='ml-3'>{new Date(row.original.created_at).toLocaleDateString()}</div>
        ),
    },
    {
        accessorKey: 'updated_at',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Updated At
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className='ml-3'>{new Date(row.original.updated_at).toLocaleDateString()}</div>
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
                                <Link href={route('admin.clients.edit', client.id)} className="inline-block mr-2 hover:text-primary">
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
                                    This action cannot be undone. This will permanently delete the client.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => router.delete(route('admin.clients.destroy', client.id))}
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

interface ClientProps {
    clients: Client[];
    statuses: { [key: string]: string };
}

const Index = ({ clients, statuses }: ClientProps) => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">

                <div className='flex items-center justify-between mb-4'>
                    <h2 className="text-2xl font-semibold">All Clients</h2>
                    <div className='flex items-center justify-between gap-2'>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button asChild>
                                        <Link href={route('admin.clients.create')}><PlusIcon /></Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Add Client</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button variant='outline' asChild>
                                        <Link href={route('admin.clients.create')}><Download /></Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Download Client</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button variant='outline' asChild>
                                        <Link href={route('admin.clients.create')}><Upload /></Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Upload Client</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <DataTable
                    data={clients}
                    columns={columns}
                    searchColumn='company_name'
                    searchPlaceholder='Company Name'
                    tabs='status'
                />
            </div>
        </AppLayout>
    );
}

export default Index;