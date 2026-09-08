import Navbar from "../components/Navbar";

interface PrivacyPolicyPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

const UPDATED = "August 24, 2026";

export default function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar activePage="privacy" onNavigate={onNavigate} />
      <main className="max-w-4xl mx-auto px-5 py-10 pb-16">
        <article className="bg-white rounded-[20px] shadow-sm p-6 md:p-10 font-['Poppins',sans-serif] text-[#1a2e2d]">
          <p className="text-[13px] text-[#5a8a87] mb-2">Last updated: {UPDATED}</p>
          <h1 className="font-['Prata',serif] text-[34px] mb-5">Privacy Policy</h1>
          <div className="space-y-5 text-[14px] leading-relaxed">
            <p>
              Petopia uses personal information only to operate this pet adoption system, manage accounts, process adoption requests,
              provide staff support, send notifications, maintain medical and vaccination records, and run the inventory/store features.
            </p>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">Information We Collect</h2>
              <p>We collect account details such as name, email, phone number, role, status, avatar, password credentials for local accounts, adoption request notes, messages, notifications, pet records, medical records, vaccination records, cart/store activity, inventory records, and uploaded pet/avatar images.</p>
            </section>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">How We Use Information</h2>
              <p>We use this data to authenticate users, enforce role-based access, display user-specific records, review adoption requests, support conversations, notify users about relevant updates, and maintain shelter operations.</p>
            </section>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">Security</h2>
              <p>Authenticated requests use bearer tokens. Passwords are handled by the backend and reset tokens are time-limited. Uploads are restricted to supported image formats and size limits by backend validation.</p>
            </section>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">Sharing</h2>
              <p>We do not sell personal information. Data is visible only to users and staff roles allowed by the system permissions, such as adoption staff reviewing requests or veterinarians managing medical records.</p>
            </section>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">Your Choices</h2>
              <p>You may update supported profile fields, log out to clear local authentication state, and request password reset for local accounts. Google-only accounts use Google authentication and do not use local password management.</p>
            </section>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">Contact</h2>
              <p>Questions about this policy can be sent to support@petopia.com.</p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
