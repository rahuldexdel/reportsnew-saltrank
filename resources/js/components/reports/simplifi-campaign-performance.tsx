import { Checkbox } from "@/components/ui/checkbox"; // update path as per your structure
import { ColumnDef } from "@tanstack/react-table"; // or your specific version
import { DataTable } from "../data-table";
import React from "react";

type Data = {
    id: string;
    amount: number;
    status: "pending" | "processing" | "success" | "failed";
    email: string;
};

interface DataProps {
    data: Data[];
}

export function SimplifiCampaignPerformance({ data }: DataProps) {
    const columns: ColumnDef<Data>[] = [
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
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("status")}</div>
            ),
        },
        {
            accessorKey: "email",
            header: () => <div>Email</div>,
            cell: ({ row }) => <div>{row.getValue("email")}</div>,
        },
        {
            accessorKey: "amount",
            header: () => <div className="text-right">Amount</div>,
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("amount"));
                const formatted = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount);

                return <div className="text-right font-medium">{formatted}</div>;
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex gap-2">
                        {/* Example: Replace with real buttons/actions */}
                        <button
                            className="text-sm text-blue-600 hover:underline"
                            onClick={() => alert(`Viewing ${item.id}`)}
                        >
                            View
                        </button>
                        <button
                            className="text-sm text-red-600 hover:underline"
                            onClick={() => alert(`Deleting ${item.id}`)}
                        >
                            Delete
                        </button>
                    </div>
                );
            },
        },
    ];

    return (
        <DataTable
            data={data}
            columns={columns}
        />
    );
}
