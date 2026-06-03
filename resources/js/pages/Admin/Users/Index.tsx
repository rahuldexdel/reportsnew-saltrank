import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ArrowUpDown, Download, PencilIcon, PlusIcon, Trash2, Upload } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BreadcrumbItem, User } from '@/types'
import { Head, Link, router } from '@inertiajs/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { AlertDialog } from '@radix-ui/react-alert-dialog'
import AppLayout from '@/layouts/app-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table'
import React from 'react'
import { useInitials } from '@/hooks/use-initials'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: route('admin.users.index')
    },
    {
        title: 'Users',
        href: route('admin.users.index')
    }
];

interface UsersProps {
    users: User[];
} 

 


const Index = ({ users }: UsersProps) => {


//console.log(users);

const columns: ColumnDef<User>[] = [
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
        accessorKey: 'avatar',
        header: 'User Image',
        cell: ({ row }) => {
            const getInitials = useInitials();
            return (
                <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                    <AvatarImage src={row.original.avatar} alt={row.original.name} />
                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                        {getInitials(row.original.name)}
                    </AvatarFallback>
                </Avatar>
            );
        },
        enableSorting: false,
        enableHiding: false,

    },
    {
        accessorKey: 'email',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <Link href={route('admin.clients.index')} className='text-primary font-medium hover:text-primary/90 ml-3'>{row.original.email}</Link>
        ),
        enableSorting: false,
        enableHiding: false,

    },
    {
        accessorKey: 'user_role',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    User Role
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <Badge variant='outline' className='ml-3'>{row.original.user_role}</Badge>
        )
    },

        {
        accessorKey: 'client',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Client
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className='ml-3'>
                {row.original.client?.company_name || '—'}
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },

    //     {
    //     accessorKey: 'dashboard_group',
    //     header: ({ column }) => ( 
    //         <Button
    //             variant="ghost"
    //             onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //         >
    //             dashboard_group
    //             <ArrowUpDown className="ml-2 h-4 w-4" />
    //         </Button>
    //     ),
    //     cell: ({ row }) => (
    //         <div className='ml-3'>
    //             {row.original.dashboard_group || '—'}
    //         </div>
    //     ),
    //     enableSorting: false,
    //     enableHiding: false,
    // },


    {
        accessorKey: 'first_name',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    First Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className='ml-3'>{row.original.first_name}</div>
        ),
        enableSorting: false,
        enableHiding: false,

    },
    {
        accessorKey: 'last_name',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Last Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className='ml-3'>{row.original.last_name}</div>
        ),
        enableSorting: false,
        enableHiding: false,

    },
    // {
    //     accessorKey: 'phone',
    //     header: 'Phone Number',
    // },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status;
            const variant = {
                'Active': 'default',
                'Inactive': 'destructive',
            }[status] as 'default' | 'secondary' | 'outline' | 'destructive';

            return (
                <Badge variant={variant}>{status}</Badge>
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
            const user = row.original;
            return (
                <>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href={route('admin.users.edit', user.id)} className="inline-block mr-2 hover:text-primary">
                                    <PencilIcon className="h-4 w-4" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Edit</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Delete Users */}
                    <AlertDialog>
                        <AlertDialogTrigger>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="text-red-600 hover:text-red-700" asChild>
                                        <Trash2 className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Delete</p>
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
                                    onClick={() => router.delete(route('admin.users.destroy', user.id))}
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


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Users' />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className='flex items-center justify-between mb-4'>
                    <h2 className="text-2xl font-semibold">All Users</h2>
                    <div className='flex items-center justify-between gap-2'>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button asChild>
                                        <Link href={route('admin.users.create')}><PlusIcon /></Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Add User</p>
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
                                    <p>Download User</p>
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
                                    <p>Upload User</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                <DataTable
                    data={users}
                    columns={columns}
                    searchColumn='email'
                    searchPlaceholder='By Email'
                    tabs='status'
                />
            </div>
        </AppLayout>
    )
}

export default Index
