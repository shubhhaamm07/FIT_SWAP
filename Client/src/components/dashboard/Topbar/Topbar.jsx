import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";

function Topbar() {
  return (
    <header
      className="
        h-[60px]
        flex
        items-center
        justify-between
        mb-6
      "
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
