import {
  paise,
  type Paise,
  type VehicleClass,
  type ApprovalStatus,
  type BookingStatus,
} from "@redtaxi/shared";

export interface AdminStats {
  totalBookingsToday: number;
  activeRides: number;
  driversOnline: number;
  pendingDrivers: number;
  completedToday: number;
  percentChangeVsYesterday: number;
}

export interface AdminDriverRecord {
  id: string;
  name: string;
  phone: string;
  vehicleNo: string;
  vehicleClass: VehicleClass;
  status: ApprovalStatus;
  rating: number;
  online: boolean;
  distanceKm?: number;
  documents: {
    id: string;
    documentType: "license" | "rc" | "insurance";
    title: string;
    status: "pending" | "approved" | "rejected";
    rejectionReason?: string;
    fileUrl: string;
  }[];
}

export interface AdminBookingRecord {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  pickup: string;
  drop: string;
  dateStr: string;
  timeStr: string;
  status: BookingStatus;
  driverName?: string;
  driverVehicleNo?: string;
  farePaise: Paise;
  paidPaise: Paise;
  duePaise: Paise;
  timeline: { status: BookingStatus; at: string }[];
}

export interface AdminPricingRecord {
  vehicleClass: VehicleClass;
  displayName: string;
  baseRatePerKmRupees: number; // For admin edit display in ₹
  dailyBattaRupees: number;
  nightAllowanceRupees: number;
  minOutstationKm: number;
  advanceDepositPercent: number;
  minDepositRupees: number;
}

export interface AdminSupportTicket {
  id: string;
  code: string;
  title: string;
  reporter: "customer" | "driver";
  reporterName: string;
  priority: "high" | "medium" | "low";
  status: "open" | "resolved";
  createdAt: string;
  description: string;
  resolutionNote?: string;
}

export interface AdminAuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  timestamp: string;
  ip: string;
}

export interface AdminAnalyticsReport {
  period: string; // "Last 7 Days"
  totalRevenuePaise: Paise;
  revenueChangePercent: number; // +12%
  totalBookings: number; // 342
  completedBookings: number; // 310
  cancelledBookings: number; // 22
  completionRatePercent: number; // 90.6%
  dailyBreakdown: { date: string; bookings: number; completed: number; revenuePaise: Paise }[];
}

// DEC-6 Canonical Admin Dashboard figures
export const INITIAL_ADMIN_STATS: AdminStats = {
  totalBookingsToday: 342,
  activeRides: 14,
  driversOnline: 58,
  pendingDrivers: 3,
  completedToday: 310,
  percentChangeVsYesterday: 12,
};

export const INITIAL_ADMIN_DRIVERS: AdminDriverRecord[] = [
  {
    id: "drv_1",
    name: "Selvam Kumar",
    phone: "9876543210",
    vehicleNo: "TN 37 BY 1234",
    vehicleClass: "sedan",
    status: "approved",
    rating: 4.8,
    online: true,
    distanceKm: 1.2,
    documents: [
      {
        id: "doc_1",
        documentType: "license",
        title: "Commercial Driver License",
        status: "approved",
        fileUrl: "/docs/license.pdf",
      },
      {
        id: "doc_2",
        documentType: "rc",
        title: "Vehicle Registration Certificate (RC)",
        status: "approved",
        fileUrl: "/docs/rc.pdf",
      },
      {
        id: "doc_3",
        documentType: "insurance",
        title: "Comprehensive Taxi Insurance",
        status: "approved",
        fileUrl: "/docs/insurance.pdf",
      },
    ],
  },
  {
    id: "drv_2",
    name: "Arun Kumar",
    phone: "9876543211",
    vehicleNo: "TN 37 AB 1234",
    vehicleClass: "suv",
    status: "pending",
    rating: 4.6,
    online: false,
    distanceKm: 3.5,
    documents: [
      {
        id: "doc_4",
        documentType: "license",
        title: "Commercial Driver License",
        status: "approved",
        fileUrl: "/docs/license.pdf",
      },
      {
        id: "doc_5",
        documentType: "rc",
        title: "Vehicle Registration Certificate (RC)",
        status: "pending",
        fileUrl: "/docs/rc.pdf",
      },
      {
        id: "doc_6",
        documentType: "insurance",
        title: "Comprehensive Taxi Insurance",
        status: "pending",
        fileUrl: "/docs/insurance.pdf",
      },
    ],
  },
  {
    id: "drv_3",
    name: "Mohan Raj",
    phone: "9876543212",
    vehicleNo: "TN 37 CD 5678",
    vehicleClass: "innova",
    status: "pending",
    rating: 4.5,
    online: false,
    distanceKm: 4.1,
    documents: [
      {
        id: "doc_7",
        documentType: "license",
        title: "Commercial Driver License",
        status: "pending",
        fileUrl: "/docs/license.pdf",
      },
      {
        id: "doc_8",
        documentType: "rc",
        title: "Vehicle Registration Certificate (RC)",
        status: "pending",
        fileUrl: "/docs/rc.pdf",
      },
      {
        id: "doc_9",
        documentType: "insurance",
        title: "Comprehensive Taxi Insurance",
        status: "pending",
        fileUrl: "/docs/insurance.pdf",
      },
    ],
  },
  {
    id: "drv_4",
    name: "Karthik",
    phone: "9876543213",
    vehicleNo: "TN 37 EF 9012",
    vehicleClass: "hatchback",
    status: "approved",
    rating: 4.7,
    online: true,
    distanceKm: 6.3,
    documents: [
      {
        id: "doc_10",
        documentType: "license",
        title: "Commercial Driver License",
        status: "approved",
        fileUrl: "/docs/license.pdf",
      },
      {
        id: "doc_11",
        documentType: "rc",
        title: "Vehicle Registration Certificate (RC)",
        status: "approved",
        fileUrl: "/docs/rc.pdf",
      },
      {
        id: "doc_12",
        documentType: "insurance",
        title: "Comprehensive Taxi Insurance",
        status: "approved",
        fileUrl: "/docs/insurance.pdf",
      },
    ],
  },
  {
    id: "drv_5",
    name: "Dinesh",
    phone: "9876543214",
    vehicleNo: "TN 37 GH 3456",
    vehicleClass: "sedan",
    status: "rejected",
    rating: 4.1,
    online: false,
    distanceKm: 8.2,
    documents: [
      {
        id: "doc_13",
        documentType: "license",
        title: "Commercial Driver License",
        status: "rejected",
        rejectionReason: "Expired commercial badge",
        fileUrl: "/docs/license.pdf",
      },
      {
        id: "doc_14",
        documentType: "rc",
        title: "Vehicle Registration Certificate (RC)",
        status: "approved",
        fileUrl: "/docs/rc.pdf",
      },
      {
        id: "doc_15",
        documentType: "insurance",
        title: "Comprehensive Taxi Insurance",
        status: "approved",
        fileUrl: "/docs/insurance.pdf",
      },
    ],
  },
];

export const INITIAL_ADMIN_BOOKINGS: AdminBookingRecord[] = [
  {
    id: "bk_10234",
    code: "BK10234",
    customerName: "Ravi Kumar",
    customerPhone: "9876543210",
    pickup: "Pollachi Bus Stand",
    drop: "Palani Temple, Palani",
    dateStr: "10 Oct 2026",
    timeStr: "06:30 AM",
    status: "in_progress",
    driverName: "Selvam Kumar",
    driverVehicleNo: "TN 37 BY 1234",
    farePaise: paise(149400),
    paidPaise: paise(50000),
    duePaise: paise(99400),
    timeline: [
      { status: "created", at: "2026-10-10T05:30:00Z" },
      { status: "driver_assigned", at: "2026-10-10T05:35:00Z" },
      { status: "driver_arriving", at: "2026-10-10T06:00:00Z" },
      { status: "driver_arrived", at: "2026-10-10T06:20:00Z" },
      { status: "in_progress", at: "2026-10-10T06:30:00Z" },
    ],
  },
  {
    id: "bk_10233",
    code: "BK10233",
    customerName: "Arun S",
    customerPhone: "9876543220",
    pickup: "Pollachi Town",
    drop: "Coimbatore Airport",
    dateStr: "10 Oct 2026",
    timeStr: "09:00 AM",
    status: "scheduled",
    farePaise: paise(120000),
    paidPaise: paise(30000),
    duePaise: paise(90000),
    timeline: [
      { status: "created", at: "2026-10-10T06:00:00Z" },
      { status: "scheduled", at: "2026-10-10T06:05:00Z" },
    ],
  },
  {
    id: "bk_10232",
    code: "BK10232",
    customerName: "Priya M",
    customerPhone: "9876543230",
    pickup: "Pollachi Railway Station",
    drop: "Chennai Central",
    dateStr: "09 Oct 2026",
    timeStr: "07:30 AM",
    status: "completed",
    driverName: "Karthik",
    driverVehicleNo: "TN 37 EF 9012",
    farePaise: paise(650000),
    paidPaise: paise(650000),
    duePaise: paise(0),
    timeline: [
      { status: "created", at: "2026-10-09T07:00:00Z" },
      { status: "driver_assigned", at: "2026-10-09T07:10:00Z" },
      { status: "in_progress", at: "2026-10-09T07:30:00Z" },
      { status: "completed", at: "2026-10-09T18:00:00Z" },
    ],
  },
  {
    id: "bk_10231",
    code: "BK10231",
    customerName: "Karthik R",
    customerPhone: "9876543240",
    pickup: "Pollachi Town",
    drop: "Madurai Meenakshi Temple",
    dateStr: "09 Oct 2026",
    timeStr: "05:00 PM",
    status: "cancelled",
    farePaise: paise(240000),
    paidPaise: paise(0),
    duePaise: paise(0),
    timeline: [
      { status: "created", at: "2026-10-09T16:00:00Z" },
      { status: "cancelled", at: "2026-10-09T16:30:00Z" },
    ],
  },
];

export const INITIAL_ADMIN_PRICING: Record<VehicleClass, AdminPricingRecord> = {
  hatchback: {
    vehicleClass: "hatchback",
    displayName: "Hatchback",
    baseRatePerKmRupees: 14.0,
    dailyBattaRupees: 300.0,
    nightAllowanceRupees: 200.0,
    minOutstationKm: 100,
    advanceDepositPercent: 25,
    minDepositRupees: 500.0,
  },
  sedan: {
    vehicleClass: "sedan",
    displayName: "Sedan",
    baseRatePerKmRupees: 16.0,
    dailyBattaRupees: 350.0,
    nightAllowanceRupees: 200.0,
    minOutstationKm: 100,
    advanceDepositPercent: 25,
    minDepositRupees: 500.0,
  },
  suv: {
    vehicleClass: "suv",
    displayName: "SUV",
    baseRatePerKmRupees: 22.0,
    dailyBattaRupees: 350.0,
    nightAllowanceRupees: 250.0,
    minOutstationKm: 100,
    advanceDepositPercent: 25,
    minDepositRupees: 500.0,
  },
  innova: {
    vehicleClass: "innova",
    displayName: "Innova",
    baseRatePerKmRupees: 26.0,
    dailyBattaRupees: 400.0,
    nightAllowanceRupees: 300.0,
    minOutstationKm: 100,
    advanceDepositPercent: 25,
    minDepositRupees: 500.0,
  },
  tempo: {
    vehicleClass: "tempo",
    displayName: "Tempo Traveller",
    baseRatePerKmRupees: 32.0,
    dailyBattaRupees: 500.0,
    nightAllowanceRupees: 350.0,
    minOutstationKm: 150,
    advanceDepositPercent: 25,
    minDepositRupees: 750.0,
  },
};

// WA8 Tickets: high > medium > low, then age
export const INITIAL_ADMIN_TICKETS: AdminSupportTicket[] = [
  {
    id: "stk_1001",
    code: "STK1001",
    title: "Fare dispute - Overcharged",
    reporter: "customer",
    reporterName: "Sundar Raman",
    priority: "high",
    status: "open",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    description: "Customer states the toll amount was added twice at drop settlement.",
  },
  {
    id: "stk_1002",
    code: "STK1002",
    title: "Driver not arriving",
    reporter: "customer",
    reporterName: "Radha Krishnan",
    priority: "medium",
    status: "open",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // 5 hours ago
    description: "Vehicle has been stationary for 15 minutes past scheduled pickup.",
  },
  {
    id: "stk_1003",
    code: "STK1003",
    title: "Lost item in vehicle",
    reporter: "customer",
    reporterName: "Meenakshi V",
    priority: "medium",
    status: "open",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
    description: "Left sunglasses on rear passenger seat.",
  },
  {
    id: "stk_1004",
    code: "STK1004",
    title: "App GPS location drift",
    reporter: "driver",
    reporterName: "Selvam Kumar",
    priority: "low",
    status: "resolved",
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    description: "Location drifted by 50m near Pollachi Flyover.",
    resolutionNote: "Driver advised to calibrate device location services.",
  },
];

// WA9 Analytics with 90.6% completion rate for 310/342
export const INITIAL_ADMIN_ANALYTICS: AdminAnalyticsReport = {
  period: "Last 7 Days",
  totalRevenuePaise: paise(24850000), // ₹2,48,500
  revenueChangePercent: 12, // +12%
  totalBookings: 342,
  completedBookings: 310,
  cancelledBookings: 22,
  completionRatePercent: 90.6, // 310 / 342 = 90.643% -> 90.6%
  dailyBreakdown: [
    { date: "Day 1", bookings: 45, completed: 41, revenuePaise: paise(3250000) },
    { date: "Day 2", bookings: 48, completed: 44, revenuePaise: paise(3480000) },
    { date: "Day 3", bookings: 52, completed: 48, revenuePaise: paise(3800000) },
    { date: "Day 4", bookings: 50, completed: 45, revenuePaise: paise(3650000) },
    { date: "Day 5", bookings: 49, completed: 44, revenuePaise: paise(3500000) },
    { date: "Day 6", bookings: 53, completed: 47, revenuePaise: paise(3920000) },
    { date: "Day 7", bookings: 45, completed: 41, revenuePaise: paise(3250000) },
  ],
};
