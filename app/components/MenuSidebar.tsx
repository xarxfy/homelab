import { useLocation } from "react-router";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "../components/ui/sidebar";
import { Home, Settings, LayoutDashboard } from "lucide-react";

export default function MenuSidebar() {
    const location = useLocation();

    const menuItems = [
        {
            title: "Dashboard",
            icon: LayoutDashboard,
            url: "/dashboard",
        },
        {
            title: "Home",
            icon: Home,
            url: "/",
        },
        {
            title: "Integrationen",
            icon: Settings,
            url: "/integrations",
        },
    ];

    const isActive = (url: string) => {
        if (url === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(url);
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="p-2 flex items-center">
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                    <img
                        src="/images/logo.png"
                        alt="Logo"
                        className="h-16 w-16 rounded-full flex-shrink-0 object-cover group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6"
                    />
                    <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">Nexus</span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        isActive={isActive(item.url)}
                                    >
                                        <a href={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}