import { HeroSection } from "@/components/home/HeroSection";
import { ProtocolGateway } from "@/components/home/ProtocolGateway";
import { HowItWorks } from "@/components/home/HowItWorks";
import { OniSection } from "@/components/home/OniSection";
import { CallToAction } from "@/components/home/CallToAction";
import { Footer } from "@/components/layout/Footer";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <ProtocolGateway />
      <OniSection />
      <CallToAction />
      <Footer />
    </>
  );
}
