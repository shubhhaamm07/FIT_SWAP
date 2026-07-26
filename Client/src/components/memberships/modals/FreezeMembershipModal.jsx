import { Snowflake } from "lucide-react";
import { useState } from "react";

import Modal from "../../ui/Modal";
import Button from "../../ui/Button";

function FreezeMembershipModal({ isOpen, membership, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleFreeze = async () => {
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

  if (!membership) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
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
            bg-sky-500/10
          "
        >
          <Snowflake size={32} className="text-sky-400" />
        </div>

        <h2 className="mt-6 text-2xl font-bold">Freeze Membership</h2>

        <p className="mt-3 text-zinc-400 leading-7">
          Are you sure you want to temporarily freeze your
          <span className="font-semibold text-white">
            {" "}
            {membership.plan.name}
          </span>
          ?
        </p>

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

          <Button onClick={handleFreeze} disabled={loading}>
            {loading ? "Freezing..." : "Freeze Membership"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default FreezeMembershipModal;
