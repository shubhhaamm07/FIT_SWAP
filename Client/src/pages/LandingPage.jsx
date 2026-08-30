import { useEffect, useState } from "react";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/landing/HeroSection";
import WhyFitSwapSection from "../components/landing/WhyFitSwapSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import MarketplacePreview from "../components/landing/MarketplacePreview";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";
import ResearchInnovationSection from "../components/landing/ResearchInnovationSection";
import FadeInSection from "../components/common/FadeInSection";
import { getAllGyms } from "../api/gym.api";
import { getMarketplaceListings } from "../api/marketplace.api";

function LandingPage() {
  const [listings, setListings] = useState([]);
  const [gymCount, setGymCount] = useState(0);

  useEffect(() => {
    const loadPublicData = async () => {
      try {
        const [gyms, marketplaceListings] = await Promise.all([
          getAllGyms(),
          getMarketplaceListings(),
        ]);
        setGymCount(gyms.length);
        setListings(marketplaceListings);
      } catch {
        setGymCount(0);
        setListings([]);
      }
    };

    void loadPublicData();
  }, []);

  return (
    <div className="site-shell fitswap-web3 bg-[#0B0B0F] text-white">
      <Navbar />

      <FadeInSection>
        <HeroSection gymCount={gymCount} listingCount={listings.length} />
      </FadeInSection>
      {/* <FadeInSection>
        <StatsSection gymCount={gymCount} listingCount={listings.length} />
      </FadeInSection> */}
      <FadeInSection>
        <WhyFitSwapSection />
      </FadeInSection>
      <FadeInSection>
        <HowItWorksSection />
      </FadeInSection>
      <FadeInSection>
        <MarketplacePreview listings={listings} />
      </FadeInSection>

      <FadeInSection>
        <ResearchInnovationSection />
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
