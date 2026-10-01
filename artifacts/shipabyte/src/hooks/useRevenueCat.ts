import { useEffect, useState } from 'react';
import {
  getStarSubscriptionStatus,
  subscribeToStarStatus,
  presentPaywall,
  presentCustomerCenter,
  purchaseStarPlan,
  restoreStarPurchases,
  cancelStarPlan,
  type StarSubscriptionStatus,
  type StarSubscriptionTier,
} from '../lib/revenuecat';

export function useRevenueCat() {
  const [status, setStatus] = useState<StarSubscriptionStatus>({
    isStar: false,
    tier: null,
    expiresAt: null,
    isNative: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getStarSubscriptionStatus().then((s) => {
      if (mounted) {
        setStatus(s);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToStarStatus((nextStatus) => {
      if (mounted) {
        setStatus(nextStatus);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return {
    isStar: status.isStar,
    tier: status.tier,
    expiresAt: status.expiresAt,
    isNative: status.isNative,
    loading,
    openPaywall: presentPaywall,
    openCustomerCenter: presentCustomerCenter,
    purchase: (t: StarSubscriptionTier) => purchaseStarPlan(t),
    restore: restoreStarPurchases,
    cancel: cancelStarPlan,
  };
}
