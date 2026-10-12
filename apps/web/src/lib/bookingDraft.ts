import type { Place, TripMode, VehicleClass } from "@redtaxi/shared";

export interface BookingDraft {
  pickup: Place | null;
  drop: Place | null;
  mode: TripMode;
  vehicleClass: VehicleClass;
  vehicleId: string | null;
  scheduledAt: string | null;
  paymentOption: "deposit" | "full";
  setPickup: (place: Place | null) => void;
  setDrop: (place: Place | null) => void;
  setMode: (mode: TripMode) => void;
  setVehicleClass: (cls: VehicleClass) => void;
  setVehicleId: (id: string | null) => void;
  setScheduledAt: (iso: string | null) => void;
  setPaymentOption: (opt: "deposit" | "full") => void;
  resetDraft: () => void;
}

const initialState = {
  pickup: { label: "Pollachi Town", lat: 10.658, lng: 77.008 } as Place,
  drop: { label: "Coimbatore Airport", lat: 11.029, lng: 77.043 } as Place,
  mode: "one_way" as TripMode,
  vehicleClass: "sedan" as VehicleClass,
  vehicleId: "veh_sedan_1",
  scheduledAt: null,
  paymentOption: "deposit" as const,
};

type Listener<T> = (val: T) => void;

class VanillaStore<T extends object> {
  private state: T;
  private listeners = new Set<Listener<T>>();

  constructor(initial: T) {
    this.state = initial;
  }

  getState = () => this.state;

  setState = (partial: Partial<T> | ((prev: T) => Partial<T>)) => {
    const next = typeof partial === "function" ? partial(this.state) : partial;
    this.state = { ...this.state, ...next };
    this.listeners.forEach((l) => l(this.state));
  };

  subscribe = (listener: Listener<T>) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

export const bookingDraftStore = new VanillaStore<BookingDraft>({
  ...initialState,
  setPickup: (pickup) => bookingDraftStore.setState({ pickup }),
  setDrop: (drop) => bookingDraftStore.setState({ drop }),
  setMode: (mode) => bookingDraftStore.setState({ mode }),
  setVehicleClass: (vehicleClass) => bookingDraftStore.setState({ vehicleClass }),
  setVehicleId: (vehicleId) => bookingDraftStore.setState({ vehicleId }),
  setScheduledAt: (scheduledAt) => bookingDraftStore.setState({ scheduledAt }),
  setPaymentOption: (paymentOption) => bookingDraftStore.setState({ paymentOption }),
  resetDraft: () => bookingDraftStore.setState(initialState),
});
