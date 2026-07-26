import DashboardLayout from "../../layouts/DashboardLayout";

import MembershipSection from "../../components/memberships/sections/MembershipSection";

function MembershipsPage() {
  return (
    <DashboardLayout>
      <main
        className="
          relative
          min-h-screen
          overflow-hidden
          bg-[#09090B]
        "
      >
        {/* Background Glow */}

        <div
          className="
            absolute
            -top-40
            -left-40
            h-[520px]
            w-[520px]
            rounded-full
            bg-violet-600/10
            blur-[140px]
          "
        />

        <div
          className="
            absolute
            top-60
            right-0
            h-[450px]
            w-[450px]
            rounded-full
            bg-fuchsia-600/10
            blur-[140px]
          "
        />

        {/* Grid */}

        <div
          className="
            absolute
            inset-0
            opacity-[0.03]
            [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]
            [background-size:52px_52px]
          "
        />

        {/* Content */}

        <div
          className="
            relative
            mx-auto
            w-full
            
            px-10
            py-10
            2xl:px-16
          "
        >
          <MembershipSection />
        </div>
      </main>
    </DashboardLayout>
  );
}

export default MembershipsPage;
