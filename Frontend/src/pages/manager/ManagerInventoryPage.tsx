import AdminInventoryPage from "../admin/AdminInventoryPage";

interface ManagerInventoryPageProps {
  onNavigate: (page: string) => void;
}

export default function ManagerInventoryPage({ onNavigate }: ManagerInventoryPageProps) {
  return <AdminInventoryPage onNavigate={onNavigate} role="manager" activePage="manager-inventory" />;
}
