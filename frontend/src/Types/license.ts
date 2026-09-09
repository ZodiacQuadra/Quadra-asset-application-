export interface ActiveLicense {
    skuId: string;
    skuPartNumber: string;
    capabilityStatus: string;
    availableUnits: number;
    consumedUnits?: number;
    enabledUnits?: number;
}