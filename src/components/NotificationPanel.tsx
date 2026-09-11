import { useState, useMemo } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Task, Scheme, PHASE_SHORT } from '@/lib/types';
import { AlertTriangle, Clock, ChevronDown, ChevronRight, ExternalLink, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { differenceInDays, parseISO, format } from 'date-fns';

interface NotificationTask {
  task: Task;
  scheme: Scheme;
  daysUntilDue: number;
}

interface NotificationPanelProps {
  onClose: () => void;
  onNavigateToScheme: (schemeId: string) => void;
}

export default function NotificationPanel({ onClose, onNavigateToScheme }: NotificationPanelProps) {
  const { schemes, currentUserRole, currentUserName } = useWorkflowStore();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const today = new Date();

  const notifications = useMemo(() => {
    const results: NotificationTask[] = [];

    // For managers, show tasks across all schemes they oversee
    // For others, show tasks assigned to the current user
    schemes.forEach((scheme) => {
      if (!scheme.isAllocated) return;

      scheme.tasks.forEach((task) => {
        if (task.status === 'completed') return;

        // Check if this task is relevant to the current user
        let isRelevant = false;
        if (currentUserRole === 'manager') {
          // Managers see all tasks across allocated schemes
          isRelevant = true;
        } else {
          // Map role names to actual user names for matching
          const resolvedAssignees = task.assignedTo.map((role) => {
            if (role === 'Preparer') return scheme.preparer;
            if (role === 'Peer Reviewer') return scheme.peerReviewer;
            if (role === 'Team Lead') return scheme.teamLead;
            return role;
          });
          isRelevant = resolvedAssignees.includes(currentUserName);
        }

        if (!isRelevant) return;

        const dueDate = parseISO(task.dueDate);
        const daysUntilDue = differenceInDays(dueDate, today);

        // Include if overdue or due within 7 days
        if (daysUntilDue <= 7) {
          results.push({ task, scheme, daysUntilDue });
        }
      });
    });

    // Sort: overdue first (most overdue at top), then upcoming (soonest first)
    results.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    return results;
  }, [schemes, currentUserRole, currentUserName]);

  const overdue = notifications.filter((n) => n.daysUntilDue < 0);
  const upcoming = notifications.filter((n) => n.daysUntilDue >= 0);

  const handleNavigate = (schemeId: string) => {
    onNavigateToScheme(schemeId);
    onClose();
  };

  return (
    <div className="absolute left-56 top-0 z-50 w-96 h-full bg-card border-r border-border shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div>
          <h2 className="text-sm font-bold text-foreground">Notifications</h2>
          <p className="text-[10px] text-muted-foreground">
            {notifications.length} task{notifications.length !== 1 ? 's' : ''} requiring attention
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm font-medium">All clear!</p>
            <p className="text-xs">No tasks due within the next 7 days.</p>
          </div>
        ) : (
          <>
            {/* Overdue Section */}
            {overdue.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-4 py-2 bg-destructive/8 border-b">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-[11px] font-bold text-destructive">
                    Overdue ({overdue.length})
                  </span>
                </div>
                <div className="divide-y">
                  {overdue.map((n) => (
                    <NotificationItem
                      key={`${n.scheme.id}-${n.task.id}`}
                      notification={n}
                      isExpanded={expandedTaskId === n.task.id}
                      onToggle={() => setExpandedTaskId(expandedTaskId === n.task.id ? null : n.task.id)}
                      onNavigate={() => handleNavigate(n.scheme.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Section */}
            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-bold text-primary">
                    Due within 7 days ({upcoming.length})
                  </span>
                </div>
                <div className="divide-y">
                  {upcoming.map((n) => (
                    <NotificationItem
                      key={`${n.scheme.id}-${n.task.id}`}
                      notification={n}
                      isExpanded={expandedTaskId === n.task.id}
                      onToggle={() => setExpandedTaskId(expandedTaskId === n.task.id ? null : n.task.id)}
                      onNavigate={() => handleNavigate(n.scheme.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notification, isExpanded, onToggle, onNavigate }: {
  notification: NotificationTask;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const { task, scheme, daysUntilDue } = notification;
  const isOverdue = daysUntilDue < 0;

  const urgencyLabel = isOverdue
    ? `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`
    : daysUntilDue === 0
    ? 'Due today'
    : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} left`;

  return (
    <div className="hover:bg-muted/30 transition-colors">
      <button className="w-full text-left px-4 py-2.5 flex items-start gap-2.5" onClick={onToggle}>
        <div className="mt-0.5">
          {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-foreground truncate flex-1">{task.title}</span>
            <Badge
              variant="outline"
              className={`text-[9px] shrink-0 ${
                isOverdue ? 'border-destructive/50 text-destructive bg-destructive/5' : daysUntilDue <= 2 ? 'border-phase-audit/50 text-phase-audit bg-phase-audit/5' : ''
              }`}
            >
              {urgencyLabel}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {scheme.name} · {PHASE_SHORT[task.phase]}
          </p>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 ml-6">
          <div className="bg-muted/40 rounded-md p-2.5 space-y-1.5">
            <p className="text-[11px] text-foreground">{task.description}</p>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>Due: {format(parseISO(task.dueDate), 'dd MMM yyyy')}</span>
              <span>·</span>
              <span>{task.dueDateLabel}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] mt-1 gap-1"
              onClick={(e) => { e.stopPropagation(); onNavigate(); }}
            >
              <ExternalLink className="h-2.5 w-2.5" /> Go to scheme
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to get notification count for the bell badge
export function useNotificationCount(): number {
  const { schemes, currentUserRole, currentUserName } = useWorkflowStore();

  return useMemo(() => {
    if (currentUserRole === 'admin') return 0;

    const today = new Date();
    let count = 0;

    schemes.forEach((scheme) => {
      if (!scheme.isAllocated) return;
      scheme.tasks.forEach((task) => {
        if (task.status === 'completed') return;

        let isRelevant = false;
        if (currentUserRole === 'manager') {
          isRelevant = true;
        } else {
          const resolvedAssignees = task.assignedTo.map((role) => {
            if (role === 'Preparer') return scheme.preparer;
            if (role === 'Peer Reviewer') return scheme.peerReviewer;
            if (role === 'Team Lead') return scheme.teamLead;
            return role;
          });
          isRelevant = resolvedAssignees.includes(currentUserName);
        }

        if (!isRelevant) return;
        const daysUntilDue = differenceInDays(parseISO(task.dueDate), today);
        if (daysUntilDue <= 7) count++;
      });
    });

    return count;
  }, [schemes, currentUserRole, currentUserName]);
}
