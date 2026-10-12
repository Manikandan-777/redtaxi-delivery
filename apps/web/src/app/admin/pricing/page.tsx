"use client";

import React, { useState } from "react";
import { type VehicleClass } from "@redtaxi/shared";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { INITIAL_ADMIN_PRICING, type AdminPricingRecord } from "@/lib/adminData";

export default function AdminPricingPage() {
  const [pricingRules, setPricingRules] =
    useState<Record<VehicleClass, AdminPricingRecord>>(INITIAL_ADMIN_PRICING);
  const [selectedClass, setSelectedClass] = useState<VehicleClass>("sedan");

  // Working state for active vehicle class
  const currentSavedRule = pricingRules[selectedClass];
  const [formState, setFormState] = useState<AdminPricingRecord>(currentSavedRule);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Switch tabs
  const handleTabChange = (tabId: string) => {
    const vClass = tabId as VehicleClass;
    setSelectedClass(vClass);
    setFormState(pricingRules[vClass]);
  };

  // Check dirty state (T7.7)
  const isDirty =
    formState.baseRatePerKmRupees !== currentSavedRule.baseRatePerKmRupees ||
    formState.dailyBattaRupees !== currentSavedRule.dailyBattaRupees ||
    formState.nightAllowanceRupees !== currentSavedRule.nightAllowanceRupees ||
    formState.minOutstationKm !== currentSavedRule.minOutstationKm ||
    formState.advanceDepositPercent !== currentSavedRule.advanceDepositPercent ||
    formState.minDepositRupees !== currentSavedRule.minDepositRupees;

  // Validation rules (T7.7): rate > 0, batta >= 0, deposit 0-100
  const validationError = (() => {
    if (formState.baseRatePerKmRupees <= 0) return "Base Rate Per Km must be greater than 0.";
    if (formState.dailyBattaRupees < 0) return "Daily Batta cannot be negative.";
    if (formState.nightAllowanceRupees < 0) return "Night Allowance cannot be negative.";
    if (formState.advanceDepositPercent < 0 || formState.advanceDepositPercent > 100)
      return "Advance Deposit must be between 0% and 100%.";
    return null;
  })();

  // Exact round trip conversion check (T7.7: ₹16.00 ↔ 1600 paise)
  const rateInPaise = Math.round(formState.baseRatePerKmRupees * 100);

  const handleSaveConfirmed = () => {
    setPricingRules({
      ...pricingRules,
      [selectedClass]: formState,
    });
    setIsDiffOpen(false);
    setSaveNotice(
      `Pricing rule for ${formState.displayName} saved successfully. New quotes will reflect ₹${formState.baseRatePerKmRupees.toFixed(2)}/km (${rateInPaise} paise). Existing quotes remain unchanged.`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-muted/20">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-ink tracking-tight">
            Tariff & Pricing Rules Management
          </h1>
          <p className="text-sm text-muted mt-1">
            Configure base rates, allowances, and deposit percentages (Affects new quotes only)
          </p>
        </div>
      </div>

      {saveNotice && (
        <div
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex justify-between items-center"
          role="status"
        >
          <span>{saveNotice}</span>
          <button
            type="button"
            onClick={() => setSaveNotice(null)}
            className="text-emerald-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Vehicle Class Tabs */}
      <Tabs
        tabs={[
          { id: "hatchback", label: "Hatchback" },
          { id: "sedan", label: "Sedan" },
          { id: "suv", label: "SUV" },
          { id: "innova", label: "Innova" },
          { id: "tempo", label: "Tempo Traveller" },
        ]}
        activeTab={selectedClass}
        onChange={handleTabChange}
      />

      {/* Pricing Form Card */}
      <Card className="p-6 max-w-2xl bg-white space-y-6">
        <div className="flex items-center justify-between border-b border-muted/20 pb-3">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {formState.displayName} Rate Configuration
            </h2>
            <p className="text-xs text-muted">
              All inputs in INR (₹) with 2 decimals; converted to integer paise
            </p>
          </div>
          {isDirty && (
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
              Unsaved Changes
            </span>
          )}
        </div>

        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium">
            ⚠ {validationError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Base Rate Per Km (₹) *
            </label>
            <Input
              id="baseRate"
              name="baseRate"
              type="number"
              step="0.01"
              value={formState.baseRatePerKmRupees}
              onChange={(e) =>
                setFormState({ ...formState, baseRatePerKmRupees: parseFloat(e.target.value) || 0 })
              }
              data-testid="pricing-base-rate-input"
            />
            <span className="text-[10px] text-muted font-mono">= {rateInPaise} paise</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Driver Daily Batta (₹) *
            </label>
            <Input
              id="dailyBatta"
              name="dailyBatta"
              type="number"
              step="0.01"
              value={formState.dailyBattaRupees}
              onChange={(e) =>
                setFormState({ ...formState, dailyBattaRupees: parseFloat(e.target.value) || 0 })
              }
              data-testid="pricing-batta-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Night Allowance (₹) *
            </label>
            <Input
              id="nightAllowance"
              name="nightAllowance"
              type="number"
              step="0.01"
              value={formState.nightAllowanceRupees}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  nightAllowanceRupees: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Minimum Outstation Km *
            </label>
            <Input
              id="minOutstationKm"
              name="minOutstationKm"
              type="number"
              value={formState.minOutstationKm}
              onChange={(e) =>
                setFormState({ ...formState, minOutstationKm: parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Advance Deposit (%) *
            </label>
            <Input
              id="advanceDeposit"
              name="advanceDeposit"
              type="number"
              value={formState.advanceDepositPercent}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  advanceDepositPercent: parseInt(e.target.value, 10) || 0,
                })
              }
              data-testid="pricing-deposit-percent-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Minimum Deposit Amount (₹) *
            </label>
            <Input
              id="minDeposit"
              name="minDeposit"
              type="number"
              step="0.01"
              value={formState.minDepositRupees}
              onChange={(e) =>
                setFormState({ ...formState, minDepositRupees: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-muted/20">
          <Button
            variant="outline"
            disabled={!isDirty}
            onClick={() => setFormState(currentSavedRule)}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            disabled={!isDirty || Boolean(validationError)}
            onClick={() => setIsDiffOpen(true)}
            data-testid="save-pricing-btn"
          >
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Diff Dialog (WA7 / T7.7: Shows Old -> New Diff) */}
      <ConfirmDialog
        isOpen={isDiffOpen}
        title={`Confirm Price Change for ${formState.displayName}`}
        description="Review the modification diff below. These changes apply to new quotes only; existing quotes remain unchanged."
        confirmLabel="Confirm & Apply Tariff"
        cancelLabel="Keep Editing"
        onConfirm={handleSaveConfirmed}
        onCancel={() => setIsDiffOpen(false)}
      >
        <div className="mt-3 bg-surface/30 p-3 rounded-lg border border-muted/30 text-xs space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-muted">Base Rate:</span>
            <span>
              ₹{currentSavedRule.baseRatePerKmRupees.toFixed(2)} →{" "}
              <strong className="text-accent">₹{formState.baseRatePerKmRupees.toFixed(2)}</strong>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Daily Batta:</span>
            <span>
              ₹{currentSavedRule.dailyBattaRupees.toFixed(2)} →{" "}
              <strong className="text-accent">₹{formState.dailyBattaRupees.toFixed(2)}</strong>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Deposit %:</span>
            <span>
              {currentSavedRule.advanceDepositPercent}% →{" "}
              <strong className="text-accent">{formState.advanceDepositPercent}%</strong>
            </span>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
