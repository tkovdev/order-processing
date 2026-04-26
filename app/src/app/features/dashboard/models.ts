import { RecentSale } from "./dashboard-api.service";

export interface InventoryByLocation {
  location: string;
  itemCount: number;
  quantity: number;
  value: number;
}

export interface TopItem {
  itemId: string;
  name: string;
  location: string;
  quantity: number;
  unitPrice: number;
  value: number;
}


export interface CustomerSummary {
  customerName: string;
  customerEmail: string;
  salesCount: number;
  totalUnits: number;
  totalValue: number;
}

export interface RiskItem {
  itemId: string;
  name: string;
  location: string;
  quantity: number;
  unitPrice: number;
  atRiskValue: number;
  targetQuantity: number;
  riskScore: number;
  riskLevel: string;
}

export interface DashboardViewModel {
  totalInventoryQuantity: number;
  totalInventoryValue: number;
  totalSales: number;
  submittedSales: number;
  completedSales: number;
  inventoryByLocation: InventoryByLocation[];
  topValueItems: TopItem[];
  recentSales: RecentSale[];
  customerSummary: CustomerSummary[];
  atRiskItems: RiskItem[];
}
