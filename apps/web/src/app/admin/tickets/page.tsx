"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { INITIAL_ADMIN_TICKETS, type AdminSupportTicket } from "@/lib/adminData";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>(INITIAL_ADMIN_TICKETS);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>("");
  const [isResolveOpen, setIsResolveOpen] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // WA8 & T7.9: Ordered by priority (high > medium > low) then age
  const sortedAndFilteredTickets = useMemo(() => {
    let list = tickets;
    if (activeTab !== "all") {
      list = list.filter((t) => t.status === activeTab);
    }

    const priorityWeights: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return list.slice().sort((a, b) => {
      const pDiff = (priorityWeights[b.priority] ?? 0) - (priorityWeights[a.priority] ?? 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tickets, activeTab]);

  const handleResolveConfirmed = () => {
    if (!selectedTicket) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              status: "resolved",
              resolutionNote: resolutionNote || "Resolved by operations admin.",
            }
          : t
      )
    );
    setActionNotice(`Ticket #${selectedTicket.code} marked as resolved (audited).`);
    setIsResolveOpen(false);
    setResolutionNote("");
    setSelectedTicket(null);
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-muted/20">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-ink tracking-tight">
            Support Tickets Operations
          </h1>
          <p className="text-sm text-muted mt-1">
            Prioritized operational disputes, customer assistance, and driver inquiries
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

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "all", label: `All (${tickets.length})` },
          { id: "open", label: `Open (${tickets.filter((t) => t.status === "open").length})` },
          {
            id: "resolved",
            label: `Resolved (${tickets.filter((t) => t.status === "resolved").length})`,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Ticket List Cards (WA8 / T7.9) */}
      <div className="space-y-3" data-testid="tickets-list">
        {sortedAndFilteredTickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="p-4 hover:border-accent transition-all cursor-pointer bg-white"
            onClick={() => setSelectedTicket(ticket)}
            data-testid={`ticket-card-${ticket.code}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-3">
                <span
                  className={`text-xs uppercase font-extrabold px-2.5 py-1 rounded-md border ${getPriorityBadgeClass(ticket.priority)}`}
                >
                  {ticket.priority}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink text-sm">#{ticket.code}</span>
                    <h2 className="text-sm font-semibold text-ink">{ticket.title}</h2>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Reporter:{" "}
                    <span className="capitalize font-medium text-ink">{ticket.reporter}</span> (
                    {ticket.reporterName}) • Created {ticket.createdAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={ticket.status === "resolved" ? "completed" : "searching"} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTicket(ticket);
                  }}
                  data-testid={`view-ticket-${ticket.code}`}
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {sortedAndFilteredTickets.length === 0 && (
          <Card className="p-8 text-center text-muted">No support tickets in this category.</Card>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-muted/20 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-muted">
                  #{selectedTicket.code}
                </span>
                <h2 className="text-lg font-bold text-ink">{selectedTicket.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-muted hover:text-ink font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Reporter:</span>
                <span className="font-semibold text-ink capitalize">
                  {selectedTicket.reporter} ({selectedTicket.reporterName})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Priority:</span>
                <span className="font-bold text-ink uppercase">{selectedTicket.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status:</span>
                <span className="font-semibold text-ink capitalize">{selectedTicket.status}</span>
              </div>
            </div>

            <div className="p-3 bg-surface/30 rounded-lg text-xs text-ink">
              <span className="font-semibold block mb-1">Issue Description:</span>
              <p>{selectedTicket.description}</p>
            </div>

            {selectedTicket.resolutionNote && (
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg text-xs">
                <span className="font-semibold block mb-1">Resolution Note:</span>
                <p>{selectedTicket.resolutionNote}</p>
              </div>
            )}

            <div className="pt-3 border-t border-muted/20 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedTicket(null)}>
                Close
              </Button>
              {selectedTicket.status === "open" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsResolveOpen(true)}
                  data-testid="resolve-ticket-btn"
                >
                  Resolve Ticket
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog on Resolve */}
      <ConfirmDialog
        isOpen={isResolveOpen}
        title={`Resolve Ticket #${selectedTicket?.code}?`}
        description="Provide a resolution note to complete this support dispute."
        confirmLabel="Confirm Resolution"
        cancelLabel="Cancel"
        onConfirm={handleResolveConfirmed}
        onCancel={() => setIsResolveOpen(false)}
      >
        <div className="mt-3">
          <label className="block text-xs font-semibold text-ink mb-1">Resolution Summary</label>
          <textarea
            rows={2}
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder="e.g., Fare adjustment credited to customer wallet."
            className="w-full p-2 border border-muted/40 rounded-lg text-sm"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
