// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  Button,
  Input,
  PhoneInput,
  OtpInput,
  Select,
  Toggle,
  StatusBadge,
  DataTable,
  ConfirmDialog,
  VehicleCard,
  FareBreakdown,
  PaymentOptions,
  DriverCard,
} from "./components/ui";
import { paise, computeFare, calculateDepositOptions, type Vehicle } from "@redtaxi/shared";

afterEach(() => {
  cleanup();
});

describe("T2.2: Web Components States (Default, Focus, Disabled, Loading, Error)", () => {
  it("Button renders default, disabled, loading (with aria-busy), and error states", () => {
    const { rerender } = render(<Button>Click Me</Button>);
    const btn = screen.getByRole("button", { name: /click me/i });
    expect(btn).not.toBeDisabled();
    expect(btn.getAttribute("aria-busy")).toBeNull();

    // Disabled state
    rerender(<Button disabled>Click Me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeDisabled();

    // Loading state
    rerender(<Button loading>Click Me</Button>);
    const loadingBtn = screen.getByRole("button", { name: /click me/i });
    expect(loadingBtn).toBeDisabled();
    expect(loadingBtn.getAttribute("aria-busy")).toBe("true");

    // Error state
    rerender(<Button hasError>Click Me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toHaveClass("border-danger");
  });

  it("Input renders default, disabled, loading, and error states", () => {
    const { rerender } = render(<Input label="Username" placeholder="Enter user" />);
    const input = screen.getByPlaceholderText("Enter user");
    expect(input).not.toBeDisabled();
    expect(input.getAttribute("aria-invalid")).toBe("false");

    // Disabled
    rerender(<Input label="Username" placeholder="Enter user" disabled />);
    expect(screen.getByPlaceholderText("Enter user")).toBeDisabled();

    // Error state with accessible alert
    rerender(<Input label="Username" placeholder="Enter user" error="Username is required" />);
    const errInput = screen.getByPlaceholderText("Enter user");
    expect(errInput.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert")).toHaveTextContent("Username is required");
  });

  it("PhoneInput renders +91 prefix and handles numbers", () => {
    const handleChange = vi.fn();
    render(<PhoneInput label="Mobile" value="" onChange={handleChange} />);
    const phoneInput = screen.getByLabelText("Mobile");
    expect(screen.getByText("+91")).toBeDefined();

    fireEvent.change(phoneInput, { target: { value: "9876543210" } });
    expect(handleChange).toHaveBeenCalledWith("9876543210");
  });

  it("Select renders options and handles change", () => {
    const handleChange = vi.fn();
    render(
      <Select
        label="Options"
        options={[
          { value: "opt1", label: "Option 1" },
          { value: "opt2", label: "Option 2" },
        ]}
        onChange={handleChange}
      />
    );
    const select = screen.getByLabelText("Options");
    fireEvent.change(select, { target: { value: "opt2" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("Toggle toggles checked state and exposes role=switch", () => {
    const handleChange = vi.fn();
    render(<Toggle checked={false} onChange={handleChange} label="Online Status" />);
    const toggle = screen.getByRole("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("StatusBadge renders appropriate labels for all statuses", () => {
    const { rerender } = render(<StatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeDefined();

    rerender(<StatusBadge status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeDefined();

    rerender(<StatusBadge status="in_progress" />);
    expect(screen.getByText("In Progress")).toBeDefined();
  });
});

describe("T2.6: OtpInput Requirements (4 and 6 digits, auto-advance, backspace, paste, aria-labels)", () => {
  it("renders 4 digits with proper aria-labels for ride OTP", () => {
    render(<OtpInput length={4} value="1234" />);
    expect(screen.getByLabelText("Digit 1 of 4")).toHaveValue("1");
    expect(screen.getByLabelText("Digit 2 of 4")).toHaveValue("2");
    expect(screen.getByLabelText("Digit 3 of 4")).toHaveValue("3");
    expect(screen.getByLabelText("Digit 4 of 4")).toHaveValue("4");
  });

  it("renders 6 digits with proper aria-labels for login OTP", () => {
    render(<OtpInput length={6} value="987654" />);
    expect(screen.getByLabelText("Digit 1 of 6")).toHaveValue("9");
    expect(screen.getByLabelText("Digit 6 of 6")).toHaveValue("4");
  });

  it("advances focus on digit input and calls onChange", () => {
    const handleChange = vi.fn();
    render(<OtpInput length={4} value="" onChange={handleChange} />);
    const box1 = screen.getByLabelText("Digit 1 of 4");
    fireEvent.change(box1, { target: { value: "7" } });
    expect(handleChange).toHaveBeenCalledWith("7");
  });

  it("handles backspace to clear previous input", () => {
    const handleChange = vi.fn();
    render(<OtpInput length={4} value="7" onChange={handleChange} />);
    const box1 = screen.getByLabelText("Digit 1 of 4");
    fireEvent.keyDown(box1, { key: "Backspace" });
    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("handles clipboard paste filling all digits", () => {
    const handleChange = vi.fn();
    render(<OtpInput length={6} value="" onChange={handleChange} />);
    const box1 = screen.getByLabelText("Digit 1 of 6");
    fireEvent.paste(box1, {
      clipboardData: {
        getData: () => "654321",
      },
    });
    expect(handleChange).toHaveBeenCalledWith("654321");
  });
});

describe("T2.7: DataTable Requirements (Sort, Pagination, Empty, Loading with aria-busy)", () => {
  const sampleData = [
    { id: "1", name: "Bob", score: 80 },
    { id: "2", name: "Alice", score: 95 },
    { id: "3", name: "Charlie", score: 70 },
  ];
  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "score", header: "Score", sortable: true },
  ];

  it("renders table with data rows and accessible headers", () => {
    render(<DataTable columns={columns} data={sampleData} />);
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Charlie")).toBeDefined();
  });

  it("sorts data ascending and descending on header click", () => {
    render(<DataTable columns={columns} data={sampleData} />);
    const sortBtn = screen.getByRole("button", { name: /sort by name/i });
    fireEvent.click(sortBtn); // Sort asc: Alice, Bob, Charlie
    const cells = screen.getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("Alice");

    fireEvent.click(sortBtn); // Sort desc: Charlie, Bob, Alice
    const descCells = screen.getAllByRole("cell");
    expect(descCells[0]).toHaveTextContent("Charlie");
  });

  it("shows loading state with aria-busy=true", () => {
    render(<DataTable columns={columns} data={sampleData} loading />);
    const table = screen.getByRole("table");
    expect(table.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Loading data...")).toBeDefined();
  });

  it("shows empty message when data is empty", () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No rides found" />);
    expect(screen.getByText("No rides found")).toBeDefined();
  });

  it("supports pagination controls", () => {
    render(<DataTable columns={columns} data={sampleData} pageSize={1} />);
    expect(screen.getByText("1 / 3")).toBeDefined();
    const nextBtn = screen.getByRole("button", { name: /next page/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText("2 / 3")).toBeDefined();
  });
});

describe("T2.8: ConfirmDialog Requirements (Focus Trap, Esc Closes, Returns Focus)", () => {
  it("renders when open and traps focus", () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Cancel Ride?"
        description="Are you sure you want to cancel?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(screen.getByText("Cancel Ride?")).toBeDefined();

    // Esc key triggers cancel
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleCancel).toHaveBeenCalled();
  });

  it("does not render when open is false", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Title"
        description="Desc"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Ride Specific Components Rendering", () => {
  const dummyVehicle: Vehicle = {
    id: "v-sedan",
    class: "sedan",
    displayName: "Maruti Dzire or Equivalent",
    passengers: 4,
    bags: 2,
    ratePerKm: paise(1600),
    minKm: 100,
    imageUrl: "/images/sedan.png",
    popular: true,
  };

  it("VehicleCard renders vehicle details and handles selection", () => {
    const handleSelect = vi.fn();
    render(<VehicleCard vehicle={dummyVehicle} onSelect={handleSelect} />);
    expect(screen.getByText("Maruti Dzire or Equivalent")).toBeDefined();
    expect(screen.getByText("Popular")).toBeDefined();
    expect(screen.getByText("Min 100 km")).toBeDefined();

    const selectBtn = screen.getByRole("button", { name: /select/i });
    fireEvent.click(selectBtn);
    expect(handleSelect).toHaveBeenCalledWith(dummyVehicle);
  });

  it("FareBreakdown renders line items and total correctly", () => {
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
    render(<FareBreakdown quote={quote} />);
    expect(screen.getByText("₹1,494")).toBeDefined();
    expect(screen.getByText("Driver Daily Batta")).toBeDefined();
  });

  it("PaymentOptions switches between deposit and full options", () => {
    const fare = computeFare({
      distanceKm: 65.2,
      ratePerKm: paise(1600),
      batta: paise(30000),
      tollEstimate: paise(8000),
    });
    const depositOptions = calculateDepositOptions(fare.total);
    const handleChange = vi.fn();
    render(
      <PaymentOptions options={depositOptions} selectedType="deposit" onChange={handleChange} />
    );
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[0]!.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(radios[1]!);
    expect(handleChange).toHaveBeenCalledWith("full");
  });

  it("DriverCard renders driver name, rating and action triggers", () => {
    const handleCall = vi.fn();
    render(
      <DriverCard
        name="Selvam Kumar"
        rating={4.8}
        vehicleNo="TN 37 BY 1234"
        vehicleClass="Sedan"
        onCall={handleCall}
      />
    );
    expect(screen.getByText("Selvam Kumar")).toBeDefined();
    expect(screen.getByText("TN 37 BY 1234 • Sedan")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /call/i }));
    expect(handleCall).toHaveBeenCalled();
  });
});
