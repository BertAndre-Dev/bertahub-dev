import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageHeader } from "@/components/legal-pages/legal-page-header";

export const metadata: Metadata = {
  title: "Privacy Notice | BertAndre Estate Management",
  description: "Privacy notice and data protection policy - BertAndre Consulting Limited",
};

export default function PrivacyNoticePage() {
  return (
    <div className="min-h-screen bg-background">
      <LegalPageHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Privacy Notice
        </h1>

        <article className="space-y-8 text-muted-foreground">
          {/* 1. Introduction */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              1. Introduction
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              BertAndre Consulting Limited (&quot;we&quot;, &quot;us&quot;,
              &quot;our&quot;, or &quot;BertAndre&quot;) is committed to
              protecting your privacy and ensuring the security of your personal
              data. This Privacy Notice explains how we collect, use, disclose,
              retain, and protect personal data when you interact with our
              Estate Management Product (the &quot;Product&quot;), our website,
              and related services.
            </p>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              This Privacy Notice is issued in compliance with the Nigeria Data
              Protection Act 2023 (&quot;NDPA&quot;), the Nigeria Data
              Protection Commission&apos;s General Application and
              Implementation Directive (&quot;GAID&quot;), and other applicable
              data protection laws and regulations.
            </p>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              By using our Product, website, or services, you acknowledge that
              you have read and understood this Privacy Notice. If you do not
              agree with the practices described herein, please discontinue use
              of our services.
            </p>
          </section>

          {/* 2. Data Controller Information */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              2. Data Controller Information
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              For the purposes of this Privacy Notice, BertAndre acts as the
              Data Controller responsible for processing your personal data. Our
              contact details are as follows:
            </p>
            <div className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4">
              <table className="w-full min-w-[280px] text-sm">
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">
                      Data Controller
                    </td>
                    <td className="py-2">BertAndre Consulting</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">
                      Registered Address
                    </td>
                    <td className="py-2">
                      20 Awudu Ephekha Boulevard, Lekki Phase 1, Lagos
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">
                      Email Address
                    </td>
                    <td className="py-2">
                      <a
                        href="mailto:info@bertandregroup.com"
                        className="text-primary hover:underline"
                      >
                        info@bertandregroup.com
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">
                      Phone Number
                    </td>
                    <td className="py-2">09138667927</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">
                      Data Protection Officer
                    </td>
                    <td className="py-2">
                      Oluwadunsin Babatunde -{" "}
                      <a
                        href="mailto:dunsin.babatunde@bertandregroup.com"
                        className="text-primary hover:underline"
                      >
                        dunsin.babatunde@bertandregroup.com
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Categories of Data Subjects */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              3. Categories of Data Subjects
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              We process personal data belonging to the underlisted categories
              of individuals. For clarity, this privacy notice applies to you if
              you are:
            </p>
            <ul className="space-y-3 text-sm leading-relaxed sm:text-base">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">a.</span>
                <span>
                  An individual visiting our official website (www.bertandregroup.com)
                  to learn about our services, access resources, or contact us.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">b.</span>
                <span>
                  A Property owner, estate manager, and/or administrator who
                  create accounts on the Product to manage your properties and
                  tenancies. This includes:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>Super-Administrators: Primary account holders with full administrative privileges</li>
                    <li>Administrators: Designated users with property management capabilities</li>
                    <li>Authorised Users: Staff members or agents granted limited access by administrators</li>
                  </ul>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">c.</span>
                <span>
                  An individual whose tenancy information is recorded on the
                  Product by property owners or managers, including those
                  subject to identity verification processes.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">d.</span>
                <span>
                  An individual who visits properties managed through the
                  Product and whose visit details are logged by property
                  managers or residents.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">e.</span>
                <span>
                  An individual who makes or receives payments through the
                  Product&apos;s integrated payment and wallet services.
                </span>
              </li>
            </ul>
          </section>

          {/* 4. Categories of Personal Data Collected */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              4. Categories of Personal Data Collected
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              We may collect and process the following categories of personal
              data based on your interaction with our services and the nature of
              the product you are consuming:
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "Personal Identification Information",
                  items: [
                    "Full name (first name, middle name, surname)",
                    "Date of birth",
                    "Gender",
                    "Photograph/profile picture",
                    "National Identification Number (NIN)",
                    "Other government-issued identification documents",
                  ],
                },
                {
                  title: "Contact Information",
                  items: [
                    "Phone number(s)",
                    "Email address",
                    "Residential address",
                    "Emergency contact details",
                  ],
                },
                {
                  title: "Biometric Data (Sensitive Personal Data)",
                  items: [
                    "Facial recognition data (for identity verification purposes)",
                    "Fingerprint data (where applicable for access control)",
                    "Note: Biometric data is classified as sensitive personal data under the NDPA 2023. We implement enhanced security measures and process this data only with explicit consent or where required by law.",
                  ],
                },
                {
                  title: "Financial and Transaction Data",
                  items: [
                    "Bank account details (for payment processing)",
                    "Payment card information (processed via licensed third-party payment providers—we do not directly collect or retain your card data)",
                    "Transaction history and records",
                    "Wallet balance and transaction details",
                    "Rental payment records",
                  ],
                },
                {
                  title: "Property and Tenancy Information",
                  items: [
                    "Property address and description",
                    "Tenancy agreement details",
                    "Rent amount and payment schedule",
                    "Move-in and move-out dates",
                    "Occupancy status",
                  ],
                },
                {
                  title: "Technical and Usage Data",
                  items: [
                    "IP address",
                    "Device information (type, operating system, browser)",
                    "Login timestamps and session data",
                    "Geolocation data (where enabled)",
                    "Cookies and similar tracking technologies",
                  ],
                },
                {
                  title: "Visitor Log Data",
                  items: [
                    "Visitor's full name",
                    "Phone number",
                    "Purpose of visit",
                    "Date and time of visit",
                    "Vehicle registration number (if applicable)",
                    "Check-in and check-out times",
                  ],
                },
              ].map((group) => (
                <div
                  key={group.title}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <h3 className="mb-2 font-medium text-foreground">
                    {group.title}
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {group.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Purposes of Processing */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              5. Purposes of Processing
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              We process your personal data for the following purposes:
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "Service Delivery, Complaint Resolution and Account Management",
                  items: [
                    "To create and manage your user account",
                    "To effectively identify issues related to your complaint and work toward a resolution",
                    "To provide access to the Product's features and functionalities",
                    "To enable property and tenancy management",
                    "To process visitor logging and access management",
                    "To facilitate communication between property owners, managers, and tenants; and with BertAndre",
                  ],
                },
                {
                  title: "Identity Verification and Compliance",
                  items: [
                    "To verify tenant identity using National Identification Number (NIN) and biometric data",
                    "To comply with the Nigerian Mandatory Use of National Identification Number Regulation",
                    "To fulfil Anti-Money Laundering and Counter-Financing of Terrorism (AML/CFT) obligations",
                    "To prevent fraud and unauthorized access",
                  ],
                },
                {
                  title: "Payment Processing",
                  items: [
                    "To process rental payments and other transactions",
                    "To manage wallet services and fund transfers",
                    "To issue receipts and transaction confirmations",
                    "To handle refunds and cancellations in accordance with our refund policy",
                  ],
                },
                {
                  title: "Security and Fraud Prevention",
                  items: [
                    "To maintain audit logs of user activities",
                    "To detect and prevent unauthorized access, fraud, and security threats",
                    "To investigate and respond to security incidents",
                    "To comply with law enforcement requests where legally required",
                  ],
                },
                {
                  title: "Communication",
                  items: [
                    "To send service-related notifications and updates",
                    "To respond to your enquiries and support requests",
                    "To send promotional communications (with your consent)",
                  ],
                },
                {
                  title: "Legal Management and Regulatory Compliance",
                  items: [
                    "To comply with applicable laws, regulations, and legal processes",
                    "To respond to requests from regulatory authorities",
                    "To establish, exercise, or defend legal claims",
                  ],
                },
              ].map((group) => (
                <div key={group.title}>
                  <h3 className="mb-2 font-medium text-foreground">
                    {group.title}
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {group.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Legal Basis for Processing */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              6. Legal Basis for Processing
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              Under the NDPA 2023, we process your personal data based on the
              following lawful grounds:
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Legal Basis
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Scope
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">
                      Consent
                    </td>
                    <td className="px-4 py-3">
                      Where you have given clear consent for us to process your
                      personal data for specific purposes
                    </td>
                    <td className="px-4 py-3">
                      Processing biometric data; Marketing communications;
                      Cookies
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">
                      Contract Performance
                    </td>
                    <td className="px-4 py-3">
                      Processing necessary for the performance of a contract
                      with you or to take steps at your request before entering
                      into a contract
                    </td>
                    <td className="px-4 py-3">
                      Account creation; Service delivery; Payment processing
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">
                      Legal Obligation
                    </td>
                    <td className="px-4 py-3">
                      Processing necessary for compliance with legal or
                      regulatory obligations
                    </td>
                    <td className="px-4 py-3">
                      NIN verification; AML compliance; Tax reporting; Regulatory
                      filings
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">
                      Legitimate Interest
                    </td>
                    <td className="px-4 py-3">
                      Processing necessary for our legitimate interests or those
                      of a third party, where not overridden by your rights
                    </td>
                    <td className="px-4 py-3">
                      Security measures; Fraud prevention; Service improvement;
                      Analytics
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. Third-Party Data Sharing */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              7. Third-Party Data Sharing and Disclosure
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              We may share your personal data with the following categories of
              recipients:
            </p>
            <ul className="space-y-4 text-sm leading-relaxed sm:text-base">
              <li>
                <strong className="text-foreground">a. Payment Service Providers</strong>{" "}
                — We use licensed third-party payment service providers to
                process payments and manage wallet services on the Product.
                These include Flutterwave for payment processing and wallet
                services. We will notify you from time to time as we add more
                processors either in a separate email or on the interface prior
                to your payment execution. These providers are licensed by the
                Central Bank of Nigeria (CBN) and process your payment data in
                accordance with their own privacy policies and applicable
                regulations.
              </li>
              <li>
                <strong className="text-foreground">b. Identity Verification Service Providers</strong>{" "}
                — We engage third-party identity verification service providers
                to verify tenant identities using NIN and biometric data. These
                providers are contractually bound to protect your data and
                process it only for verification purposes.
              </li>
              <li>
                <strong className="text-foreground">c. Cloud Hosting and Infrastructure Providers</strong>{" "}
                — Your data is stored on secure cloud infrastructure provided by
                reputable hosting services. These providers maintain appropriate
                security certifications and comply with applicable data
                protection standards.
              </li>
              <li>
                <strong className="text-foreground">d. Property Owners and Managers</strong>{" "}
                — Where you are a tenant or visitor, your personal data may be
                shared with the property owner or manager using the Product to
                manage the property you occupy or visit.
              </li>
              <li>
                <strong className="text-foreground">e. Regulatory and Law Enforcement Authorities</strong>{" "}
                — We may disclose your personal data to regulatory bodies, law
                enforcement agencies, or courts where required by law or to
                respond to valid legal processes, including: (i) Nigeria Data
                Protection Commission (NDPC), (ii) Central Bank of Nigeria
                (CBN), (iii) Nigeria Financial Intelligence Unit (NFIU), (iv)
                Law enforcement agencies in response to lawful requests.
              </li>
              <li>
                <strong className="text-foreground">f. Professional Advisors</strong>{" "}
                — We may share data with our professional advisors, including
                lawyers, auditors, and consultants, where necessary for the
                provision of professional services.
              </li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed sm:text-base">
              All third-party service providers with whom we share personal data
              are bound by Data Processing Agreements, or clauses in service
              contracts, requiring them to process your data only on our
              instructions and implement appropriate security measures.
            </p>
          </section>

          {/* 8. Data Retention */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              8. Data Retention
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              We retain your personal data only for as long as necessary to
              fulfil the purposes for which it was collected, comply with legal
              obligations, and resolve disputes. The following retention periods
              apply:
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[360px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Data Category
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Retention Period
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Basis
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Account Information", "Duration of account + 5 years", "Contractual purposes and legal compliance"],
                    ["KYC/Identity Verification Data", "5 years post-account termination", "Money Laundering (Prevention and Prohibition) Act 2022"],
                    ["Transaction Records", "Minimum 5 years post-transaction", "AML compliance; CBN regulations; tax requirements"],
                    ["Tenancy Records", "Duration of tenancy + 3 years", "Contractual and legal purposes"],
                    ["Visitor Log Data", "Maximum 12 months", "Security purposes; property management needs"],
                    ["Audit Logs", "5 years", "Security; compliance; fraud investigation"],
                    ["Marketing Consent Records", "Duration of consent + 2 years", "Evidence of consent"],
                    ["Technical/Usage Data", "Maximum 24 months", "Analytics and security purposes"],
                  ].map(([category, period, basis], i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">{category}</td>
                      <td className="px-4 py-3">{period}</td>
                      <td className="px-4 py-3">{basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-relaxed sm:text-base">
              Upon expiration of the retention period, personal data will be
              securely deleted or anonymised in accordance with our data
              disposal procedures. Where data must be retained for compliance
              purposes following account deletion, it will be archived securely
              with restricted access.
            </p>
          </section>

          {/* 9. Your Rights */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              9. Your Rights as a Data Subject
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              Under the NDPA 2023, you have the following rights in relation to
              your personal data:
            </p>
            <ul className="space-y-2 text-sm leading-relaxed sm:text-base">
              <li>• <strong className="text-foreground">Right to Request Confirmation</strong> — You have the right to request confirmation of whether we process your personal data and, if so, to request access to that data along with information about the processing.</li>
              <li>• <strong className="text-foreground">Right to Rectification</strong> — You have the right to request the correction of inaccurate or incomplete personal data we hold about you.</li>
              <li>• <strong className="text-foreground">Right to Erasure</strong> — You have the right to request the deletion of your personal data where it is no longer necessary, you withdraw consent, or there is no other legal ground for processing.</li>
              <li>• <strong className="text-foreground">Right to Restrict Processing</strong> — You have the right to request restriction of processing in certain circumstances.</li>
              <li>• <strong className="text-foreground">Right to Portability</strong> — You have the right to receive your personal data in a structured, commonly used, and machine-readable format.</li>
              <li>• <strong className="text-foreground">Right to Object to Processing</strong> — You have the right to object to processing based on legitimate interests, including profiling, and to processing for direct marketing purposes.</li>
              <li>• <strong className="text-foreground">Right to withdraw Consent</strong> — Where processing is based on consent, you have the right to withdraw your consent at any time.</li>
              <li>• <strong className="text-foreground">Right to Not be Subject to Full Automated Decision Making</strong> — You have the right not to be subject to decisions based solely on automated processing which produce legal effects or similarly significantly affect you.</li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed sm:text-base">
              To exercise any of these rights, please submit a request through:
              <br />
              • Email: info@bertandregroup.com
              <br />
              • In-App Request Form: Navigate to Settings &gt; Privacy &gt; Data Request
            </p>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              We will respond to your request within thirty (30) days of
              receipt. If your request is complex or we receive a high volume of
              requests, we may extend this period by an additional sixty (60)
              days, in which case we will notify you of the extension and the
              reasons.
            </p>
          </section>

          {/* 10. Data Security */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              10. Data Security
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              We implement appropriate technical and organisational measures to
              protect your personal data against unauthorised access, alteration,
              disclosure, or destruction. These measures include:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm sm:text-base">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure password hashing using industry-standard algorithms</li>
              <li>Multi-factor authentication for administrative access</li>
              <li>Role-based access controls and privileged access management</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Comprehensive audit logging of system activities</li>
              <li>Data loss prevention measures</li>
              <li>Employee training on data protection and information security</li>
              <li>Incident response procedures for data breaches</li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed sm:text-base">
              While we take extensive measures to protect your data, no method
              of electronic transmission or storage is completely secure. We
              cannot guarantee absolute security but commit to promptly
              addressing any security incidents in accordance with our Data
              Breach Incident Management procedures.
            </p>
          </section>

          {/* 11. International Data Transfers */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              11. International Data Transfers
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              Your personal data may be transferred to and processed in
              countries outside Nigeria where our service providers are
              located. Where such transfers occur, we ensure that appropriate
              safeguards are in place in compliance with the NDPA 2023,
              including:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm sm:text-base">
              <li>Transfer to countries deemed by the NDPC to have adequate data protection laws</li>
              <li>Standard contractual clauses approved by relevant data protection authorities</li>
              <li>Binding corporate rules, where applicable</li>
              <li>Your explicit consent where other safeguards are not available</li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed sm:text-base">
              You may request information about the specific safeguards applied
              to international transfers by contacting us using the details
              provided in this Notice.
            </p>
          </section>

          {/* 12. Children's Privacy */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              12. Children&apos;s Privacy
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              Our Product and services are not intended for use by individuals
              under the age of 18. We do not knowingly collect personal data
              from children. If we become aware that we have collected personal
              data from a child without appropriate parental consent, we will
              take steps to delete that information promptly. If you are a
              parent or guardian and believe your child has provided us with
              personal data, please contact us immediately using the details in
              this Notice.
            </p>
          </section>

          {/* 13. Updates */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              13. Updates to This Privacy Notice
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              We may update this Privacy Notice from time to time to reflect
              changes in our data processing practices, legal requirements, or
              business operations. When we make material changes, we will:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm sm:text-base">
              <li>Update the &quot;Last Updated&quot; date</li>
              <li>Notify you via email or through the Product where appropriate</li>
              <li>Where required by law, obtain your consent to the updated terms</li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed sm:text-base">
              We encourage you to review this Privacy Notice periodically to
              stay informed about how we protect your data.
            </p>
          </section>

          {/* 14. Complaints */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              14. Complaints
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              If you have concerns about how we process your personal data or
              believe we have not handled your data in accordance with this
              Notice or applicable law, you have the right to lodge a complaint.
              We encourage you to contact our Data Protection Officer first
              using the details provided in Section 2. We will investigate your
              complaint and respond within thirty (30) days.
            </p>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              If you are not satisfied with our response, you have the right to
              lodge a complaint with the Nigeria Data Protection Commission:
            </p>
            <div className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4">
              <table className="w-full min-w-[280px] text-sm">
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">
                      Regulatory Authority
                    </td>
                    <td className="py-2">Nigeria Data Protection Commission (NDPC)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">
                      Website
                    </td>
                    <td className="py-2">
                      <a
                        href="https://ndpc.gov.ng"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        https://ndpc.gov.ng
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">
                      Email
                    </td>
                    <td className="py-2">
                      <a
                        href="mailto:info@ndpc.gov.ng"
                        className="text-primary hover:underline"
                      >
                        info@ndpc.gov.ng
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">
                      Address
                    </td>
                    <td className="py-2">
                      12, Dr. Clement Isong Street, Asokoro, FCT, Abuja
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 15. Contact Us */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              15. Contact Us
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              If you have any questions, concerns, or requests regarding this
              Privacy Notice or our data processing practices, please contact us:
            </p>
            <ul className="mt-3 space-y-1 text-sm sm:text-base">
              <li>
                General Enquiries:{" "}
                <a
                  href="mailto:info@bertandregroup.com"
                  className="text-primary hover:underline"
                >
                  info@bertandregroup.com
                </a>
              </li>
              <li>
                Data Protection Officer:{" "}
                <a
                  href="mailto:dunsin.babatunde@bertandregroup.com"
                  className="text-primary hover:underline"
                >
                  dunsin.babatunde@bertandregroup.com
                </a>
              </li>
            </ul>
            <p className="mt-6 text-sm text-muted-foreground/80">
              For our Cookie Notice and Policy, please see our{" "}
              <Link
                href="/cookie-policy"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Cookie Notice & Policy
              </Link>
              .
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
