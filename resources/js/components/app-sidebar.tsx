import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavCollapsible } from '@/components/nav-collapsible';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, StarsIcon, UserCog, FileCog, Database,Settings } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
  const { props, url } = usePage();
  const user = props.auth?.user;
  const isActive = (href: string) => url.startsWith(href);

  const mainNavItems: NavItem[] = [
    {
      title: 'Favorites',
      href: '/dashboard',
      icon: StarsIcon,
    },
  ];

  // Base menu always visible
  const navCollapsibleItems: NavItem[] = [
    {
      title: "Reports",
      href: "#",
      icon: FileCog,
      isActive: isActive('/dashboard'),
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          isActive: isActive('/dashboard'),
        },
      ],
    },
  ];


    // Base menu always visible
 navCollapsibleItems.push({
      title: "AI Insights",
      href: "#",
      icon: FileCog,
      isActive: isActive('/Insights'),
      items: [
        {
          title: "Insights Data",
          href: "/insights-data",
          isActive: isActive('/Insights'),
        },
        {
          title: "Semrush AI Data",
          href: "/insights/semrush-ai",
          isActive: isActive('/insights/semrush-ai'),
        },
      ],
  });


  // 👇 Add this only if user is Super Admin
  if (user?.user_role === 'Super Admin') {
    navCollapsibleItems.unshift({
      title: "Data",
      href: "/data",
      icon: UserCog,
      isActive: isActive('/data'),
      items: [
        {
          title: "Data Sources",
          href: "/data/datasource",
          isActive: isActive('/data/datasource'),
        },
      ],
    });

    navCollapsibleItems.push({
      title: "Admin",
      href: "#",
      icon: Settings,
      isActive: isActive('/admin'),
      items: [
        {
          title: "Clients",
          href: "/admin/clients",
          isActive: isActive('/admin/clients'),
        },
        {
          title: "Clients Groups",
          href: "/admin/client-groups",
          isActive: isActive('/admin/client-groups'),
        },
        {
          title: "Users",
          href: "/admin/users",
          isActive: isActive('/admin/users'),
        },
      ],
    });
  }
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <NavCollapsible items={navCollapsibleItems} />
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
