import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { FormEventHandler } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Admin', href: route('admin.clients.index') },
  { title: 'Client Groups', href: route('admin.client-groups.index') },
  { title: 'Create Client Group', href: '#' },
];

type ClientGroupForm = {
  name: string;
  clients: string[];
  client_group_dashboard: string;
  isManualDashboardGroup: boolean;
};

interface ClientGroupProps {
  clients: { id: number; company_name: string }[];
  clientGroups: { id: number; client_group_dashboard: string }[];
}

const Create = ({ clients, clientGroups }: ClientGroupProps) => {
  const animatedComponents = makeAnimated();
  const { data, setData, post, processing, errors, reset } = useForm<Required<ClientGroupForm>>({
    name: '',
    clients: [],
    client_group_dashboard: '',
    isManualDashboardGroup: false,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('admin.client-groups.store'), { onSuccess: () => reset() });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Client Group" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">Add New Client Group</h2>
          </div>
        </div>

        <form className="flex flex-col gap-6" onSubmit={submit}>
          <div className="grid grid-cols-1 w-full md:w-1/2 gap-6">

            {/* Group Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                type="text"
                required
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
                options={clients.map((client) => ({
                  value: client.id.toString(),
                  label: client.company_name,
                }))}
                value={data.clients.map((id) => ({
                  value: id,
                  label: clients.find((c) => c.id.toString() === id)?.company_name || id,
                }))}
                onChange={(selectedOptions) =>
                  setData('clients', selectedOptions.map((o) => o.value))
                }
                components={animatedComponents}
                placeholder="Select clients..."
                classNamePrefix="react-select"
                closeMenuOnSelect={false}
              />
              <InputError message={errors.clients} />
            </div>

            {/* Dashboard Group */}
            {/* <div className="grid gap-2">
              <Label htmlFor="client_group_dashboard">Dashboard Group</Label>

              {data.isManualDashboardGroup ? (
                <>
                  <Input
                    id="client_group_dashboard_input"
                    type="text"
                    value={data.client_group_dashboard}
                    onChange={(e) => setData('client_group_dashboard', e.target.value)}
                    placeholder="Enter new dashboard group name"
                    required
                  />
                  <button
                    type="button"
                    className="text-sm text-blue-600 underline mt-1 text-left"
                    onClick={() => setData('isManualDashboardGroup', false)}
                  >
                    ← Back to select list
                  </button>
                </>
              ) : (
                <Select
                  value={data.client_group_dashboard}
                  onValueChange={(value) => {
                    if (value === 'manual') {
                      setData('isManualDashboardGroup', true);
                      setData('client_group_dashboard', '');
                    } else {
                      setData('client_group_dashboard', value);
                    }
                  }}
                  required
                >
                  <SelectTrigger id="client_group_dashboard" tabIndex={3}>
                    <SelectValue placeholder="Select or add dashboard group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Existing Groups</SelectLabel>
                      {clientGroups.map((group) => (
                        <SelectItem
                          key={group.id}
                          value={group.client_group_dashboard}
                        >
                          {group.client_group_dashboard}
                        </SelectItem>
                      ))}
                      <SelectItem value="manual">➕ Add new group</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}

              <InputError message={errors.client_group_dashboard} />
            </div> */}
          </div>

          <Button type="submit" className="mt-4 w-full md:w-auto self-start" tabIndex={4} disabled={processing}>
            {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
            Create Group
          </Button>
        </form>
      </div>
    </AppLayout>
  );
};

export default Create;
