import { Shield } from "lucide-react";
import { AdGuardAPI } from "../adguardApi";
import type { Integration } from "../integrationConfig";

export const adguardIntegration = {
    id: "adguard",
    name: "AdGuard Home",
    icon: Shield,
    iconColor: "text-green-500",
    description: "AdGuard Home DNS Server",
    defaultPort: "80",
    fields: [
        { name: "name", label: "Name", type: "text" as const, placeholder: "z.B. Mein AdGuard Server", required: true },
        { name: "host", label: "Host", type: "text" as const, placeholder: "192.168.1.100", required: true },
        { name: "port", label: "Port", type: "text" as const, placeholder: "80", required: true },
        { name: "username", label: "Benutzername", type: "text" as const, placeholder: "admin", required: true },
        { name: "password", label: "Passwort", type: "password" as const, placeholder: "••••••••", required: true }
    ],

    validateConfig: (data: any) => {
        return {
            host: data.host,
            port: data.port,
            username: data.username,
            password: data.password,
        };
    },

    testConnection: async (integration: Integration) => {
        const api = new AdGuardAPI(integration.config);
        return await api.testConnection();
    }
};