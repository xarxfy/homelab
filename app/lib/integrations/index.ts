import { proxmoxIntegration } from "./proxmox";
import { adguardIntegration } from "./adguard";

export const integrationRegistry = {
    proxmox: proxmoxIntegration,
    adguard: adguardIntegration,
};

export type IntegrationType = keyof typeof integrationRegistry;

export function getIntegrationByType(type: string) {
    return integrationRegistry[type as IntegrationType];
}

export function getAllIntegrations() {
    return Object.values(integrationRegistry);
}