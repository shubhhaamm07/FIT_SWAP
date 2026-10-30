import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "./DashboardLayout";
import PublicLayout from "./PublicLayout";

export default function BrowseLayout({ children, rightSidebar }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated
    ? <DashboardLayout rightSidebar={rightSidebar}>{children}</DashboardLayout>
    : <PublicLayout>{children}</PublicLayout>;
}
