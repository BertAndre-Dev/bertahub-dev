import Navbar from "@/components/landing-page/navbar";
import HeroSection from "@/components/landing-page/heroSection";
import FAQSection from "@/components/landing-page/faqSection";
import BlogSection from "@/components/landing-page/blogSection";
import BertaShowcaseSection from "@/components/landing-page/bertaShowcaseSection";
import FeaturesSection from "@/components/landing-page/featuresSection";
import PlansSection from "@/components/landing-page/plansSection";
import Footer from "@/components/landing-page/footer";
import TrustedBySection from "@/components/landing-page/trustedBy";
import EverythingYouNeedSection from "@/components/landing-page/everythingYouNeedSection";
import EstateManagementShowcase from "@/components/marketing/EstateManagementShowcase";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-3 mt-3 overflow-hidden rounded-[24px] border border-[#D0D5DD] bg-white sm:mx-5 sm:mt-5 sm:rounded-[32px] lg:mx-8 lg:rounded-[36px]">
        <Navbar embedded />
        <HeroSection />
      </div>

      <main>
        <TrustedBySection />
        <EverythingYouNeedSection />
        <EstateManagementShowcase />
        <BertaShowcaseSection />

        <FeaturesSection />
        <PlansSection />
        <FAQSection />
        <BlogSection />
      </main>
      <Footer />
    </div>
  );
}
