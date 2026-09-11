import { useWorkflowStore } from '@/lib/workflow-store';
import AppSidebar from '@/components/AppSidebar';
import Dashboard from '@/components/Dashboard';
import SchemeDetail from '@/components/SchemeDetail';
import TeamManagement from '@/components/TeamManagement';
import SchemeManagement from '@/components/SchemeManagement';

const Index = () => {
  const { selectedSchemeId, showTeamManagement, showSchemeManagement } = useWorkflowStore();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      {showSchemeManagement ? (
        <SchemeManagement />
      ) : showTeamManagement ? (
        <TeamManagement />
      ) : selectedSchemeId ? (
        <SchemeDetail />
      ) : (
        <Dashboard />
      )}
    </div>
  );
};

export default Index;
