import type { Route } from "./+types/dashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import AppLayout from "../components/AppLayout";
import DashboardGrid from "~/components/DashboardGrid";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Nexus - Dashboard" },
        { name: "description", content: "Dashboard Overview" },
    ];
}

export default function Dashboard() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="p-6">
                    <DashboardGrid />
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}