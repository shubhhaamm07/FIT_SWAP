import { Eye, Play, Snowflake, Store } from "lucide-react";

import { useNavigate } from "react-router-dom";

import Button from "../../ui/Button";

function MembershipActions({ membership, onFreeze, onUnfreeze, onTransfer }) {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/memberships/${membership.id}`);
  };

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Button variant="secondary" onClick={handleView}>
        <Eye size={16} />

        <span>View</span>
      </Button>

      {membership.status === "ACTIVE" && (
        <>
          <Button onClick={() => onFreeze(membership)}>
            <Snowflake size={16} />

            <span>Freeze</span>
          </Button>

          {membership.plan?.transferable && (
            <Button
              variant="secondary"
              onClick={() => onTransfer(membership.plan)}
            >
              <Store size={16} />

              <span>Sell</span>
            </Button>
          )}
        </>
      )}

      {membership.status === "FROZEN" && (
        <Button onClick={() => onUnfreeze(membership)}>
          <Play size={16} />

          <span>Resume</span>
        </Button>
      )}
    </div>
  );
}

export default MembershipActions;
