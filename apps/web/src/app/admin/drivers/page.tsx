"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { INITIAL_ADMIN_DRIVERS, type AdminDriverRecord } from "@/lib/adminData";

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<AdminDriverRecord[]>(INITIAL_ADMIN_DRIVERS);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const limit = 4;

  // Selected driver for verification review (WA4 / T7.4)
  const [selectedDriver, setSelectedDriver] = useState<AdminDriverRecord | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [isRejectOpen, setIsRejectOpen] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filtered and paginated drivers (T7.3: server-side pagination & tabs filter)
  const filteredDrivers = useMemo(() => {
    let result = drivers;
    if (activeTab !== "all") {
      result = result.filter((d) => d.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.vehicleNo.toLowerCase().includes(q) ||
          d.vehicleClass.toLowerCase().includes(q)
      );
    }
    return result;
  }, [drivers, activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / limit));
  const paginatedDrivers = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredDrivers.slice(start, start + limit);
  }, [filteredDrivers, page, limit]);

  // Verification helper: check if all documents are approved (T7.4)
  const areAllDocsApproved = (driver: AdminDriverRecord) => {
    return driver.documents.every((doc) => doc.status === "approved");
  };

  // Approve driver action
  const handleApproveDriver = (driverId: string) => {
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driverId) {
          return {
            ...d,
            status: "approved",
            documents: d.documents.map((doc) => ({ ...doc, status: "approved" })),
          };
        }
        return d;
      })
    );
    setActionNotice(`Driver ${selectedDriver?.name} approved successfully (audited).`);
    setSelectedDriver(null);
  };

  // Reject driver action with required reason
  const handleRejectDriver = () => {
    if (!rejectReason.trim() || !selectedDriver) return;
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === selectedDriver.id) {
          return {
            ...d,
            status: "rejected",
            documents: d.documents.map((doc) =>
              doc.status === "pending"
                ? { ...doc, status: "rejected", rejectionReason: rejectReason }
                : doc
            ),
          };
        }
        return d;
      })
    );
    setActionNotice(
      `Driver ${selectedDriver.name} rejected with reason: "${rejectReason}" (audited).`
    );
    setIsRejectOpen(false);
    setRejectReason("");
    setSelectedDriver(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-muted/20">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-ink tracking-tight">
            Driver Management & Verification
          </h1>
          <p className="text-sm text-muted mt-1">
            Review onboarding submissions, documents, and manage fleet approvals
          </p>
        </div>
      </div>

      {actionNotice && (
        <div
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex justify-between items-center"
          role="status"
        >
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* WA3: Tabs & Debounced Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: "all", label: `All (${drivers.length})` },
            {
              id: "pending",
              label: `Pending (${drivers.filter((d) => d.status === "pending").length})`,
            },
            {
              id: "approved",
              label: `Approved (${drivers.filter((d) => d.status === "approved").length})`,
            },
            {
              id: "rejected",
              label: `Rejected (${drivers.filter((d) => d.status === "rejected").length})`,
            },
          ]}
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setPage(1);
          }}
        />

        <div className="w-full sm:w-72">
          <Input
            id="driver-search"
            name="search"
            placeholder="Search drivers or vehicle..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            aria-label="Search drivers"
          />
        </div>
      </div>

      {/* Driver Table (WA3 Table) */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm text-body border-collapse"
            aria-label="Drivers Table"
          >
            <thead className="bg-surface/50 border-b border-muted/20 text-xs font-semibold text-ink uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Driver Name
                </th>
                <th scope="col" className="px-4 py-3">
                  Vehicle Details
                </th>
                <th scope="col" className="px-4 py-3">
                  Class
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Rating
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {paginatedDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-surface/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-ink">
                    <div>{driver.name}</div>
                    <div className="text-xs text-muted font-mono">{driver.phone}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-ink">{driver.vehicleNo}</td>
                  <td className="px-4 py-3 capitalize">{driver.vehicleClass}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={driver.status} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">★ {driver.rating.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDriver(driver)}
                      data-testid={`review-driver-${driver.id}`}
                    >
                      {driver.status === "pending" ? "Verify Docs" : "View Profile"}
                    </Button>
                  </td>
                </tr>
              ))}
              {paginatedDrivers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No drivers matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-muted/20 bg-surface/10 text-xs">
          <span>
            Showing page <span className="font-semibold text-ink">{page}</span> of{" "}
            <span className="font-semibold text-ink">{totalPages}</span> ({filteredDrivers.length}{" "}
            drivers)
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* WA4: Driver Verification Modal / Detail Review */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl p-6 bg-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-muted/20 pb-3">
              <div>
                <h2 className="text-xl font-bold text-ink">
                  Driver Verification: {selectedDriver.name}
                </h2>
                <p className="text-xs text-muted">
                  Vehicle: {selectedDriver.vehicleNo} ({selectedDriver.vehicleClass})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDriver(null)}
                className="text-muted hover:text-ink font-bold text-lg min-w-[44px] min-h-[44px]"
                aria-label="Close verification modal"
              >
                ✕
              </button>
            </div>

            {/* Documents checklist (T7.4: Driving License, RC, Insurance) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-ink">Mandatory Verification Documents</h3>
              {selectedDriver.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-lg border border-muted/30 bg-surface/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-ink text-sm">{doc.title}</p>
                    <p className="text-xs text-muted font-mono capitalize">
                      Type: {doc.documentType}
                    </p>
                    {doc.rejectionReason && (
                      <p className="text-xs text-danger mt-1">
                        Rejection Reason: {doc.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.status} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Toggle individual doc status for testing/demo
                        setSelectedDriver({
                          ...selectedDriver,
                          documents: selectedDriver.documents.map((d) =>
                            d.id === doc.id
                              ? { ...d, status: d.status === "approved" ? "pending" : "approved" }
                              : d
                          ),
                        });
                      }}
                    >
                      {doc.status === "approved" ? "Mark Pending" : "Mark Verified"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Approve / Reject actions (T7.4) */}
            <div className="pt-4 border-t border-muted/20 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-xs text-muted">
                {areAllDocsApproved(selectedDriver) ? (
                  <span className="text-success font-semibold">
                    ✔ All 3 mandatory documents verified
                  </span>
                ) : (
                  <span className="text-danger font-semibold">
                    ⚠ Cannot approve: All documents must be verified first
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="danger"
                  className="flex-1 sm:flex-none"
                  onClick={() => setIsRejectOpen(true)}
                  data-testid="reject-driver-btn"
                >
                  Reject Driver
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 sm:flex-none"
                  disabled={!areAllDocsApproved(selectedDriver)}
                  onClick={() => handleApproveDriver(selectedDriver.id)}
                  data-testid="approve-driver-btn"
                >
                  Approve Driver
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Reason Confirmation Dialog (T7.4: Reject needs reason) */}
      <ConfirmDialog
        isOpen={isRejectOpen}
        title={`Reject ${selectedDriver?.name}?`}
        description="Please provide a documented reason for rejection. This will be recorded in the audit log."
        confirmLabel="Confirm Rejection"
        cancelLabel="Cancel"
        onConfirm={handleRejectDriver}
        onCancel={() => {
          setIsRejectOpen(false);
          setRejectReason("");
        }}
      >
        <div className="mt-3">
          <label htmlFor="rejection-reason" className="block text-xs font-semibold text-ink mb-1">
            Reason for Rejection *
          </label>
          <textarea
            id="rejection-reason"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Expired commercial badge on Driving License"
            className="w-full p-2.5 border border-muted/40 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            data-testid="reject-reason-input"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
