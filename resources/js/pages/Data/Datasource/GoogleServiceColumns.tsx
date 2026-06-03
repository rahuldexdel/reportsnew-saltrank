// google-service-columns.ts

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ArrowUpDown, Check, Pencil, UserRoundX } from 'lucide-react'
import { Client, Property } from '@/types'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ColumnDef } from '@tanstack/react-table'
import { Link } from '@inertiajs/react'
import { toast } from 'sonner'
import { useForm } from '@inertiajs/react'

export const getGoogleServiceColumns = (clients: Client[]): ColumnDef<Property>[] => [
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
        accessorKey: 'property_id',
        header: 'Account Name',
        cell: ({ row }) => (
            <div className='text-primary font-medium hover:text-primary/90 ml-3'>{row.original.property_id}</div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'accountname',
        header: 'Account Connection',
        accessorFn: (row) => row.account?.name || '',
        cell: ({ row }) => {
            return (
                <>
                    <button className="text-white bg-green-500 rounded-full p-0.5 mr-1"><Check className="h-2.5 w-2.5" /></button>
                    {row.getValue('accountname')}
                </>
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Date First Seen <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue("created_at"));
            return <div className='ml-3'>
                {date.toLocaleDateString('en-US', {
                    month: 'long',
                    day: '2-digit',
                    year: 'numeric'
                })}
            </div>
        },
    },
    {
        accessorKey: 'is_assigned',
        header: 'Assignment Status',
        cell: ({ row }) => {
            const variant = row.getValue('is_assigned') ? 'success' : 'outline';
            return (
                <Badge variant={variant}> {row.getValue('is_assigned') ? 'Assigned' : 'Unassigned'}</Badge>
            );
        },
    },
    {
        accessorKey: 'client_id',
        header: 'Assigned Client',
        cell: ({ row }) => {
            const property = row.original;
            const { data, setData, post, processing, errors, reset } = useForm({
                clientId: row.original.client_id || ''
            });

            const handleAssign = (clientId: string) => {
                post(route('properties.assign', {
                    property_id: property.id,
                    client_id: clientId,
                }), {
                    onSuccess: () => { toast.success('Assigned to Client successfully') },
                    onError: () => { toast.error('Failed to save assignment') }
                });
            }
            const handleUnAssign = () => {
                post(route('properties.unassign', {
                    property_id: property.id,
                }), {
                    onSuccess: () => { toast.success('Unassigned to Client successfully') },
                    onError: () => { toast.error('Failed to unassigned assignment') }
                });
            }

            return (
                <div className="flex items-center gap-2 ">
                    <Select
                        value={data.clientId?.toString()}
                        onValueChange={handleAssign}
                        disabled={processing}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Assign to" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel className='font-semibold'>Select Client</SelectLabel>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id.toString()}>
                                        {client.company_name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    {row.original.is_assigned && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="success" asChild>
                                        <Link href={route('admin.clients.edit', data.clientId)}><Pencil className="h-4 w-4" /></Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Edit Client</p>
                                </TooltipContent>
                            </Tooltip>

                            <AlertDialog>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="danger"><UserRoundX className="h-4 w-4" /></Button>
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
                                            You are about to unassign{" "}
                                            <strong>{row.original.client.company_name}</strong> from this
                                            account. Do you wish to continue?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleUnAssign} disabled={processing}>
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
    },
];