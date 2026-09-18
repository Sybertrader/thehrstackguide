import catalog from '../data/vendor-catalog.json';

/** Frozen category ids. Do not add values without a catalog + schema change. */
export const VENDOR_CATEGORIES = ['payroll-eor', 'ats', 'performance-management'] as const;

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export interface CatalogVendor {
  id: string;
  name: string;
  category: VendorCategory;
}

export const KEEP_VENDORS = catalog.keepVendors as CatalogVendor[];
export const PURGE_VENDORS = catalog.purgeVendors as CatalogVendor[];

export const KEEP_VENDOR_IDS = KEEP_VENDORS.map((vendor) => vendor.id);
export const PURGE_VENDOR_IDS = PURGE_VENDORS.map((vendor) => vendor.id);

const KEEP_VENDOR_ID_SET = new Set(KEEP_VENDOR_IDS);

export function isCatalogVendorId(toolId: string): boolean {
  return KEEP_VENDOR_ID_SET.has(toolId);
}

export function catalogVendor(toolId: string): CatalogVendor | undefined {
  return KEEP_VENDORS.find((vendor) => vendor.id === toolId);
}
