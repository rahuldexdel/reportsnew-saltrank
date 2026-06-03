import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'


import { ArrowUpDown, Pencil, LoaderCircle,Plus, RefreshCw,UserRoundX } from 'lucide-react'
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import React, { useState } from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog'
import AppLayout from '@/layouts/app-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CreateClientPopup from '@/components/CreateClientPopup'
import { router } from '@inertiajs/react'


/* Types */
interface SemrushSite {
    id: number
    domain: string
    client_id: number | null
    client?: { company_name: string }
    database: string
    created_at: string
}

interface Client {
    id: number
    company_name: string
}

interface Props {
    account: {
        id: number
        domain: string
        sites: SemrushSite[]
    }
    clients: Client[]
}

type SemrushForm = {
    api_key: string
    default_database: string
    test_domain: string
}

const SemrushService = () => {
    const { account, clients, clientGroups, statuses } =
        usePage<Props & {
            clientGroups: any[]
            statuses: Record<string, string>
        }>().props



       

const [isSemrushOpen, setIsSemrushOpen] = useState(false)


    const [openCreateClient, setOpenCreateClient] = useState(false)

    const semrushForm = useForm<SemrushForm>({
        api_key: '',
        default_database: 'us',
        test_domain: '',
    })


    const submitDomain: FormEventHandler = (e) => {
        e.preventDefault();

        semrushForm.post(route('add-domain-to-semrushrq'), {
            onSuccess: () => {
                setIsSemrushOpen(false);
                toast.success('Domain added to SEMrush account');
                semrushForm.reset();
            },
            onError: (errors) => {
                toast.error(
                    errors?.test_domain || 'Failed to add domain to SEMrush account'
                );
            },
        });
    };

    const columns: ColumnDef<SemrushSite>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) =>
                        row.toggleSelected(!!value)
                    }
                />
            ),
        },
        {
            accessorKey: "domain",
            header: "Domain",
            cell: ({ row }) => (
                <div className="font-medium text-primary ml-2">
                    {row.original.domain}
                </div>
            ),
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Date First Seen
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const date = new Date(row.original.created_at)
                return (
                    <div className="ml-2">
                        {date.toLocaleDateString("en-US", {
                            month: "long",
                            day: "2-digit",
                            year: "numeric",
                        })}
                    </div>
                )
            },
        },
        {
            accessorKey: "client_id",
            header: "Assignment Status",
            cell: ({ row }) => (
                <Badge variant={row.original.client_id ? "success" : "outline"}>
                    {row.original.client_id ? "Assigned" : "Unassigned"}
                </Badge>
            ),
        },
        {
            accessorKey: "client",
            header: "Assigned Client",
            cell: ({ row }) => {
                const site = row.original

                const { data, post, processing } = useForm({
                    clientId: site.client_id || '',
                })

            const handleAssign = (clientId: string) => {
                router.post(route('semrush.assign.client'), {
                    site_id: site.id,
                    client_id: clientId,
                }, {
                    onSuccess: () => toast.success('Client assigned successfully'),
                    onError: () => toast.error('Failed to assign client'),
                })
            }

            const handleUnassign = () => {
                router.post(route('semrush.unassign.client'), {
                    site_id: site.id,
                }, {
                    onSuccess: () => toast.success('Client unassigned successfully'),
                    onError: () => toast.error('Failed to unassign client'),
                })
            }


                return (
                    <div className="flex items-center gap-2">

                        {/* SELECT CLIENT */}
                        <Select
                            value={data.clientId?.toString()}
                            onValueChange={(value) => {
                                if (value === '__new_client__') {
                                    setOpenCreateClient(true)
                                    return
                                }
                                handleAssign(value)
                            }}
                            disabled={processing}
                        >
                            <SelectTrigger className="w-[180px]">
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

                                    {clients.map((client) => (
                                        <SelectItem
                                            key={client.id}
                                            value={client.id.toString()}
                                        >
                                            {client.company_name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        {/* CREATE CLIENT DIALOG */}
                        <Dialog open={openCreateClient} onOpenChange={setOpenCreateClient}>
                            <DialogContent className="sm:max-w-[650px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Client</DialogTitle>
                                </DialogHeader>

                                <CreateClientPopup
                                    clientGroups={clientGroups}
                                    statuses={statuses}
                                    semrush="semrush" 
                                    onSuccess={(client) => {
                                        setOpenCreateClient(false)
                                        handleAssign(client.id.toString())
                                    }}
                                />
                            </DialogContent>
                        </Dialog>

                        {/* ACTION BUTTONS */}
                        {site.client_id && (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="success" asChild>
                                            <Link href={route('admin.clients.edit', site.client_id)}>
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Client</TooltipContent>
                                </Tooltip>

                                <AlertDialog>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="danger">
                                                    <UserRoundX className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>Unassign</TooltipContent>
                                    </Tooltip>

                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Are you sure?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                You are about to unassign this domain from its client.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleUnassign}
                                                disabled={processing}
                                            >
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
            <AppLayout>
                <Head title="Manage Semrush Sites" />

                <div className="flex flex-col gap-4 rounded-xl p-4">

                    {/* Existing Table for Domains */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Semrush Sites</h2>
                        {/* {account.sites.length === 0 && (
                            <Button variant="light" onClick={() => setIsSemrushOpen(true)}>
                                <Plus className="h-4 w-4" /> Add Domain
                            </Button>
                        )} */}

                    <Button variant='light' className='cursor-pointer' asChild>
                        <Link href={route('data.datasource.sync', 'semrush')}>
                            <RefreshCw className="h-4 w-4" /> Refresh Data
                        </Link>
                    </Button>


                    </div>

                    <h3 className="text-xl font-semibold">
                        Assign a Semrush domain to its respective client
                    </h3>
                    <p className="text-gray-500">
                        You can assign or unassign domains to clients using the dropdown.
                    </p>
                    {/* New Section for Account Information */}
                    <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded-xl mb-6">
                        <h3 className="text-xl font-semibold">Account Information</h3>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-600">
                                <strong>Connection Status:</strong> {account.status === 'connected' ? 'Connected' : 'Disconnected'}
                            </p>
                            <p className="text-gray-600">
                                <strong>Domains:</strong> {account.sites.length}
                            </p>
                        </div>
                    </div>

                    {/* Existing DataTable Component */}
                    <DataTable
                        data={account.sites}
                        columns={columns}
                        searchColumn="domain"
                        searchPlaceholder="Search domain..."
                    />

                    {/* Add Domain Dialog */}
                    <Dialog open={isSemrushOpen} onOpenChange={setIsSemrushOpen}>
                        <DialogContent className="max-w-xl">
                            <form onSubmit={submitDomain}>
                            <DialogHeader>
                                <DialogTitle>Add Domain to SEMrush Account</DialogTitle>
                                <DialogDescription>
                                    Enter your Domain Name to associate it with the SEMrush account.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 mt-4">
                                <div className="grid gap-2">
                                    <Label>Domain</Label>
                                    <Input
                                        required
                                        value={semrushForm.data.test_domain}
                                        onChange={(e) =>
                                            semrushForm.setData('test_domain', e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={semrushForm.processing}>
                                    {semrushForm.processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    Save
                                </Button>
                            </DialogFooter>
                        </form>

                        </DialogContent>
                    </Dialog>
                </div>
            </AppLayout>
        );

}

export default SemrushService
