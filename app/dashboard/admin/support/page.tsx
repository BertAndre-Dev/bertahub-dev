// "use client";

// import ContactSupportPage from "@/components/support/ContactSupportPage";

// export default function AdminSupportPage() {
//   return <ContactSupportPage />;
// }

"use client";

import Image from "next/image";

export default function ComingSoon() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center  px-6 mt-10 lg:mt-0">
      <div className="text-center max-w-md w-full">
        {/* Logo / Name */}
        <div className="flex flex-col gap-2 items-center justify-center">
          <Image src="/chat-Logo.svg" alt="Berta Hub" width={140} height={48} />
          <h1 className="text-3xl md:text-4xl font-bold text-blue-600">
            Support Inbox - Berta Hub
          </h1>
        </div>

        {/* Message */}
        <p className="mt-3 text-gray-600 text-sm md:text-base">
          We’re working on something great. Launching soon.
        </p>

        {/* Divider */}
        <div className="w-12 h-1 bg-blue-600 mx-auto mt-6 rounded-full" />
      </div>
    </main>
  );
}
