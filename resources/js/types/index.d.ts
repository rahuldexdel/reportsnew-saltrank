import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    //title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    items?: {
        title: string
        href: string
        isActive?: boolean;
    }[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface Datasource {
    id: number;
    title: string;
    image?: string;
    service: string;
    is_connected: number;
    total_connections: number
}

export interface Property {
    id: number;
    property_id: string;
    property_name: string;
    permission_level: string;
    is_verified: boolean;
    is_assigned: boolean;
    is_active: boolean;
    client_id: string;
    client: Client;
    account: {
        id: number;
        name: string;
        email: string;
        // add other fields if needed
    }
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    name: string;
    avatar: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_name: string;
    status: string;
    time_zone: string;
    user_role: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export type UserForm = {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation?: string;
    status?: string;
    user_role?: string;
    company_name: string;
    time_zone: string
}

export interface Client {
    id: number;
    company_name: string;
    groups: { id: number; name: string }[];
    data_dashboard: string;
    logo: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export type ClientForm = {
    company_name: string;
    client_groups: string[];
    data_dashboard: string;
    logo: File | null;
    status: string;
}

