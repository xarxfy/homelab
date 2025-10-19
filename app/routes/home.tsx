import type { Route } from "./+types/home";
import AppLayout from "../components/AppLayout";
import DashboardGrid from "~/components/DashboardGrid";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Nexus - Dashboard" },
        { name: "description", content: "Welcome to Nexus Dashboard!" },
    ];
}

export default function Home() {
    return (
        <AppLayout>
            <div className="p-6">
                <DashboardGrid />
            </div>
        </AppLayout>
    );
}