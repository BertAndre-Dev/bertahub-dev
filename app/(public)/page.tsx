import LandingHome from "./landing";
import { LandingJsonLd } from "@/components/landing-page/landing-json-ld";
import { createLandingMetadata } from "@/lib/landing/seo";

export const metadata = createLandingMetadata();

export default function Home() {
  return (
    <>
      <LandingJsonLd />
      <LandingHome />
    </>
  );
}
