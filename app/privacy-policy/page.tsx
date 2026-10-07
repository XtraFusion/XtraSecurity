'use client';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">Last updated: October 7, 2026</p>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Effective: October 7, 2026</p>

          {/* 1. Who We Are */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Who We Are</h2>
            <p>
              XtraSecurity (&quot;XtraSecurity&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the XtraSecurity secrets management platform, available at xtrasecurity.com, and its associated CLI, SDK, VS Code extension, and APIs (collectively, the &quot;Service&quot;).
            </p>
            <p className="mt-4">
              For privacy enquiries, please contact our Grievance Officer:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-2">
              <p><strong>Grievance Officer:</strong> XtraSecurity Privacy Team</p>
              <p><strong>Email:</strong> privacy@xtrasecurity.com</p>
              <p><strong>Response SLA:</strong> Within 30 days of receipt</p>
            </div>
          </section>

          {/* 2. Scope */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Scope of this Policy</h2>
            <p>
              This Privacy Policy explains how we collect, use, store, share, and protect your personal data when you use our Service. It applies to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Visitors to our website</li>
              <li>Registered users of the XtraSecurity dashboard</li>
              <li>Users of our CLI, SDK, and VS Code extension</li>
              <li>Customers who have purchased a subscription plan</li>
            </ul>
            <p>
              This Policy does not apply to the <strong>content of secrets</strong> (API keys, tokens, credentials) you store in XtraSecurity. That content is encrypted under our zero-knowledge architecture and is treated as your property. See Section 6 for our cryptographic commitments.
            </p>
          </section>

          {/* 3. Data We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Personal Data We Collect</h2>

            <h3 className="text-xl font-semibold mb-3">3.1 Account & Identity Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Full name and email address (required for account creation)</li>
              <li>Profile photo (if provided via Google/GitHub OAuth)</li>
              <li>Hashed password (we never store plaintext passwords)</li>
              <li>Two-factor authentication credentials (TOTP seeds, stored encrypted)</li>
              <li>Company name (optional, for Pro/Enterprise plans)</li>
            </ul>
            <p className="text-sm text-gray-500 mb-4"><strong>Lawful basis (GDPR Art 6(1)(b)):</strong> Contract — necessary to provide the Service.</p>

            <h3 className="text-xl font-semibold mb-3">3.2 Usage & Technical Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>IP address, browser type, operating system</li>
              <li>Pages visited, features used, session duration</li>
              <li>CLI version, Node.js version (for diagnostics and compatibility)</li>
              <li>API request metadata (timestamp, endpoint, response code) — not secret content</li>
              <li>Error logs and crash reports (anonymized where possible)</li>
            </ul>
            <p className="text-sm text-gray-500 mb-4"><strong>Lawful basis (GDPR Art 6(1)(f)):</strong> Legitimate interest — service performance, security, and fraud prevention.</p>

            <h3 className="text-xl font-semibold mb-3">3.3 Payment & Billing Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Subscription tier, billing cycle, payment history</li>
              <li>Invoice details (name, address, GSTIN for Indian customers)</li>
              <li>Card details are <strong>never stored by XtraSecurity</strong> — they are processed directly by Razorpay (PCI-DSS certified) or Stripe</li>
            </ul>
            <p className="text-sm text-gray-500 mb-4"><strong>Lawful basis (GDPR Art 6(1)(b) and (c)):</strong> Contract and legal obligation (GST/tax records).</p>

            <h3 className="text-xl font-semibold mb-3">3.4 Audit & Activity Logs</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Records of secret reads, writes, deletions, and role changes (by user ID)</li>
              <li>Team invitations sent and accepted</li>
              <li>Key rotation events</li>
            </ul>
            <p className="text-sm text-gray-500 mb-4"><strong>Lawful basis (GDPR Art 6(1)(b) and (f)):</strong> Contract (feature delivery) and legitimate interest (security integrity). Audit logs are immutable for security compliance and are pseudonymized upon account deletion requests.</p>

            <h3 className="text-xl font-semibold mb-3">3.5 Communications Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Support ticket messages</li>
              <li>Email correspondence with our team</li>
              <li>Feedback and feature requests</li>
            </ul>
            <p className="text-sm text-gray-500 mb-4"><strong>Lawful basis (GDPR Art 6(1)(b)):</strong> Contract — provision of customer support.</p>

            <h3 className="text-xl font-semibold mb-3">3.6 Data We Do NOT Collect</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>The content of your secrets (API keys, tokens, passwords you store) — these are encrypted client-side and are never readable by XtraSecurity servers under Strict Zero-Knowledge mode</li>
              <li>Sensitive special category data under GDPR Art 9 (health, biometric, racial, religious data)</li>
              <li>Children&apos;s data — our Service is strictly for users aged 18 and above</li>
            </ul>
          </section>

          {/* 4. Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Cookies & Tracking Technologies</h2>
            <p className="mb-4">We use the following types of cookies:</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-4">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Type</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Purpose</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Consent Required?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Essential</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Session authentication, CSRF protection</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">No (strictly necessary)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Functional</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Theme preference, language settings</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">No (user-initiated)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Analytics</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Service usage statistics (anonymized)</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Yes — consent banner</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>You can manage cookie preferences at any time via our Cookie Settings panel accessible in the website footer.</p>
          </section>

          {/* 5. How We Use Your Data */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. How We Use Your Data</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Providing, maintaining, and improving the Service</li>
              <li>Processing subscription payments and issuing invoices/receipts</li>
              <li>Sending transactional emails (account creation, password reset, invite notifications)</li>
              <li>Providing customer support</li>
              <li>Security monitoring, fraud detection, and abuse prevention</li>
              <li>Complying with legal obligations (tax, regulatory reporting)</li>
              <li>Sending product updates and newsletters (with opt-out available)</li>
            </ul>
            <p><strong>We do not sell your personal data.</strong> We do not share personal data with third parties for their direct marketing purposes.</p>
          </section>

          {/* 6. Zero-Knowledge Encryption */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Zero-Knowledge Architecture & Your Secrets</h2>
            <p className="mb-4">
              XtraSecurity operates on a strict zero-knowledge encryption model for secrets stored in Strict E2EE mode (Level 3). This means:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Your Master Vault Passphrase is <strong>never transmitted to our servers</strong> in plaintext.</li>
              <li>Encryption and decryption of your secrets happens <strong>entirely locally on your device</strong> (via the CLI, SDK, VS Code extension, or WebCrypto API in the browser).</li>
              <li>Your Master Passphrase may be cached locally in your device&apos;s native Hardware Keyring (e.g., Windows DPAPI, macOS Keychain). We do not have access to this local hardware cache.</li>
              <li>Our servers store only ciphertext blobs — we mathematically cannot read, copy, or distribute your secrets.</li>
              <li><strong>Absolute Non-Recovery:</strong> If you lose your Master Passphrase, we <strong>cannot recover your secrets under any circumstances</strong>, including pursuant to lawful subpoenas, as we do not possess the decryption keys.</li>
            </ul>
            <p className="mb-4">
              Legacy secrets stored under Server AES (Level 1) are encrypted using a server-side key stored in our infrastructure. These are not zero-knowledge. We strongly recommend migrating to Level 3 using the Vault Key Rotation feature.
            </p>
          </section>

          {/* 7. Data Sharing & Sub-processors */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Sharing & Sub-processors</h2>
            <p className="mb-4">We share your data with the following third-party sub-processors who help us operate the Service:</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-4">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Sub-processor</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Purpose</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Location</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Razorpay</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Payment processing</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">India</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Google (OAuth / SMTP)</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Authentication & email</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">USA</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">GitHub (OAuth)</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Authentication & GitHub sync</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">USA</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Vercel / Hosting Provider</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Cloud infrastructure</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">USA / Global</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              We do not sell, rent, or otherwise disclose personal data to other parties except as listed above or where required by law (e.g., valid court order, government request).
            </p>
          </section>

          {/* 8. International Data Transfers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
            <p className="mb-4">
              XtraSecurity is headquartered in India. If you access our Service from the European Economic Area (EEA), United Kingdom, or Switzerland, your personal data may be transferred to countries that may not provide the same level of data protection as your home country.
            </p>
            <p>
              For such transfers, we rely on appropriate safeguards including Standard Contractual Clauses (SCCs) approved by the European Commission. You may request a copy of relevant transfer safeguards by contacting privacy@xtrasecurity.com.
            </p>
          </section>

          {/* 9. Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-4">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Data Category</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Retention Period</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Basis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Account data</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Duration of account + 30 days</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Contract</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Secrets (encrypted)</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Until deleted by user</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Contract</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Audit logs</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">1 year (Free), 5 years (Pro/Enterprise)</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Legitimate interest / Legal</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Payment records</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">7 years</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Legal obligation (GST Act)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Usage/technical logs</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">90 days (rolling)</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Legitimate interest</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Support communications</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">3 years after resolution</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Legitimate interest</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 10. Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Your Rights</h2>
            <p className="mb-4">Depending on your location, you may have the following rights:</p>

            <h3 className="text-xl font-semibold mb-2">Under GDPR (EU/EEA/UK users):</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Right to access</strong> — Request a copy of your personal data</li>
              <li><strong>Right to rectification</strong> — Correct inaccurate personal data</li>
              <li><strong>Right to erasure</strong> — Request deletion of your account and personal data (except where we have legal obligations to retain it)</li>
              <li><strong>Right to restriction</strong> — Request limited processing in certain circumstances</li>
              <li><strong>Right to data portability</strong> — Receive your account data in a machine-readable format</li>
              <li><strong>Right to object</strong> — Object to processing based on legitimate interests</li>
              <li><strong>Right not to be subject to automated decision-making</strong></li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">Under DPDP Act 2023 (India):</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Right to access</strong> — Summary of personal data and processing activities</li>
              <li><strong>Right to correction and erasure</strong></li>
              <li><strong>Right to grievance redressal</strong> — Contact our Grievance Officer</li>
              <li><strong>Right to nominate</strong> — Nominate another individual to exercise rights in the event of death or incapacity</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">Under CCPA (California users):</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Right to know</strong> what personal information is collected</li>
              <li><strong>Right to delete</strong> personal information</li>
              <li><strong>Right to opt-out</strong> of sale or sharing of personal information</li>
              <li><strong>Right to non-discrimination</strong> for exercising CCPA rights</li>
            </ul>

            <p>
              To exercise any of these rights, contact us at <strong>privacy@xtrasecurity.com</strong>. We will respond within 30 days. You may also delete your account directly from Settings → Account → Delete Account.
            </p>
          </section>

          {/* 11. Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Security Measures</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>AES-256-GCM encryption for all stored secrets</li>
              <li>HKDF-SHA256 key derivation with per-project salts</li>
              <li>TLS 1.3 in transit for all API communications</li>
              <li>Bcrypt hashing for passwords</li>
              <li>Role-based access control (RBAC) on all endpoints</li>
              <li>IP restriction and 2FA enforcement per project</li>
              <li>Immutable audit logs for all sensitive operations</li>
              <li>Automated secret leak scanning on all git commits</li>
            </ul>
            <p>
              In the event of a personal data breach affecting your rights and freedoms, we will notify affected users within 72 hours of becoming aware, and notify the applicable regulatory authority (Data Protection Board of India / relevant EU supervisory authority) as required by law.
            </p>
          </section>

          {/* 12. Children */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Children&apos;s Privacy</h2>
            <p>
              XtraSecurity is intended for users who are <strong>18 years of age or older</strong>. We do not knowingly collect personal data from persons under the age of 18. If you believe we have inadvertently collected data from a minor, please contact privacy@xtrasecurity.com and we will promptly delete it.
            </p>
          </section>

          {/* 13. Changes */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Changes to this Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify registered users of material changes via email at least 14 days before the changes take effect. Continued use of the Service after the effective date constitutes acceptance of the updated Policy.
            </p>
          </section>

          {/* 14. Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <p className="font-semibold mb-2">XtraSecurity — Privacy & Data Protection</p>
              <p>Email: <a href="mailto:privacy@xtrasecurity.com" className="text-blue-600 dark:text-blue-400">privacy@xtrasecurity.com</a></p>
              <p>Grievance Officer Email: <a href="mailto:grievance@xtrasecurity.com" className="text-blue-600 dark:text-blue-400">grievance@xtrasecurity.com</a></p>
              <p className="mt-4 text-sm text-gray-500">
                EU users may also lodge a complaint with your local data protection supervisory authority. A list of EU supervisory authorities is available at <a href="https://edpb.europa.eu" className="text-blue-600 dark:text-blue-400" target="_blank" rel="noopener noreferrer">edpb.europa.eu</a>.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Indian users may escalate unresolved complaints to the Data Protection Board of India once established.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
