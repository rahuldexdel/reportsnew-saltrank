import { Head, useForm } from '@inertiajs/react';
import React, { FormEventHandler } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';
import { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Admin', href: route('admin.clients.index') },
  { title: 'Clients', href: route('admin.clients.index') },
  { title: 'Edit Client Group', href: '#' },
];

type ClientGroupForm = {
  name: string;
  clients: string[];
  client_group_dashboard: string;
  isManualDashboardGroup: boolean;
};

interface ClientGroupProps {
  clientGroup: {
    id: number;
    name: string;
    clients: { id: number; company_name: string }[];
    client_group_dashboard: string;
  };
  clients: { id: number; company_name: string }[];
  clientGroups: { id: number; client_group_dashboard: string }[]; // ✅ Added
}

const Edit = ({ clientGroup, clients, clientGroups }: ClientGroupProps) => {
  const animatedComponents = makeAnimated();

  const { data, setData, put, processing, errors, reset } =
    useForm<Required<ClientGroupForm>>({
      name: clientGroup.name,
      clients: clientGroup.clients.map((c) => c.id.toString()),
      client_group_dashboard: clientGroup.client_group_dashboard,
      isManualDashboardGroup: false,
    });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    put(route('admin.client-groups.update', clientGroup.id), {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Edit Client Groups" />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-2xl font-semibold">{clientGroup.name}</h2>

        <form className="flex flex-col gap-6" onSubmit={submit}>
          <div className="grid grid-cols-1 w-full md:w-1/2 gap-6">
            {/* Group Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                type="text"
                required
                autoFocus
                tabIndex={1}
                autoComplete="name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="Group Name"
              />
              <InputError message={errors.name} />
            </div>

            {/* Clients */}
            <div className="grid gap-2">
              <Label htmlFor="clients">Clients</Label>
              <ReactSelect
                id="clients"
                tabIndex={2}
                isMulti
                options={clients.map((group) => ({
                  value: group.id.toString(),
                  label: group.company_name,
                }))}
                value={data.clients.map((id) => ({
                  value: id,
                  label:
                    clients.find((g) => g.id.toString() === id)?.company_name ||
                    id,
                }))}
                onChange={(selectedOptions) => {
                  setData(
                    'clients',
                    selectedOptions.map((option) => option.value)
                  );
                }}
                components={animatedComponents}
                placeholder="Select clients..."
                className="react-select-container"
                classNamePrefix="react-select"
                closeMenuOnSelect={false}
              />
              <InputError message={errors.clients} />
            </div>

            {/* Dashboard Group */}


   
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button type="submit" tabIndex={6} disabled={processing}>
              {processing && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Group
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default Edit;
