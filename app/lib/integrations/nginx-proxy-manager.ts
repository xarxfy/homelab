import { Network } from "lucide-react";
import { NginxProxyManagerAPI, type NginxProxyManagerConfig } from "../nginxProxyManagerApi";  // <-- type importieren
import type { Integration } from "../integrationConfig";

export const nginxProxyManagerIntegration = {
    id: "nginx-proxy-manager",
    name: "Nginx Proxy Manager",
    icon: Network,
    iconColor: "text-blue-500",
    description: "Nginx Proxy Manager",
    defaultPort: "81",
    fields: [
        { name: "name", label: "Name", type: "text" as const, placeholder: "z.B. Mein Nginx Proxy Manager", required: true },
        { name: "host", label: "Host", type: "text" as const, placeholder: "192.168.1.100", required: true },
        { name: "port", label: "Port", type: "text" as const, placeholder: "81", required: true },
        { name: "email", label: "E-Mail", type: "text" as const, placeholder: "admin@example.com", required: true },
        { name: "password", label: "Passwort", type: "password" as const, placeholder: "••••••••", required: true }
    ],

    validateConfig: (data: any) => {
        return {
            host: data.host,
            port: data.port,
            email: data.email,
            password: data.password,
        };
    },

    testConnection: async (integration: Integration) => {
        const api = new NginxProxyManagerAPI(integration.config as NginxProxyManagerConfig);  // <-- Type Assertion
        return await api.testConnection();
    }
};