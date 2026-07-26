import { CreditCard } from "lucide-react";
import { useState } from "react";

import Modal from "../../ui/Modal";
import Button from "../../ui/Button";

function PurchaseMembershipModal({ isOpen, plan, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    try {
      setLoading(true);

      await onConfirm();

      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="text-center">
        <div
          className="
            mx-auto
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-full
            bg-violet-500/10
          "
        >
          <CreditCard size={32} className="text-violet-400" />
        </div>

        <h2 className="mt-6 text-2xl font-bold">Purchase Membership</h2>

        <p className="mt-3 text-zinc-400 leading-7">
          You're about to purchase
          <span className="font-semibold text-white"> {plan.name}</span>.
        </p>

        <div
          className="
            mt-8
            rounded-2xl
            border
            border-white/10
            bg-[#16161F]
            p-5
            text-left
            space-y-3
          "
        >
          <div className="flex justify-between">
            <span className="text-zinc-400">Gym</span>

            <span className="font-medium">{plan.gym?.name}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Duration</span>

            <span className="font-medium">{plan.durationMonths} Months</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Price</span>

            <span className="font-semibold text-violet-400">₹{plan.price}</span>
          </div>
        </div>

        <div
          className="
            mt-8
            flex
            justify-end
            gap-3
          "
        >
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button onClick={handlePurchase} disabled={loading}>
            {loading ? "Processing..." : "Purchase Membership"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PurchaseMembershipModal;
