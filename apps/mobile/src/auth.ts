export type Role = "passenger" | "driver" | "admin";

export interface MobileAuthState {
  token: string | null;
  role: Role | null;
  phone: string | null;
  isAuthenticated: boolean;
}

/**
 * Validates Indian 10-digit phone number per schema standard
 */
export function validatePhoneNumber(phone: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  const cleaned = phone.replace(/\D/g, "");
  // If formatted as 91XXXXXXXXXX (12 digits)
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    const local = cleaned.slice(2);
    if (/^[6-9]\d{9}$/.test(local)) {
      return { valid: true, normalized: local };
    }
  }
  // Standard 10 digits starting with 6-9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }
  return { valid: false, error: "Please enter a valid 10-digit Indian mobile number" };
}

/**
 * Validates 6-digit numeric login OTP (DEC-13)
 */
export function validateOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp.trim());
}

/**
 * In-memory client auth manager for mobile app session lifecycle
 */
export class MobileAuthService {
  private state: MobileAuthState = {
    token: null,
    role: null,
    phone: null,
    isAuthenticated: false,
  };

  private listeners: Array<(state: MobileAuthState) => void> = [];

  getState(): MobileAuthState {
    return { ...this.state };
  }

  subscribe(listener: (state: MobileAuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  async loginWithOtp(
    phone: string,
    otp: string,
    role: Role = "passenger"
  ): Promise<{ success: boolean; error?: string }> {
    const phoneVal = validatePhoneNumber(phone);
    if (!phoneVal.valid || !phoneVal.normalized) {
      return { success: false, error: phoneVal.error || "Invalid phone number" };
    }

    if (!validateOtp(otp)) {
      return { success: false, error: "OTP must be exactly 6 numeric digits" };
    }

    // In mobile, token is returned from backend verify endpoint
    const token = `mbl_${role}_${phoneVal.normalized}_${Date.now()}`;

    this.state = {
      token,
      role,
      phone: phoneVal.normalized,
      isAuthenticated: true,
    };
    this.notify();

    return { success: true };
  }

  logout(): void {
    this.state = {
      token: null,
      role: null,
      phone: null,
      isAuthenticated: false,
    };
    this.notify();
  }
}

export const mobileAuth = new MobileAuthService();
