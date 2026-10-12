"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";

interface DocItem {
  id: string;
  type: "license" | "rc" | "insurance";
  title: string;
  status: "approved" | "pending" | "rejected";
  expiresAt: string;
}

export default function DriverProfileDocumentsPage() {
  const [docs, setDocs] = useState<DocItem[]>([
    {
      id: "doc_1",
      type: "license",
      title: "Commercial Driving License",
      status: "approved",
      expiresAt: "2028-06-30",
    },
    {
      id: "doc_2",
      type: "rc",
      title: "Vehicle Registration Certificate (RC)",
      status: "approved",
      expiresAt: "2029-11-15",
    },
    {
      id: "doc_3",
      type: "insurance",
      title: "Comprehensive Commercial Insurance",
      status: "approved",
      expiresAt: "2027-04-10",
    },
  ]);

  // Masked bank details (T6.12 & SC-F3: last 4 digits only)
  const maskedBankAccount = "•••• •••• •••• 4321";
  const ifscCode = "HDFC0001234";

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleFileUpload = (docType: "license" | "rc" | "insurance", file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    // T6.11: File type validation (reject .exe / .html / etc.)
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".exe") || lowerName.endsWith(".html") || lowerName.endsWith(".js")) {
      setUploadError("Dangerous file extension rejected. Only PDF, JPG, and PNG allowed.");
      return;
    }

    // T6.11: File size validation (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds 10MB maximum size limit.");
      return;
    }

    // Update document status
    setDocs((prev) => prev.map((d) => (d.type === docType ? { ...d, status: "pending" } : d)));
    setUploadSuccess(`${file.name} uploaded for verification.`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-muted/30 shadow-sm flex items-center justify-between">
        <div>
          <Link href="/driver" className="text-xs font-bold text-accent hover:underline">
            ← Driver Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-ink mt-1">Driver Profile & Documents</h1>
          <p className="text-xs text-muted">Manage your verified documents and payout account</p>
        </div>
        <StatusBadge status="approved" />
      </div>

      {/* Driver Personal & Vehicle Details */}
      <Card className="p-6 bg-white space-y-4">
        <h2 className="text-sm font-bold text-ink uppercase">Driver & Vehicle Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-muted">Full Name</span>
            <p className="font-bold text-ink" data-testid="driver-profile-name">
              Selvam Kumar
            </p>
          </div>
          <div>
            <span className="text-xs text-muted">Phone Number</span>
            <p className="font-bold text-ink">+91 98765 43210</p>
          </div>
          <div>
            <span className="text-xs text-muted">Vehicle Registration</span>
            <p className="font-bold text-ink">TN 37 BY 1234</p>
          </div>
          <div>
            <span className="text-xs text-muted">Vehicle Class</span>
            <p className="font-bold text-ink">Sedan (Maruti Dzire)</p>
          </div>
        </div>
      </Card>

      {/* Masked Bank Details (T6.12) */}
      <Card className="p-6 bg-white space-y-4">
        <h2 className="text-sm font-bold text-ink uppercase">Payout Bank Account</h2>
        <p className="text-xs text-muted">
          Earnings are deposited into this account. For security, account numbers are masked.
        </p>

        <div className="p-4 bg-background rounded-xl border border-muted/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted">Bank Account Number</span>
            <p
              className="text-base font-mono font-bold text-ink tracking-widest"
              data-testid="masked-bank-account"
            >
              {maskedBankAccount}
            </p>
            <span className="text-xs text-muted">IFSC: {ifscCode}</span>
          </div>
          <span className="text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-md">
            Verified Active
          </span>
        </div>
      </Card>

      {/* Document Upload & Status Badges (WD9 / T6.11) */}
      <Card className="p-6 bg-white space-y-4">
        <h2 className="text-sm font-bold text-ink uppercase">Verification Documents</h2>
        <p className="text-xs text-muted">
          All 3 documents must be valid and approved to remain eligible to go online.
        </p>

        {uploadError && (
          <div
            role="alert"
            data-testid="doc-upload-error"
            className="p-3 bg-danger/10 border border-danger/30 text-danger text-xs font-semibold rounded-xl"
          >
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div
            role="status"
            className="p-3 bg-success/10 border border-success/30 text-success text-xs font-semibold rounded-xl"
          >
            {uploadSuccess}
          </div>
        )}

        <div className="space-y-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-ink">{doc.title}</h3>
                  <StatusBadge status={doc.status} />
                </div>
                <p className="text-xs text-muted mt-1">Valid until: {doc.expiresAt}</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center justify-center font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 border border-accent text-accent hover:bg-accent/10 text-xs h-8 px-3 rounded-lg">
                    Re-upload
                  </span>
                  <Input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(doc.type, file);
                    }}
                    data-testid={`upload-${doc.type}-input`}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Logout Action */}
      <div className="text-center pt-2">
        <Button
          variant="outline"
          className="text-danger border-danger/30 hover:bg-danger/10"
          onClick={() => {
            window.location.href = "/driver/login";
          }}
          data-testid="driver-logout-btn"
        >
          Sign Out of Driver Portal
        </Button>
      </div>
    </div>
  );
}
