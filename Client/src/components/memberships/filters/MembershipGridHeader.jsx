function MembershipGridHeader({ total }) {
  return (
    <div
      className="flex items-center justify-between"
    >
      <div>
        <p className="text-sm text-zinc-400">Showing {total === 0 ? 0 : 1} to {total} of {total} memberships</p>
      </div>
    </div>
  );
}

export default MembershipGridHeader;
