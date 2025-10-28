import { proxmoxIntegration } from "./proxmox";
import { adguardIntegration } from "./adguard";
import { nginxProxyManagerIntegration } from "./nginx-proxy-manager";

export const integrationRegistry = {
    proxmox: proxmoxIntegration,
    adguard: adguardIntegration,
    "nginx-proxy-manager": nginxProxyManagerIntegration,
};

export type IntegrationType = keyof typeof integrationRegistry;

export function getIntegrationByType(type: string) {
    return integrationRegistry[type as IntegrationType];
}

export function getAllIntegrations() {
    return Object.values(integrationRegistry);
}