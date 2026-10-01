/**
 * Production-Ready Angular Service for RevenueCat SDK with Capacitor
 * Compatible with Angular 17+ (Standalone Injectable & Signals)
 * 
 * Packages required in your Angular project:
 * npm install @revenuecat/purchases-capacitor @revenuecat/purchases-capacitor-ui
 */

import { Injectable, signal, computed } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from '@revenuecat/purchases-capacitor';
import {
  RevenueCatUI,
  PAYWALL_RESULT,
} from '@revenuecat/purchases-capacitor-ui';

@Injectable({
  providedIn: 'root',
})
export class RevenueCatService {
  // Configuration
  public readonly API_KEY = 'test_qZmZRkJwUOnTcrkesCGjMAwZxzq';
  public readonly ENTITLEMENT_ID = 'oxibyte_star';
  public readonly OFFERING_ID = 'default';

  // Angular Signals for Reactive UI State
  public customerInfo = signal<CustomerInfo | null>(null);
  public offerings = signal<PurchasesOfferings | null>(null);
  public isLoading = signal<boolean>(false);
  public isInitialized = signal<boolean>(false);

  // Computed Signal: true if user holds active 'oxibyte_star' entitlement
  public isStar = computed(() => {
    const info = this.customerInfo();
    return !!info?.entitlements.active[this.ENTITLEMENT_ID];
  });

  constructor() {
    this.init();
  }

  /**
   * Initialize RevenueCat SDK on Capacitor Native Platform
   */
  async init(appUserId?: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('[RevenueCat] Running on Web. Native StoreKit / Google Play Billing is disabled.');
      return;
    }

    try {
      this.isLoading.set(true);

      // Enable verbose logs during dev/testing
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      // Configure SDK
      await Purchases.configure({
        apiKey: this.API_KEY,
        appUserID: appUserId,
      });

      // Listen to real-time subscription status changes (renewals, cancellations)
      Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
        console.log('[RevenueCat] CustomerInfo updated:', info);
        this.customerInfo.set(info);
      });

      // Load initial state
      const initial = await Purchases.getCustomerInfo();
      this.customerInfo.set(initial.customerInfo);

      // Fetch Offerings (Yearly & Monthly packages)
      await this.refreshOfferings();

      this.isInitialized.set(true);
    } catch (error) {
      console.error('[RevenueCat] Initialization error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Refresh available packages from RevenueCat
   */
  async refreshOfferings(): Promise<PurchasesOfferings | null> {
    try {
      const response = await Purchases.getOfferings();
      if (response && response.current) {
        this.offerings.set(response);
        return response;
      }
      return null;
    } catch (error) {
      console.error('[RevenueCat] Error loading offerings:', error);
      return null;
    }
  }

  /**
   * Bind user ID on login (merges purchases with Oxibyte account)
   */
  async logIn(userId: string): Promise<CustomerInfo> {
    const { customerInfo } = await Purchases.logIn({ appUserID: userId });
    this.customerInfo.set(customerInfo);
    return customerInfo;
  }

  /**
   * Reset on user logout
   */
  async logOut(): Promise<CustomerInfo> {
    const { customerInfo } = await Purchases.logOut();
    this.customerInfo.set(customerInfo);
    return customerInfo;
  }

  /**
   * Purchase a package (Monthly or Yearly)
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<{
    success: boolean;
    cancelled?: boolean;
    error?: string;
  }> {
    try {
      this.isLoading.set(true);
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      this.customerInfo.set(result.customerInfo);

      const hasStar = !!result.customerInfo.entitlements.active[this.ENTITLEMENT_ID];
      return { success: hasStar };
    } catch (error: any) {
      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return { success: false, cancelled: true };
      }
      if (error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        return { success: false, error: 'Payment is pending approval.' };
      }
      if (error.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
        return { success: false, error: 'Product already purchased. Please restore.' };
      }
      return { success: false, error: error.message || 'Purchase failed.' };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<boolean> {
    try {
      this.isLoading.set(true);
      const { customerInfo } = await Purchases.restorePurchases();
      this.customerInfo.set(customerInfo);
      return !!customerInfo.entitlements.active[this.ENTITLEMENT_ID];
    } catch (error) {
      console.error('[RevenueCat] Restore error:', error);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ==========================================
  //  UI PLUGIN: Paywalls & Customer Center
  // ==========================================

  /**
   * Present native RevenueCat Paywall if user lacks 'oxibyte_star'
   */
  async presentPaywallIfNeeded(): Promise<PAYWALL_RESULT> {
    if (!Capacitor.isNativePlatform()) return PAYWALL_RESULT.NOT_PRESENTED;

    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: this.ENTITLEMENT_ID,
      });
      const info = await Purchases.getCustomerInfo();
      this.customerInfo.set(info.customerInfo);
      return result.result;
    } catch (error) {
      console.error('[RevenueCat] Paywall error:', error);
      return PAYWALL_RESULT.ERROR;
    }
  }

  /**
   * Always present Paywall (e.g. user tapped "Upgrade to Star" CTA)
   */
  async presentPaywall(): Promise<PAYWALL_RESULT> {
    if (!Capacitor.isNativePlatform()) return PAYWALL_RESULT.NOT_PRESENTED;

    try {
      const result = await RevenueCatUI.presentPaywall();
      const info = await Purchases.getCustomerInfo();
      this.customerInfo.set(info.customerInfo);
      return result.result;
    } catch (error) {
      console.error('[RevenueCat] Paywall error:', error);
      return PAYWALL_RESULT.ERROR;
    }
  }

  /**
   * Present Customer Center (allows users to view active plan, switch tiers, or cancel)
   */
  async presentCustomerCenter(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await RevenueCatUI.presentCustomerCenter();
      const info = await Purchases.getCustomerInfo();
      this.customerInfo.set(info.customerInfo);
    } catch (error) {
      console.error('[RevenueCat] Customer Center error:', error);
    }
  }
}
