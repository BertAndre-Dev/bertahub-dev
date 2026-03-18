"use client";

import { useState } from "react";
import Navbar from "@/components/landing-page/navbar";
import HeroSection from "@/components/landing-page/heroSection";
import CallToActionSection from "@/components/landing-page/callToActionSection";
import FAQSection from "@/components/landing-page/faqSection";
import FeaturesShowcaseSection from "@/components/landing-page/featuresShowcaseSection";
import BertaShowcaseSection from "@/components/landing-page/bertaShowcaseSection";
import FeaturesSection from "@/components/landing-page/featuresSection";
import Footer from "@/components/landing-page/footer";
import BookDemoModal from "@/components/landing-page/BookDemoModal";
import TrustedBySection from "@/components/landing-page/trustedBy";

export default function Home() {
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar onOpenBookDemo={() => setIsBookDemoOpen(true)} />
      <main>
        <HeroSection onOpenBookDemo={() => setIsBookDemoOpen(true)} />
        <FeaturesShowcaseSection />
        <TrustedBySection />
        <FeaturesSection />
        <BertaShowcaseSection />
        <FAQSection />
        <CallToActionSection />
      </main>
      <Footer />
      <BookDemoModal
        isOpen={isBookDemoOpen}
        onClose={() => setIsBookDemoOpen(false)}
      />
    </div>
  );
}
