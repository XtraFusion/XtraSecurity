'use client';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Refund & Cancellation Policy</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: October 7, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Subscription Cancellation</h2>
            <p className="mb-4">
              You may cancel your XtraSecurity subscription at any time from <strong>Settings → Subscription → Cancel Plan</strong> or by contacting billing@xtrasecurity.com.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Cancellation takes effect at the end of the current billing period</li>
              <li>You retain access to all paid features until the period ends</li>
              <li>After cancellation, your account automatically downgrades to the Free tier</li>
              <li>Your data is retained for 30 days post-cancellation; after that, paid-tier data (extended audit logs, etc.) is purged</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Refund Eligibility</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-4">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-left">Plan Type</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-left">Refund Window</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-left">Refund Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">Monthly — Pro</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">No refunds after billing</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">Access through end of period</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">Annual — Pro</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">Within 30 days of purchase/renewal</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">Pro-rated refund for unused months</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">Enterprise</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">Per contract terms</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">Per Order Form</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">Free tier</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">N/A</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-3">N/A</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500">
              Refunds will be credited back to the original payment method within 5–10 business days via Razorpay or Stripe.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Service Outage Credits</h2>
            <p className="mb-4">
              If the Service experiences unscheduled downtime exceeding our 99.5% monthly uptime SLA (for paid plans), you may request a pro-rated service credit for the affected period.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Downtime must be verified against our status page at status.xtrasecurity.com</li>
              <li>Credit requests must be submitted within 30 days of the incident</li>
              <li>Credits are applied to the next billing cycle and are non-transferable</li>
              <li>Credits are the sole remedy for service availability failures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Non-Refundable Situations</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Accounts suspended or terminated for violation of our Terms of Service or Acceptable Use Policy</li>
              <li>Unused features within a plan (e.g., not using all available projects)</li>
              <li>Accidental purchases where the subscription has been actively used</li>
              <li>Annual plans beyond the 30-day refund window</li>
              <li>Annual plan downgrade requests before renewal (you may cancel to avoid renewal)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. How to Request a Refund</h2>
            <ol className="list-decimal pl-6 mb-4">
              <li>Email <a href="mailto:billing@xtrasecurity.com" className="text-blue-600 dark:text-blue-400">billing@xtrasecurity.com</a> with subject line: <strong>&quot;Refund Request — [Your Account Email]&quot;</strong></li>
              <li>Include your Order ID (found in your invoice email)</li>
              <li>Briefly describe the reason for your refund request</li>
              <li>We will review and respond within 3 business days</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Grievance Escalation</h2>
            <p>
              If your refund request is not resolved to your satisfaction within 7 days, you may escalate to our Grievance Officer at <a href="mailto:grievance@xtrasecurity.com" className="text-blue-600 dark:text-blue-400">grievance@xtrasecurity.com</a>. We will respond within 30 days.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
