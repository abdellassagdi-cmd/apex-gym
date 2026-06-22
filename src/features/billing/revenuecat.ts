import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from "react-native-purchases";

import type { PlanCode } from "../workouts/services/membership";

const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
let configured = false;
let identifiedUserId: string | null = null;

export async function syncRevenueCatIdentity(userId: string | null) {
  if (process.env.EXPO_OS === "web" || !apiKey) return;

  if (!configured) {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({ apiKey, appUserID: userId ?? undefined });
    configured = true;
    identifiedUserId = userId;
    return;
  }

  if (userId && userId !== identifiedUserId) {
    await Purchases.logIn(userId);
    identifiedUserId = userId;
  } else if (!userId && identifiedUserId) {
    await Purchases.logOut();
    identifiedUserId = null;
  }
}

export async function purchaseRevenueCatPlan(plan: Exclude<PlanCode, "free">): Promise<CustomerInfo> {
  if (process.env.EXPO_OS === "web") throw new Error("Purchases are available in the installed Android or iPhone app.");
  if (!configured) await syncRevenueCatIdentity(null);

  const offerings = await Purchases.getOfferings();
  const packages = offerings.current?.availablePackages ?? [];
  const selected = findPlanPackage(packages, plan);
  if (!selected) {
    throw new Error(`RevenueCat does not have a ${plan.toUpperCase()} package yet. Add it to the current Offering.`);
  }
  const result = await Purchases.purchasePackage(selected);
  return result.customerInfo;
}

export async function restoreRevenueCatPurchases() {
  if (process.env.EXPO_OS === "web") throw new Error("Restore is available in the installed mobile app.");
  if (!configured) await syncRevenueCatIdentity(null);
  return Purchases.restorePurchases();
}

export function planFromCustomerInfo(customerInfo: CustomerInfo): PlanCode {
  const active = customerInfo.entitlements.active;
  if (active.pro) return "pro";
  if (active.plus) return "plus";
  return "free";
}

function findPlanPackage(packages: PurchasesPackage[], plan: "plus" | "pro") {
  return packages.find((item) => {
    const searchable = `${item.identifier} ${item.product.identifier}`.toLowerCase();
    return searchable.includes(plan);
  });
}
