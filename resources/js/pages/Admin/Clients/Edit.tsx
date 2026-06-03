import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { BreadcrumbItem, Client, ClientForm } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { FormEventHandler } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

const animatedComponents = makeAnimated();

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: route('admin.clients.index')
    },
    {
        title: 'Clients',
        href: route('admin.clients.index')
    },
    {
        title: 'Edit Client',
        href: '#'
    }
];

interface ClientProps {
    client: Client;
    clientGroups: { id: number; name: string }[];
    domain?: string | null;
    statuses: { [key: string]: string };
}

const Edit = ({ client, clientGroups, statuses ,domain }: ClientProps) => {
    const { data, setData, put, processing, errors } = useForm<Required<ClientForm>>({
        company_name: client.company_name,
        client_groups: client.groups.map(g => g.id.toString()),
        data_dashboard: client.data_dashboard,
        logo: null as File | null,
        status: client.status,
        domain: domain ?? '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setData('logo', e.target.files[0]);
        }
    };


    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('admin.clients.update', client.id), {
            preserveScroll: true,
        });
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs} >
            <Head title='Create Client' />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center justify-between gap-2'>
                        <h2 className="text-2xl font-semibold">{client.company_name}</h2>
                    </div>
                </div>

                <form className="flex flex-col gap-6" onSubmit={submit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Company Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="company_name">Company Name</Label>
                            <Input
                                id="company_name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                value={data.company_name}
                                onChange={(e) => setData('company_name', e.target.value)}
                                placeholder="Company Name"
                            />
                            <InputError message={errors.company_name} />
                        </div>

                        {/* Client Groups */}
                        <div className="grid gap-2">
                            <Label htmlFor="client_groups">Client Groups</Label>
                            <ReactSelect
                                id="client_groups"
                                isMulti
                                options={clientGroups.map(group => ({
                                    value: group.id.toString(),
                                    label: group.name
                                }))}
                                value={data.client_groups?.map(group => ({
                                    value: group,
                                    label: clientGroups.find(g => g.id.toString() === group)?.name || group
                                }))}
                                onChange={(selectedOptions) => {
                                    setData('client_groups', selectedOptions.map(option => option.value));
                                }}
                                components={animatedComponents}
                                placeholder="Select client groups..."
                                className="react-select-container"
                                classNamePrefix="react-select"
                                closeMenuOnSelect={false}
                            />
                            <InputError message={errors.client_groups} />
                        </div>

                        {/* Dashboard Group */}
                        {/* <div className="grid gap-2">
                            <Label htmlFor="data_dashboard">Dashboard Group</Label>
                            <Select
                                value={data.data_dashboard}
                                onValueChange={(value) => setData('data_dashboard', value)}
                                required
                            >
                                <SelectTrigger id="data_dashboard" tabIndex={3}>
                                    <SelectValue placeholder="Select dashboard group" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Groups</SelectLabel>
                                        <SelectItem value="group1">Group 1</SelectItem>
                                        <SelectItem value="group2">Group 2</SelectItem>
                                        <SelectItem value="group3">Group 3</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.data_dashboard} />
                        </div> */}

                        {/* Logo */}
                        <div className="grid gap-2">
                            <div>
                                <Label htmlFor="logo">Logo</Label>
                                <Input
                                    id="logo"
                                    type="file"
                                    className=""
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    tabIndex={4}
                                />
                            </div>

                            <InputError message={errors.logo} />
                        </div>

                        {/* Status */}
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) => setData('status', value)}
                                required
                            >
                                <SelectTrigger id="status" tabIndex={5}>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Select status</SelectLabel>
                                        {Object.entries(statuses).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>{value}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Add Domain</Label>
                            <Input
                                value={data.domain}
                                onChange={(e) => setData('domain', e.target.value)}
                                placeholder="example.com"
                            />
                            <InputError message={errors.domain} />
                        </div>
                    </div>
                    {client.logo && (
                        <div className="mt-2">
                            <p className="text-sm text-muted-foreground">Current logo:</p>
                            <img
                                src={`/storage/${client.logo}`}
                                alt="Current logo"
                                className="h-16 w-16 object-contain"
                            />
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Button type="submit" tabIndex={6} disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Update Client
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
    )
}

export default Edit
