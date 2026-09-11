import { useState } from 'react';
import { LayoutDashboard, Settings, Bell, UserCircle, Users, Database } from 'lucide-react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { UserRole, USER_ROLE_LABELS } from '@/lib/types';
import { seniorManagers } from '@/lib/mock-data';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import NotificationPanel, { useNotificationCount } from '@/components/NotificationPanel';

const roleUsers: Record<UserRole, string[]> = {
  'preparer': ['Alice Chen', 'Ben Martinez', 'Claire O\'Brien', 'David Osei', 'Emma Wright',
    'James Wilson', 'Kate Morgan', 'Liam Taylor', 'Nina Patel', 'Oliver Brown'],
  'peer-reviewer': ['Rachel Adams', 'Sam Frost', 'Tanya Shah', 'Will Cooper', 'Zara Hussain'],
  'team-lead': ['Fiona Grant', 'George Patel', 'Hannah Kim', 'Robert Clarke', 'Sarah Jennings'],
  'manager': seniorManagers,
  'admin': ['System Admin'],
};

export default function AppSidebar() {
  const { currentUserRole, currentUserName, setCurrentUserRole, setCurrentUserName, showTeamManagement, setShowTeamManagement, showSchemeManagement, setShowSchemeManagement, setSelectedScheme, showNotifications, setShowNotifications } = useWorkflowStore();
  const notificationCount = useNotificationCount();

  const handleRoleChange = (role: UserRole) => {
    setCurrentUserRole(role);
    setCurrentUserName(roleUsers[role][0]);
  };

  const handleNavigateToScheme = (schemeId: string) => {
    setShowTeamManagement(false);
    setShowSchemeManagement(false);
    setSelectedScheme(schemeId);
  };

  const showBell = currentUserRole !== 'admin';

  return (
    <>
      <aside className="hidden lg:flex w-56 flex-col py-5 bg-sidebar text-sidebar-foreground border-r border-sidebar-border relative z-50">
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
              TSA
            </div>
            <span className="text-sm font-bold">Trustee Scheme Accounting</span>
          </div>
        </div>

        {/* Role switcher */}
        <div className="px-3 mb-4">
          <label className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-1 mb-1 block">View as</label>
          <Select value={currentUserRole} onValueChange={(v) => handleRoleChange(v as UserRole)}>
            <SelectTrigger className="h-8 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(USER_ROLE_LABELS) as UserRole[]).map((r) => (
                <SelectItem key={r} value={r} className="text-xs">{USER_ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User switcher */}
        <div className="px-3 mb-6">
          <label className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-1 mb-1 block">User</label>
          <Select value={currentUserName} onValueChange={setCurrentUserName}>
            <SelectTrigger className="h-8 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleUsers[currentUserRole].map((name) => (
                <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          <button
            onClick={() => { setShowTeamManagement(false); setShowSchemeManagement(false); setShowNotifications(false); setSelectedScheme(null); }}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              !showTeamManagement && !showSchemeManagement ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          {(currentUserRole === 'manager' || currentUserRole === 'admin') && (
            <button
              onClick={() => { setShowNotifications(false); setShowTeamManagement(true); }}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                showTeamManagement ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Teams</span>
            </button>
          )}
          {currentUserRole === 'admin' && (
            <button
              onClick={() => { setShowNotifications(false); setShowSchemeManagement(true); }}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                showSchemeManagement ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Scheme Master</span>
            </button>
          )}
          {showBell && (
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors relative ${
                showNotifications ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <div className="relative">
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </div>
              <span>Notifications</span>
            </button>
          )}
          <button
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium hover:bg-sidebar-accent transition-colors text-sidebar-foreground/80 hover:text-sidebar-foreground"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="mt-auto px-3 pt-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2">
            <UserCircle className="h-5 w-5 text-sidebar-foreground/60" />
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{currentUserName}</div>
              <div className="text-[10px] text-sidebar-foreground/50">{USER_ROLE_LABELS[currentUserRole]}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel
          onClose={() => setShowNotifications(false)}
          onNavigateToScheme={handleNavigateToScheme}
        />
      )}
    </>
  );
}
