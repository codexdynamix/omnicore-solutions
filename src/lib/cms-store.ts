import { useState, useEffect } from "react";
import { crmApi } from "@/lib/crm-api";
import { equipment as initialEquipment, site as initialSite, type Equipment } from "@/data/site";

export type CRMClient = {
  id: string;
  name: string;
  organization: string;
  phone: string;
  email: string;
  location: string;
  province: string;
  service: string;
  equipmentInterest: string;
  intent: "Buy" | "Hire" | "Both" | "Consultation";
  stage: "Lead" | "Discovery" | "Tender Quoted" | "Negotiation" | "Won" | "Lost";
  priority: "High" | "Medium" | "Normal";
  dealValue: number;
  dealValueDisplay: string;
  lastContact: string;
  nextFollowUp: string;
  notes: string;
  timeline: { date: string; note: string; author: string }[];
};

export type ExtendedEquipment = Equipment & {
  sku?: string;
  stockStatus?: "In Yard Cranborne" | "In Transit (Beitbridge)" | "Active on Site" | "Special Order";
  throughput?: string;
  powerOption?: string;
  condition?: "New" | "Refurbished / Certified";
  warrantyMonths?: number;
  detailedNotes?: string;
};

export type RecycleBinKind = "client" | "product";

export type RecycleBinItem = {
  binId: string;
  kind: RecycleBinKind;
  deletedAt: string;
  title: string;
  subtitle: string;
  snapshot: CRMClient | ExtendedEquipment;
};

export type SiteCopyContent = {
  // Brand & Identity
  name: string;
  shortName: string;
  tagline: string;
  foundedYear: string;
  companyReg: string;

  // Hero Section
  heroBadge: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroBannerAnnouncement: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroCtaTertiary: string;

  // Hero Quick Stats (4 cards)
  stat1Label: string;
  stat1Detail: string;
  stat2Label: string;
  stat2Detail: string;
  stat3Label: string;
  stat3Detail: string;
  stat4Label: string;
  stat4Detail: string;

  // Yard & Physical Location
  yardAddressLine1: string;
  yardAddressLine2: string;
  yardCity: string;
  yardCountry: string;
  googleMapsUrl: string;
  yardDirectionsNote: string;

  // Contact Channels
  primaryPhone: string;
  primaryPhoneTel: string;
  secondaryPhone: string;
  secondaryPhoneTel: string;
  whatsappNumber: string;
  whatsappMessage: string;
  email: string;
  salesEmail: string;

  // Operating Hours & Service SLAs
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  afterHoursNotice: string;
  responseSLA: string;
  emergencyHotline: string;
  emergencyHotlineTel: string;
  dispatchTurnaround: string;
  warrantyNotice: string;
  termsNotice: string;
  paymentMethods: string;
  inspectionNotice: string;
  tendersNotice: string;

  // Social Links
  linkedinUrl: string;
  facebookUrl: string;

  // Division Eyebrows & Headlines
  miningEyebrow: string;
  miningHeadline: string;
  miningSubheadline: string;
  hardwareEyebrow: string;
  hardwareHeadline: string;
  hardwareSubheadline: string;
  hireEyebrow: string;
  hireHeadline: string;
  hireSubheadline: string;
  farmingEyebrow: string;
  farmingHeadline: string;
  farmingSubheadline: string;
  industryEyebrow: string;
  industryHeadline: string;
  industrySubheadline: string;

  // About & Pillars
  aboutHeadline: string;
  aboutMission: string;
  aboutStory: string;
  aboutPillar1: string;
  aboutPillar2: string;
  aboutPillar3: string;
  aboutPillar4: string;

  // Footer & Compliance
  footerAbout: string;
  footerCopyright: string;
};

export const defaultSiteCopy: SiteCopyContent = {
  // Brand & Identity
  name: initialSite.name,
  shortName: initialSite.shortName,
  tagline: initialSite.tagline,
  foundedYear: "2024",
  companyReg: "Harare Industrial & Mining Machinery Supplier",

  // Hero Section
  heroBadge: "Cranborne yard · 115 Chiremba Road, Harare",
  heroHeadline: "Plant for Zimbabwe’s mines, farms and pours.",
  heroSubheadline:
    "Gold circuits, fence plant, self-loading mixers, excavators and farm mills — specified in Harare, delivered nationwide, commissioned on the ground.",
  heroBannerAnnouncement: "Cranborne Yard Open Mon–Sat · Lowbed Deliveries to Midlands, Matabeleland, Manicaland & Mashonaland",
  heroCtaPrimary: "Chat on WhatsApp",
  heroCtaSecondary: "Request a firm quote",
  heroCtaTertiary: "Open the catalogue",

  // Hero Quick Stats
  stat1Label: "Harare hub",
  stat1Detail: "Cranborne yard",
  stat2Label: "1–25 TPH",
  stat2Detail: "Gold circuits",
  stat3Label: "Wet & dry",
  stat3Detail: "Plant hire",
  stat4Label: "10 provinces",
  stat4Detail: "Lowbed delivery",

  // Yard & Physical Location
  yardAddressLine1: initialSite.address.line1,
  yardAddressLine2: initialSite.address.line2,
  yardCity: "Harare",
  yardCountry: "Zimbabwe",
  googleMapsUrl: initialSite.address.maps,
  yardDirectionsNote: "5 minutes from Harare CBD along Chiremba Rd, Cranborne Industrial Belt. Lowbed and heavy truck access.",

  // Contact Channels
  primaryPhone: initialSite.phoneDisplay,
  primaryPhoneTel: initialSite.phoneTel,
  secondaryPhone: initialSite.phoneAltDisplay,
  secondaryPhoneTel: initialSite.phoneAltTel,
  whatsappNumber: initialSite.whatsappNumber,
  whatsappMessage: "Hello Omnicore Harare Desk — I would like an equipment quote.",
  email: initialSite.email,
  salesEmail: "sales@omnicoresolutions.co.zw",

  // Operating Hours & Service SLAs
  hoursWeekday: "08:00 – 17:00",
  hoursSaturday: "08:00 – 13:00",
  hoursSunday: "Closed · WhatsApp desk monitored",
  afterHoursNotice: "Urgent site breakdown & pump dispatch hotline active 24/7 on WhatsApp.",
  responseSLA: "Average tender & pricing turnaround under 15 minutes during yard hours.",
  emergencyHotline: "+263 77 733 4569",
  emergencyHotlineTel: "+263777334569",
  dispatchTurnaround: "Same-day lowbed loading for in-stock plant; 24–48h nationwide delivery.",
  warrantyNotice: "12-month factory parts warranty & Harare commissioning included.",
  termsNotice: "All quotes issued in USD payable via Nostro, RTGS at official bank rate, or cash on collection.",
  paymentMethods: "Bank Transfer, Nostro, USD Cash, EcoCash, ZIPIT",
  inspectionNotice: "Physical yard mechanical inspections welcome Monday–Saturday at 115 Chiremba Rd, Cranborne.",
  tendersNotice: "PRAZ Registered Supplier · Formal tenders, municipal quotes & mine procurement packs issued within 24h.",

  // Social Links
  linkedinUrl: initialSite.linkedin,
  facebookUrl: initialSite.facebook,

  // Division Eyebrows & Headlines
  miningEyebrow: "Gold · Chrome · Lithium",
  miningHeadline: "Plant that turns ore into cashflow.",
  miningSubheadline: "Complete gravity and milling circuits engineered for small-scale and commercial miners across Kadoma, Kwekwe, Gwanda, and Shamva.",
  hardwareEyebrow: "Build · Fence · Supply",
  hardwareHeadline: "The hardware that keeps a site moving.",
  hardwareSubheadline: "Diamond mesh, razor wire, block machines, and farm fencing hardware built to withstand rigorous Zimbabwean field conditions.",
  hireEyebrow: "Heavy Fleet · Harare Yard",
  hireHeadline: "Yellow plant on wet or dry rate without the downtime.",
  hireSubheadline: "Late-model CAT diggers, 37m concrete boom pumps, and self-loading mixers with certified operators ready for rapid mobilization.",
  farmingEyebrow: "Feed · Grind · Value Add",
  farmingHeadline: "Agro-processing machinery for commercial and smallholder farms.",
  farmingSubheadline: "Hammer mills, vertical feed mixers, and oil presses designed for commercial poultry, cattle pen-fattening, and crop processing.",
  industryEyebrow: "Power · Motors · Compressors",
  industryHeadline: "Industrial gear that doesn't buckle under load shedding.",
  industrySubheadline: "Heavy-duty electric motors, screw compressors, and diesel backup sets calibrated for uninterrupted industrial operation.",

  // About & Pillars
  aboutHeadline: "Direct Importers & Stockists of Heavy Industrial Equipment",
  aboutMission:
    "Supplying verified commercial machinery with local parts, field commissioning, and technical back-up across all 10 provinces of Zimbabwe.",
  aboutStory: "Founded to bridge the equipment gap for Zimbabwean miners, contractors, and farmers, Omnicore Solutions maintains a fully-stocked Cranborne yard with experienced mechanical engineers on site.",
  aboutPillar1: "Physical Harare Yard Stock — inspect before purchase at Cranborne",
  aboutPillar2: "Zimbabwe-Field Proven — built for local ore grades and rural power grids",
  aboutPillar3: "Spares & Technical Backup — OEM wear parts stocked in Harare",
  aboutPillar4: "Nationwide Logistics — lowbed and crane-truck delivery to your site",

  // Footer & Compliance
  footerAbout:
    "Direct supply, equipment hire, and on-site plant commissioning from Cranborne, Harare — delivering to claims, farms and project sites nationwide.",
  footerCopyright: `© ${new Date().getFullYear()} Omnicore Solutions. All rights reserved. Machinery & Plant Zimbabwe · Cranborne, Harare`,
};

export const defaultCRMClients: CRMClient[] = [];

export const defaultExtendedEquipment: ExtendedEquipment[] = [];

const STORAGE_KEY_CRM = "omnicore_crm_clients_v2";
const STORAGE_KEY_EQUIPMENT = "omnicore_equipment_inventory_v2";
const STORAGE_KEY_SITE_COPY = "omnicore_site_copy_v2";
const STORAGE_KEY_RECYCLE = "omnicore_recycle_bin_v1";

export function getStoredCRMClients(): CRMClient[] {
  if (typeof window === "undefined") return defaultCRMClients;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CRM);
    if (!raw) return defaultCRMClients;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((client) => !/^CRM-100[1-8]$/.test(client.id)) : defaultCRMClients;
  } catch {
    return defaultCRMClients;
  }
}

function announceStorageError(error: unknown) {
  if (typeof window === "undefined") return;
  const message = error instanceof Error ? error.message : "Could not save data in this browser.";
  window.dispatchEvent(new CustomEvent("omnicore-storage-error", { detail: { message } }));
}

export function saveStoredCRMClients(clients: CRMClient[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_CRM, JSON.stringify(clients));
    void crmApi.saveCRM(clients).catch(() => undefined);
    window.dispatchEvent(new CustomEvent("omnicore-crm-updated"));
  } catch {
    announceStorageError(new Error("Could not save CRM data in this browser."));
  }
}

export async function addInboundLeadToCRM(lead: {
  name: string;
  phone: string;
  email?: string;
  location?: string;
  service?: string;
  intent?: string;
  message?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "This request can only be saved in a browser." };
  }

  const now = new Date();
  const intent: CRMClient["intent"] =
    lead.intent === "Hire" || lead.intent === "Both"
      ? lead.intent
      : lead.intent === "General"
        ? "Consultation"
        : "Buy";
  const client: CRMClient = {
    id: `CRM-${now.getTime()}`,
    name: lead.name,
    organization: "Website inquiry",
    phone: lead.phone,
    email: lead.email ?? "",
    location: lead.location ?? "",
    province: "Not specified",
    service: lead.service ?? "",
    equipmentInterest: lead.service ?? "",
    intent,
    stage: "Lead",
    priority: "Normal",
    dealValue: 0,
    dealValueDisplay: "$0",
    lastContact: now.toLocaleString(),
    nextFollowUp: "Not set",
    notes: lead.message ?? "",
    timeline: [{ date: now.toLocaleDateString(), note: "Inbound quote received through the website.", author: "Website" }],
  };

  try {
    localStorage.setItem(STORAGE_KEY_CRM, JSON.stringify([...getStoredCRMClients(), client]));
    window.dispatchEvent(new CustomEvent("omnicore-crm-updated"));
    return { success: true };
  } catch (error) {
    announceStorageError(error);
    return {
      success: false,
      error: "This inquiry could not be saved in this browser. You can still send it through WhatsApp.",
    };
  }
}

export function getStoredEquipment(): ExtendedEquipment[] {
  if (typeof window === "undefined") return defaultExtendedEquipment;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EQUIPMENT);
    if (!raw) return defaultExtendedEquipment;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => !initialEquipment.some((seed) => seed.id === item.id)) : defaultExtendedEquipment;
  } catch {
    return defaultExtendedEquipment;
  }
}

export function saveStoredEquipment(items: ExtendedEquipment[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY_EQUIPMENT, JSON.stringify(items));
    void crmApi.saveEquipment(items).catch(() => undefined);
    window.dispatchEvent(new CustomEvent("omnicore-equipment-updated"));
    return true;
  } catch {
    announceStorageError(new Error("Could not save equipment data in this browser."));
    return false;
  }
}

export function getStoredSiteCopy(): SiteCopyContent {
  if (typeof window === "undefined") return defaultSiteCopy;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SITE_COPY);
    if (!raw) return defaultSiteCopy;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? { ...defaultSiteCopy, ...parsed } : defaultSiteCopy;
  } catch {
    return defaultSiteCopy;
  }
}

export function saveStoredSiteCopy(copy: SiteCopyContent): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY_SITE_COPY, JSON.stringify(copy));
    void crmApi.saveSiteCopy(copy).catch(() => undefined);
    window.dispatchEvent(new CustomEvent("omnicore-copy-updated"));
    return true;
  } catch {
    announceStorageError(new Error("Could not save site content in this browser."));
    return false;
  }
}

export function resetStoredSiteCopy(): SiteCopyContent | null {
  if (typeof window === "undefined") return null;
  try {
    localStorage.setItem(STORAGE_KEY_SITE_COPY, JSON.stringify(defaultSiteCopy));
    window.dispatchEvent(new CustomEvent("omnicore-copy-updated"));
    return defaultSiteCopy;
  } catch {
    announceStorageError(new Error("Could not reset website content in this browser."));
    return null;
  }
}

export function useSiteCopy(): SiteCopyContent {
  const [copy, setCopy] = useState<SiteCopyContent>(getStoredSiteCopy);

  useEffect(() => {
    function onUpdate() {
      setCopy(getStoredSiteCopy());
    }
    window.addEventListener("omnicore-copy-updated", onUpdate);
    return () => {
      window.removeEventListener("omnicore-copy-updated", onUpdate);
    };
  }, []);

  return copy;
}

function makeBinId(kind: RecycleBinKind, sourceId: string) {
  return `bin-${kind}-${sourceId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function toRecycleClient(client: CRMClient): RecycleBinItem {
  return {
    binId: makeBinId("client", client.id),
    kind: "client",
    deletedAt: new Date().toISOString(),
    title: client.name,
    subtitle: `${client.organization} · ${client.id}`,
    snapshot: client,
  };
}

export function toRecycleProduct(item: ExtendedEquipment): RecycleBinItem {
  return {
    binId: makeBinId("product", item.id),
    kind: "product",
    deletedAt: new Date().toISOString(),
    title: item.name,
    subtitle: `${item.sku || item.id} · ${item.category}`,
    snapshot: item,
  };
}

export function getStoredRecycleBin(): RecycleBinItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECYCLE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredRecycleBin(items: RecycleBinItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_RECYCLE, JSON.stringify(items));
    void crmApi.saveRecycle(items).catch(() => undefined);
    window.dispatchEvent(new CustomEvent("omnicore-recycle-updated"));
  } catch {
    // ignore
  }
}

// ============================================================================
// PLANT HIRE DEPLOYMENTS & FIELD FLEET STORE
// ============================================================================
export const STORAGE_KEY_DEPLOYMENTS = "omnicore_field_deployments_v2";

export type DeploymentStatus =
  | "Active on Site"
  | "Scheduled Mobilization"
  | "Demobilizing / In Transit"
  | "Routine Service / Standby"
  | "Returned to Cranborne Yard";

export type DeploymentRecord = {
  id: string;
  productId?: string;
  plant: string;
  category: "hire" | "mining" | "farming" | "hardware" | "industry";
  image: string;
  sku: string;
  client: string;
  site: string;
  province: string;
  operator: string;
  rate: string;
  dailyRateUSD: number;
  status: DeploymentStatus;
  startDate: string;
  scheduledReturn: string;
  contractRef: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
};

export const DEFAULT_DEPLOYMENTS: DeploymentRecord[] = [];

export function getStoredDeployments(): DeploymentRecord[] {
  if (typeof window === "undefined") return DEFAULT_DEPLOYMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEPLOYMENTS);
    if (!raw) return DEFAULT_DEPLOYMENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((deployment) => !/^DEP-(0[1-9]|1[0-2])$/.test(deployment.id)) : DEFAULT_DEPLOYMENTS;
  } catch {
    return DEFAULT_DEPLOYMENTS;
  }
}

export function saveStoredDeployments(deployments: DeploymentRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_DEPLOYMENTS, JSON.stringify(deployments));
    void crmApi.saveDeployments(deployments).catch(() => undefined);
    window.dispatchEvent(new CustomEvent("omnicore-deployments-updated"));
  } catch {
    announceStorageError(new Error("Could not save deployment data in this browser."));
  }
}




