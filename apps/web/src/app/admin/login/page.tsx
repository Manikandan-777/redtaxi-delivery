import React from "react";

export default function AdminLoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
      <p className="text-muted mb-6">Enter admin credentials and TOTP authenticator code.</p>
    </div>
  );
}
