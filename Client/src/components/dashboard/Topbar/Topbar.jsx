import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";

function Topbar() {
  return (
    <header
      className="flex h-14 w-full items-center justify-between gap-4"
    >
      <SearchBar />

      <div className="flex items-center gap-3">
        <NotificationBell count={2} />

        <UserMenu />
      </div>
    </header>
  );
}

export default Topbar;
