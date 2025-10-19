import { useLocation } from "react-router";
import MenuSidebar from "./MenuSidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation();

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/':
            case '/dashboard':
                return 'Dashboard';
            case '/integrations':
                return 'Integrationen';
            default:
                return 'Nexus';
        }
    };

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <MenuSidebar />
                <main className="flex-1 flex flex-col">
                    <header className="flex justify-between bg-card p-2 w-full items-center border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="text-white" />
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {getPageTitle()}
                            </h1>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                            <img src="/images/logo.png" alt="Logo" className="h-16 rounded-full" />
                        </div>
                    </header>
                    <div className="flex-1 overflow-auto">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}