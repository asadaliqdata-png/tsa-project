import { useState } from 'react';
import { Task, PHASE_SHORT, Phase } from '@/lib/types';
import { useWorkflowStore } from '@/lib/workflow-store';
import {
  CheckCircle2, Circle, Clock, Mail, MessageSquare, ChevronDown, ChevronUp, Users, Send, AlertTriangle, FileText, ChevronRight, Paperclip, RotateCcw, Download, Calendar, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, parseISO, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { getFollowUpEmailTemplate } from '@/lib/email-templates';

const phaseColors: Record<Phase, string> = {
  'not-started': 'bg-muted text-muted-foreground',
  'planning': 'phase-badge-planning',
  'peer-review': 'phase-badge-peer-review',
  'audit-process': 'phase-badge-audit',
  'audit-sign-off': 'phase-badge-sign-off',
  'completed': 'phase-badge-completed',
};

interface TaskCardProps {
  task: Task;
  schemeId: string;
  schemeName?: string;
  showSequenceNumber?: boolean;
  showPhaseBadge?: boolean;
  onOpenDraftReport?: () => void;
  onSchemeClick?: () => void;
  auditKickOffDate?: string;
  onSetAuditKickOffDate?: (date: string) => void;
  draftReportProgress?: {
    answeredCount: number;
    totalQuestions: number;
    docsUploaded: number;
    docsExpected: number;
    accountsGenerated: boolean;
    latestFileName?: string;
    latestActionType?: 'generated' | 'uploaded';
    latestActionBy?: string;
    latestActionAt?: string;
  };
}

export default function TaskCard({ task, schemeId, schemeName, showSequenceNumber, showPhaseBadge = true, onOpenDraftReport, onSchemeClick, auditKickOffDate, onSetAuditKickOffDate, draftReportProgress }: TaskCardProps) {
  const { toggleTaskComplete, addTaskNote, sendEmails, sendFollowUpEmails, toggleRecipientSelected, toggleAllRecipients, deleteAdhocTask } = useWorkflowStore();
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showSentEmail, setShowSentEmail] = useState<number | null>(null);
  const [editableDraft, setEditableDraft] = useState(task.emailDraftTemplate || '');
  const [editableFollowUp, setEditableFollowUp] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isCompleted = task.status === 'completed';
  const isEmail = task.type === 'email';
  const isDraftReport = task.type === 'draft-accounting-report';
  const isAdhoc = task.id.startsWith('adhoc-');
  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && !isCompleted;

  const allSent = task.emailRecipients && task.emailRecipients.length > 0 && task.emailRecipients.every(r => r.sentAt);
  const selectedCount = task.emailRecipients?.filter(r => r.selected !== false).length ?? 0;
  const allSelected = task.emailRecipients ? selectedCount === task.emailRecipients.length : false;

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addTaskNote(schemeId, task.id, {
      text: noteText,
      author: 'Current User',
      createdAt: new Date().toISOString(),
    });
    setNoteText('');
  };

  const handleSendEmails = () => {
    sendEmails(schemeId, task.id, editableDraft);
  };

  const handleSendFollowUp = () => {
    sendFollowUpEmails(schemeId, task.id, editableFollowUp);
    setShowFollowUp(false);
  };

  // Draft accounting report task - special rendering
  // Whether this is shown inline (inside draft report view) - hide the arrow
  const isInlineView = isDraftReport && !onOpenDraftReport;

  if (isDraftReport) {
    const pct = draftReportProgress ? Math.round((draftReportProgress.answeredCount / draftReportProgress.totalQuestions) * 100) : 0;
    const Wrapper = onOpenDraftReport ? 'button' as const : 'div' as const;
    // Get the latest generation history entry for download info
    const scheme = useWorkflowStore.getState().schemes.find(s => s.id === schemeId);
    const dar = scheme?.draftAccountingReport;
    const latestAttempt = dar?.generationHistory?.length ? dar.generationHistory[dar.generationHistory.length - 1] : null;

    const handleDownloadFromCard = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!dar?.generatedFileName) return;
      const blob = new Blob(['Placeholder for generated annual report.'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dar.generatedFileName;
      a.click();
      URL.revokeObjectURL(url);
    };

    const questComplete = draftReportProgress && draftReportProgress.answeredCount === draftReportProgress.totalQuestions;
    const docsComplete = draftReportProgress && draftReportProgress.docsUploaded === draftReportProgress.docsExpected;

    return (
      <Wrapper
        onClick={onOpenDraftReport}
        className={`w-full bg-card rounded-xl p-4 transition-all text-left ${
          onOpenDraftReport ? 'hover:border-primary/40 hover:shadow-md cursor-pointer' : ''
        } ${isCompleted ? 'border-l-4 border-l-task-complete bg-task-complete/5 border border-task-complete/20' : 'border-2 border-primary/20'}`}
      >
        {/* Top row */}
        <div className="flex items-center gap-4">
          {isCompleted ? (
            <button onClick={(e) => { e.stopPropagation(); toggleTaskComplete(schemeId, task.id); }} className="shrink-0" title="Mark as incomplete">
              <CheckCircle2 className="h-5 w-5 text-task-complete hover:text-task-pending transition-colors" />
            </button>
          ) : (
            <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold">{task.title}</h3>
              {showPhaseBadge && (
                <Badge variant="outline" className={`text-[10px] ${phaseColors[task.phase]}`}>
                  {PHASE_SHORT[task.phase]}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className={`font-medium ${isOverdue ? 'text-task-overdue' : 'text-task-reminder'}`}>
                <Clock className="h-3 w-3 inline mr-0.5" />
                Due: {task.dueDate ? format(parseISO(task.dueDate), 'dd MMM yyyy') : task.dueDateLabel}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {task.assignedTo.join(', ')}
              </span>
              {isCompleted && task.completedAt && (
                <span className="text-task-complete">✓ {format(parseISO(task.completedAt), 'dd MMM yyyy HH:mm')}</span>
              )}
            </div>
          </div>
          {onOpenDraftReport && <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />}
        </div>

        {/* Status indicators row */}
        {draftReportProgress && (
          <div className="mt-3 ml-14 flex items-center gap-4 flex-wrap">
            {/* Questionnaire indicator */}
            <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg px-3 py-1.5">
              {questComplete ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-task-complete shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className={`text-xs font-medium ${questComplete ? 'text-task-complete' : 'text-muted-foreground'}`}>
                Questionnaire {draftReportProgress.answeredCount}/{draftReportProgress.totalQuestions}
              </span>
            </div>

            {/* Documents indicator */}
            <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg px-3 py-1.5">
              {docsComplete ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-task-complete shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className={`text-xs font-medium ${docsComplete ? 'text-task-complete' : 'text-muted-foreground'}`}>
                Documents {draftReportProgress.docsUploaded}/{draftReportProgress.docsExpected}
              </span>
            </div>

            {/* Draft Accounts generation indicator */}
            <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg px-3 py-1.5">
              {draftReportProgress.accountsGenerated ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-task-complete shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className={`text-xs font-medium ${draftReportProgress.accountsGenerated ? 'text-task-complete' : 'text-muted-foreground'}`}>
                Draft Accounts {draftReportProgress.accountsGenerated ? 'Generated' : 'Pending'}
              </span>
            </div>
          </div>
        )}

        {/* Download row inside card when accounts generated */}
        {onOpenDraftReport && draftReportProgress?.accountsGenerated && draftReportProgress.latestFileName && (
          <div className="mt-2 ml-14 flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-lg px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <button onClick={handleDownloadFromCard} className="text-xs font-medium text-primary hover:underline truncate block">
                {draftReportProgress.latestFileName}
              </button>
              <p className="text-[10px] text-muted-foreground">
                {draftReportProgress.latestActionType === 'uploaded' ? 'Uploaded' : 'Generated'} by {draftReportProgress.latestActionBy || 'System'} · {draftReportProgress.latestActionAt ? format(parseISO(draftReportProgress.latestActionAt), 'dd MMM yyyy HH:mm') : ''}
              </p>
            </div>
            <button onClick={handleDownloadFromCard} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
        )}
      </Wrapper>
    );
  }

  return (
    <div
      className={`bg-card rounded-xl transition-all ${
        isCompleted ? 'border-l-4 border-l-task-complete bg-task-complete/5 border border-task-complete/20' : isOverdue ? 'border border-task-overdue/40' : 'border border-border hover:border-primary/30 hover:shadow-sm'
      } ${expanded ? 'border-2 border-primary shadow-lg ring-2 ring-primary/15' : ''}`}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (task.isAuditKickOff && !auditKickOffDate && !isCompleted) return;
            toggleTaskComplete(schemeId, task.id);
          }}
          className={`mt-0.5 shrink-0 ${task.isAuditKickOff && !auditKickOffDate && !isCompleted ? 'opacity-40 cursor-not-allowed' : ''}`}
          title={task.isAuditKickOff && !auditKickOffDate && !isCompleted ? 'Enter audit kick-off date first' : undefined}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-task-complete" />
          ) : (
            <Circle className="h-5 w-5 text-task-pending hover:text-primary transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {showSequenceNumber && (
              <span className="text-xs font-bold text-muted-foreground bg-muted rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                {task.number}
              </span>
            )}
            <span className={`font-semibold text-sm ${isCompleted ? 'text-muted-foreground' : ''}`}>{task.title}</span>
            {isCompleted && task.completedAt && (
              <span className="text-[10px] text-task-complete">
                ✓ {format(parseISO(task.completedAt), 'dd MMM yyyy HH:mm')}
              </span>
            )}
            {isAdhoc && (
              <Badge variant="outline" className="text-[10px] bg-accent/30 text-accent-foreground border-accent">Ad-hoc</Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Overdue
              </Badge>
            )}
            {showPhaseBadge && (
              <Badge variant="outline" className={`text-[10px] ${phaseColors[task.phase]}`}>
                {PHASE_SHORT[task.phase]}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
            {schemeName && onSchemeClick ? (
              <button onClick={(e) => { e.stopPropagation(); onSchemeClick(); }} className="font-medium text-primary hover:underline cursor-pointer text-left">
                {schemeName}
              </button>
            ) : schemeName ? (
              <span className="font-medium text-foreground">{schemeName}</span>
            ) : null}
            <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-task-overdue' : !isCompleted ? 'text-task-reminder' : ''}`}>
              <Clock className="h-3 w-3" />
              Due: {task.dueDate ? format(parseISO(task.dueDate), 'dd MMM yyyy') : task.dueDateLabel}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {task.assignedTo.join(', ')}
            </span>
            {task.notes.length > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {task.notes.length}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 p-1">
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t px-4 py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {task.dueDate
              ? task.description.replace(/\btoday\b\.?/gi, `by ${format(parseISO(task.dueDate), 'dd MMM yyyy')}.`)
              : task.description}
          </p>

          {/* Audit Kick-Off Date Picker */}
          {task.isAuditKickOff && onSetAuditKickOffDate && (
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Audit Kick-Off Date
              </h4>
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[220px] justify-start text-left text-sm font-normal",
                        !auditKickOffDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {auditKickOffDate ? format(parseISO(auditKickOffDate), 'dd MMM yyyy') : 'Select audit date...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarWidget
                      mode="single"
                      selected={auditKickOffDate ? parseISO(auditKickOffDate) : undefined}
                      onSelect={(date) => date && onSetAuditKickOffDate(format(date, 'yyyy-MM-dd'))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {auditKickOffDate && (
                  <span className="text-xs text-task-complete flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Date confirmed
                  </span>
                )}
              </div>
              {!auditKickOffDate && (
                <p className="text-[11px] text-muted-foreground">
                  Enter the confirmed audit kick-off date once arranged with the auditors. This will generate tasks for subsequent phases.
                </p>
              )}
            </div>
          )}

          {/* ─── Email Section ─── */}
          {isEmail && (
            <div className="space-y-3 bg-muted/20 border border-border rounded-lg p-4">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Mail className="h-3.5 w-3.5" /> Email Communication
              </h4>

              {/* Email Draft - editable before sending, collapsed after */}
              {task.emailDraftTemplate && !allSent && (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Email Draft</span>
                    {task.contactTypeForRecipients && (
                      <Badge variant="outline" className="text-[10px] ml-auto">
                        To: {task.contactTypeForRecipients === 'Administrator' ? 'Admin Team' : task.contactTypeForRecipients}
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    value={editableDraft}
                    onChange={(e) => setEditableDraft(e.target.value)}
                    className="px-4 py-3 text-xs text-foreground font-sans leading-relaxed max-h-[300px] min-h-[150px] border-0 rounded-none focus-visible:ring-0 resize-y bg-white"
                  />
                </div>
              )}

              {/* Attachment option */}
              {task.allowAttachment && (
                <div className="flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2.5">
                  <Paperclip className="h-4 w-4 text-accent-foreground" />
                  <div className="flex-1">
                    <span className="text-xs font-medium text-foreground">{task.attachmentLabel || 'Attachment'}</span>
                    <p className="text-[10px] text-muted-foreground">Document will be attached to the email</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <Paperclip className="h-3 w-3 mr-1" /> Attach File
                  </Button>
                </div>
              )}

              {/* Recipients & Send */}
              {task.emailRecipients && task.emailRecipients.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Recipients ({selectedCount}/{task.emailRecipients.length} selected)
                      {task.contactTypeForRecipients && (
                        <span className="text-muted-foreground font-normal ml-1">
                          — {task.contactTypeForRecipients === 'Administrator' ? 'Admin Team' : task.contactTypeForRecipients}
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2">
                      {allSent && (
                        <Button size="sm" variant="outline" onClick={() => { if (!showFollowUp) setEditableFollowUp(getFollowUpEmailTemplate(schemeName || 'the scheme', task.title)); setShowFollowUp(!showFollowUp); }} className="h-7 text-xs">
                          <RotateCcw className="h-3 w-3 mr-1" /> Follow Up
                        </Button>
                      )}
                      {!allSent && (
                        <Button size="sm" variant="default" onClick={handleSendEmails} disabled={selectedCount === 0} className="h-7 text-xs">
                          <Send className="h-3 w-3 mr-1" /> Send to Selected ({selectedCount})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Select All toggle */}
                  <div className="flex items-center gap-2 pb-1 border-b border-border">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => toggleAllRecipients(schemeId, task.id, !!checked)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-[11px] text-muted-foreground font-medium">Select all</span>
                  </div>

                  <div className="space-y-1.5">
                    {task.emailRecipients.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 text-xs bg-muted/30 rounded-md px-3 py-2">
                        <Checkbox
                          checked={r.selected !== false}
                          onCheckedChange={() => toggleRecipientSelected(schemeId, task.id, r.id)}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{r.name}</span>
                            {r.company && r.company !== r.name && (
                              <span className="text-muted-foreground text-[10px]">({r.company})</span>
                            )}
                          </div>
                          <span className="text-muted-foreground">{r.email}</span>
                        </div>
                        {r.sentAt ? (
                          <span className="text-task-complete flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="h-3 w-3" />
                            Sent {format(parseISO(r.sentAt), 'dd MMM HH:mm')}
                          </span>
                        ) : (
                          <span className="text-task-pending shrink-0">Not sent</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Follow-up email section */}
                  {showFollowUp && (
                    <div className="border-t border-border pt-3 space-y-2">
                      <h5 className="text-xs font-semibold flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" /> Follow-Up Email Preview
                      </h5>
                      <div className="bg-muted/30 border border-border rounded-lg overflow-hidden">
                      <Textarea
                        value={editableFollowUp}
                        onChange={(e) => setEditableFollowUp(e.target.value)}
                        className="px-4 py-3 text-xs text-foreground font-sans leading-relaxed max-h-[200px] min-h-[120px] border-0 rounded-none focus-visible:ring-0 resize-y bg-white"
                      />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          Will be sent to {selectedCount} selected recipient(s)
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setShowFollowUp(false)} className="h-7 text-xs">Cancel</Button>
                          <Button size="sm" variant="default" onClick={handleSendFollowUp} disabled={selectedCount === 0} className="h-7 text-xs">
                            <Send className="h-3 w-3 mr-1" /> Send Follow-Up
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Send History */}
                  {task.emailHistory && task.emailHistory.length > 0 && (
                    <div className="border-t border-border pt-2 space-y-1.5">
                      <h5 className="text-[10px] font-semibold text-muted-foreground mb-1">Send History</h5>
                      {task.emailHistory.map((h, i) => (
                        <div key={i} className="text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {h.type === 'follow-up' ? (
                              <RotateCcw className="h-2.5 w-2.5" />
                            ) : (
                              <Send className="h-2.5 w-2.5" />
                            )}
                            {format(parseISO(h.sentAt), 'dd MMM yyyy HH:mm')} — {h.recipientCount} recipient(s)
                            {h.type === 'follow-up' && <Badge variant="outline" className="text-[9px] h-4">Follow-up</Badge>}
                            {h.emailText && (
                              <button
                                onClick={() => setShowSentEmail(showSentEmail === i ? null : i)}
                                className="text-primary hover:underline ml-1 text-[10px]"
                              >
                                {showSentEmail === i ? 'Hide email' : 'View sent email'}
                              </button>
                            )}
                          </div>
                          {showSentEmail === i && h.emailText && (
                            <div className="mt-1 ml-4 bg-muted/30 border border-border rounded-lg overflow-hidden">
                              <pre className="px-3 py-2 text-[11px] text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-[200px] overflow-y-auto">
                                {h.emailText}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No recipients warning */}
              {(!task.emailRecipients || task.emailRecipients.length === 0) && task.contactTypeForRecipients && (
                <div className="flex items-center gap-2 text-xs text-task-overdue bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  No {task.contactTypeForRecipients === 'Administrator' ? 'Admin Team' : task.contactTypeForRecipients} contacts found for this scheme. Please add contacts in Scheme Management.
                </div>
              )}
            </div>
          )}

          {/* ─── Task Notes Section (visually separate) ─── */}
          <div className="space-y-2 border-t border-dashed border-border pt-4">
            <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
              <MessageSquare className="h-3.5 w-3.5" /> Task Notes
            </h4>
            {task.notes.length > 0 && (
              <div className="space-y-1.5">
                {task.notes.map((n) => (
                  <div key={n.id} className="bg-muted/50 rounded-md px-3 py-2 text-xs">
                    <span className="font-medium">{n.author}</span>
                    <span className="text-muted-foreground ml-2">{format(parseISO(n.createdAt), 'dd MMM HH:mm')}</span>
                    <p className="mt-1">{n.text}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Textarea placeholder="Add a note about this task..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="text-xs min-h-[60px]" />
              <Button size="sm" variant="outline" onClick={handleAddNote} className="shrink-0 self-end">Add</Button>
            </div>
          </div>

          {isCompleted && task.completedAt && (
            <div className="text-xs text-task-complete flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed {format(parseISO(task.completedAt), 'dd MMM yyyy HH:mm')}
            </div>
          )}

          {/* Delete ad-hoc task button */}
          {isAdhoc && (
            <div className="border-t border-dashed border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Task
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              Delete Ad-hoc Task?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{task.title}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteAdhocTask(schemeId, task.id)}
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
