
import { Toaster } from '@/components/ui/sonner';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';
// import { Toaster } from 'sonner';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
            warning?: string;
        };
    };

    useEffect(() => {
        if (flash?.success) toast.success('SUCCESS', {
            description: flash.success,
            duration: 5000,
        });
        if (flash?.error) toast.error('OPPS', {
            description: flash.error,
            duration: 5000,
        });
        if (flash?.warning) toast.warning(flash.warning);
    }, [flash]);
    return (

        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            <div className='p-5'>
             {children}

            </div>
            <Toaster
                position="top-right"
                richColors
                expand={true}
                closeButton
            />
        </AppLayoutTemplate>
    );
}

