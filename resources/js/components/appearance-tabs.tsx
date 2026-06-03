import { Sun, Moon } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'; // adjust import path if needed

export default function AppearanceToggle({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    // Only two modes
    const nextMode = appearance === 'dark' ? 'light' : 'dark';
    const Icon = appearance === 'dark' ? Sun : Moon;
    const label = nextMode === 'dark' ? 'Dark Mode' : 'Light Mode';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => updateAppearance(nextMode)}
                        className={cn(
                            'flex items-center rounded-md p-2 transition-colors',
                            'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700',
                            'text-neutral-700 dark:text-neutral-200',
                            className
                        )}
                        {...props}
                    >
                        <Icon className="h-5 w-5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                    Switch to {label}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
