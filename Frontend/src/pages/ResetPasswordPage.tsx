import { useState } from "react";
import { Lock } from "lucide-react";
import Navbar from "../components/Navbar";
import InputField from "../components/InputField";
import { apiFetch } from "../lib/api";
import { isStrongPassword } from "../lib/validation";

interface ResetPasswordPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  token?: string;
}

export default function ResetPasswordPage({ onNavigate, token }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : "Reset token is missing.");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError("Password must include uppercase, lowercase, number, and symbol.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      setMessage(res.message);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} />
      <main className="max-w-md mx-auto px-5 py-16">
        <div className="bg-white rounded-[24px] shadow-sm p-8">
          <h1 className="font-['Prata',serif] text-[30px] text-[#1a2e2d] mb-2">Create New Password</h1>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87] mb-6">
            Use a strong password with uppercase, lowercase, number, and symbol.
          </p>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <InputField label="New password" placeholder="New password" type="password" icon={<Lock size={18} />} value={newPassword} onChange={setNewPassword} />
            <InputField label="Confirm password" placeholder="Confirm password" type="password" icon={<Lock size={18} />} value={confirmPassword} onChange={setConfirmPassword} />
            {message && <p className="font-['Poppins',sans-serif] text-[13px] text-emerald-700 bg-emerald-50 rounded-[12px] px-4 py-3">{message}</p>}
            {error && <p className="font-['Poppins',sans-serif] text-[13px] text-red-600 bg-red-50 rounded-[12px] px-4 py-3">{error}</p>}
            <button disabled={loading || Boolean(message)} className="w-full bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[15px] py-3 rounded-[14px] hover:bg-[#047975] transition-colors disabled:opacity-60">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button type="button" onClick={() => onNavigate("login")} className="font-['Poppins',sans-serif] text-[13px] text-[#089D97] hover:underline">
              Back to Login
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
