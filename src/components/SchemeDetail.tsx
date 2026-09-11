import { useWorkflowStore } from '@/lib/workflow-store';
import { PHASE_LABELS, PHASE_SHORT, Phase, QUESTIONNAIRE_QUESTIONS, AuditTrailEntry } from '@/lib/types';
import { ArrowLeft, Plus, Lock, FileText, ChevronRight, CheckCircle2, PartyPopper, Loader2, CalendarOff, History, Users, Mail, FileUp, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import TaskCard from './TaskCard';
import AdhocTaskDialog from './AdhocTaskDialog';
import PreliminaryInfo from './PreliminaryInfo';
import DraftAccountingReport from './DraftAccountingReport';
import { useState, useRef, useEffect } from 'react';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { UserCircle, Eye, Shield, Calendar, AlertTriangle, Clock } from 'lucide-react';

const phases: Phase[] = ['planning', 'peer-review', 'audit-process', 'audit-sign-off'];

const phaseColors: Record<Phase, string> = {
  'not-started': 'phase-badge-not-started',
  'planning': 'phase-badge-planning',
  'peer-review': 'phase-badge-peer-review',
  'audit-process': 'phase-badge-audit',
  'audit-sign-off': 'phase-badge-sign-off',
  'completed': 'phase-badge-completed',
};

const phaseTabColors: Record<Phase, string> = {
  'not-started': '',
  'planning': 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
  'peer-review': 'data-[state=active]:bg-phase-peer-review data-[state=active]:text-primary-foreground',
  'audit-process': 'data-[state=active]:bg-phase-audit data-[state=active]:text-primary-foreground',
  'audit-sign-off': 'data-[state=active]:bg-phase-sign-off data-[state=active]:text-primary-foreground',
  'completed': 'data-[state=active]:bg-task-complete data-[state=active]:text-primary-foreground',
};

const phaseStripColors: Record<Phase, string> = {
  'not-started': 'bg-muted',
  'planning': 'bg-primary/60',
  'peer-review': 'bg-phase-peer-review/60',
  'audit-process': 'bg-phase-audit/60',
  'audit-sign-off': 'bg-phase-sign-off/60',
  'completed': 'bg-task-complete/60',
};

const phaseCardBg: Record<Phase, string> = {
  'not-started': '',
  'planning': 'bg-primary/[0.03]',
  'peer-review': 'bg-phase-peer-review/[0.03]',
  'audit-process': 'bg-phase-audit/[0.03]',
  'audit-sign-off': 'bg-phase-sign-off/[0.03]',
  'completed': 'bg-task-complete/[0.03]',
};

export default function SchemeDetail() {
  const { schemes, masterSchemes, selectedSchemeId, setSelectedScheme, activePhase, setActivePhase, showDraftReport, setShowDraftReport, completeScheme, toggleTaskComplete, setAuditKickOffDate } = useWorkflowStore();
  const [adhocOpen, setAdhocOpen] = useState(false);
  const [showGeneratingPopup, setShowGeneratingPopup] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const scheme = schemes.find((s) => s.id === selectedSchemeId);
  const auditTask = scheme?.tasks.find(t => t.isAuditKickOff);
  const prevAuditStatusRef = useRef(auditTask?.status);

  useEffect(() => {
    if (auditTask && prevAuditStatusRef.current !== 'completed' && auditTask.status === 'completed' && scheme?.auditStartDate) {
      setShowGeneratingPopup(true);
      setTimeout(() => setShowGeneratingPopup(false), 3000);
    }
    prevAuditStatusRef.current = auditTask?.status;
  }, [auditTask?.status, scheme?.auditStartDate]);

  if (!scheme) return null;

  const totalCompleted = scheme.tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = scheme.tasks.length;

  const pi = scheme.preliminaryInfo;
  const preliminaryComplete = !!(
    pi.schemeRegNo && pi.priorYearDocsUploaded && pi.acPeriodConfirmed &&
    pi.schemeNameConfirmed && pi.nameAbbreviation
  );

  const dar = scheme.draftAccountingReport;
  const answeredCount = dar.questionnaireAnswers.filter((a) => a.answered).length;
  const totalQuestions = QUESTIONNAIRE_QUESTIONS.length;

  // Dynamically count applicable documents based on scheme type
  const masterScheme = masterSchemes.find(ms => ms.schemeName === scheme.name);
  const schemeType = masterScheme?.schemeType || 'Defined Benefit';
  const isDCorHybridDC = schemeType === 'Defined Contribution' || schemeType === 'Hybrid';
  const isDBorHybridDB = schemeType === 'Defined Benefit' || schemeType === 'Hybrid';

  // Count: 2 legacy (prevYear + workingPaper) + 10 new doc fields + conditional ones
  let docsExpected = 10; // always-shown: implementationStatement, investmentReport, pensionIncreases, auditReport, auditorsStatement, investmentRiskDisclosure, scheduleOfContribution, certificationOfSchedule + prevYear + workingPaper
  if (isDCorHybridDC) docsExpected++;  // chairsStatement
  if (isDBorHybridDB) docsExpected++;  // reportOnActuarialLiabilities
  // Plus IM reports (always 6 providers)
  docsExpected += 6;

  let docsUploadedCount = (dar.prevYearReportUploaded ? 1 : 0) + (dar.workingPaperUploaded ? 1 : 0);
  docsUploadedCount += dar.implementationStatement.uploaded ? 1 : 0;
  if (isDCorHybridDC) docsUploadedCount += dar.chairsStatement.uploaded ? 1 : 0;
  if (isDBorHybridDB) docsUploadedCount += dar.reportOnActuarialLiabilities.uploaded ? 1 : 0;
  docsUploadedCount += dar.investmentReport.uploaded ? 1 : 0;
  docsUploadedCount += dar.pensionIncreases.uploaded ? 1 : 0;
  docsUploadedCount += dar.auditReport.uploaded ? 1 : 0;
  docsUploadedCount += dar.auditorsStatement.uploaded ? 1 : 0;
  docsUploadedCount += dar.investmentRiskDisclosure.uploaded ? 1 : 0;
  docsUploadedCount += dar.scheduleOfContribution.uploaded ? 1 : 0;
  docsUploadedCount += dar.certificationOfSchedule.uploaded ? 1 : 0;
  docsUploadedCount += dar.investmentManagerReports.length; // each IM report counts as 1

  const docsUploaded = docsUploadedCount === docsExpected;
  const accountsGenerated = dar.accountsGenerationStatus === 'generated';
  const latestAttempt = dar.generationHistory?.length ? dar.generationHistory[dar.generationHistory.length - 1] : null;
  const draftProgressProps = {
    answeredCount,
    totalQuestions,
    docsUploaded: docsUploadedCount,
    docsExpected,
    accountsGenerated,
    latestFileName: latestAttempt?.fileName,
    latestActionType: latestAttempt?.actionType,
    latestActionBy: latestAttempt?.actionBy,
    latestActionAt: latestAttempt?.generatedAt,
  };

  // Check if all tasks in audit-sign-off are completed
  const auditSignOffTasks = scheme.tasks.filter((t) => t.phase === 'audit-sign-off');
  const allSignOffDone = auditSignOffTasks.length > 0 && auditSignOffTasks.every((t) => t.status === 'completed');
  const allTasksDone = scheme.tasks.every((t) => t.status === 'completed');

  // Whether accounts have been generated (gate for completing draft accounts task)

  // Draft report: show as dedicated view within the same shell
  if (showDraftReport) {
    const draftTask = scheme.tasks.find((t) => t.type === 'draft-accounting-report');
    return (
      <div className="flex-1 overflow-auto">
        {/* Same header as scheme detail */}
        <div className="border-b px-6 py-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <Button variant="ghost" size="icon" onClick={() => setShowDraftReport(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button onClick={() => { setShowDraftReport(false); setSelectedScheme(null); }} className="hover:text-foreground transition-colors">
                  Schemes
                </button>
                <ChevronRight className="h-3 w-3" />
                <button onClick={() => setShowDraftReport(false)} className="hover:text-foreground transition-colors">
                  {scheme.name}
                </button>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium">Draft Accounts</span>
              </div>
            </div>
            {/* Scheme info card - full consistent style matching detail header */}
            <SchemeInfoCard scheme={scheme} phaseCardBg={phaseCardBg} phaseStripColors={phaseStripColors} phaseColors={phaseColors} onOpenAuditTrail={() => setShowAuditTrail(true)} />
            <AuditTrailDialog open={showAuditTrail} onOpenChange={setShowAuditTrail} entries={scheme.auditTrail} schemeName={scheme.name} />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-6 pb-12">
          {/* Phase tabs - clickable to navigate */}
          <Tabs value="planning" className="mb-6">
            <TabsList className="bg-muted/50">
              {phases.map((p) => (
                <TabsTrigger
                  key={p}
                  value={p}
                  onClick={() => { setShowDraftReport(false); setActivePhase(p); }}
                  className={`text-xs cursor-pointer ${phaseTabColors[p]}`}
                >
                  {(() => {
                    const phaseTasks = scheme.tasks.filter((t) => t.phase === p);
                    const completedCount = phaseTasks.filter((t) => t.status === 'completed').length;
                    const allDone = phaseTasks.length > 0 && completedCount === phaseTasks.length;
                    return (
                      <>
                        {PHASE_SHORT[p]}
                        {allDone ? (
                          <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent/15">
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                          </span>
                        ) : (
                          <span className="ml-1.5 text-[10px] opacity-70">
                            {completedCount}/{phaseTasks.length}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Draft task card summary - no arrow, not clickable */}
          {draftTask && (
            <div className="mb-6">
              <TaskCard
                task={{
                  ...draftTask,
                  assignedTo: draftTask.assignedTo.map((role) => {
                    if (role === 'Preparer') return scheme.preparer || 'Preparer';
                    if (role === 'Peer Reviewer') return scheme.peerReviewer || 'Peer Reviewer';
                    if (role === 'Team Lead') return scheme.teamLead || 'Team Lead';
                    return role;
                  }),
                }}
                schemeId={scheme.id}
                showSequenceNumber
                showPhaseBadge={false}
                draftReportProgress={draftProgressProps}
              />
            </div>
          )}

          {/* Mark as complete button - only if accounts generated */}
          {draftTask && draftTask.status !== 'completed' && accountsGenerated && (
            <div className="mb-6 flex justify-end">
              <Button
                size="lg"
                onClick={() => toggleTaskComplete(scheme.id, draftTask.id)}
                className="h-11 px-6 text-sm font-bold bg-gradient-to-r from-task-complete to-emerald-500 hover:from-task-complete/90 hover:to-emerald-500/90 text-white shadow-lg shadow-task-complete/25 transition-all hover:shadow-xl hover:shadow-task-complete/30 hover:scale-[1.02] rounded-lg"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Draft Accounts Complete
              </Button>
            </div>
          )}

          <DraftAccountingReport schemeId={scheme.id} onBack={() => setShowDraftReport(false)} inline />
        </div>
      </div>
    );
  }

  const pct = Math.round((totalCompleted / totalTasks) * 100);
  const overdueTasks = scheme.tasks.filter(t => t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== 'completed').length;


  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedScheme(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Back to schemes</span>
          </div>
          <SchemeInfoCard scheme={scheme} phaseCardBg={phaseCardBg} phaseStripColors={phaseStripColors} phaseColors={phaseColors} onOpenAuditTrail={() => setShowAuditTrail(true)} />
          <AuditTrailDialog open={showAuditTrail} onOpenChange={setShowAuditTrail} entries={scheme.auditTrail} schemeName={scheme.name} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        <Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as Phase)}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-muted/50">
            {phases.map((p) => (
              <TabsTrigger key={p} value={p} className={`text-xs ${phaseTabColors[p]}`}>
                {PHASE_SHORT[p]}
                <span className="ml-1.5 text-[10px] opacity-70">
                  {scheme.tasks.filter((t) => t.phase === p && t.status === 'completed').length}/
                  {scheme.tasks.filter((t) => t.phase === p).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
            <Button size="sm" variant="outline" onClick={() => setAdhocOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ad-hoc Task
            </Button>
          </div>

          {phases.map((p) => (
            <TabsContent key={p} value={p} className="space-y-3 pb-12">
              
              

              {p === 'planning' && (
                <PreliminaryInfo schemeId={scheme.id} info={scheme.preliminaryInfo} />
              )}

              {p === 'planning' && !preliminaryComplete && (
                <div className="relative">
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 rounded-xl flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-card border shadow-lg rounded-lg px-4 py-3">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Complete preliminary information above to unlock tasks
                      </span>
                    </div>
                  </div>
                  <div className="opacity-40 pointer-events-none space-y-3">
                    {scheme.tasks
                      .filter((t) => t.phase === p)
                      .map((task) => {
                        const resolvedTask = {
                          ...task,
                          assignedTo: task.assignedTo.map((role) => {
                            if (role === 'Preparer') return scheme.preparer || 'Preparer';
                            if (role === 'Peer Reviewer') return scheme.peerReviewer || 'Peer Reviewer';
                            if (role === 'Team Lead') return scheme.teamLead || 'Team Lead';
                            return role;
                          }),
                        };
                        return (
                          <TaskCard key={task.id} task={resolvedTask} schemeId={scheme.id} showPhaseBadge={false} onOpenDraftReport={() => setShowDraftReport(true)} />
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Audit not arranged message for non-planning phases */}
              {p !== 'planning' && !scheme.auditStartDate && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CalendarOff className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Audit kick off date not arranged yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">Tasks will be generated once the audit kick-off date is confirmed in the Planning phase.</p>
                </div>
              )}

              {((p === 'planning' && preliminaryComplete) || (p !== 'planning' && !!scheme.auditStartDate)) &&
                scheme.tasks
                  .filter((t) => t.phase === p)
                  .map((task) => {
                    const resolvedTask = {
                      ...task,
                      assignedTo: task.assignedTo.map((role) => {
                        if (role === 'Preparer') return scheme.preparer || 'Preparer';
                        if (role === 'Peer Reviewer') return scheme.peerReviewer || 'Peer Reviewer';
                        if (role === 'Team Lead') return scheme.teamLead || 'Team Lead';
                        return role;
                      }),
                    };
                    return (
                      <TaskCard
                        key={task.id}
                        task={resolvedTask}
                        schemeId={scheme.id}
                        showPhaseBadge={false}
                        showSequenceNumber={p !== 'planning'}
                        onOpenDraftReport={task.type === 'draft-accounting-report' ? () => setShowDraftReport(true) : undefined}
                        draftReportProgress={task.type === 'draft-accounting-report' ? draftProgressProps : undefined}
                        auditKickOffDate={task.isAuditKickOff ? scheme.auditStartDate : undefined}
                        onSetAuditKickOffDate={task.isAuditKickOff ? (date) => setAuditKickOffDate(scheme.id, date) : undefined}
                      />
                    );
                  })}

              {/* Completion button on Audit Sign Off tab */}
              {p === 'audit-sign-off' && allTasksDone && scheme.currentPhase !== 'completed' && (
                <div className="mt-8 flex flex-col items-center gap-4 py-8">
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="h-12 w-12 text-task-complete mx-auto" />
                    <h3 className="text-lg font-bold">All Tasks Completed</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      All {totalTasks} tasks across all phases have been completed. You can now confirm the scheme accounts as finalised.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => completeScheme(scheme.id)}
                    className="h-14 px-10 text-base font-bold bg-gradient-to-r from-task-complete to-emerald-500 hover:from-task-complete/90 hover:to-emerald-500/90 text-white shadow-lg shadow-task-complete/25 transition-all hover:shadow-xl hover:shadow-task-complete/30 hover:scale-[1.02]"
                  >
                    <PartyPopper className="h-5 w-5 mr-2" />
                    Confirm Scheme Accounts Completed
                  </Button>
                </div>
              )}

              {p === 'audit-sign-off' && scheme.currentPhase === 'completed' && (
                <div className="mt-8 flex flex-col items-center gap-3 py-8">
                  <CheckCircle2 className="h-14 w-14 text-task-complete" />
                  <h3 className="text-lg font-bold text-task-complete">Scheme Accounts Completed</h3>
                  <p className="text-sm text-muted-foreground">
                    Completed by <span className="font-medium text-foreground">{scheme.completedBy || 'Unknown'}</span>
                    {scheme.completedAt && (
                      <> on <span className="font-medium text-foreground">{format(parseISO(scheme.completedAt), 'dd MMM yyyy')}</span> at {format(parseISO(scheme.completedAt), 'HH:mm')}</>
                    )}
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <AdhocTaskDialog
        open={adhocOpen}
        onOpenChange={setAdhocOpen}
        schemeId={scheme.id}
        phase={activePhase}
        schemePreparer={scheme.preparer}
      />

      {/* Generating tasks popup */}
      {showGeneratingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-card border-2 border-primary/20 rounded-2xl px-8 py-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 flex items-center gap-4 max-w-md">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-base">Generating tasks...</p>
              <p className="text-sm text-muted-foreground mt-1">Creating tasks for Peer Review, Audit Process, and Audit Sign Off phases</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Reusable Scheme Info Card ---
import { Scheme } from '@/lib/types';

function SchemeInfoCard({ scheme, phaseCardBg, phaseStripColors, phaseColors, onOpenAuditTrail }: {
  scheme: Scheme;
  phaseCardBg: Record<Phase, string>;
  phaseStripColors: Record<Phase, string>;
  phaseColors: Record<Phase, string>;
  onOpenAuditTrail?: () => void;
}) {
  const totalCompleted = scheme.tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = scheme.tasks.length;
  const pct = Math.round((totalCompleted / totalTasks) * 100);
  const overdueTasks = scheme.tasks.filter(t => t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== 'completed').length;

  return (
    <div className={`border rounded-xl overflow-hidden ${phaseCardBg[scheme.currentPhase] || ''}`}>
      <div className={`h-0.5 ${phaseStripColors[scheme.currentPhase] || 'bg-muted'}`} />
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-semibold truncate">{scheme.name}</span>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${phaseColors[scheme.currentPhase]}`}>
                {PHASE_SHORT[scheme.currentPhase]}
              </Badge>
              {overdueTasks > 0 && (
                <Badge variant="outline" className="text-[10px] border-destructive text-destructive bg-destructive/10">
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Overdue tasks ({overdueTasks})
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
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
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Year end: <span className="font-medium text-foreground">{scheme.yearEnd}</span></span>
            <span>Audit kick-off: <span className={`font-medium ${scheme.auditStartDate ? 'text-foreground' : 'text-muted-foreground italic'}`}>{scheme.auditStartDate ? format(parseISO(scheme.auditStartDate), 'dd MMM yyyy') : 'Not arranged'}</span></span>
            <span>Sign-off due: {(() => { const days = differenceInDays(parseISO(scheme.signingDeadline), new Date()); const isApproaching = days >= 0 && days <= 14; return <span className={`font-medium ${isApproaching ? 'text-destructive' : 'text-foreground'}`}>{format(parseISO(scheme.signingDeadline), 'dd MMM yyyy')}{isApproaching && <sup className="ml-1 text-[9px] font-semibold text-destructive">({days}d)</sup>}</span>; })()}</span>
            {scheme.lastActivity && (
              <span className="flex items-center gap-1 text-[10px]">
                <Clock className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[280px]">
                  {scheme.lastActivity.by} · {scheme.lastActivity.action} · {format(parseISO(scheme.lastActivity.at), 'dd MMM yyyy HH:mm')}
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {onOpenAuditTrail && (
              <button onClick={onOpenAuditTrail} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                <History className="h-3 w-3" /> Audit Trail
              </button>
            )}
            {onOpenAuditTrail && <div className="w-px h-4 bg-border" />}
            <div className="w-32">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{totalCompleted}/{totalTasks} tasks</span>
                <span>{pct}%</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Audit Trail Dialog ---
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const categoryIcons: Record<string, React.ReactNode> = {
  allocation: <Users className="h-3.5 w-3.5 text-primary" />,
  task: <CheckCircle2 className="h-3.5 w-3.5 text-task-complete" />,
  email: <Mail className="h-3.5 w-3.5 text-phase-audit" />,
  document: <FileUp className="h-3.5 w-3.5 text-phase-peer-review" />,
  generation: <FileText className="h-3.5 w-3.5 text-phase-sign-off" />,
  phase: <PartyPopper className="h-3.5 w-3.5 text-task-complete" />,
  system: <Settings className="h-3.5 w-3.5 text-muted-foreground" />,
};

const categoryLabels: Record<string, string> = {
  allocation: 'Allocation',
  task: 'Task',
  email: 'Email',
  document: 'Document',
  generation: 'Generation',
  phase: 'Phase',
  system: 'System',
};

function AuditTrailDialog({ open, onOpenChange, entries, schemeName }: { open: boolean; onOpenChange: (v: boolean) => void; entries: AuditTrailEntry[]; schemeName: string }) {
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const filtered = filterCategory ? sorted.filter(e => e.category === filterCategory) : sorted;
  const categories = Array.from(new Set(entries.map(e => e.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-muted-foreground" />
            Audit Trail — {schemeName}
            <Badge variant="outline" className="text-[10px] ml-1">{filtered.length} entries</Badge>
          </DialogTitle>
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <Button
              variant={filterCategory === null ? 'secondary' : 'ghost'}
              size="sm"
              className="text-[10px] h-6 px-2"
              onClick={() => setFilterCategory(null)}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={filterCategory === cat ? 'secondary' : 'ghost'}
                size="sm"
                className="text-[10px] h-6 px-2 gap-1"
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
              >
                {categoryIcons[cat]}
                {categoryLabels[cat]}
              </Button>
            ))}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto px-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">No audit trail entries</div>
          ) : (
            <div className="divide-y">
              {filtered.map((entry) => (
                <div key={entry.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                  <div className="mt-0.5 shrink-0">
                    {categoryIcons[entry.category] || <Settings className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{entry.action}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5">{categoryLabels[entry.category]}</Badge>
                    </div>
                    {entry.detail && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{entry.detail}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span className="font-medium text-foreground/70">{entry.performedBy}</span>
                      <span>·</span>
                      <span>{format(parseISO(entry.timestamp), 'dd MMM yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


