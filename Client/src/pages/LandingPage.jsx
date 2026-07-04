import Navbar from "../components/common/Navbar";
// import heroImage from "../assets/images/hero.png";
import WorkflowCard from "../components/common/WorkflowCard";
import HeroSection from "../components/landing/HeroSection";
import StatsSection from "../components/landing/StatsSection";
import WhyFitSwapSection from "../components/landing/WhyFitSwapSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import MarketplacePreview from "../components/landing/MarketplacePreview";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";
import Arrow from "../components/common/Arrow";
import FadeInSection from "../components/common/FadeInSection";
import CountUp from "react-countup";
import { motion } from "framer-motion";
function LandingPage() {
  return (
    <div className="bg-[#0B0B0F] text-white">
      <Navbar />

      <FadeInSection>
        <HeroSection />
      </FadeInSection>
      <FadeInSection>
        <WhyFitSwapSection />
      </FadeInSection>
      <FadeInSection>
        <HowItWorksSection />
      </FadeInSection>
      <FadeInSection>
        <MarketplacePreview />
      </FadeInSection>

      {/* <FadeInSection>
        <section className="py-24 bg-[#0B0B0F]">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold">
                Secure
                <span className="text-violet-500"> Membership Transfer</span>
              </h2>

              <p className="text-zinc-400 mt-5">
                Every transfer follows a verified workflow.
              </p>
            </div>

            <div
              className="
        flex
        flex-col
        md:flex-row
        items-center
        justify-between
        gap-6
      "
            >
              <WorkflowCard title="Seller" desc="Lists Membership" />

              <Arrow />

              <WorkflowCard title="Buyer" desc="Sends Request" />

              <Arrow />

              <WorkflowCard title="Approval" desc="Seller Approves" />

              <Arrow />

              <WorkflowCard title="Transfer" desc="Ownership Updated" />

              <Arrow />

              <WorkflowCard title="Completed" desc="Membership Received" />
            </div>
          </div>
        </section>
      </FadeInSection> */}
      <FadeInSection>
        <CTASection />
      </FadeInSection>
      <FadeInSection>
        <Footer />
      </FadeInSection>
    </div>
  );
}

export default LandingPage;
