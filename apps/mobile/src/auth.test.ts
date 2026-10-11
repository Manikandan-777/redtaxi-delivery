import { validatePhoneNumber, validateOtp, MobileAuthService } from "./auth";

describe("T3.1 & Phase 3: Mobile Authentication & State Management", () => {
  describe("validatePhoneNumber", () => {
    it("accepts valid 10-digit Indian phone numbers starting with 6-9", () => {
      const validNumbers = ["9876543210", "8123456789", "7012345678", "6398765432"];
      for (const phone of validNumbers) {
        const res = validatePhoneNumber(phone);
        expect(res.valid).toBe(true);
        expect(res.normalized).toBe(phone);
      }
    });

    it("handles country-code prefixes +91 or 91", () => {
      const res = validatePhoneNumber("+91 9876543210");
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe("9876543210");
    });

    it("rejects phone numbers with invalid starting digits or lengths", () => {
      expect(validatePhoneNumber("5123456789").valid).toBe(false);
      expect(validatePhoneNumber("12345").valid).toBe(false);
      expect(validatePhoneNumber("987654321000").valid).toBe(false);
      expect(validatePhoneNumber("abcdefghij").valid).toBe(false);
    });
  });

  describe("DEC-13: validateOtp (6-digit numeric login OTP)", () => {
    it("accepts exactly 6 numeric digits", () => {
      expect(validateOtp("123456")).toBe(true);
      expect(validateOtp("000000")).toBe(true);
      expect(validateOtp("999999")).toBe(true);
    });

    it("rejects non-6-digit or non-numeric values", () => {
      expect(validateOtp("12345")).toBe(false);
      expect(validateOtp("1234567")).toBe(false);
      expect(validateOtp("12345a")).toBe(false);
      expect(validateOtp("")).toBe(false);
      expect(validateOtp("   ")).toBe(false);
    });
  });

  describe("MobileAuthService session management", () => {
    let authService: MobileAuthService;

    beforeEach(() => {
      authService = new MobileAuthService();
    });

    it("initializes in unauthenticated state", () => {
      const state = authService.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.role).toBeNull();
      expect(state.phone).toBeNull();
    });

    it("fails login when phone or OTP is invalid", async () => {
      const resBadPhone = await authService.loginWithOtp("123", "123456");
      expect(resBadPhone.success).toBe(false);
      expect(authService.getState().isAuthenticated).toBe(false);

      const resBadOtp = await authService.loginWithOtp("9876543210", "123");
      expect(resBadOtp.success).toBe(false);
      expect(authService.getState().isAuthenticated).toBe(false);
    });

    it("successfully logs in passenger and notifies subscribers", async () => {
      const listener = jest.fn();
      const unsubscribe = authService.subscribe(listener);

      const res = await authService.loginWithOtp("9876543210", "654321", "passenger");
      expect(res.success).toBe(true);

      const state = authService.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.role).toBe("passenger");
      expect(state.phone).toBe("9876543210");
      expect(state.token).toBeDefined();
      expect(listener).toHaveBeenCalledWith(state);

      unsubscribe();
    });

    it("supports driver login role", async () => {
      const res = await authService.loginWithOtp("9876543210", "654321", "driver");
      expect(res.success).toBe(true);

      const state = authService.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.role).toBe("driver");
    });

    it("clears state and notifies subscribers on logout", async () => {
      await authService.loginWithOtp("9876543210", "654321", "passenger");
      expect(authService.getState().isAuthenticated).toBe(true);

      const listener = jest.fn();
      authService.subscribe(listener);

      authService.logout();
      const state = authService.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.role).toBeNull();
      expect(state.phone).toBeNull();
      expect(listener).toHaveBeenCalledWith(state);
    });
  });
});
