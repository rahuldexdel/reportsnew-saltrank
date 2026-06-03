import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog'

import { LoaderCircle, Pencil,RefreshCw, Plus, UserRoundX } from 'lucide-react'
import { BreadcrumbItem, Client } from '@/types'
import { Head, Link,router , useForm, usePage } from '@inertiajs/react'
import React, { useState } from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import AppLayout from '@/layouts/app-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ColumnDef } from '@tanstack/react-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table'
import { toast } from 'sonner'
import CreateClientPopup from '@/components/CreateClientPopup'


const breadcrumbs: BreadcrumbItem[] = [
    { title: 'CallRail Companies', href: '/data/datasource/callrail' },
]

// 🔥 COMPANY TYPE
interface Company {
    id: number
    name: string
    property_id: string
    client_id: number | null
    is_assigned: boolean
    created_at: string
}

interface Props {
    companies: Company[]
    clients: Client[]
}

const CallrailService: React.FC = () => {
    const { companies, clients, clientGroups, statuses } = usePage<any>().props
    const [openCreateClient, setOpenCreateClient] = useState(false)

    // 🔥 TABLE COLUMNS
    const columns: ColumnDef<Company>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                />
            ),
        },

        {
            accessorKey: "name",
            header: "Account Name",
            cell: ({ row }) => (
                <span className="text-orange-500 font-medium ml-2">
                    {row.original.name}
                </span>
            ),
        },

        {
            header: "Connection Name",
            cell: () => (
                <div className="flex items-center gap-2">
                    <span className="text-green-500">●</span>
                    Salt Rank
                </div>
            ),
        },

        {
            accessorKey: "created_at",
            header: "Date First Seen",
        },

        {
            accessorKey: "is_assigned",
            header: "Assignment Status",
            cell: ({ row }) => (
                <Badge variant={row.original.is_assigned ? "success" : "outline"}>
                    {row.original.is_assigned ? "Assigned" : "Unassigned"}
                </Badge>
            ),
        },

        {
            header: "Assigned Client",
            cell: ({ row }) => {
                const company = row.original

                const { data, setData, post, processing } = useForm({
                    clientId: company.client_id || "",
                })

                // 🔥 ASSIGN
               const handleAssign = (value: string) => {
                    post(
                        route("callrail.assign.client", {
                             company_id: company.id,
                        client_id: value,
                        }),
                        {
                           // onSuccess: () => toast.success("Assigned successfully!"),
                            onError: () => toast.error("Failed to assign."),
                        }
                    )
                }

                const handleUnassign = () => {
                                post(
                                    route("callrail.unassign.client", {
                                        company_id: company.id,
                                    }),
                                    {
                                       // onSuccess: () => toast.success("Unassigned successfully!"),
                                        onError: () => toast.error("Failed to unassign."),
                                    }
                                )
                            }


                return (
                    <div className="flex items-center gap-2">

                        {/* SELECT */}
                        <Select
                            value={data.clientId?.toString()}
                            onValueChange={handleAssign}
                            disabled={processing}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Assign to" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Select Client</SelectLabel>

                                    <SelectItem value="__new_client__">
                                        <div className="flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            New Client
                                        </div>
                                    </SelectItem>

                                    {clients.map((client: Client) => (
                                        <SelectItem key={client.id} value={client.id.toString()}>
                                            {client.company_name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        {/* POPUP */}
                        <Dialog open={openCreateClient} onOpenChange={setOpenCreateClient}>
                            <DialogContent className="sm:max-w-[650px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Client</DialogTitle>
                                </DialogHeader>

                                <CreateClientPopup
                                    clientGroups={clientGroups}
                                    statuses={statuses}
                                    onSuccess={(client) => {
                                        setOpenCreateClient(false)

                                        setTimeout(() => {
                                            handleAssign(client.id.toString())
                                        }, 200)
                                    }}
                                />
                            </DialogContent>
                        </Dialog>

                        {/* ACTIONS */}
                        {company.is_assigned && (
                            <>
                                {/* EDIT */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button asChild variant="success">
                                            <Link href={route("admin.clients.edit", company.client_id)}>
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Client</TooltipContent>
                                </Tooltip>

                                {/* UNASSIGN */}
                                <AlertDialog>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive">
                                                    <UserRoundX className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>Unassign</TooltipContent>
                                    </Tooltip>

                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will unassign the client.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleUnassign}>
                                                Yes, Unassign
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                    </div>
                )
            },
        },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CallRail Companies" />

           <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                     <div className='flex items-center justify-between mb-4'>
                         <h2 className="text-2xl font-semibold">Call Rail</h2>
                         <div className='flex items-center justify-between gap-2'>
                        <Button
                            variant="light"
                            className="cursor-pointer"
                            onClick={() => router.post(route('data.datasource.syncCompony'))}
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span className="ml-1">Sync Compony</span>
                        </Button>
                         </div>
                    </div>
                <h3 className="text-xl font-semibold leading-1">  Assign a CallRail company to its respective client</h3>
                <p className='text-md text-gray-500'>You can expand a Call Rail profile to reveal the existing campaigns and assign them on a more granular level.</p>
                <DataTable
                    data={companies}
                    columns={columns}
                    searchColumn="name"
                    searchPlaceholder="Search 149 records..."
                />
            </div>
        </AppLayout>
    )
}

export default CallrailService