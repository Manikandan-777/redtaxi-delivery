import { NotificationTemplates } from "@redtaxi/shared";

describe("Phase 8: Mobile Push Notifications & Deep Linking (T8.5 / Task 8.4)", () => {
  it("formats mobile notification payloads with high priority for driver offers and arrivals", () => {
    const offer = NotificationTemplates.offer({
      bookingId: "bk_mob_100",
      pickup: "Coimbatore Junction",
      earnings: "₹1,850",
    });

    expect(offer.priority).toBe("high");
    expect(offer.sound).toBe("default");
    expect(offer.data.type).toBe("offer");
    expect(offer.data.bookingId).toBe("bk_mob_100");

    const arrival = NotificationTemplates.arrival({
      bookingId: "bk_mob_100",
      driverName: "Senthil Nathan",
      otp: "9876",
    });

    expect(arrival.priority).toBe("high");
    expect(arrival.body).toContain("9876");
    expect(arrival.data.type).toBe("arrival");
  });

  it("formats passenger booking assignment and trip completion correctly", () => {
    const assignment = NotificationTemplates.assignment({
      bookingId: "bk_mob_100",
      driverName: "Senthil Nathan",
      vehicleNo: "TN 38 CD 4321",
    });

    expect(assignment.body).toContain("Senthil Nathan");
    expect(assignment.body).toContain("TN 38 CD 4321");

    const completion = NotificationTemplates.completion({
      bookingId: "bk_mob_100",
      amountCollected: "₹1,850",
    });

    expect(completion.body).toContain("Your ride has been completed");
    expect(completion.data.amount).toBe("₹1,850");
  });
});
