import { ArrowLeft, LoaderCircle, Phone } from 'lucide-react'
import { BreadcrumbItem, User, UserForm } from '@/types'
import { Head, Link, useForm } from '@inertiajs/react'
import React, { FormEventHandler, use } from 'react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'

import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import InputError from '@/components/input-error'
import { Label } from '@/components/ui/label'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: route('admin.users.index')
    },
    {
        title: 'Users',
        href: route('admin.users.index')
    },
    {
        title: 'Edit User',
        href: '#'
    }
];


interface UsersProps {
    statuses: { [key: string]: string };
    userRoles: { [key: string]: string };
    user: User;
    clients: { id: number; company_name: string }[]; 
    clientGroups: { id: number; name: string }[]; 
}

const Edit = ({ statuses, userRoles, user ,clients, clientGroups }: UsersProps) => {
const { data, setData, put, processing, errors, reset } = useForm<Required<UserForm>>({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    password_confirmation: '',
    status: user.status || 'active',
    user_role: user.user_role || '',
    company_name: user.company_name || '',
    time_zone: user.time_zone || 'UTC',
    client_id: user.client_id || null,
    client_Groups_id: user.client_Groups_id || null,
    data_profile: user.data_profile || null,
});


//console.log('clientGroups',clientGroups);


    const submit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        put(route('admin.users.update', user.id), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Create User' />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center justify-between gap-2'>
                        <Button asChild>
                            <Link href={route('admin.users.index')}><ArrowLeft /></Link>
                        </Button>
                        <h2 className="text-2xl font-semibold">{user.name}</h2>
                    </div>
                </div>

                <form className="flex flex-col gap-6" onSubmit={submit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* First Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="first_name">First Name*</Label>
                            <Input
                                id="first_name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                value={data.first_name}
                                onChange={(e) => setData('first_name', e.target.value)}
                                placeholder="First Name"
                            />
                            <InputError message={errors.first_name} />
                        </div>

                        {/* Last Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="last_name">Last Name*</Label>
                            <Input
                                id="last_name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={2}
                                autoComplete="name"
                                value={data.last_name}
                                onChange={(e) => setData('last_name', e.target.value)}
                                placeholder="Last Name"
                            />
                            <InputError message={errors.last_name} />
                        </div>

                        {/* Email */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email*</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={3}
                                autoComplete="name"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Email"
                            />
                            <InputError message={errors.email} />
                        </div>

                        {/* Phone */}
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="phone"
                                required
                                autoFocus
                                tabIndex={4}
                                autoComplete="number"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="Phone Number"
                            />
                            <InputError message={errors.phone} />
                        </div>

                        {/* Password */}
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password*</Label>
                            <Input
                                id="password"
                                type="password"
                                tabIndex={5}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                disabled={processing}
                                placeholder="Password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirm Password */}
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm password*</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                tabIndex={6}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                disabled={processing}
                                placeholder="Confirm password"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        {/* Status */}
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status*</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) => setData('status', value)}
                                required
                            >
                                <SelectTrigger id="status" tabIndex={7}>
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

                        {/* User Role */}
                            {/* User Role */}
                        <div className="grid gap-2">
                            <Label htmlFor="user_role">User Role*</Label>
                            <Select
                                value={data.user_role}
                                onValueChange={(value) => {
                                    setData('user_role', value);

                                    // Auto clear fields depending on selection
                                    if (value === 'Client') {
                                        setData('client_Groups_id', null);
                                    } else if (value === 'Agent') {
                                        setData('client_id', null);
                                    } else {
                                        setData('client_id', null);
                                        setData('client_Groups_id', null);
                                    }
                                }}
                                required
                            >
                                <SelectTrigger id="user_role" tabIndex={8}>
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Select Role</SelectLabel>
                                        {Object.entries(userRoles).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>{value}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.user_role} />
                        </div>


                        {/* Conditional Fields Based on User Role */}
                        {data.user_role === 'Client' && (
                            <div className="grid gap-2">
                                <Label htmlFor="client_id">Client</Label>
                                <Select
                                    value={data.client_id ? String(data.client_id) : ''}
                                    onValueChange={(value) => setData('client_id', Number(value))}
                                >
                                    <SelectTrigger id="client_id" tabIndex={9}>
                                        <SelectValue placeholder="Select Client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Select Client</SelectLabel>
                                            {clients.map((client) => (
                                                <SelectItem key={client.id} value={String(client.id)}>
                                                    {client.company_name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.client_id} />
                            </div>
                        )}

                        {data.user_role === 'Agent' && (
                            <div className="grid gap-2">
                                <Label htmlFor="client_group_id">Client Group</Label>
                                <Select
                                    value={data.client_Groups_id ? String(data.client_Groups_id) : ''}
                                    onValueChange={(value) => {
                                        const selected = clientGroups.find(g => String(g.id) === value);
                                        setData('client_Groups_id', Number(value));
                                    }}
                                >
                                    <SelectTrigger id="client_group_id" tabIndex={10}>
                                        <SelectValue placeholder="Select Client Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Select Client Group</SelectLabel>
                                            {clientGroups.map((group) => (
                                                <SelectItem key={group.id} value={String(group.id)}>
                                                    {group.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.client_Groups_id} />
                            </div>
                        )}




                        <div className="grid gap-2">
                            <Label htmlFor="data_profile">Data Profile*</Label>

                            <Select
                                value={data.data_profile ?? ''}   // ✅ Preselect existing value
                                onValueChange={(value) => setData('data_profile', value)}
                                required
                            >
                                <SelectTrigger id="data_profile" tabIndex={11}>
                                    <SelectValue placeholder="Select data profile" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Select data profile</SelectLabel>

                                        {/* ✅ Only one option */}
                                        <SelectItem value="salt_rank_geofencing">
                                            Salt Rank Geofencing Only
                                        </SelectItem>
                                             {/* ✅ New option */}
                                            <SelectItem value="vendor">
                                            Vendor
                                            </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <InputError message={errors.data_profile} />
                        </div>


                    {/* <div className="grid gap-2">
                        <Label htmlFor="dashboard_group">Dashboard Group</Label>
                        <Select
                            value={data.dashboard_group_id ? String(data.dashboard_group_id) : ''}
                            onValueChange={(value) => {
                                const selected = clientGroups.find(g => String(g.id) === value);
                                setData('dashboard_group_id', Number(value));
                                setData('dashboard_group', selected ? selected.name : '');
                            }}
                        >
                            <SelectTrigger id="dashboard_group" tabIndex={10}>
                                <SelectValue placeholder="Select Dashboard Group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Select Dashboard Group</SelectLabel>
                                    {clientGroups.map((group) => (
                                        <SelectItem key={group.id} value={String(group.id)}>
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.dashboard_group_id} />
                    </div> */}





                        {/* Company Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="company_name">Company Name</Label>
                            <Input
                                id="company_name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={9}
                                autoComplete="name"
                                value={data.company_name}
                                onChange={(e) => setData('company_name', e.target.value)}
                                placeholder="Company Name"
                            />
                            <InputError message={errors.company_name} />
                        </div>

                        {/* Timezone */}
                        <div className="grid gap-2">
                            <Label htmlFor="time_zone">TimeZone</Label>
                            <Select
                                value={data.time_zone}
                                onValueChange={(value) => setData('time_zone', value)}
                                required
                            >
                                <SelectTrigger id="time_zone" tabIndex={10}>
                                    <SelectValue placeholder="Select TimeZone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>TimeZone</SelectLabel>
                                        <SelectItem value="TimeZone1">TimeZone 1</SelectItem>
                                        <SelectItem value="TimeZone2">TimeZone 2</SelectItem>
                                        <SelectItem value="TimeZone3">TimeZone 3</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.time_zone} />
                        </div>

                    </div>

                    <div className="flex gap-4">
                        <Button type="submit" tabIndex={6} disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Update User
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
