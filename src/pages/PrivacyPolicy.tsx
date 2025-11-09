import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-6">Last updated: November 4, 2025</p>

        <section className="prose prose-sm mb-6">
          <h2>Introduction</h2>
          <p>
            NexHR (the "Service") is an HR management and recruitment platform designed to
            help organizations manage job postings, applications, payroll and candidate screening.
            We respect your privacy and are committed to protecting personal information we
            process while operating the Service.
          </p>
        </section>

        <section className="prose prose-sm mb-6">
          <h2>What information we collect</h2>
          <ul>
            <li>Account information: name, company, email, phone and role when you register.</li>
            <li>Job and application data: job descriptions, candidate CVs, screening results and application metadata.</li>
            <li>Usage data: logs, IP addresses, device and browser information, and interactions with the app.</li>
            <li>Payment information: limited payment metadata used for invoicing and transaction verification (we do not store full card data).</li>
            <li>Third-party data: where you link external services (for example, LinkedIn) we may receive profile information you permit us to access.</li>
          </ul>
        </section>

        <section className="prose prose-sm mb-6">
          <h2>How we use your information</h2>
          <p>We use collected data to:</p>
          <ul>
            <li>Provide and maintain the Service, including job posting, candidate screening and payroll features.</li>
            <li>Process and deliver applications and hiring workflows between employers and candidates.</li>
            <li>Communicate with you about account activity, updates, and support requests.</li>
            <li>Improve and personalize the Service using aggregated and anonymized analytics.</li>
            <li>Comply with legal obligations and enforce our terms.</li>
          </ul>
        </section>

        <section className="prose prose-sm mb-6">
          <h2>Legal basis for processing (GDPR)</h2>
          <p>
            When applicable, we rely on several legal bases to process personal data: the performance
            of a contract (providing the Service), legal obligations, consent (where requested), and
            our legitimate interests (running and securing the Service, fraud prevention, and analytics).
          </p>
        </section>

        <section className="prose prose-sm mb-6">
          <h2>Sharing and disclosure</h2>
          <p>
            We may share personal information with:
          </p>
          <ul>
            <li>Service providers and subcontractors who perform processing on our behalf (hosting, email, analytics).</li>
            <li>Employers and hiring teams as part of the application workflow (candidate resumes, screening outputs).</li>
            <li>Law enforcement or regulators when required by law or to protect rights and property.</li>
          </ul>
          <p>We do not sell personal data to third parties.</p>
        </section>

        <section className="prose prose-sm mb-6">
          <h2>Retention</h2>
          <p>
            We retain personal data for as long as necessary to provide the Service and to comply with
            our legal obligations. For recruitment data (applications, resumes), retention periods may be
            set by the customer using the platform; otherwise we retain candidate data for a reasonable
            period (typically 1–3 years) unless the data subject requests deletion.
          </p>
        </section>

        <section className="prose prose-sm mb-6">
          <h2>Security</h2>
          <p>
            We implement reasonable administrative, technical and physical safeguards designed to protect
            personal information. While we strive to secure your data, no system is completely secure —
            please avoid sending extremely sensitive information unless necessary.
          </p>
        </section>

        <section className="prose prose-sm mb-6">
          <h2>Cookies and tracking</h2>
          <p>
            We use cookies and similar technologies for authentication, preferences and analytics. You can
            control cookie settings via your browser; disabling certain cookies may impact Service functionality.
          </p>
        </section>

        <section className="prose prose-sm mb-6">
          <h2>Your rights</h2>
          <ul>
            <li>Access: you may request a copy of personal data we hold about you.</li>
            <li>Rectification: you may request correction of inaccurate data.</li>
            <li>Deletion: you may request deletion of your personal data, subject to contractual and legal exceptions.</li>
            <li>Portability: you may request your data in a machine-readable format.</li>
            <li>Objection or restriction: you may object to or request restriction of certain processing activities.</li>
          </ul>
          <p>To exercise these rights, contact us using the details below.</p>
        </section>

        <section className="prose prose-sm mb-6">
          <h2>Children</h2>
          <p>The Service is not intended for children under 16. We do not knowingly collect data from minors.</p>
        </section>

        <section className="prose prose-sm mb-6">
          <h2>Contact</h2>
          <p>
            If you have questions about this policy or wish to exercise your rights, please contact us at:
            <br />
            <strong>privacy@nexhr.example</strong>
          </p>
        </section>

        <p className="text-xs text-gray-500 mt-6">This policy may be updated — the latest version will always be available here.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
