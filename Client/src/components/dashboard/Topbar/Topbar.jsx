import { useLocation } from "react-router-dom";
import { Heart, MessageSquare } from "lucide-react";

import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";

import { pageConfig } from "./pageConfig";

function Topbar({ actions = null }) {
  const { pathname } = useLocation();

  const currentPage = pageConfig[pathname] || {
    title: "Dashboard",
    description: "Welcome back!",
  };
  const marketplace = pathname === "/marketplace";

  return (
    <header className={`flex flex-col gap-4 border-b border-white/[0.08] pb-4 lg:flex-row lg:items-center ${marketplace ? "lg:justify-end" : "lg:justify-between"}`}>
      {!marketplace && <div>
        <h1 className="text-3xl font-bold text-white">{currentPage.title}</h1>

        <p className="mt-1 text-sm text-zinc-400">{currentPage.description}</p>
      </div>}

      <div className={`flex items-center gap-3 ${marketplace ? "w-full" : "flex-1 justify-end"}`}>
        <div className={`hidden w-full ${marketplace ? "max-w-[490px]" : "max-w-md"} lg:block`}>
          <SearchBar />
        </div>

        {actions}

        <NotificationBell count={2} />

        {marketplace && <><button aria-label="Saved listings" className="hidden h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/5 lg:flex"><Heart size={19} /></button><button aria-label="Messages" className="hidden h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/5 lg:flex"><MessageSquare size={19} /></button></>}

        <UserMenu />
      </div>
    </header>
  );
}

export default Topbar;
