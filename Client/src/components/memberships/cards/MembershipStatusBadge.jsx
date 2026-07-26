import { getMembershipStatus } from "../utils/membershipStatus";

function MembershipStatusBadge({ status }) {
  const badge = getMembershipStatus(status);

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-3
        py-1
        text-xs
        font-semibold

        ${badge.bg}
        ${badge.text}
        ${badge.border}
      `}
    >
      {badge.label}
    </span>
  );
}

export default MembershipStatusBadge;
