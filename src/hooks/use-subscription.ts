"use client";

// Layer 5 stub. Returns the fixture subscription unconditionally for now;
// when Backend_Handoff §8.x ships /api/me/subscription this hook flips to a
// real TanStack query. The fixture is shaped exactly like the eventual
// response payload so callers don't need to change.

import {
  FIXTURE_INVOICES,
  FIXTURE_PAYMENT_METHOD,
  FIXTURE_SUBSCRIPTION,
  type InvoiceFixture,
  type PaymentMethodFixture,
  type Subscription,
} from "@/hooks/_fixtures";

export function useSubscription(): {
  subscription: Subscription;
  invoices: ReadonlyArray<InvoiceFixture>;
  paymentMethod: PaymentMethodFixture;
  isLoading: boolean;
} {
  return {
    subscription: FIXTURE_SUBSCRIPTION,
    invoices: FIXTURE_INVOICES,
    paymentMethod: FIXTURE_PAYMENT_METHOD,
    isLoading: false,
  };
}
