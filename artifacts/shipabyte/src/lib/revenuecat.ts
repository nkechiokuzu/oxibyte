import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';

export const REVENUECAT_CONFIG = {
  API_KEY: 'test_qZmZRkJwUOnTcrkesCGjMAwZxzq',
  ENTITLEMENT_ID: 'oxibyte_star',
  PRODUCTS: {
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
  },
  OFFERING_ID: 'default',
} as const;

export type StarSubscriptionTier = 'monthly' | 'yearly';

export interface StarSubscriptionStatus {
  isStar: boolean;
  tier: StarSubscriptionTier | null;
  expiresAt: string | null;
  isNative: boolean;
}

// Local event dispatcher so React components update when subscription changes
const listeners = new Set<(status: StarSubscriptionStatus) => void>();

function notifyListeners(status: StarSubscriptionStatus) {
  listeners.forEach((fn) => fn(status));
}

export function subscribeToStarStatus(fn: (status: StarSubscriptionStatus) => void): () => void {
  listeners.add(fn);
  // Emit current status immediately
  getStarSubscriptionStatus().then(fn).catch(() => {});
  return () => {
    listeners.delete(fn);
  };
}

let isInitialized = false;

/**
 * Initialize RevenueCat SDK.
 * Safely handles Native iOS/Android via StoreKit/Google Play and Web dev preview.
 */
export async function initRevenueCat(userId?: string): Promise<void> {
  if (isInitialized) return;

  if (Capacitor.isNativePlatform()) {
    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({
        apiKey: REVENUECAT_CONFIG.API_KEY,
        appUserID: userId,
      });

      Purchases.addCustomerInfoUpdateListener((info) => {
        const isStar = !!info.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];
        const tier: StarSubscriptionTier | null = isStar
          ? (info.activeSubscriptions.find((s) => s.includes('year')) ? 'yearly' : 'monthly')
          : null;
        notifyListeners({
          isStar,
          tier,
          expiresAt: info.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID]?.expirationDate || null,
          isNative: true,
        });
      });

      isInitialized = true;
    } catch (err) {
      console.warn('[RevenueCat] Native init warning:', err);
    }
  } else {
    // Web / dev preview mode
    isInitialized = true;
  }
}

/**
 * Check if current user has active oxibyte_star entitlement
 */
export async function getStarSubscriptionStatus(): Promise<StarSubscriptionStatus> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];
      const isStar = !!entitlement;
      const tier: StarSubscriptionTier | null = isStar
        ? (customerInfo.activeSubscriptions.find((s) => s.includes('year')) ? 'yearly' : 'monthly')
        : null;

      return {
        isStar,
        tier,
        expiresAt: entitlement?.expirationDate || null,
        isNative: true,
      };
    } catch (err) {
      console.warn('[RevenueCat] Failed to fetch customer info, falling back to cached state:', err);
    }
  }

  // Web fallback simulation
  const savedSub = localStorage.getItem('oxibyte_star_subscribed');
  const savedTier = (localStorage.getItem('oxibyte_star_tier') as StarSubscriptionTier) || 'yearly';
  const isStar = savedSub === 'true';

  return {
    isStar,
    tier: isStar ? savedTier : null,
    expiresAt: isStar ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
    isNative: false,
  };
}

/**
 * Present Native RevenueCat Paywall or open custom web modal
 */
export async function presentPaywall(): Promise<{ result: string }> {
  if (Capacitor.isNativePlatform()) {
    try {
      const paywallResult = await RevenueCatUI.presentPaywall();
      const status = await getStarSubscriptionStatus();
      notifyListeners(status);
      return { result: paywallResult.result };
    } catch (err) {
      console.error('[RevenueCat] Paywall presentation failed:', err);
      return { result: PAYWALL_RESULT.ERROR };
    }
  }

  // On Web: dispatch custom event so UI displays OxibyteStarModal
  window.dispatchEvent(new CustomEvent('oxibyte:open_star_paywall'));
  return { result: 'WEB_MODAL_OPENED' };
}

/**
 * Present Paywall only if user does not hold oxibyte_star entitlement
 */
export async function presentPaywallIfNeeded(): Promise<{ result: string }> {
  const current = await getStarSubscriptionStatus();
  if (current.isStar) {
    return { result: PAYWALL_RESULT.NOT_PRESENTED };
  }
  return presentPaywall();
}

/**
 * Present Native Customer Center (subscription management / cancellations / changes)
 */
export async function presentCustomerCenter(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await RevenueCatUI.presentCustomerCenter();
      const status = await getStarSubscriptionStatus();
      notifyListeners(status);
      return;
    } catch (err) {
      console.error('[RevenueCat] Customer Center error:', err);
    }
  }

  // On Web: open customer center view in modal
  window.dispatchEvent(new CustomEvent('oxibyte:open_star_customer_center'));
}

/**
 * Purchase a subscription package (Monthly or Yearly)
 */
export async function purchaseStarPlan(tier: StarSubscriptionTier): Promise<{
  success: boolean;
  cancelled?: boolean;
  error?: string;
}> {
  if (Capacitor.isNativePlatform()) {
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) {
        throw new Error('No current offerings configured in RevenueCat dashboard.');
      }

      // Pick corresponding package
      const pkg = tier === 'yearly' ? current.annual : current.monthly;
      if (!pkg) {
        throw new Error(`Package ${tier} not found in current offering.`);
      }

      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      const isStar = !!customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];

      const status = {
        isStar,
        tier: isStar ? tier : null,
        expiresAt: customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID]?.expirationDate || null,
        isNative: true,
      };
      notifyListeners(status);
      return { success: isStar };
    } catch (err: any) {
      if (err.code === 1 || err.message?.includes('cancelled')) {
        return { success: false, cancelled: true };
      }
      return { success: false, error: err.message || 'Purchase failed.' };
    }
  }

  // Web simulation purchase
  localStorage.setItem('oxibyte_star_subscribed', 'true');
  localStorage.setItem('oxibyte_star_tier', tier);
  const status: StarSubscriptionStatus = {
    isStar: true,
    tier,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    isNative: false,
  };
  notifyListeners(status);
  return { success: true };
}

/**
 * Cancel or reset subscription (dev simulation / local reset)
 */
export async function cancelStarPlan(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.removeItem('oxibyte_star_subscribed');
    localStorage.removeItem('oxibyte_star_tier');
    const status: StarSubscriptionStatus = {
      isStar: false,
      tier: null,
      expiresAt: null,
      isNative: false,
    };
    notifyListeners(status);
  }
}

/**
 * Restore previous purchases
 */
export async function restoreStarPurchases(): Promise<{ success: boolean; isStar: boolean }> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      const isStar = !!customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];
      const tier: StarSubscriptionTier | null = isStar
        ? (customerInfo.activeSubscriptions.find((s) => s.includes('year')) ? 'yearly' : 'monthly')
        : null;

      const status = {
        isStar,
        tier,
        expiresAt: customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID]?.expirationDate || null,
        isNative: true,
      };
      notifyListeners(status);
      return { success: true, isStar };
    } catch (err) {
      return { success: false, isStar: false };
    }
  }

  const status = await getStarSubscriptionStatus();
  return { success: true, isStar: status.isStar };
}
