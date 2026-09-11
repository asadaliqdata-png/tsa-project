import { useState, useMemo } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { getTeamLeadForPreparer } from '@/lib/mock-data';
import { PHASE_SHORT, Phase, USER_ROLE_LABELS, QUESTIONNAIRE_QUESTIONS } from '@/lib/types';
import { Search, ListChecks, LayoutGrid, Clock, CheckCircle2, AlertTriangle, BarChart3, Users, TrendingUp, FileText, ChevronDown, ChevronUp, Circle, Mail, MessageSquare, Send, UserCircle, Eye, Shield, Calendar, Filter, Edit2 } from 'lucide-react';
import TaskCard from '@/components/TaskCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';
import { format, isPast, parseISO, differenceInDays, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { Scheme } from '@/lib/types';

const phaseColors: Record<Phase, string> = {
  'not-started': 'phase-badge-not-started',
  'planning': 'phase-badge-planning',
  'peer-review': 'phase-badge-peer-review',
  'audit-process': 'phase-badge-audit',
  'audit-sign-off': 'phase-badge-sign-off',
  'completed': 'phase-badge-completed',
};

const phaseRingColors: Record<string, string> = {
  'pending-allocation': 'ring-destructive border-destructive',
  'planning': 'ring-primary border-primary',
  'peer-review': 'ring-[hsl(280,65%,50%)] border-[hsl(280,65%,50%)]',
  'audit-process': 'ring-[hsl(35,95%,48%)] border-[hsl(35,95%,48%)]',
  'audit-sign-off': 'ring-[hsl(200,60%,42%)] border-[hsl(200,60%,42%)]',
  'completed': 'ring-[hsl(160,70%,34%)] border-[hsl(160,70%,34%)]',
};

const phaseStripColors: Record<string, string> = {
  'not-started': 'bg-muted',
  'planning': 'bg-primary/60',
  'peer-review': 'bg-phase-peer-review/60',
  'audit-process': 'bg-phase-audit/60',
  'audit-sign-off': 'bg-phase-sign-off/60',
  'completed': 'bg-task-complete/60',
};

const phaseCardBg: Record<string, string> = {
  'not-started': '',
  'planning': 'bg-primary/[0.03]',
  'peer-review': 'bg-phase-peer-review/[0.03]',
  'audit-process': 'bg-phase-audit/[0.03]',
  'audit-sign-off': 'bg-phase-sign-off/[0.03]',
  'completed': 'bg-task-complete/[0.03]',
};

export default function Dashboard() {
  const { schemes, setSelectedScheme, searchQuery, setSearchQuery, currentUserRole, currentUserName, setShowDraftReport, setActivePhase, toggleTaskComplete, addTaskNote, sendEmails, allocateScheme } = useWorkflowStore();
  const [activeTab, setActiveTab] = useState<'schemes' | 'tasks'>('schemes');
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  const [allocatingSchemeId, setAllocatingSchemeId] = useState<string | null>(null);
  const [allocPreparer, setAllocPreparer] = useState('');
  const [allocReviewer, setAllocReviewer] = useState('');
  const [allocSignOffDate, setAllocSignOffDate] = useState<Date | undefined>(undefined);
  const [showAllocPopup, setShowAllocPopup] = useState(false);
  const preparersList = ['Alice Chen', 'Ben Martinez', 'Claire O\'Brien', 'David Osei', 'Emma Wright',
    'James Wilson', 'Kate Morgan', 'Liam Taylor', 'Nina Patel', 'Oliver Brown'];
  const reviewersList = ['Rachel Adams', 'Sam Frost', 'Tanya Shah', 'Will Cooper', 'Zara Hussain'];

  // Filter schemes by role
  const mySchemes = schemes.filter((s) => {
    if (currentUserRole === 'manager') return true;
    if (currentUserRole === 'preparer') return s.preparer === currentUserName;
    if (currentUserRole === 'peer-reviewer') return s.peerReviewer === currentUserName;
    if (currentUserRole === 'team-lead') return s.teamLead === currentUserName;
    return true;
  });

  const isManager = currentUserRole === 'manager';

  const filtered = mySchemes.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.preparer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.peerReviewer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.teamLead.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedFilters.length > 0) {
      return selectedFilters.some(f => f === 'pending-allocation' ? !s.isAllocated : s.currentPhase === f);
    }
    return true;
  });

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
  };

  // My tasks (respect current scheme filters)
  const allMyTasks = filtered.filter(s => s.isAllocated).flatMap((s) => {
    const roleTasks = s.tasks.filter((t) => {
      if (currentUserRole === 'preparer') return t.assignedTo.some(a => a.toLowerCase().includes('preparer'));
      if (currentUserRole === 'peer-reviewer') return t.assignedTo.some(a => a.toLowerCase().includes('peer reviewer'));
      return true;
    });
    return roleTasks.map((t) => ({ ...t, schemeName: s.name, schemeId: s.id, preparer: s.preparer, peerReviewer: s.peerReviewer, teamLead: s.teamLead }));
  });
  const visibleTasks = showAllTasks ? allMyTasks : allMyTasks.filter((t) => t.status !== 'completed');
  const sortedTasks = [...visibleTasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const tasksTabLabel = currentUserRole === 'team-lead' ? "My Team's Tasks" : 'My Tasks';
  const outstandingTaskCount = allMyTasks.filter(t => t.status !== 'completed').length;
  

  const handleAllocate = () => {
    if (!allocatingSchemeId || !allocPreparer || !allocReviewer || !allocSignOffDate) return;
    allocateScheme(allocatingSchemeId, allocPreparer, allocReviewer, allocSignOffDate.toISOString());
    setAllocatingSchemeId(null);
    setAllocPreparer('');
    setAllocReviewer('');
    setAllocSignOffDate(undefined);
    setShowAllocPopup(true);
    setTimeout(() => setShowAllocPopup(false), 3000);
  };

  const allocatingScheme = useMemo(() => schemes.find(s => s.id === allocatingSchemeId), [schemes, allocatingSchemeId]);

  const unallocatedRaw = schemes.filter(s => !s.isAllocated).length;
  const unallocatedCount = isManager ? Math.round(unallocatedRaw * (300 / schemes.length)) : unallocatedRaw;

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header - compact */}
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            {isManager ? 'Manager Dashboard' : 'Scheme Dashboard'}
          </h1>
          <Badge variant="outline" className="text-[10px]">
            {USER_ROLE_LABELS[currentUserRole]}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {isManager ? '300' : mySchemes.length} schemes · Logged in as {currentUserName}
          </span>
        </div>

        {/* Manager stats */}
        {isManager && <ManagerStats schemes={schemes} />}

        {/* Phase summary cards - compact */}
        <div className={`grid grid-cols-3 ${isManager ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-2 mb-4`}>
          {isManager && (() => {
            const isActive = selectedFilters.includes('pending-allocation');
            return (
              <div
                key="pending-allocation"
                className={`bg-card rounded-lg border px-3 py-2 cursor-pointer transition-all ${isActive ? `ring-2 ${phaseRingColors['pending-allocation']}` : 'hover:border-muted-foreground/40'}`}
                onClick={() => toggleFilter('pending-allocation')}
              >
                <div className="text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit bg-destructive/10 text-destructive mb-1">
                  Pending
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">{unallocatedCount}</span>
                  <span className="text-[10px] text-muted-foreground">schemes</span>
                </div>
              </div>
            );
          })()}
          {(['planning', 'peer-review', 'audit-process', 'audit-sign-off', 'completed'] as Phase[]).map((phase) => {
            const rawCount = mySchemes.filter((s) => s.currentPhase === phase).length;
            const count = isManager ? Math.round(rawCount * (300 / schemes.length)) : rawCount;
            const isActive = selectedFilters.includes(phase);
            return (
              <div
                key={phase}
                className={`bg-card rounded-lg border px-3 py-2 cursor-pointer transition-all ${isActive ? `ring-2 ${phaseRingColors[phase]}` : 'hover:border-muted-foreground/40'}`}
                onClick={() => toggleFilter(phase)}
              >
                <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit ${phaseColors[phase]} mb-1`}>
                  {PHASE_SHORT[phase]}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">{count}</span>
                  <span className="text-[10px] text-muted-foreground">schemes</span>
                </div>
              </div>
            );
          })}
        </div>

        {selectedFilters.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">Filtered by:</span>
            {selectedFilters.map(f => (
              <Badge key={f} variant="outline" className="text-[10px] gap-1">
                {f === 'pending-allocation' ? 'Pending Allocation' : PHASE_SHORT[f as Phase]}
                <button onClick={() => toggleFilter(f)} className="ml-0.5 hover:text-destructive">×</button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="text-[10px] h-5 px-2" onClick={() => setSelectedFilters([])}>Clear all</Button>
          </div>
        )}

        {/* Tabs: For manager, no "My Tasks" tab */}
        {isManager ? (
          <div>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schemes, preparers, reviewers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card"
              />
            </div>

            <div className="grid gap-3">
              {filtered.map((scheme) => (
                <SchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  isManager={true}
                  onSelect={() => {
                    if (scheme.isAllocated) setSelectedScheme(scheme.id);
                  }}
                  onAllocate={() => {
                    setAllocatingSchemeId(scheme.id);
                    setAllocPreparer('');
                    setAllocReviewer('');
                    setAllocSignOffDate(scheme.yearEndDate ? addMonths(parseISO(scheme.yearEndDate), 7) : undefined);
                  }}
                  onReallocate={() => {
                    setAllocatingSchemeId(scheme.id);
                    setAllocPreparer(scheme.preparer);
                    setAllocReviewer(scheme.peerReviewer);
                    setAllocSignOffDate(scheme.signingDeadline ? parseISO(scheme.signingDeadline) : undefined);
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'schemes' | 'tasks')}>
            <TabsList className="mb-4">
              <TabsTrigger value="schemes" className="text-xs gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" /> List of Schemes
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs gap-1.5">
                <ListChecks className="h-3.5 w-3.5" /> {tasksTabLabel}
                {outstandingTaskCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {outstandingTaskCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schemes">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schemes, preparers, reviewers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card"
                />
              </div>

              <div className="grid gap-3">
                {filtered.map((scheme) => (
                  <SchemeCard
                    key={scheme.id}
                    scheme={scheme}
                    isManager={false}
                    onSelect={() => setSelectedScheme(scheme.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {sortedTasks.length} tasks · sorted by due date
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowAllTasks(!showAllTasks)} className="text-xs">
                  {showAllTasks ? 'Show Pending Only' : 'Show All Tasks'}
                </Button>
              </div>

              <div className="grid gap-2">
                {sortedTasks.map((task) => {
                  // Resolve role-based assignedTo to actual names for display
                  const resolvedTask = {
                    ...task,
                    assignedTo: task.assignedTo.map((role) => {
                      if (role === 'Preparer') return task.preparer || 'Preparer';
                      if (role === 'Peer Reviewer') return task.peerReviewer || 'Peer Reviewer';
                      if (role === 'Team Lead') return task.teamLead || 'Team Lead';
                      return role;
                    }),
                  };

                    const isDraftReport = task.type === 'draft-accounting-report';

                    return (
                      <TaskCard
                        key={`${task.schemeId}-${task.id}`}
                        task={resolvedTask}
                        schemeId={task.schemeId}
                        schemeName={task.schemeName}
                        showSequenceNumber={false}
                        onSchemeClick={() => {
                          setSelectedScheme(task.schemeId);
                          setActivePhase(task.phase as Phase);
                        }}
                        onOpenDraftReport={isDraftReport ? () => {
                          setSelectedScheme(task.schemeId);
                          setActivePhase('planning');
                          setTimeout(() => setShowDraftReport(true), 100);
                        } : undefined}
                      />
                    );
                })}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Allocation Dialog */}
      <Dialog open={!!allocatingSchemeId} onOpenChange={(open) => { if (!open) setAllocatingSchemeId(null); }}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {allocatingScheme?.isAllocated ? 'Change Allocation' : 'Allocate Scheme'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Scheme name banner - sophisticated amber styling */}
            <div className="rounded-xl bg-gradient-to-br from-amber-50 via-amber-50/80 to-yellow-50 border border-amber-200/60 px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-amber-200/50 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-amber-600/80 font-semibold mb-0.5">Pension Scheme</div>
                  <div className="font-bold text-foreground text-base leading-tight">{allocatingScheme?.name}</div>
                  <div className="text-xs text-amber-700/70 mt-0.5">Year end: {allocatingScheme?.yearEnd}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-foreground flex items-center gap-1.5">
                  <UserCircle className="h-3.5 w-3.5 text-primary" /> Preparer
                </label>
                <Select value={allocPreparer} onValueChange={setAllocPreparer}>
                  <SelectTrigger className="text-sm h-10">
                    <SelectValue placeholder="Select preparer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {preparersList.map(p => (
                      <SelectItem key={p} value={p} className="text-sm">
                        <span className="flex items-center gap-2">
                          <UserCircle className="h-3.5 w-3.5 text-primary" /> {p}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {allocPreparer && (
                  <div className="mt-2 flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
                    <Shield className="h-3.5 w-3.5 text-task-reminder" />
                    <span className="text-xs text-muted-foreground">Team Lead:</span>
                    <span className="text-xs font-bold text-foreground">{getTeamLeadForPreparer(allocPreparer)}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-phase-audit" /> Peer Reviewer
                </label>
                <Select value={allocReviewer} onValueChange={setAllocReviewer}>
                  <SelectTrigger className="text-sm h-10">
                    <SelectValue placeholder="Select peer reviewer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewersList.map(r => (
                      <SelectItem key={r} value={r} className="text-sm">
                        <span className="flex items-center gap-2">
                          <Eye className="h-3.5 w-3.5 text-phase-audit" /> {r}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-foreground">Sign-off Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left text-sm font-normal h-10",
                        !allocSignOffDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {allocSignOffDate ? format(allocSignOffDate, 'dd MMM yyyy') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarWidget
                      mode="single"
                      selected={allocSignOffDate}
                      onSelect={setAllocSignOffDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-[10px] text-muted-foreground mt-1.5">Defaults to 7 months after year end date</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button variant="outline" size="sm" onClick={() => setAllocatingSchemeId(null)}>Cancel</Button>
              <Button size="sm" disabled={!allocPreparer || !allocReviewer || !allocSignOffDate} onClick={handleAllocate} className="px-6">
                {allocatingScheme?.isAllocated ? 'Update Allocation' : 'Allocate & Generate Tasks'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocation success popup */}
      {showAllocPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-card border-2 border-primary/20 rounded-2xl px-8 py-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 flex items-center gap-4 pointer-events-auto">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Assigning team members and generating tasks...</p>
              <p className="text-xs text-muted-foreground mt-0.5">This will take a moment</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Scheme Card ---
function SchemeCard({ scheme, isManager, onSelect, onAllocate, onReallocate }: {
  scheme: Scheme;
  isManager: boolean;
  onSelect: () => void;
  onAllocate?: () => void;
  onReallocate?: () => void;
}) {
  const total = scheme.tasks.length;
  const completed = scheme.tasks.filter((t) => t.status === 'completed').length;
  const pct = Math.round((completed / total) * 100);
  const overdueTasks = scheme.isAllocated ? scheme.tasks.filter(t => t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== 'completed').length : 0;

  return (
    <div
      className={`border rounded-xl overflow-hidden text-left transition-all ${
        !scheme.isAllocated
          ? 'border-task-overdue/40 bg-task-overdue/5'
          : `${phaseCardBg[scheme.currentPhase] || ''} hover:border-primary/40 hover:shadow-sm cursor-pointer`
      }`}
      onClick={scheme.isAllocated ? onSelect : undefined}
    >
      {/* Phase color strip */}
      <div className={`h-0.5 ${!scheme.isAllocated ? 'bg-muted' : (phaseStripColors[scheme.currentPhase] || 'bg-muted')}`} />
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-semibold truncate">{scheme.name}</span>
              {scheme.isAllocated && (
                <Badge variant="outline" className={`text-[10px] shrink-0 ${phaseColors[scheme.currentPhase]}`}>
                  {PHASE_SHORT[scheme.currentPhase]}
                </Badge>
              )}
              {!scheme.isAllocated && (
                <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">
                  Not Allocated
                </Badge>
              )}
              {overdueTasks > 0 && (
                <Badge variant="outline" className="text-[10px] border-destructive text-destructive bg-destructive/10">
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Overdue tasks ({overdueTasks})
                </Badge>
              )}
            </div>
          </div>
          {/* Team members or allocate button */}
          <div className="flex items-center gap-3 shrink-0">
            {scheme.isAllocated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[11px]" title="Preparer">
                  <UserCircle className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">{scheme.preparer}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]" title="Peer Reviewer">
                  <Eye className="h-3.5 w-3.5 text-phase-audit" />
                  <span className="text-muted-foreground">{scheme.peerReviewer}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]" title="Team Lead">
                  <Shield className="h-3.5 w-3.5 text-task-reminder" />
                  <span className="text-muted-foreground">{scheme.teamLead}</span>
                </div>
                {isManager && onReallocate && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground border-border hover:text-foreground"
                    title="Re-allocate"
                    onClick={(e) => { e.stopPropagation(); onReallocate(); }}
                  >
                    <Users className="h-3 w-3" /> Re-allocate
                  </Button>
                )}
              </div>
            ) : isManager && onAllocate ? (
              <Button
                size="sm"
                variant="default"
                className="text-xs h-7"
                onClick={(e) => { e.stopPropagation(); onAllocate(); }}
              >
                <Users className="h-3 w-3 mr-1" /> Allocate
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Year end: <span className="font-medium text-foreground">{scheme.yearEnd}</span></span>
            {scheme.isAllocated && (
              <span>Audit kick-off: <span className={`font-medium ${scheme.auditStartDate ? 'text-foreground' : 'text-muted-foreground italic'}`}>{scheme.auditStartDate ? format(parseISO(scheme.auditStartDate), 'dd MMM yyyy') : 'Not arranged'}</span></span>
            )}
            {scheme.isAllocated && (
              <span>Sign-off due: {(() => { const days = differenceInDays(parseISO(scheme.signingDeadline), new Date()); const isApproaching = days >= 0 && days <= 14; return <span className={`font-medium ${isApproaching ? 'text-destructive' : 'text-foreground'}`}>{format(parseISO(scheme.signingDeadline), 'dd MMM yyyy')}{isApproaching && <sup className="ml-1 text-[9px] font-semibold text-destructive">({days}d)</sup>}</span>; })()}</span>
            )}
            {/* Inline activity trail */}
            {scheme.isAllocated && scheme.lastActivity && (
              <span className="flex items-center gap-1 text-[10px]">
                <Clock className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[280px]">
                  {scheme.lastActivity.by} · {scheme.lastActivity.action} · {format(parseISO(scheme.lastActivity.at), 'dd MMM yyyy HH:mm')}
                </span>
              </span>
            )}
          </div>
          {scheme.isAllocated && (
            <div className="w-32 shrink-0">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{completed}/{total} tasks</span>
                <span>{pct}%</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Manager statistics panel ---
function ManagerStats({ schemes }: { schemes: Scheme[] }) {
  // The app has 30 schemes in mock data but represents a universe of 300
  const TOTAL_UNIVERSE = 300;
  const scaleFactor = TOTAL_UNIVERSE / schemes.length;

  const allocatedSchemes = schemes.filter(s => s.isAllocated);
  const unallocatedSchemes = schemes.filter(s => !s.isAllocated);

  const allocatedCount = Math.round(allocatedSchemes.length * scaleFactor);
  const unallocatedCount = Math.round(unallocatedSchemes.length * scaleFactor);

  // Phase breakdown (scaled)
  const phaseBreakdown = {
    planning: Math.round(schemes.filter(s => s.currentPhase === 'planning').length * scaleFactor),
    'peer-review': Math.round(schemes.filter(s => s.currentPhase === 'peer-review').length * scaleFactor),
    'audit-process': Math.round(schemes.filter(s => s.currentPhase === 'audit-process').length * scaleFactor),
    'audit-sign-off': Math.round(schemes.filter(s => s.currentPhase === 'audit-sign-off').length * scaleFactor),
    'completed': Math.round(schemes.filter(s => s.currentPhase === 'completed').length * scaleFactor),
  };

  // Tasks progress
  const totalTasks = allocatedSchemes.reduce((acc, s) => acc + s.tasks.length, 0);
  const completedTasks = allocatedSchemes.reduce((acc, s) => acc + s.tasks.filter(t => t.status === 'completed').length, 0);
  const overallPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Overdue: schemes past signing deadline with incomplete tasks
  const overdueRaw = allocatedSchemes.filter(s => isPast(parseISO(s.signingDeadline)) && s.tasks.some(t => t.status !== 'completed')).length;
  const overdueCount = Math.round(overdueRaw * scaleFactor);

  // Audit dates arranged vs not
  const auditArrangedRaw = allocatedSchemes.filter(s => s.auditStartDate).length;
  const auditNotArrangedRaw = allocatedSchemes.filter(s => !s.auditStartDate).length;
  const auditArranged = Math.round(auditArrangedRaw * scaleFactor);
  const auditNotArranged = Math.round(auditNotArrangedRaw * scaleFactor);

  // Team workload
  const teamMap = new Map<string, { schemes: number; completed: number; total: number }>();
  allocatedSchemes.forEach(s => {
    const existing = teamMap.get(s.teamLead) || { schemes: 0, completed: 0, total: 0 };
    existing.schemes++;
    existing.total += s.tasks.length;
    existing.completed += s.tasks.filter(t => t.status === 'completed').length;
    teamMap.set(s.teamLead, existing);
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Allocation overview */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Users className="h-3.5 w-3.5" /> Scheme Allocation
        </div>
        <div className="text-2xl font-bold">{TOTAL_UNIVERSE}</div>
        <div className="text-[10px] text-muted-foreground mb-2">total schemes</div>
        <div className="flex gap-2 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary inline-block" />
            <span className="font-semibold text-foreground">{allocatedCount}</span> allocated
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive inline-block" />
            <span className="font-semibold text-destructive">{unallocatedCount}</span> pending
          </span>
        </div>
        <Progress value={(allocatedCount / TOTAL_UNIVERSE) * 100} className="h-1.5 mt-2" />
      </div>

      {/* Phase breakdown */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <BarChart3 className="h-3.5 w-3.5" /> Phase Breakdown
        </div>
        <div className="space-y-1.5 mt-1">
          {([
            { key: 'planning', label: 'Planning', color: 'bg-blue-500' },
            { key: 'peer-review', label: 'Peer Review', color: 'bg-amber-500' },
            { key: 'audit-process', label: 'Audit Process', color: 'bg-purple-500' },
            { key: 'audit-sign-off', label: 'Audit Sign Off', color: 'bg-emerald-500' },
            { key: 'completed', label: 'Completed', color: 'bg-green-600' },
          ] as const).map(p => (
            <div key={p.key} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${p.color} inline-block`} />
                {p.label}
              </span>
              <span className="font-semibold text-foreground">{phaseBreakdown[p.key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Audit & Overdue */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Calendar className="h-3.5 w-3.5" /> Audit Status
        </div>
        <div className="space-y-2 mt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span>Audit dates arranged</span>
            <span className="font-semibold text-foreground">{auditArranged}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>Not yet arranged</span>
            <span className="font-semibold text-amber-600">{auditNotArranged}</span>
          </div>
          <div className="border-t pt-2 mt-2 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3 w-3" /> Past sign-off deadline
            </span>
            <span className="font-bold text-destructive">{overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Team workload */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <TrendingUp className="h-3.5 w-3.5" /> Team Lead Workload
        </div>
        <div className="space-y-1.5 mt-1">
          {Array.from(teamMap.entries()).map(([lead, data]) => (
            <div key={lead} className="flex items-center justify-between text-[11px]">
              <span className="truncate font-medium">{lead}</span>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">{Math.round(data.schemes * scaleFactor)} schemes</span>
                <span className="font-semibold text-foreground w-8 text-right">{data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
