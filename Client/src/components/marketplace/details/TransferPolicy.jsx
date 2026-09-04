import { BadgeCheck, CircleDollarSign, Clock3, ShieldCheck } from "lucide-react";

const TransferPolicy = ({ listing }) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#11131A] p-6">
      <h2 className="mb-6 text-2xl font-bold text-white">Transfer Policy</h2>

      <div className="space-y-5">
        <div className="flex justify-between">
          <span className="text-zinc-400">Transfer Status</span>

          <span className="flex items-center gap-2 text-green-400">
            <BadgeCheck size={16} />
            Active listing
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Minimum remaining days</span>

          <span className="flex items-center gap-2 text-white">
            <Clock3 size={16} />
            {listing.minimumTransferDays} days
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Handover approval</span>
          <span className="flex items-center gap-2 text-right text-white"><ShieldCheck size={16} />{listing.requiresGymApproval ? "Gym owner required" : "Seller confirmation"}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Available methods</span>
          <span className="text-right text-white">{[listing.allowOnlinePayment && "UPI", listing.allowCashTransfer && "Cash"].filter(Boolean).join(" + ") || "Contact gym"}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Transfer Fee</span>

          <span className="flex items-center gap-2 text-white">
            <CircleDollarSign size={16} />₹{listing.transferFee}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransferPolicy;
