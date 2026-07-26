import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getListingById } from "../../api/marketplace.api";

import ImageGallery from "../../components/marketplace/details/ImageGallery";
import MembershipInfo from "../../components/marketplace/details/MembershipInfo";
import SellerInfo from "../../components/marketplace/details/SellerInfo";
import GymInfo from "../../components/marketplace/details/GymInfo";
import PriceBreakdown from "../../components/marketplace/details/PriceBreakdown";
import TransferPolicy from "../../components/marketplace/details/TransferPolicy";
import PurchaseCard from "../../components/marketplace/details/PurchaseCard";

const ListingDetailsPage = () => {
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadListing = async () => {
      try {
        setError("");
        setListing(await getListingById(listingId));
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load this listing.");
      }
    };

    loadListing();
  }, [listingId]);

  if (!listing && !error) {
    return <div className="py-24 text-center text-zinc-400">Loading listing…</div>;
  }

  if (!listing) {
    return (
      <div className="py-24 text-center text-white">{error || "Listing not found."}</div>
    );
  }

  const images = [listing.image, listing.image, listing.image, listing.image];

  return (
    <div className="space-y-8">
      <ImageGallery images={images} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <MembershipInfo listing={listing} />

          <SellerInfo listing={listing} />

          <GymInfo listing={listing} />

          <TransferPolicy listing={listing} />

          <PriceBreakdown listing={listing} />
        </div>

        <div className="col-span-12 xl:col-span-4">
          <PurchaseCard listing={listing} />
        </div>
      </div>
    </div>
  );
};

export default ListingDetailsPage;
