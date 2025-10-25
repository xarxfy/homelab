import { Server } from "lucide-react";
import { ProxmoxAPI } from "../proxmoxApi";
import type { Integration } from "../integrationConfig";

export const proxmoxIntegration = {
    id: "proxmox",
    name: "Proxmox",
    icon: Server,
    iconColor: "text-orange-500",
    description: "Proxmox Virtual Environment",
    defaultPort: "8006",
    fields: [
        { name: "name", label: "Name", type: "text" as const, placeholder: "z.B. Mein Proxmox Server", required: true },
        { name: "host", label: "Host", type: "text" as const, placeholder: "192.168.1.100", required: true },
        { name: "port", label: "Port", type: "text" as const, placeholder: "8006", required: true },
        { name: "tokenId", label: "Token ID", type: "text" as const, placeholder: "user@pam!tokenname", required: true },
        { name: "tokenSecret", label: "Token Secret", type: "password" as const, placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", required: true }
    ],

    validateConfig: (data: any) => {
        return {
            host: data.host,
            port: data.port,
            tokenId: data.tokenId,
            tokenSecret: data.tokenSecret,
        };
    },

    testConnection: async (integration: Integration) => {
        const api = new ProxmoxAPI(integration.config);
        return await api.testConnection();
    }
};