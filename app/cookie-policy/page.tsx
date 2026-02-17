import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageHeader } from "@/components/legal-pages/legal-page-header";

export const metadata: Metadata = {
  title: "Cookie Notice & Policy | BertAndre Estate Management",
  description: "Cookie notice and policy for BertAndre Consulting Limited",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <LegalPageHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Cookie Notice
        </h1>
        <p className="mb-8 text-sm text-muted-foreground sm:text-base">
          BertAndre Consulting Limited
        </p>

        <article className="space-y-8 text-muted-foreground">
          {/* Cookie Notice Section */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Cookie Notice
            </h2>
            <ul className="space-y-3 text-sm leading-relaxed sm:text-base">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">a.</span>
                <span>
                  The objective of this policy is to communicate what cookies
                  are, how our organization uses cookies, and the options
                  available to you for managing cookies when using our website.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">b.</span>
                <span>
                  When you first visit our site, you will be presented with a
                  consent notice that gives you the option to{" "}
                  <span className="font-bold text-foreground">Accept All</span>,{" "}
                  <span className="font-bold text-foreground">
                    Reject All
                  </span>
                  , or{" "}
                  <span className="font-bold text-foreground">
                    customize your preferences via Cookie Settings
                  </span>
                  . All, or customize your preferences via Cookie Settings.
                </span>
              </li>
            </ul>
          </section>

          {/* How We Use Cookies */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              2. How We Use Cookies
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              <span className="font-medium text-foreground">a.</span> We use
              cookies to give you a better and more inclusive customer
              experience. We only use your information in accordance with NDPA
              and other applicable regulations, as explained in our Cookie
              Policy.
            </p>
          </section>

          {/* Cookie Policy Header */}
          <div className="border-t border-border pt-8">
            <h1 className="mb-6 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Cookie Policy
            </h1>
            <p className="mb-8 text-sm font-medium text-muted-foreground">
              BertAndre Consulting Limited
            </p>
          </div>

          {/* Table of Contents */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Table of Contents
            </h2>
            <ul className="list-inside list-disc space-y-1 text-sm sm:text-base">
              <li>Record of Change</li>
              <li>Introduction</li>
              <li>What are Cookies?</li>
              <li>Types of Cookies and how we use them</li>
              <li>Keeping Your Personal Information Safe</li>
              <li>Cookie Preferences</li>
              <li>Cookie Consent</li>
              <li>Review</li>
              <li>Policy Compliance</li>
            </ul>
          </section>

          {/* Record of Change */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Record of Change
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              A description of any changes to the document are to be entered
              here.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[300px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Version
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Reviewed by
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Key changes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3">1.0</td>
                    <td className="px-4 py-3">01/12/2025</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Introduction */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Introduction
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              The objective of this policy is to communicate what cookies are,
              how BertAndre Consulting Limited uses cookies and the options
              available to customers for managing cookies when using BertAndre
              Consulting Limited&apos;s website.
            </p>
          </section>

          {/* What are Cookies? */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              What are Cookies?
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              A cookie is a small text file that is sent to and stored in the
              browser directories of your device (smartphone or PC). Cookies can
              be used for a variety of purposes such as identifying users,
              keeping track of preferences and activity (e.g. Language,
              Currency, IP address used and Time zone).
            </p>
          </section>

          {/* Types of Cookies */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Types of Cookies and how we use them
            </h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h3 className="mb-2 font-medium text-foreground">
                  Session Cookies
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  Session cookies are cookies that expire when you end the
                  session (leave the site or close your browser). Session
                  cookies are used to store certain information while you use
                  the site that makes navigation and your experience on our site
                  easier and more convenient.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h3 className="mb-2 font-medium text-foreground">
                  Persistent Cookies
                </h3>
                <p className="text-sm leading-relaxed sm:text-base">
                  Persistent cookies are cookies that remain stored on your
                  device until their expiry dates are exceeded or until they are
                  deleted. They are used to store preferences so that the
                  website can remember your choices the next time you access the
                  site. They are used to provide a more customized experience to
                  you whenever you access our website.
                </p>
              </div>
              <p className="text-sm leading-relaxed sm:text-base">
                In addition to the above types, if you follow a link from our
                website to another website, please be aware that the owner of
                the other website will have their own privacy and cookie
                policies for their site. Please check the relevant third-party
                website for more information on their use of cookies.
              </p>
            </div>
          </section>

          {/* Keeping Your Personal Information Safe */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Keeping Your Personal Information Safe
            </h2>
            <ul className="space-y-2 text-sm leading-relaxed sm:text-base">
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  Our cookies do not store personal or sensitive information;
                  they simply hold a unique random reference to you so that once
                  you visit the site we can recognize who you are and provide
                  certain content to you.
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  The cookies we use cannot read or search your computer or
                  mobile device to obtain information about you or your family,
                  or read any material kept on your device.
                </span>
              </li>
            </ul>
          </section>

          {/* Cookie Preferences */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Cookie Preferences
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              Various browsers have different methods of managing cookies
              (including disabling options). However, you should note that some
              cookies are essential and disabling them may result in some
              functions or services not functioning properly.
            </p>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              For more information on how to manage cookies, please refer to:{" "}
              <a
                href="https://www.aboutcookies.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                https://www.aboutcookies.org
              </a>{" "}
              for detailed guidance on how to control, disable or delete
              cookies.
            </p>
          </section>

          {/* Cookie Consent */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Cookie Consent
            </h2>
            <p className="mb-4 text-sm leading-relaxed sm:text-base">
              In compliance with the extant Data Protection Regulations like the
              Nigerian Data Protection Act (NDPA), and other applicable
              regulations, websites associated with our organization provide
              consent notices that give customers the option to either accept,
              reject or manage their preferences (i.e adjust their cookie
              consent) and also get more detailed information about our cookies.
            </p>
            <p className="mb-3 text-sm leading-relaxed sm:text-base">
              BertAndre Consulting Limited has classified the cookies we collect
              into two:
            </p>
            <ul className="space-y-3 text-sm leading-relaxed sm:text-base">
              <li>
                <strong className="text-foreground">
                  Essential (Required):
                </strong>{" "}
                These are cookies that the site cannot function properly
                without. This includes cookies for access to secure areas and
                security features. Essential cookies do not collect personal or
                sensitive information and are not used for tracking purposes.
                Examples include session identifiers and security tokens that
                protect against malicious activity.
              </li>
              <li>
                <strong className="text-foreground">Non-essential:</strong>{" "}
                These are cookies that may not be strictly necessary for the
                website to function but are used to enhance user experience,
                collect analytics, or support advertising. Non-essential cookies
                are only placed on your device with your consent. Examples
                include analytics cookies that help us understand how users
                interact with our site and advertising cookies used to display
                relevant content.
              </li>
            </ul>
          </section>

          {/* Review */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Review
            </h2>
            <p className="text-sm leading-relaxed sm:text-base">
              This policy will be subject to annual review to reflect any
              changes in cookie usage, technology or legal requirements.
            </p>
          </section>

          {/* Policy Compliance */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Policy Compliance
            </h2>
            <ul className="space-y-2 text-sm leading-relaxed sm:text-base">
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  BertAndre Consulting Limited will verify compliance of this
                  policy through various means which include but are not limited
                  to internal and external audits and business reporting tools.
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  Any justifiable exceptions to this policy must be approved in
                  advance by management.
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  An employee found to have violated this policy may be subject
                  to disciplinary action, up to and including termination of
                  employment.
                </span>
              </li>
            </ul>
          </section>

          {/* Link to Privacy Notice */}
          <section className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm leading-relaxed sm:text-base">
              For more details on how we handle your personal data, please see
              our{" "}
              <Link
                href="/privacy-notice"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Privacy Notice
              </Link>
              .
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
