"use client";

// Settings → Billing. Subscription tier model — replaces the prior
// pay-as-you-go pack picker. Plan tiles drive monthly vs annual; payment
// method and invoices are inline; cancel is a low-weight footer link.

import * as React from "react";
import { Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { BalanceHero } from "@/components/settings/BalanceHero";
import { PlanTiles } from "@/components/settings/PlanTiles";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/use-subscription";
import { settingsBilling } from "@/lib/copy";
import { cn } from "@/lib/utils";

function formatInvoiceDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function planLabel(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function PaymentSection() {
  const { paymentMethod } = useSubscription();
  return (
    <SettingsSection
      title={settingsBilling.paymentSectionTitle}
      description={settingsBilling.paymentSectionDescription}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-foreground">
          {settingsBilling.paymentDisplay(paymentMethod.last4, paymentMethod.exp)}
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => {
            // eslint-disable-next-line no-console
            console.warn("Stripe customer portal pending Layer 5");
            toast.info("Payment management opens in Stripe (pending).");
          }}
        >
          {settingsBilling.paymentManageCta}
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </SettingsSection>
  );
}

function InvoicesSection() {
  const { invoices } = useSubscription();

  return (
    <SettingsSection
      title={settingsBilling.invoicesSectionTitle}
      description={settingsBilling.invoicesSectionDescription}
    >
      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {settingsBilling.invoicesEmpty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  {settingsBilling.invoicesColumns.date}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {settingsBilling.invoicesColumns.plan}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {settingsBilling.invoicesColumns.credits}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {settingsBilling.invoicesColumns.amount}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {settingsBilling.invoicesColumns.pdf}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className={cn("border-t border-border")}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatInvoiceDate(inv.date)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {planLabel(inv.plan)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-muted-foreground">
                    {inv.credits}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-foreground">
                    ${inv.amount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        // eslint-disable-next-line no-console
                        console.warn("Invoice PDF pending Layer 5", inv.id);
                        toast.info(`Invoice ${inv.id} download pending.`);
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-primary hover:bg-primary-soft"
                    >
                      <Download className="size-3" aria-hidden="true" />
                      {settingsBilling.invoicePdfDownload}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsSection>
  );
}

function CancelSection() {
  const [open, setOpen] = React.useState(false);
  const { subscription } = useSubscription();

  if (subscription.status !== "active") return null;

  const handleCancel = () => {
    // eslint-disable-next-line no-console
    console.warn("Subscription cancellation pending Layer 5");
    toast.success("Subscription scheduled to cancel at period end.");
    setOpen(false);
  };

  return (
    <section className="border-t border-border py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {settingsBilling.cancelSectionTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            {settingsBilling.cancelSectionDescription}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
        >
          {settingsBilling.cancelCta}
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{settingsBilling.cancelDialog.title}</DialogTitle>
            <DialogDescription>
              {settingsBilling.cancelDialog.body}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setOpen(false)}
            >
              {settingsBilling.cancelDialog.keep}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={handleCancel}
            >
              {settingsBilling.cancelDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function SettingsBillingPage() {
  return (
    <div>
      <div className="pb-8">
        <BalanceHero />
      </div>

      <SettingsSection
        title={settingsBilling.plansSectionTitle}
        description={settingsBilling.plansSectionDescription}
      >
        <PlanTiles />
      </SettingsSection>

      <PaymentSection />
      <InvoicesSection />
      <CancelSection />
    </div>
  );
}
