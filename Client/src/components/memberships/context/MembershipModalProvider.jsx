import { useState } from "react";

import FreezeMembershipModal from "../modals/FreezeMembershipModal";
import UnfreezeMembershipModal from "../modals/UnfreezeMembershipModal";
import PurchaseMembershipModal from "../modals/PurchaseMembershipModal";

function MembershipModalProvider({
  children,
  onFreeze,
  onUnfreeze,
  onPurchase,
}) {
  const [selectedMembership, setSelectedMembership] = useState(null);

  const [selectedPlan, setSelectedPlan] = useState(null);

  const [freezeOpen, setFreezeOpen] = useState(false);

  const [unfreezeOpen, setUnfreezeOpen] = useState(false);

  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const openFreeze = (membership) => {
    setSelectedMembership(membership);
    setFreezeOpen(true);
  };

  const openUnfreeze = (membership) => {
    setSelectedMembership(membership);
    setUnfreezeOpen(true);
  };

  const openPurchase = (plan) => {
    setSelectedPlan(plan);
    setPurchaseOpen(true);
  };

  const closeAll = () => {
    setFreezeOpen(false);
    setUnfreezeOpen(false);
    setPurchaseOpen(false);

    setSelectedMembership(null);
    setSelectedPlan(null);
  };

  const handleFreeze = async () => {
    try {
      await onFreeze(selectedMembership.id);

      closeAll();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUnfreeze = async () => {
    try {
      await onUnfreeze(selectedMembership.id);

      closeAll();
    } catch (error) {
      console.error(error);
    }
  };

  const handlePurchase = async () => {
    try {
      await onPurchase(selectedPlan.id);

      closeAll();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {children({
        openFreeze,
        openUnfreeze,
        openPurchase,
      })}

      <FreezeMembershipModal
        isOpen={freezeOpen}
        membership={selectedMembership}
        onClose={closeAll}
        onConfirm={handleFreeze}
      />

      <UnfreezeMembershipModal
        isOpen={unfreezeOpen}
        membership={selectedMembership}
        onClose={closeAll}
        onConfirm={handleUnfreeze}
      />

      <PurchaseMembershipModal
        isOpen={purchaseOpen}
        plan={selectedPlan}
        onClose={closeAll}
        onConfirm={handlePurchase}
      />
    </>
  );
}

export default MembershipModalProvider;
