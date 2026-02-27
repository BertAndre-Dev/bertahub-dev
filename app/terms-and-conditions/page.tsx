import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageHeader } from "@/components/legal-pages/legal-page-header";

export const metadata: Metadata = {
  title: "Terms and Conditions | Berta Estate Hub",
  description: "Terms and Conditions for the Berta Estate Hub platform - Bertandre Consulting",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <LegalPageHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Terms and Conditions
        </h1>
        <p className="mb-8 text-sm text-muted-foreground sm:text-base">
          Effective Date: 5th of February, 2026
        </p>

        <article className="space-y-8 text-muted-foreground">
          <section>
            <p className="text-sm leading-relaxed sm:text-base">
              These Terms and Conditions (&quot;Terms&quot;) govern access to and
              use of the Berta Estate Hub platform, including its website, mobile
              applications, APIs, and related services (collectively, the
              &quot;Platform&quot;). The Platform is owned and operated by
              Bertandre Consulting (&quot;Platform Owner&quot;, &quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;).
            </p>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              By accessing or using the Platform, you agree to be bound by
              these Terms. If you do not agree, do not access or use the
              Platform.
            </p>
          </section>

          {/* 1. Platform Role & Disclaimer */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              1. Platform Role & Disclaimer of Liability
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  1.1 Technology Intermediary Only
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  Berta Estate Hub is a technology and information platform that
                  facilitates estate management, meter management, communication,
                  listings, payments (including escrow and installment tracking),
                  and engagement between estate developers, property owners,
                  tenants, buyers, and other users (collectively,
                  &quot;Users&quot;).
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  1.2 No Property Ownership or Agency Role
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  The Platform Owner is not a real estate developer, property
                  owner, landlord, agent, broker, lawyer, escrow agent, or
                  financial institution. We do not own, sell, lease, manage,
                  construct, inspect, finance, or warrant any property listed on
                  the Platform.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  1.3 No Responsibility for Property Transactions
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  All agreements, transactions, obligations, disputes, and
                  liabilities arising between estate developers, owners, tenants,
                  buyers, or any third party are strictly between those parties.
                  The Platform Owner bears no responsibility or liability for
                  such interactions.
                </p>
              </div>
            </div>
          </section>

          {/* 2. No Liability for Disputes */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              2. No Liability for Disputes
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  2.1 Third-Party Disputes
                </h3>
                <p className="mb-3 text-sm leading-relaxed sm:text-base">
                  Any dispute, claim, demand, loss, or damage arising between
                  Users, including but not limited to disputes between:
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm sm:text-base">
                  <li>Estate developers and buyers</li>
                  <li>Property owners and tenants</li>
                  <li>Developers and contractors</li>
                  <li>Buyers and tenants</li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed sm:text-base">
                  shall be resolved solely between the involved parties, without
                  involving the Platform Owner.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  2.2 Waiver of Claims
                </h3>
                <p className="mb-3 text-sm leading-relaxed sm:text-base">
                  You expressly waive any claim against the Platform Owner, its
                  directors, officers, employees, contractors, affiliates, or
                  partners arising from or related to:
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm sm:text-base">
                  <li>Property defects</li>
                  <li>Delayed construction or delivery</li>
                  <li>Estate Management</li>
                  <li>Misrepresentation by any User</li>
                  <li>Rental, lease, or ownership disputes</li>
                  <li>Payment defaults or refunds</li>
                  <li>Breach of contract by any User</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. No Warranties */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              3. No Warranties
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  3.1 As-Is Platform
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  The Platform is provided on an &quot;AS IS&quot; and &quot;AS
                  AVAILABLE&quot; basis without warranties of any kind, whether
                  express or implied.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  3.2 No Guarantee of Accuracy
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  We do not verify, guarantee, or warrant the accuracy, legality,
                  quality, safety, or completeness of: property listings; building
                  plans; pricing or payment schedules; user-submitted content.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  3.3 No Guarantee of Outcomes
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  We do not guarantee successful sales, rentals, construction
                  completion, investment returns, or tenant occupancy.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Payments, Escrow & Financial */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              4. Payments, Escrow & Financial Disclaimers
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  4.1 Third-Party Wallets & Payment Systems
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  All payment processing, wallet services, escrow functionality,
                  and installment collections on the Platform are provided and
                  operated exclusively by independent third-party payment
                  service providers. The Platform Owner does not own, operate,
                  control, or manage any wallet system, escrow account, or
                  payment infrastructure.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  4.2 No Custodial or Financial Institution Role
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  The Platform Owner does not act as a bank, financial
                  institution, money service business, payment processor,
                  trustee, or escrow agent, and does not hold, store, or take
                  custody of user funds at any time.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  4.3 Payment Authorization & Risk Assumption
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  By using the payment or wallet features, Users authorize such
                  third-party providers to process transactions in accordance
                  with their own terms and policies. All risks associated with
                  payments, including delays, failures, chargebacks, reversals,
                  fraud, or system downtime, are assumed by the Users and the
                  relevant third-party provider.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  4.4 Payment Disputes
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  Any dispute relating to payments, wallet balances, escrow
                  releases, or installment schedules shall be resolved solely
                  between the User, the relevant counterparty (estate developer,
                  owner, tenant, or buyer), and the third-party payment provider.
                  The Platform Owner shall not be a party to, or liable for,
                  such disputes.
                </p>
              </div>
            </div>
          </section>

          {/* 5. User Obligations */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              5. User Obligations
            </h2>
            <p className="mb-3 text-sm leading-relaxed sm:text-base">
              Users agree to:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm sm:text-base">
              <li>Provide accurate and lawful information</li>
              <li>Conduct independent due diligence before any transaction</li>
              <li>Comply with all applicable real estate, tenancy, tax, and financial laws</li>
              <li>Use the Platform only for lawful purposes</li>
            </ul>
          </section>

          {/* 6. Limitation of Liability */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              6. Limitation of Liability
            </h2>
            <p className="mb-3 text-sm leading-relaxed sm:text-base">
              To the maximum extent permitted by law, the Platform Owner shall
              not be liable for:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm sm:text-base">
              <li>Direct, indirect, incidental, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Property damage or personal injury</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              This limitation applies even if we were advised of the possibility
              of such damages.
            </p>
          </section>

          {/* 7. Indemnification */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              7. Indemnification
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              You agree to indemnify, defend, and hold harmless the Platform
              Owner and its affiliates from any claims, damages, losses,
              liabilities, costs, or expenses (including legal fees) arising
              from: your use of the Platform; your transactions with other Users;
              your violation of these Terms; your violation of any law or
              third-party rights.
            </p>
          </section>

          {/* 8. Content & IP */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              8. Content & Intellectual Property
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  8.1 User Content
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  Users retain ownership of their content but grant the Platform
                  Owner a non-exclusive, royalty-free license to use, display,
                  and distribute such content for Platform operations.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">
                  8.2 Platform IP
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  All Platform software, branding, design, and content are the
                  exclusive property of the Platform Owner. Unauthorized use is
                  prohibited.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Termination */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              9. Termination
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              We reserve the right to suspend or terminate any account at our
              sole discretion, without liability, for: breach of these Terms;
              fraudulent or unlawful activity; actions that expose the Platform
              Owner to legal or reputational risk.
            </p>
          </section>

          {/* 10. Regulatory Disclaimer */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              10. Regulatory & Legal Compliance Disclaimer
            </h2>
            <p className="mb-3 text-sm leading-relaxed sm:text-base">
              Users are solely responsible for ensuring compliance with: local
              real estate laws; tenancy and landlord regulations; building and
              planning approvals; tax obligations.
            </p>
            <p className="text-sm leading-relaxed sm:text-base">
              The Platform Owner does not provide legal, tax, or regulatory
              advice.
            </p>
          </section>

          {/* 11. Force Majeure */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              11. Force Majeure
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              The Platform Owner shall not be liable for failure or delay
              caused by events beyond reasonable control, including acts of God,
              government actions, strikes, system failures, or network outages.
            </p>
          </section>

          {/* 12. Governing Law */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              12. Governing Law & Jurisdiction
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              These Terms shall be governed by and construed in accordance with
              the laws of the Federal Republic of Nigeria, without regard to
              conflict of law principles.
            </p>
          </section>

          {/* 13. Changes to Terms */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              13. Changes to Terms
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              We may update these Terms at any time. Continued use of the
              Platform constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* 14. Entire Agreement */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              14. Entire Agreement
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              These Terms constitute the entire agreement between you and the
              Platform Owner and supersede all prior agreements or
              understandings.
            </p>
          </section>

          {/* 15. Contact */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              15. Contact Information
            </h2>
            <p className="mb-3 text-sm leading-relaxed sm:text-base">
              For questions regarding these Terms, contact:
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="font-medium text-foreground">Bertandre Consulting</p>
              <a
                href="mailto:info@bertandregroup.com"
                className="text-primary hover:underline"
              >
                info@bertandregroup.com
              </a>
            </div>
            <p className="mt-6 text-sm">
              <Link
                href="/privacy-notice"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Privacy Notice
              </Link>
              {" · "}
              <Link
                href="/cookie-policy"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Cookie Notice & Policy
              </Link>
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
