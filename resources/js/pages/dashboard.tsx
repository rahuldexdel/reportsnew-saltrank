import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Delete, PlusIcon, Settings, Star, Trash, Trash2, Zap } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@radix-ui/react-tooltip';
import dashboardBg from '@/images/dashboard-bg.jpg';

const breadcrumbs: BreadcrumbItem[] = [
    {
       // title: 'Pilot the new Manage Data Sources experience today:',
        href: '/dashboard',
    },
];



export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Data Sources" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">

                <div className='flex items-center justify-between mb-4'>
                    <Tabs defaultValue="all" className="w-full bg-red">
                        <TabsList className='bg-transparent'>
                            <TabsTrigger value="all" className='active:bg-transparent'>All Dashboards</TabsTrigger>
                            <TabsTrigger value="shared">Shared Dashboards</TabsTrigger>
                            <TabsTrigger value="client">Client Dashboards</TabsTrigger>
                            <TabsTrigger value="predefined">Predefined Dashboards</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className='border-t-2 px-4 py-6'>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        <TabsContent value="shared" className='border-t-2 px-4 py-6'>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        <TabsContent value="client" className='border-t-2 px-4 py-6'>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        <TabsContent value="predefined" className='border-t-2 px-4 py-6'>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className='overflow-hidden group hover:-translate-y-1 transition border pb-0 pt-1 bg-black/50 hover:shadow-lg hover:bg-blend-color-burn bg-cover bg-[url(http://192.168.18.112:5173/resources/js/images/dashboard-bg.jpg)]'>
                                    <CardContent className="flex flex-col items-center p-0">
                                        <div className=" w-full h-80 flex flex-col justify-end">
                                            <div className='bg-white p-4 flex items-center justify-between relative'>
                                            <Trash2 className='bg-white rounded-full p-1 mb-2 absolute -top-10 right-2.5 text-primary hidden group-hover:block'/>  
                                                <div>
                                                    <p className='text-sm leading-7 font-bold'>*In Progress* Salt Rank Master Dashboard</p>
                                                    <p className='text-xs text-gray-500'>Updated at May 28, 2025 2:19 AM</p>
                                                </div>
                                                <Star className='text-primary hidden group-hover:block'/>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">

                </div>
            </div>
        </AppLayout>
    );
}

