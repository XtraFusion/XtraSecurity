'use client';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Terms and Conditions</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">Last updated: October 7, 2026</p>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Effective: October 7, 2026</p>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
            <p className="text-sm">
              <strong>Summary:</strong> XtraSecurity provides a secrets management platform under a subscription model. By creating an account, you agree to these terms. If you are agreeing on behalf of a company, you represent that you have the authority to do so. Please read these terms carefully, particularly Sections 6 (Acceptable Use), 9 (Disclaimers), 10 (Limitation of Liability), and 14 (Governing Law).
            </p>
          </div>

          {/* 1. Parties & Agreement */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Parties and Agreement</h2>
            <p className="mb-4">
              These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;Customer&quot;, or &quot;you&quot;) and XtraSecurity (&quot;XtraSecurity&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) governing your access to and use of the XtraSecurity platform, including the web dashboard, CLI, SDK, VS Code extension, and APIs (collectively, the &quot;Service&quot;).
            </p>
            <p className="mb-4">
              By creating an account, clicking &quot;I agree&quot;, or using the Service, you confirm that:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You are at least 18 years of age</li>
              <li>You have the legal capacity to enter into a binding contract</li>
              <li>If acting on behalf of an organisation, you have authority to bind that organisation</li>
              <li>You have read, understood, and agree to these Terms and our Privacy Policy</li>
            </ul>
            <p><strong>If you do not agree to these Terms, do not use the Service.</strong></p>
          </section>

          {/* 2. The Service */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              XtraSecurity is a cloud-based secrets management platform that enables developers and organisations to securely store, manage, rotate, and inject application secrets (API keys, tokens, database credentials, environment variables) across development, staging, and production environments.
            </p>
            <p className="mb-4">The Service includes:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Web dashboard for secret management and team collaboration</li>
              <li>CLI tool (<code>xtra-cli</code>) for terminal-based operations and CI/CD integration</li>
              <li>Node.js, Python, and Go SDKs for programmatic access</li>
              <li>VS Code extension for inline drift detection and secret scanning</li>
              <li>REST and WebSocket APIs</li>
              <li>GitHub Actions integration for secret synchronisation</li>
            </ul>
          </section>

          {/* 3. Subscription Plans */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Subscription Plans & Licence</h2>
            <p className="mb-4">
              Subject to your compliance with these Terms and payment of applicable fees, we grant you a limited, non-exclusive, non-transferable, revocable licence to access and use the Service for your internal business or personal development purposes.
            </p>

            <h3 className="text-xl font-semibold mb-3">3.1 Plan Tiers</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-4">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Plan</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Availability</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Key Limits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2"><strong>Free</strong></td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">No credit card required</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Limited workspaces, teams, projects, and API requests</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2"><strong>Pro</strong></td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Monthly/annual subscription</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Expanded quotas, priority support, 5-year audit retention</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-2"><strong>Enterprise</strong></td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Custom contract</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2">Unlimited, SLA, custom DPA, dedicated support</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Current pricing and plan features are listed on our Pricing page at xtrasecurity.com/pricing. We reserve the right to modify plan pricing with 30 days notice to existing paid subscribers.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">3.2 Billing & Payment</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Paid subscriptions are billed in advance on a monthly or annual cycle</li>
              <li>Payments are processed by Razorpay (India) in INR, or by Stripe in USD/EUR for international customers</li>
              <li>All prices are inclusive of applicable GST for Indian customers</li>
              <li>Auto-renewal is enabled by default and will be disclosed at checkout. You may disable auto-renewal from Settings → Subscription at any time</li>
              <li>Failed payments may result in Service downgrade to the Free tier after a 7-day grace period</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.3 Refund Policy</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Monthly plans:</strong> No refunds after the billing cycle starts. You may cancel at any time; access continues until end of the paid period.</li>
              <li><strong>Annual plans:</strong> Pro-rated refund available within 30 days of purchase or renewal. No refunds after 30 days.</li>
              <li><strong>Service outage credits:</strong> If Service availability falls below 99.5% in any calendar month (for paid plans), you may request a pro-rated credit for the affected period. Contact support@xtrasecurity.com within 30 days of the incident.</li>
              <li>Refund requests must be submitted to billing@xtrasecurity.com with order details</li>
            </ul>
          </section>

          {/* 4. Account Registration */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Account Registration & Security</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>You must provide accurate, current, and complete information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must notify us immediately at security@xtrasecurity.com of any unauthorised use of your account</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>One person or legal entity may not maintain more than one free account</li>
              <li>You must not share your account credentials with third parties except Service Accounts created within the platform for this purpose</li>
            </ul>
          </section>

          {/* 5. Your Data & Content */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Your Data & Intellectual Property</h2>
            <p className="mb-4">
              <strong>Your data is yours.</strong> You retain all intellectual property rights in the secrets, configuration data, and other content you upload to the Service (&quot;Customer Content&quot;).
            </p>
            <p className="mb-4">
              By using the Service, you grant XtraSecurity a limited, non-exclusive licence to store, process, and transmit Customer Content solely to the extent necessary to provide the Service to you. We will not access, use, or disclose Customer Content for any other purpose without your explicit consent.
            </p>
            <p className="mb-4">
              <strong>Zero-Knowledge commitment:</strong> Secrets stored under Strict Zero-Knowledge (E2EE Level 3) mode are technically inaccessible to XtraSecurity. We cannot read, copy, or disclose such secrets. You are solely responsible for maintaining and safeguarding your vault passphrase. We cannot recover lost passphrases or the secrets encrypted under them.
            </p>
            <p>
              You are responsible for ensuring that Customer Content you upload does not violate any applicable laws or third-party rights.
            </p>
          </section>

          {/* 6. Acceptable Use Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use Policy (AUP)</h2>
            <p className="mb-4">You agree to use the Service only for lawful purposes. You must not use the Service to:</p>

            <h3 className="text-xl font-semibold mb-2">6.1 Prohibited Activities</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Store, manage, or distribute credentials for illegal services (dark web markets, malware distribution, phishing infrastructure)</li>
              <li>Store credentials that provide access to child sexual abuse material (CSAM) or any content that exploits minors</li>
              <li>Support, finance, or facilitate terrorist organisations or sanctioned entities</li>
              <li>Circumvent, disable, or interfere with security features of the Service</li>
              <li>Conduct penetration testing, vulnerability scanning, or load testing against XtraSecurity infrastructure without prior written consent</li>
              <li>Attempt to gain unauthorised access to other users&apos; accounts or data</li>
              <li>Reverse-engineer, decompile, or extract source code from the Service</li>
              <li>Resell, sublicense, or otherwise commercialise access to the Service without a written reseller agreement</li>
              <li>Use automated means (bots, scrapers) to extract data from the platform beyond documented API limits</li>
              <li>Impersonate XtraSecurity or its employees in communications</li>
              <li>Transmit unsolicited commercial messages via platform invitation features</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">6.2 GitHub Integration Specific Terms</h3>
            <p className="mb-4">
              When using the GitHub Sync feature, you authorise XtraSecurity to access your GitHub repositories as configured. You must only connect repositories you own or have permission to integrate with third-party services. XtraSecurity will access only the minimum data necessary to perform the synchronisation.
            </p>

            <h3 className="text-xl font-semibold mb-2">6.3 Regulated Industries</h3>
            <p className="mb-4">
              If you operate in a regulated industry, you are solely responsible for ensuring your use of XtraSecurity complies with applicable sector-specific regulations, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Healthcare (HIPAA):</strong> XtraSecurity does not provide a Business Associate Agreement by default. Contact enterprise@xtrasecurity.com to request a BAA before storing credentials that provide access to Protected Health Information (PHI).</li>
              <li><strong>Financial services:</strong> Compliance with PCI-DSS, RBI guidelines, and other financial regulations is your responsibility.</li>
              <li><strong>Defence / Government:</strong> Use of XtraSecurity for classified government systems is prohibited without a specific written agreement.</li>
            </ul>
          </section>

          {/* 7. Service Availability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Service Availability & SLA</h2>
            <p className="mb-4">
              We target a monthly uptime of <strong>99.5%</strong> for paid plans, excluding scheduled maintenance (announced 48 hours in advance) and Force Majeure events.
            </p>
            <p className="mb-4">
              The Free tier is provided on a best-effort basis with no uptime guarantee.
            </p>
            <p>
              Enterprise plan SLAs are defined in the applicable Order Form or Enterprise Agreement.
            </p>
          </section>

          {/* 8. Security Responsibilities */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Security Responsibilities</h2>
            <h3 className="text-xl font-semibold mb-2">XtraSecurity is responsible for:</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Security of the platform infrastructure</li>
              <li>Encryption of secrets at rest and in transit</li>
              <li>Access control enforcement</li>
              <li>Timely patching of known vulnerabilities in our software</li>
              <li>Notifying you of security incidents affecting your data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">You are responsible for:</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Safeguarding your vault passphrase (zero-knowledge mode)</li>
              <li>Proper team permission configuration within your organisation</li>
              <li>Enabling 2FA on your account</li>
              <li>Promptly rotating secrets you believe may be compromised</li>
              <li>Not sharing API keys or Service Account tokens with unauthorised parties</li>
              <li>Compliance with your organisation&apos;s internal security policies</li>
            </ul>
          </section>

          {/* 9. Disclaimers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimers</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, XTRASECURITY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mb-4">
              We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components. We do not warrant that defects will be corrected.
            </p>
            <p className="mb-4">
              <strong>Compliance disclaimer:</strong> Our &quot;Pre-Audit Readiness Reports&quot; (formerly labelled SOC 2/GDPR reports) are self-assessment tools generated from your current platform configuration. They are <strong>not</strong> official SOC 2 Type II attestations, GDPR audit certifications, or representations of regulatory compliance. Regulatory compliance is your responsibility.
            </p>
            <p>
              <strong>Passphrase disclaimer:</strong> If you use Zero-Knowledge E2EE mode and lose your vault passphrase, XtraSecurity <strong>cannot recover your secrets</strong>. There is no technical mechanism for us to do so. We strongly recommend downloading and securely storing your recovery kit.
            </p>
          </section>

          {/* 10. Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL XTRASECURITY, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, goodwill, or other intangible losses</li>
              <li>Damages resulting from your inability to access or use the Service</li>
              <li>Damages resulting from unauthorised access to your account where you failed to secure your credentials</li>
              <li>Loss of secrets where zero-knowledge passphrase was lost</li>
            </ul>
            <p className="mb-4">
              Our total cumulative liability to you for all claims arising out of or relating to these Terms or the Service shall not exceed the greater of:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>The total fees paid by you to XtraSecurity in the <strong>twelve (12) months</strong> preceding the claim; or</li>
              <li>INR 10,000 (ten thousand rupees) / USD 100 (one hundred US dollars)</li>
            </ul>
            <p className="mb-4">
              <strong>Note for Indian consumers:</strong> Nothing in this section shall limit your rights under the Consumer Protection Act 2019 (India) or any other non-waivable statutory consumer rights.
            </p>
            <p>
              <strong>Note for EU users:</strong> Nothing in this section limits XtraSecurity&apos;s liability under GDPR Article 82 for damages resulting from our violation of GDPR obligations.
            </p>
          </section>

          {/* 11. Indemnification */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless XtraSecurity and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 mb-4 mt-2">
              <li>Your violation of these Terms</li>
              <li>Your violation of any applicable law or regulation</li>
              <li>Customer Content you upload that infringes third-party rights</li>
              <li>Your use of the Service in a manner that causes harm to a third party</li>
            </ul>
          </section>

          {/* 12. Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Account Termination & Suspension</h2>

            <h3 className="text-xl font-semibold mb-2">12.1 Termination by You</h3>
            <p className="mb-4">
              You may terminate your account at any time from Settings → Account → Delete Account. Upon termination, your secrets, projects, and personal data will be deleted within 30 days, except data we are required to retain by law (e.g., payment records for 7 years per GST Act).
            </p>

            <h3 className="text-xl font-semibold mb-2">12.2 Termination or Suspension by XtraSecurity</h3>
            <p className="mb-4">We may suspend or terminate your account:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Immediately and without notice</strong> if you violate Section 6 (Acceptable Use), engage in fraudulent activity, or pose a security risk to other users</li>
              <li><strong>With 14 days notice</strong> for non-payment of subscription fees (after the 7-day grace period)</li>
              <li><strong>With 30 days notice</strong> if we decide to discontinue the Service or a feature</li>
            </ul>
            <p>
              Upon termination by us without cause, we will provide a pro-rated refund of prepaid fees for the unused subscription period.
            </p>
          </section>

          {/* 13. Open Source */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Open Source Components</h2>
            <p className="mb-4">
              Certain components of XtraSecurity (including the CLI and SDKs) are made available under open-source licences. The applicable licence for each component is identified in the respective repository&apos;s LICENSE file and THIRD_PARTY_NOTICES.
            </p>
            <p>
              Nothing in these Terms grants you a right to use XtraSecurity&apos;s trademarks, logos, or brand elements beyond what is expressly permitted.
            </p>
          </section>

          {/* 14. Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law & Dispute Resolution</h2>
            <p className="mb-4">
              These Terms are governed by and construed in accordance with the laws of <strong>India</strong>, without regard to its conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold mb-2">14.1 Grievance Redressal</h3>
            <p className="mb-4">
              In accordance with the Consumer Protection (E-Commerce) Rules 2020 and the Information Technology Act 2000, any grievances regarding the Service should first be raised with our Grievance Officer:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <p><strong>Grievance Officer:</strong> XtraSecurity Support Team</p>
              <p><strong>Email:</strong> grievance@xtrasecurity.com</p>
              <p><strong>Response time:</strong> We will acknowledge within 48 hours and resolve within 30 days</p>
            </div>

            <h3 className="text-xl font-semibold mb-2">14.2 Arbitration</h3>
            <p className="mb-4">
              If a dispute cannot be resolved through the Grievance process, the parties agree to resolve disputes through binding arbitration under the Arbitration and Conciliation Act, 1996 (India). The arbitration shall be:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Conducted by a sole arbitrator mutually agreed upon by both parties</li>
              <li>Conducted in English in Mumbai, Maharashtra, India</li>
              <li>Subject to the substantive laws of India</li>
            </ul>
            <p className="mb-4">
              Class action waivers: You agree that any arbitration or proceedings shall be limited to the dispute between you and XtraSecurity individually. You waive any right to bring claims as a class action or class arbitration.
            </p>
            <p>
              <strong>EU users:</strong> Notwithstanding the above, EU consumers retain the right to bring claims before their local courts and to use EU online dispute resolution mechanisms available at <a href="https://ec.europa.eu/consumers/odr" className="text-blue-600 dark:text-blue-400" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
            </p>
          </section>

          {/* 15. General Provisions */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. General Provisions</h2>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy and any Order Form, constitute the entire agreement between you and XtraSecurity regarding the Service and supersede all prior agreements.</li>
              <li><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</li>
              <li><strong>No Waiver:</strong> Our failure to enforce any right or provision of these Terms will not constitute a waiver of that right.</li>
              <li><strong>Assignment:</strong> You may not assign or transfer these Terms without our prior written consent. We may assign these Terms to a successor entity in connection with a merger, acquisition, or sale of assets.</li>
              <li><strong>Modifications:</strong> We may modify these Terms with 30 days&apos; notice to registered users via email or prominent in-app notification. Continued use of the Service constitutes acceptance.</li>
              <li><strong>Force Majeure:</strong> We are not liable for delays or failures due to circumstances beyond our reasonable control, including natural disasters, government actions, internet outages, or third-party service failures.</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <p className="font-semibold mb-4">XtraSecurity</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">General Support</p>
                  <p><a href="mailto:support@xtrasecurity.com" className="text-blue-600 dark:text-blue-400">support@xtrasecurity.com</a></p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Billing & Refunds</p>
                  <p><a href="mailto:billing@xtrasecurity.com" className="text-blue-600 dark:text-blue-400">billing@xtrasecurity.com</a></p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Security Incidents</p>
                  <p><a href="mailto:security@xtrasecurity.com" className="text-blue-600 dark:text-blue-400">security@xtrasecurity.com</a></p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grievance Officer</p>
                  <p><a href="mailto:grievance@xtrasecurity.com" className="text-blue-600 dark:text-blue-400">grievance@xtrasecurity.com</a></p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Enterprise & HIPAA BAA</p>
                  <p><a href="mailto:enterprise@xtrasecurity.com" className="text-blue-600 dark:text-blue-400">enterprise@xtrasecurity.com</a></p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Privacy</p>
                  <p><a href="mailto:privacy@xtrasecurity.com" className="text-blue-600 dark:text-blue-400">privacy@xtrasecurity.com</a></p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
