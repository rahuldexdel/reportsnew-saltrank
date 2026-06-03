import { BreadcrumbItem, Datasource } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Check, LoaderCircle, Settings, Zap } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import React, { FormEventHandler, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    {
       // title: 'Pilot the new Manage Data Sources experience today:',
        href: '/dashboard',
    },
];

type SimplifiForm = {
    username: string;
    apikey: string;
    Organizationid: string;
}

type CallTrackingForm = {
    key: string;
    account_id: string;
};


type SemrushForm = {
    api_key: string;
};



interface DataSourcesProps {
    dataSources: Datasource[];
}

const datasource = ({ dataSources: initialDataSources }: DataSourcesProps) => {
    const { baseUrl } = usePage().props;
    const [filter, setFilter] = useState<'all' | 'connected'>('all');


    const [isOpen, setIsOpen] = useState(false);
    const [isSimplifiOpen, setIsSimplifiOpen] = useState(false);
    const [isCallTrackingOpen, setIsCallTrackingOpen] = useState(false);
    const [isSemrushOpen, setIsSemrushOpen] = useState(false);


    const [dataSources, setDataSources] = useState(initialDataSources);
    const filteredDataSources = filter === 'connected' ? dataSources.filter(source => source.is_connected) : dataSources;

    const simplifiForm = useForm<Required<SimplifiForm>>({
        username: '',
        apikey: '',
        Organizationid: '',
    });

    const submitSimplifi: FormEventHandler = (e) => {
        e.preventDefault();
        simplifiForm.post(route('connect-smplifi-account'), {
            onSuccess: () => {
                setIsSimplifiOpen(false);
                simplifiForm.reset();
            }
        });
    };


        const callTrackingForm = useForm<Required<CallTrackingForm>>({
            key: '',
            account_id: '',
        });

        const submitCallTracking: FormEventHandler = (e) => {
            e.preventDefault();
            callTrackingForm.post(route('connect-call-tracking'), {
                onSuccess: () => {
                    setIsCallTrackingOpen(false);
                    callTrackingForm.reset();
                }
            });
        };


        const semrushForm = useForm<SemrushForm>({
            api_key: '',
        });

        const submitSemrush: FormEventHandler = (e) => {
            e.preventDefault();

            semrushForm.post(route('connect-semrush'), {
                onSuccess: () => {
                    setIsSemrushOpen(false);
                    toast.success('SEMrush account connected successfully');
                    semrushForm.reset();
                },
                onError: (errors) => {
                    toast.error(
                        errors?.api_key || errors?.message || 'Failed to connect SEMrush'
                    );
                },
            });
        };




    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Data Sources" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className='flex items-center justify-between mb-4'>
                    <h2 className="text-2xl font-semibold">Data Source</h2>
                    <div className='flex items-center justify-between gap-3'>
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            onClick={() => setFilter('all')}
                        >
                            {`Show All (${dataSources.length})`}
                        </Button>
                        <Button
                            variant={filter === 'connected' ? 'default' : 'outline'}
                            onClick={() => setFilter('connected')}
                        >
                            <Zap className="h-4 w-4" /> {`Connected (${dataSources.filter(source => source.is_connected).length})`}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {filteredDataSources.map((source) => (
                        <Card key={source.id} className="overflow-hidden border pb-0 pt-1 hover:shadow-lg">
                            <CardContent className="flex flex-col items-center p-0">
                                <div className="relative w-full">
                                    <TooltipProvider>
                                        {source.is_connected && (
                                            <>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="absolute left-5 top-5 text-white bg-green-500 rounded-full p-1">
                                                            <Check className="h-3 w-3" />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Connected</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="absolute right-5 top-5 text-gray-500 bg-gray-200 rounded-full p-1">
                                                            <Settings className="h-4 w-4" />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Manage Connections</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </>
                                        )}
                                    </TooltipProvider>

                                    <div className="h-32 h- flex items-center justify-center">
                                        <img
                                            src={
                                                source.image
                                                    ? `${baseUrl}/images/${source.image}`
                                                    : `${baseUrl}/placeholder.svg`
                                            }
                                            alt={source.title}
                                            className="w-16 h-16 object-contain rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="text-center p-2">
                                    <h3 className="font-medium text-gray-500">{source.title}</h3>
                                </div>
                                <div className="w-full border-t rounded-none p-4">
                                    {source.is_connected
                                        ? (
                                            <Button variant='default' className="w-full rounded-full p-2 border" asChild>
                                                <Link href={route('data.datasource.service', source.service)}>ASSIGN</Link>
                                            </Button>
                                        )
                                        : source.service === 'simplifi' ? (
                                        <Dialog open={isSimplifiOpen} onOpenChange={setIsSimplifiOpen}>

                                                <DialogTrigger asChild>
                                                    <Button variant='secondary' className="w-full rounded-full p-2 border hover:bg-primary/90 hover:text-white">
                                                        CONNECT
                                                    </Button>
                                                </DialogTrigger>

                                                <DialogContent className="sm:max-w-[425px] md:max-w-xl">
                                               <form onSubmit={submitSimplifi}>
                                                        <DialogHeader>
                                                            <DialogTitle>Connect Simpli.fi Account</DialogTitle>
                                                            <DialogDescription>
                                                                Enter your credentials to connect this data source and allow the platform to find your accounts
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <div className="grid gap-4">
                                                            <div className="grid gap-3">
                                                                <Label htmlFor="username">Organization Manager Username</Label>
                                                                <Input
                                                                    id="username"
                                                                    type="text"
                                                                    required
                                                                    autoFocus
                                                                    tabIndex={1}
                                                                   value={simplifiForm.data.username}
                                                                    onChange={(e) => simplifiForm.setData('username', e.target.value)}
                                                                    placeholder="Please Enter your Organization Manager Username"
                                                                />
                                                            </div>

                                                            <div className="grid gap-3">
                                                                <Label htmlFor="apikey">API User Key</Label>
                                                                <Input
                                                                    id="apikey"
                                                                    type="text"
                                                                    required
                                                                    tabIndex={2}
                                                                    value={simplifiForm.data.apikey}
                                                                    onChange={(e) => simplifiForm.setData('apikey', e.target.value)}
                                                                    placeholder="Please Enter your API User Key"
                                                                />
                                                            </div>

                                                            <div className="grid gap-3">
                                                                <Label htmlFor="Organizationid">Top Organization ID (optional)</Label>
                                                                <Input
                                                                    id="Organizationid"
                                                                    type="text"
                                                                    tabIndex={3}
                                                                    value={simplifiForm.data.Organizationid}
                                                                    onChange={(e) => simplifiForm.setData('Organizationid', e.target.value)}
                                                                    placeholder="Please Enter your Top Organization ID"
                                                                />
                                                            </div>
                                                        </div>

                                                        <DialogFooter className="pt-4">
                                                            <DialogClose asChild>
                                                                <Button variant="outline">Cancel</Button>
                                                            </DialogClose>
                                                      <Button type="submit" tabIndex={4} disabled={simplifiForm.processing}>
                                                            {simplifiForm.processing && (
                                                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                                            )}
                                                            Save
                                                        </Button>




                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        ) : source.service === 'call-tracking' ? (
                                        <Dialog open={isCallTrackingOpen} onOpenChange={setIsCallTrackingOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="secondary"
                                                    className="w-full rounded-full p-2 border hover:bg-primary/90 hover:text-white"
                                                >
                                                    CONNECT
                                                </Button>
                                            </DialogTrigger>

                                            <DialogContent className="sm:max-w-[425px] md:max-w-xl">
                                                <form onSubmit={submitCallTracking}>
                                                    <DialogHeader>
                                                        <DialogTitle>Connect Call Tracking Account</DialogTitle>
                                                        <DialogDescription>
                                                            Enter your Call Tracking credentials to connect this data source
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="grid gap-4">
                                                        <div className="grid gap-3">
                                                            <Label htmlFor="key">API Key</Label>
                                                            <Input
                                                                id="key"
                                                                type="text"
                                                                required
                                                                value={callTrackingForm.data.key}
                                                                onChange={(e) =>
                                                                    callTrackingForm.setData('key', e.target.value)
                                                                }
                                                                placeholder="0fb3639a0638011d12b93f98338d0266"
                                                            />
                                                        </div>

                                                        <div className="grid gap-3">
                                                            <Label htmlFor="account_id">Account ID</Label>
                                                            <Input
                                                                id="account_id"
                                                                type="text"
                                                                required
                                                                value={callTrackingForm.data.account_id}
                                                                onChange={(e) =>
                                                                    callTrackingForm.setData('account_id', e.target.value)
                                                                }
                                                                placeholder="325-476-338"
                                                            />
                                                        </div>
                                                    </div>

                                                    <DialogFooter className="pt-4">
                                                        <DialogClose asChild>
                                                            <Button variant="outline">Cancel</Button>
                                                        </DialogClose>
                                                        <Button type="submit" disabled={callTrackingForm.processing}>
                                                            {callTrackingForm.processing && (
                                                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                                            )}
                                                            Save
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    ) : source.service === 'semrush' ? (


                                       <Dialog open={isSemrushOpen} onOpenChange={setIsSemrushOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="secondary"
                                                    className="w-full rounded-full p-2 border hover:bg-primary/90 hover:text-white"
                                                >
                                                    CONNECT
                                                </Button>
                                            </DialogTrigger>

                                            <DialogContent className="sm:max-w-[425px] md:max-w-xl">
                                               <form onSubmit={submitSemrush}>
                                                    <DialogHeader>
                                                        <DialogTitle>Connect SEMrush Account</DialogTitle>
                                                        <DialogDescription>
                                                            Enter your SEMrush API credentials to connect this data source.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="grid gap-4">
                                                        {/* API KEY */}
                                                        <div className="grid gap-3">
                                                            <Label htmlFor="api_key">SEMrush API Key</Label>
                                                            <Input
                                                                id="api_key"
                                                                type="text"
                                                                required
                                                                value={semrushForm.data.api_key}
                                                                onChange={(e) =>
                                                                    semrushForm.setData('api_key', e.target.value)
                                                                }
                                                                placeholder="Enter SEMrush API key"
                                                            />
                                                        </div>
                                                    </div>

                                                    <DialogFooter className="pt-4">
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

                                    ) : (
                                            <Button variant='secondary' className="w-full rounded-full p-2 border hover:bg-primary/90 hover:text-white" asChild>
                                                <a href={`/auth/google/${source.service}`}>CONNECT</a>
                                            </Button>
                                        )
                                    }
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    )
}

export default datasource