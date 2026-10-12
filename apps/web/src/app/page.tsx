import React from "react";
import Link from "next/link";
import { inr, paise, type Vehicle } from "@redtaxi/shared";
import { TopNav } from "@/components/layout/TopNav";

// Static fleet preview for ISR / server render
const FEATURED_FLEET: Vehicle[] = [
  {
    id: "veh_hatch_1",
    displayName: "Tata Tiago / WagonR",
    class: "hatchback",
    passengers: 4,
    bags: 2,
    ratePerKm: paise(1400),
    minKm: 100,
    imageUrl: "",
    popular: false,
  },
  {
    id: "veh_sedan_1",
    displayName: "Swift Dzire / Etios",
    class: "sedan",
    passengers: 4,
    bags: 3,
    ratePerKm: paise(1600),
    minKm: 130,
    imageUrl: "",
    popular: true,
  },
  {
    id: "veh_suv_1",
    displayName: "Maruti Ertiga",
    class: "suv",
    passengers: 6,
    bags: 4,
    ratePerKm: paise(2000),
    minKm: 150,
    imageUrl: "",
    popular: false,
  },
  {
    id: "veh_innova_1",
    displayName: "Toyota Innova Crysta",
    class: "innova",
    passengers: 7,
    bags: 5,
    ratePerKm: paise(2400),
    minKm: 150,
    imageUrl: "",
    popular: false,
  },
];

export const metadata = {
  title: "RedTaxi Pollachi — Trusted Outstation & Local Taxi Service",
  description:
    "Book reliable taxis in Pollachi & Coimbatore. Transparent rates, verified drivers, round trips and airport drops starting from ₹14/km.",
  openGraph: {
    title: "RedTaxi Pollachi — Trusted Outstation & Local Taxi Service",
    description: "Book reliable taxis in Pollachi & Coimbatore with verified drivers.",
    url: "https://redtaxi.internal",
    siteName: "RedTaxi",
    type: "website",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    name: "RedTaxi Pollachi",
    provider: {
      "@type": "LocalBusiness",
      name: "RedTaxi",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Pollachi",
        addressRegion: "Tamil Nadu",
        addressCountry: "IN",
      },
    },
    areaServed: ["Pollachi", "Coimbatore", "Valparai", "Udumalpet"],
    priceRange: "₹14 - ₹24 per km",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* JSON-LD Script for SEO (SC-H2: zero dangerouslySetInnerHTML) */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <TopNav />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-surface/40 to-background py-16 px-4 sm:px-6 lg:px-8 border-b border-muted/20">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight">
              Reliable Taxis in <span className="text-accent">Pollachi & Coimbatore</span>
            </h1>
            <p className="mt-4 text-lg text-body max-w-2xl mx-auto">
              Transparent per-km pricing, verified polite drivers, on-time pickups, and 24/7
              support.
            </p>

            {/* Quick Booking Action Widget */}
            <div className="mt-8 p-6 bg-white rounded-2xl shadow-md border border-muted/20 max-w-xl mx-auto">
              <div className="flex flex-col gap-3 text-left">
                <label className="text-xs font-semibold text-muted uppercase">
                  Pickup Location
                </label>
                <input
                  type="text"
                  readOnly
                  value="Pollachi Central Bus Stand"
                  className="w-full px-4 py-2.5 rounded-lg border border-muted/30 text-ink bg-surface/10 font-medium"
                />
                <label className="text-xs font-semibold text-muted uppercase mt-2">
                  Drop Location
                </label>
                <input
                  type="text"
                  readOnly
                  value="Coimbatore International Airport (CJB)"
                  className="w-full px-4 py-2.5 rounded-lg border border-muted/30 text-ink bg-surface/10 font-medium"
                />
                <Link
                  href="/book/vehicle"
                  className="mt-4 w-full py-3.5 px-4 bg-accent hover:bg-accentLight text-white font-bold rounded-xl text-center shadow transition-colors block"
                >
                  Explore Fleet & Book Ride
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Fleet Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-ink">Our Available Fleet</h2>
            <p className="text-sm text-body mt-1">
              Select from sanitised, well-maintained vehicles for outstation & city trips
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_FLEET.map((v) => (
              <div
                key={v.id}
                className="p-5 bg-white rounded-xl border border-muted/20 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-accent uppercase">
                    <span>{v.class}</span>
                    <span className="text-ink">{inr(v.ratePerKm)} / km</span>
                  </div>
                  <h3 className="text-base font-bold text-ink mt-2">{v.displayName}</h3>
                  <p className="text-xs text-muted mt-1">
                    {v.passengers} Seats • {v.bags} Bags • AC
                  </p>
                </div>
                <Link
                  href="/book/vehicle"
                  className="mt-6 w-full py-2 bg-surface hover:bg-accent/20 text-ink text-center text-sm font-semibold rounded-lg border border-muted/30 transition-colors"
                >
                  Select & Quote
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
