import { useLocation } from "react-router";
import { useState } from "react";
import MenuSidebar from "./MenuSidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { getUser, logout } from "../lib/auth";
import { LogOut, User } from "lucide-react";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const user = getUser();

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

                        <div className="flex items-center gap-4">
                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <User size={20} className="text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm text-gray-900 dark:text-white">
                                        {user?.username}
                                    </span>
                                </button>

                                {showUserMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowUserMenu(false)}
                                        />

                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                                            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {user?.username}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {user?.email}
                                                </p>
                                            </div>
                                            <div className="p-2">
                                                <button
                                                    onClick={logout}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                >
                                                    <LogOut size={16} />
                                                    Abmelden
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

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