// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as axe from "axe-core";
import {
  Button,
  Input,
  PhoneInput,
  OtpInput,
  Select,
  Toggle,
  DataTable,
  ConfirmDialog,
  FareBreakdown,
  PaymentOptions,
} from "./components/ui";
import DevUiGalleryPage from "./app/_dev/ui/page";
import { paise, computeFare, calculateDepositOptions } from "@redtaxi/shared";

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // In JSDOM synthetic testing, color-contrast may lack full canvas rendering context
      "color-contrast": { enabled: false },
    },
  });

  const seriousOrCritical = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical"
  );

  if (seriousOrCritical.length > 0) {
    const errorDetails = seriousOrCritical
      .map(
        (v) =>
          `[${v.impact?.toUpperCase()}] ${v.id}: ${v.help} (${v.nodes.map((n) => n.html).join(", ")})`
      )
      .join("\n");
    throw new Error(`Axe accessibility violations found:\n${errorDetails}`);
  }

  expect(seriousOrCritical).toHaveLength(0);
}

describe("T2.4: Accessibility Audit with axe-core (0 Serious/Critical Violations)", () => {
  it("Button has 0 serious/critical a11y violations", async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Submit Ride</Button>
        <Button variant="outline" disabled>
          Disabled Action
        </Button>
        <Button variant="danger" loading>
          Deleting
        </Button>
      </div>
    );
    await expectNoAxeViolations(container);
  });

  it("Form controls (Input, PhoneInput, Select, Toggle) have 0 serious/critical a11y violations", async () => {
    const { container } = render(
      <form>
        <Input label="Name" placeholder="Enter full name" />
        <PhoneInput label="Phone" value="9876543210" />
        <Select
          label="Vehicle"
          options={[
            { value: "sedan", label: "Sedan" },
            { value: "suv", label: "SUV" },
          ]}
        />
        <Toggle checked={true} onChange={() => {}} label="Driver Status" />
      </form>
    );
    await expectNoAxeViolations(container);
  });

  it("OtpInput (4-digit and 6-digit) has 0 serious/critical a11y violations", async () => {
    const { container } = render(
      <div>
        <OtpInput length={4} value="1234" />
        <OtpInput length={6} value="987654" />
      </div>
    );
    await expectNoAxeViolations(container);
  });

  it("DataTable has 0 serious/critical a11y violations", async () => {
    const { container } = render(
      <DataTable
        columns={[
          { key: "id", header: "Trip ID", sortable: true },
          { key: "fare", header: "Fare", sortable: true },
        ]}
        data={[
          { id: "BK101", fare: "₹1,494" },
          { id: "BK102", fare: "₹850" },
        ]}
      />
    );
    await expectNoAxeViolations(container);
  });

  it("ConfirmDialog modal has 0 serious/critical a11y violations", async () => {
    const { container } = render(
      <ConfirmDialog
        open={true}
        title="Confirm Cancellation"
        description="Are you sure you want to cancel?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    await expectNoAxeViolations(container);
  });

  it("FareBreakdown and PaymentOptions have 0 serious/critical a11y violations", async () => {
    const fare = computeFare({
      distanceKm: 65.2,
      ratePerKm: paise(1600),
      batta: paise(30000),
      tollEstimate: paise(8000),
    });
    const quote = {
      ...fare,
      id: "q-1",
      vehicleId: "v-sedan",
      mode: "one_way" as const,
      distanceKm: 65.2,
      durationMin: 85,
      depositOptions: calculateDepositOptions(fare.total),
      validUntil: "2026-10-10T14:30:00Z",
    };
    const { container } = render(
      <div>
        <FareBreakdown quote={quote} />
        <PaymentOptions options={quote.depositOptions} selectedType="deposit" onChange={() => {}} />
      </div>
    );
    await expectNoAxeViolations(container);
  });

  it("Full Dev UI Gallery Page has 0 serious/critical a11y violations", async () => {
    const { container } = render(<DevUiGalleryPage />);
    await expectNoAxeViolations(container);
  });
});
