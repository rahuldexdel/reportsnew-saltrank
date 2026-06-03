import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { BreadcrumbItem, UserForm } from '@/types'
import { Head, Link, useForm } from '@inertiajs/react'
import React, { FormEventHandler } from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'

import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import InputError from '@/components/input-error'
import { Label } from '@/components/ui/label'

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: route('admin.users.index') },
    { title: 'Users', href: route('admin.users.index') },
    { title: 'Create User', href: '#' }
]

interface UsersProps {
    statuses: { [key: string]: string }
    userRoles: { [key: string]: string }
    clients: { id: number; company_name: string }[]
    clientGroups: { id: number; name: string }[]
}

const Create = ({ statuses, userRoles, clients, clientGroups }: UsersProps) => {
    const { data, setData, post, processing, errors, reset } =
        useForm<Required<UserForm>>({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            password: '',
            password_confirmation: '',
            status: '',
            user_role: '',
            company_name: '',
            time_zone: '',
            client_id: null,
            client_Groups_id: null,
            data_profile: ''
        })

    const submit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()
        post(route('admin.users.store'), {
            onSuccess: () => reset()
        })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Button asChild>
                        <Link href={route('admin.users.index')}>
                            <ArrowLeft />
                        </Link>
                    </Button>
                    <h2 className="text-2xl font-semibold">New User</h2>
                </div>

                <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* First Name */}
                        <div className="grid gap-2">
                            <Label>First Name*</Label>
                            
                            <Input
                                placeholder="First Name"
                                value={data.first_name}
                                onChange={(e) =>
                                    setData('first_name', e.target.value)
                                }
                            />
                            <InputError message={errors.first_name} />
                        </div>

                        {/* Last Name */}
                        <div className="grid gap-2">
                            <Label>Last Name*</Label>
                            <Input
                            placeholder="Last Name"
                                value={data.last_name}
                                onChange={(e) =>
                                    setData('last_name', e.target.value)
                                }
                            />
                            <InputError message={errors.last_name} />
                        </div>

                        {/* Email */}
                        <div className="grid gap-2">
                            <Label>Email*</Label>
                            <Input
                                placeholder="Email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                            />
                            <InputError message={errors.email} />
                        </div>

                        {/* Phone */}
                        <div className="grid gap-2">
                            <Label>Phone</Label>
                            <Input
                            placeholder="Phone Number"
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                            />
                            <InputError message={errors.phone} />
                        </div>

                        {/* Password */}
                        <div className="grid gap-2">
                            <Label>Password*</Label>
                            <Input
                            placeholder="Password"
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                            />
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirm Password */}
                        <div className="grid gap-2">
                            <Label>Confirm Password*</Label>
                            <Input
                            placeholder="Confirm password"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value
                                    )
                                }
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        {/* Status */}
                        <div className="grid gap-2">
                            <Label>Status*</Label>
                            <Select
                                value={data.status}
                                onValueChange={(v) =>
                                    setData('status', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(statuses).map(
                                        ([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                                {v}
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>

                        {/* User Role */}
                        <div className="grid gap-2">
                            <Label>User Role*</Label>
                            <Select
                                value={data.user_role}
                                onValueChange={(value) => {
                                    setData('user_role', value)

                                    if (value === 'Client') {
                                        setData('client_Groups_id', null)
                                    } else if (value === 'Agent') {
                                        setData('client_id', null)
                                    } else {
                                        setData('client_id', null)
                                        setData('client_Groups_id', null)
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(userRoles).map(
                                        ([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                                {v}
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.user_role} />
                        </div>

                        {/* Client */}
                        {data.user_role === 'Client' && (
                            <div className="grid gap-2">
                                <Label>Client</Label>
                                <Select
                                    value={
                                        data.client_id
                                            ? String(data.client_id)
                                            : ''
                                    }
                                    onValueChange={(v) =>
                                        setData('client_id', Number(v))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((c) => (
                                            <SelectItem
                                                key={c.id}
                                                value={String(c.id)}
                                            >
                                                {c.company_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.client_id} />
                            </div>
                        )}

                        {/* Client Group */}
                        {data.user_role === 'Agent' && (
                            <div className="grid gap-2">
                                <Label>Client Group</Label>
                                <Select
                                    value={
                                        data.client_Groups_id
                                            ? String(
                                                  data.client_Groups_id
                                              )
                                            : ''
                                    }
                                    onValueChange={(v) =>
                                        setData(
                                            'client_Groups_id',
                                            Number(v)
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Client Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clientGroups.map((g) => (
                                            <SelectItem
                                                key={g.id}
                                                value={String(g.id)}
                                            >
                                                {g.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.client_Groups_id}
                                />
                            </div>
                        )}

                        {/* Data Profile */}
                        <div className="grid gap-2">
                            <Label>Data Profile*</Label>
                            <Select
                                value={data.data_profile}
                                onValueChange={(v) =>
                                    setData('data_profile', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select data profile" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="salt_rank_geofencing">
                                        Salt Rank Geofencing Only
                                    </SelectItem>
                                    <SelectItem value="vendor">
                                        Vendor
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.data_profile} />
                        </div>

                        {/* Company */}
                        <div className="grid gap-2">
                            <Label>Company Name</Label>
                            <Input
                                value={data.company_name}
                                onChange={(e) =>
                                    setData(
                                        'company_name',
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        {/* Timezone */}
                        <div className="grid gap-2">
                            <Label>Time Zone</Label>
                            <Select
                                value={data.time_zone}
                                onValueChange={(v) =>
                                    setData('time_zone', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                <div className="flex gap-4">
                    <Button type="submit" disabled={processing}>
                        {processing && (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create User
                    </Button>
                    <Button
                        variant="outline"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            window.history.back()
                        }}
                    >
                        Cancel
                    </Button>

                 </div>
                </form>
            </div>
        </AppLayout>
    )
}

export default Create
