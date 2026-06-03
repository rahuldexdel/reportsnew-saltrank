import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { BreadcrumbItem, ClientForm } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { FormEventHandler } from 'react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

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
        title: 'Create Client',
        href: '#'
    }
];

interface ClientProps {
    clientGroups: {
        id: number;
        name: string;
    }[];
    statuses: { [kay: string]: string };
}


const Create = ({ clientGroups, statuses }: ClientProps) => {

    const animatedComponents = makeAnimated();

    const { data, setData, post, processing, errors, reset } = useForm<Required<ClientForm>>({
        company_name: '',
        client_groups: [],
        data_dashboard: '',
        logo: null,
        status: '',
        domain:'',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setData('logo', e.target.files[0]);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.clients.store'), {
            onSuccess: () => reset(),
        });
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs} >
            <Head title='Create Client' />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center justify-between gap-2'>
                        <h2 className="text-2xl font-semibold">Add New Client</h2>
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
                                tabIndex={2}
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

                        {/* Logo */}
                        <div className="grid gap-2">
                            <Label htmlFor="logo">Logo</Label>
                            <Input
                                id="logo"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                tabIndex={4}
                            />
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
                            />
                            <InputError message={errors.domain} />
                        </div>
                    </div>
                    <Button type="submit" className="mt-4 w-full md:w-auto self-start" tabIndex={6} disabled={processing}>
                        {processing && <LoaderCircle className='h4 w-4 animate-spin' />}
                        Create Client
                    </Button>
                </form>
            </div>
        </AppLayout>
    )
}

export default Create
