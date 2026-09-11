import { create } from 'zustand';
import { Scheme, Task, TaskNote, Phase, PreliminaryInfo, DraftAccountingReportData, UserRole, Team, InvestmentManagerReport, AccountsGenerationAttempt, MasterScheme, AuditTrailEntry } from './types';
import { generateMockSchemes, generateMockTeams, getTeamLeadForPreparer, generateMockMasterSchemes, recomputeNonPlanningDates } from './mock-data';

// Helper to create audit trail entries
function createAuditEntry(performedBy: string, action: string, category: AuditTrailEntry['category'], detail?: string): AuditTrailEntry {
  return {
    id: `at-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    performedBy,
    action,
    detail,
    category,
  };
}

// Compute the current phase based on which task phases have incomplete tasks
export function computePhaseFromTasks(tasks: Task[], isAllocated: boolean): Phase {
  if (!isAllocated) return 'not-started';
  const phases: Phase[] = ['planning', 'peer-review', 'audit-process', 'audit-sign-off'];
  for (const phase of phases) {
    const phaseTasks = tasks.filter(t => t.phase === phase);
    if (phaseTasks.length > 0 && phaseTasks.some(t => t.status !== 'completed')) {
      return phase;
    }
  }
  // All tasks in all phases are completed
  return 'audit-sign-off';
}

interface WorkflowState {
  schemes: Scheme[];
  teams: Team[];
  masterSchemes: MasterScheme[];
  selectedSchemeId: string | null;
  activePhase: Phase;
  searchQuery: string;
  showDraftReport: boolean;
  showTeamManagement: boolean;
  showSchemeManagement: boolean;
  showNotifications: boolean;
  currentUserRole: UserRole;
  currentUserName: string;
  setSelectedScheme: (id: string | null) => void;
  setActivePhase: (phase: Phase) => void;
  setSearchQuery: (q: string) => void;
  setShowDraftReport: (show: boolean) => void;
  setShowTeamManagement: (show: boolean) => void;
  setShowSchemeManagement: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setCurrentUserRole: (role: UserRole) => void;
  setCurrentUserName: (name: string) => void;
  toggleTaskComplete: (schemeId: string, taskId: string) => void;
  addTaskNote: (schemeId: string, taskId: string, note: Omit<TaskNote, 'id'>) => void;
  sendEmails: (schemeId: string, taskId: string, emailText?: string) => void;
  sendFollowUpEmails: (schemeId: string, taskId: string, emailText?: string) => void;
  toggleRecipientSelected: (schemeId: string, taskId: string, recipientId: string) => void;
  toggleAllRecipients: (schemeId: string, taskId: string, selected: boolean) => void;
  completeScheme: (schemeId: string) => void;
  addAdhocTask: (schemeId: string, task: Omit<Task, 'id'>) => void;
  deleteAdhocTask: (schemeId: string, taskId: string) => void;
  updatePreliminaryInfo: (schemeId: string, info: Partial<PreliminaryInfo>) => void;
  updateDraftAccountingReport: (schemeId: string, data: Partial<DraftAccountingReportData>) => void;
  answerQuestion: (schemeId: string, questionId: number, value: string, subValues?: Record<string, string>) => void;
  clearAnswer: (schemeId: string, questionId: number) => void;
  startGenerateAccounts: (schemeId: string) => void;
  completeGenerateAccounts: (schemeId: string) => void;
  allocateScheme: (schemeId: string, preparer: string, peerReviewer: string, signingDeadline: string) => void;
  setAuditKickOffDate: (schemeId: string, date: string) => void;
  addInvestmentManagerReport: (schemeId: string, report: InvestmentManagerReport) => void;
  removeInvestmentManagerReport: (schemeId: string, reportId: string) => void;
  updateGenerationNotes: (schemeId: string, notes: string) => void;
  updateMasterScheme: (id: string, data: Partial<MasterScheme>) => void;
  addMasterScheme: (scheme: MasterScheme) => void;
  toggleTeamMemberActive: (teamId: string, memberId: string) => void;
  setTeamLead: (teamId: string, memberName: string) => void;
  addTeamMember: (teamId: string, member: { name: string; email: string; role: 'preparer' | 'peer-reviewer' }) => void;
  changeTeamMemberRole: (teamId: string, memberId: string, role: 'preparer' | 'peer-reviewer') => void;
  uploadDraftVersion: (schemeId: string, fileName: string) => void;
  dismissFormatWarning: (schemeId: string, field: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  schemes: generateMockSchemes(),
  teams: generateMockTeams(),
  masterSchemes: generateMockMasterSchemes(),
  selectedSchemeId: null,
  activePhase: 'planning',
  searchQuery: '',
  showDraftReport: false,
  showTeamManagement: false,
  showSchemeManagement: false,
  showNotifications: false,
  currentUserRole: 'preparer',
  currentUserName: 'Sean Wilson',
  setSelectedScheme: (id) => set((state) => {
    const scheme = id ? state.schemes.find(s => s.id === id) : null;
    const phase = scheme
      ? (scheme.currentPhase === 'completed' || scheme.currentPhase === 'not-started' ? 'audit-sign-off' : scheme.currentPhase)
      : state.activePhase;
    return { selectedSchemeId: id, showDraftReport: false, activePhase: phase as Phase };
  }),
  setActivePhase: (phase) => set({ activePhase: phase }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setShowDraftReport: (show) => set({ showDraftReport: show }),
  setShowTeamManagement: (show) => set({ showTeamManagement: show, selectedSchemeId: null, showSchemeManagement: false }),
  setShowSchemeManagement: (show) => set({ showSchemeManagement: show, selectedSchemeId: null, showTeamManagement: false }),
  setShowNotifications: (show) => set({ showNotifications: show }),
  setCurrentUserRole: (role) => set({ currentUserRole: role, selectedSchemeId: null, showDraftReport: false, showTeamManagement: false, showSchemeManagement: false, showNotifications: false }),
  setCurrentUserName: (name) => set({ currentUserName: name }),
  toggleTaskComplete: (schemeId, taskId) =>
    set((state) => ({
      schemes: state.schemes.map((s) => {
        if (s.id !== schemeId) return s;
        const userName = state.currentUserName || 'System';
        const now = new Date().toISOString();
        const targetTask = s.tasks.find(t => t.id === taskId);
        const updatedTasks = s.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: t.status === 'completed' ? ('pending' as const) : ('completed' as const),
                completedAt: t.status === 'completed' ? undefined : now,
              }
            : t
        );
        const newStatus = targetTask?.status === 'completed' ? 'reopened' : 'completed';
        const wasCompleted = s.currentPhase === 'completed';
        const computedPhase = wasCompleted ? computePhaseFromTasks(updatedTasks, s.isAllocated) : computePhaseFromTasks(updatedTasks, s.isAllocated);
        return {
          ...s,
          tasks: updatedTasks,
          currentPhase: computedPhase,
          lastActivity: {
            action: `Task "${targetTask?.title}" ${newStatus}`,
            by: userName,
            at: now,
          },
          auditTrail: [...s.auditTrail, createAuditEntry(
            userName,
            `Task ${newStatus}`,
            'task',
            `"${targetTask?.title}" ${newStatus}`
          )],
        };
      }),
    })),
  addTaskNote: (schemeId, taskId, note) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? {
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, notes: [...t.notes, { ...note, id: `note-${Date.now()}` }] }
                  : t
              ),
            }
          : s
      ),
    })),
  sendEmails: (schemeId, taskId, emailText) =>
    set((state) => {
      const userName = state.currentUserName || 'System';
      const now = new Date().toISOString();
      return {
        schemes: state.schemes.map((s) =>
          s.id === schemeId
            ? {
                ...s,
                lastActivity: { action: `Emails sent for "${s.tasks.find(t => t.id === taskId)?.title || 'Unknown'}"`, by: userName, at: now },
                tasks: s.tasks.map((t) =>
                  t.id === taskId && t.emailRecipients
                    ? {
                        ...t,
                        emailRecipients: t.emailRecipients.map((r) => ({
                          ...r,
                          sentAt: (r.selected !== false && !r.sentAt) ? now : r.sentAt,
                        })),
                        emailHistory: [
                          ...(t.emailHistory || []),
                          { sentAt: now, recipientCount: t.emailRecipients.filter(r => r.selected !== false && !r.sentAt).length, type: 'initial' as const, emailText },
                        ],
                      }
                    : t
                ),
                auditTrail: [...s.auditTrail, createAuditEntry(
                  userName, 'Emails sent', 'email',
                  `Initial emails sent for "${s.tasks.find(t => t.id === taskId)?.title || 'Unknown'}" to ${s.tasks.find(t => t.id === taskId)?.emailRecipients?.filter(r => r.selected !== false && !r.sentAt).length || 0} recipients`
                )],
              }
            : s
        ),
      };
    }),
  sendFollowUpEmails: (schemeId, taskId, emailText) =>
    set((state) => {
      const userName = state.currentUserName || 'System';
      return {
        schemes: state.schemes.map((s) =>
          s.id === schemeId
            ? {
                ...s,
                tasks: s.tasks.map((t) =>
                  t.id === taskId && t.emailRecipients
                    ? {
                        ...t,
                        emailHistory: [
                          ...(t.emailHistory || []),
                          { sentAt: new Date().toISOString(), recipientCount: t.emailRecipients.filter(r => r.selected !== false).length, type: 'follow-up' as const, emailText },
                        ],
                      }
                    : t
                ),
                auditTrail: [...s.auditTrail, createAuditEntry(
                  userName, 'Follow-up emails sent', 'email',
                  `Follow-up emails for "${s.tasks.find(t => t.id === taskId)?.title || 'Unknown'}"`
                )],
              }
            : s
        ),
      };
    }),
  toggleRecipientSelected: (schemeId, taskId, recipientId) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? {
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === taskId && t.emailRecipients
                  ? {
                      ...t,
                      emailRecipients: t.emailRecipients.map((r) =>
                        r.id === recipientId ? { ...r, selected: r.selected === false ? true : false } : r
                      ),
                    }
                  : t
              ),
            }
          : s
      ),
    })),
  toggleAllRecipients: (schemeId, taskId, selected) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? {
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === taskId && t.emailRecipients
                  ? {
                      ...t,
                      emailRecipients: t.emailRecipients.map((r) => ({ ...r, selected })),
                    }
                  : t
              ),
            }
          : s
      ),
    })),
  addAdhocTask: (schemeId, task) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? {
              ...s,
              tasks: [...s.tasks, { ...task, id: `adhoc-${Date.now()}` }],
              auditTrail: [...s.auditTrail, createAuditEntry(state.currentUserName, 'Ad-hoc task added', 'task', `"${task.title}" added to ${task.phase}`)],
            }
          : s
      ),
    })),
  deleteAdhocTask: (schemeId, taskId) =>
    set((state) => {
      const scheme = state.schemes.find(s => s.id === schemeId);
      const task = scheme?.tasks.find(t => t.id === taskId);
      return {
        schemes: state.schemes.map((s) =>
          s.id === schemeId
            ? {
                ...s,
                tasks: s.tasks.filter(t => t.id !== taskId),
                auditTrail: [...s.auditTrail, createAuditEntry(state.currentUserName, 'Ad-hoc task deleted', 'task', `"${task?.title}" removed`)],
              }
            : s
        ),
      };
    }),
  updatePreliminaryInfo: (schemeId, info) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? { ...s, preliminaryInfo: { ...s.preliminaryInfo, ...info } }
          : s
      ),
    })),
  updateDraftAccountingReport: (schemeId, data) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? { ...s, draftAccountingReport: { ...s.draftAccountingReport, ...data } }
          : s
      ),
    })),
  answerQuestion: (schemeId, questionId, value, subValues) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? {
              ...s,
              draftAccountingReport: {
                ...s.draftAccountingReport,
                questionnaireAnswers: s.draftAccountingReport.questionnaireAnswers.map((a) =>
                  a.questionId === questionId
                    ? { ...a, answered: true, value, subValues: subValues || a.subValues }
                    : a
                ),
              },
            }
          : s
      ),
    })),
  clearAnswer: (schemeId, questionId) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? {
              ...s,
              draftAccountingReport: {
                ...s.draftAccountingReport,
                questionnaireAnswers: s.draftAccountingReport.questionnaireAnswers.map((a) =>
                  a.questionId === questionId
                    ? { ...a, answered: false, value: '', subValues: undefined }
                    : a
                ),
              },
            }
          : s
      ),
    })),
  startGenerateAccounts: (schemeId) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? { ...s, draftAccountingReport: { ...s.draftAccountingReport, accountsGenerationStatus: 'generating' as const } }
          : s
      ),
    })),
  completeGenerateAccounts: (schemeId) =>
    set((state) => ({
      schemes: state.schemes.map((s) => {
        if (s.id !== schemeId) return s;
        const dar = s.draftAccountingReport;
        const version = dar.generationHistory.length + 1;
        const fileName = `${s.name.replace(/\s+/g, '_')}_Annual_Report_2025_v${version}.docx`;
        const attempt: AccountsGenerationAttempt = {
          id: `gen-${Date.now()}`,
          version,
          generatedAt: new Date().toISOString(),
          fileName,
          questionsAnswered: dar.questionnaireAnswers.filter(a => a.answered).length,
          totalQuestions: dar.questionnaireAnswers.length,
          notes: dar.generationNotes || undefined,
          actionType: 'generated',
          actionBy: s.preparer || 'System',
        };
        return {
          ...s,
          draftAccountingReport: {
            ...dar,
            accountsGenerationStatus: 'generated' as const,
            generatedFileName: fileName,
            generationHistory: [...dar.generationHistory, attempt],
          },
          auditTrail: [...s.auditTrail, createAuditEntry(s.preparer || 'System', 'Draft accounts generated', 'generation', `Version ${version}: ${fileName}`)],
        };
      }),
    })),
  uploadDraftVersion: (schemeId, fileName) =>
    set((state) => ({
      schemes: state.schemes.map((s) => {
        if (s.id !== schemeId) return s;
        const dar = s.draftAccountingReport;
        const version = dar.generationHistory.length + 1;
        const attempt: AccountsGenerationAttempt = {
          id: `upload-${Date.now()}`,
          version,
          generatedAt: new Date().toISOString(),
          fileName,
          questionsAnswered: dar.questionnaireAnswers.filter(a => a.answered).length,
          totalQuestions: dar.questionnaireAnswers.length,
          actionType: 'uploaded',
          actionBy: s.preparer || 'Current User',
        };
        return {
          ...s,
          draftAccountingReport: {
            ...dar,
            accountsGenerationStatus: 'generated' as const,
            generatedFileName: fileName,
            generationHistory: [...dar.generationHistory, attempt],
          },
          auditTrail: [...s.auditTrail, createAuditEntry(s.preparer || 'Current User', 'Draft version uploaded', 'document', `Version ${version}: ${fileName}`)],
        };
      }),
    })),
  dismissFormatWarning: (schemeId, field) =>
    set((state) => ({
      schemes: state.schemes.map((s) => {
        if (s.id !== schemeId) return s;
        const dar = s.draftAccountingReport;
        const docField = field as keyof DraftAccountingReportData;
        const doc = dar[docField];
        if (doc && typeof doc === 'object' && 'uploaded' in doc) {
          return {
            ...s,
            draftAccountingReport: {
              ...dar,
              [docField]: { ...doc, formatWarning: false },
            },
          };
        }
        return s;
      }),
    })),
  allocateScheme: (schemeId, preparer, peerReviewer, signingDeadline) =>
    set((state) => ({
      schemes: state.schemes.map((s) => {
        if (s.id !== schemeId) return s;
        const userName = state.currentUserName;
        const tl = getTeamLeadForPreparer(preparer);
        const wasAllocated = s.isAllocated;
        return {
          ...s,
          preparer,
          peerReviewer,
          teamLead: tl,
          isAllocated: true,
          signingDeadline,
          currentPhase: s.currentPhase === 'not-started' ? 'planning' as const : s.currentPhase,
          lastActivity: {
            action: `Allocated to ${preparer} (Preparer) & ${peerReviewer} (Reviewer)`,
            by: userName,
            at: new Date().toISOString(),
          },
          auditTrail: [...s.auditTrail, createAuditEntry(
            userName,
            wasAllocated ? 'Team re-allocated' : 'Team allocated',
            'allocation',
            `Preparer: ${preparer}, Peer Reviewer: ${peerReviewer}, Team Lead: ${tl}`
          )],
        };
      }),
    })),
  addInvestmentManagerReport: (schemeId, report) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? {
              ...s,
              draftAccountingReport: {
                ...s.draftAccountingReport,
                investmentManagerReports: [...s.draftAccountingReport.investmentManagerReports, report],
              },
            }
          : s
      ),
    })),
  removeInvestmentManagerReport: (schemeId, reportId) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? {
              ...s,
              draftAccountingReport: {
                ...s.draftAccountingReport,
                investmentManagerReports: s.draftAccountingReport.investmentManagerReports.filter(r => r.id !== reportId),
              },
            }
          : s
      ),
    })),
  updateGenerationNotes: (schemeId, notes) =>
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === schemeId
          ? { ...s, draftAccountingReport: { ...s.draftAccountingReport, generationNotes: notes } }
          : s
      ),
    })),
  toggleTeamMemberActive: (teamId, memberId) =>
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === teamId
          ? { ...t, members: t.members.map(m => m.id === memberId ? { ...m, isActive: !m.isActive } : m) }
          : t
      ),
    })),
  setTeamLead: (teamId, memberName) =>
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === teamId ? { ...t, teamLead: memberName } : t
      ),
    })),
  addTeamMember: (teamId, member) =>
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === teamId
          ? { ...t, members: [...t.members, { id: `tm-${Date.now()}`, ...member, isActive: true }] }
          : t
      ),
    })),
  changeTeamMemberRole: (teamId, memberId, role) =>
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === teamId
          ? { ...t, members: t.members.map(m => m.id === memberId ? { ...m, role } : m) }
          : t
      ),
    })),
  updateMasterScheme: (id, data) =>
    set((state) => ({
      masterSchemes: state.masterSchemes.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    })),
  addMasterScheme: (scheme) =>
    set((state) => ({
      masterSchemes: [...state.masterSchemes, scheme],
    })),
  completeScheme: (schemeId) =>
    set((state) => {
      const userName = state.currentUserName || 'System';
      const now = new Date().toISOString();
      return {
        schemes: state.schemes.map((s) =>
          s.id === schemeId ? {
            ...s,
            currentPhase: 'completed' as const,
            completedBy: userName,
            completedAt: now,
            lastActivity: { action: 'Scheme marked as completed', by: userName, at: now },
            auditTrail: [...s.auditTrail, createAuditEntry(userName, 'Scheme completed', 'phase', 'Scheme accounts marked as completed')],
          } : s
        ),
      };
    }),
  setAuditKickOffDate: (schemeId, date) =>
    set((state) => ({
      schemes: state.schemes.map((s) => {
        if (s.id !== schemeId) return s;
        const userName = state.currentUserName || 'System';
        const dateMap = recomputeNonPlanningDates(s.yearEndDate, date);
        const updatedTasks = s.tasks.map(t => {
          if (t.phase === 'planning') return t;
          const newDate = dateMap[t.number];
          return newDate ? { ...t, dueDate: newDate } : t;
        });
        return {
          ...s,
          auditStartDate: date,
          tasks: updatedTasks,
          lastActivity: {
            action: 'Audit kick-off date arranged',
            by: userName,
            at: new Date().toISOString(),
          },
          auditTrail: [...s.auditTrail, createAuditEntry(userName, 'Audit kick-off date set', 'system', `Date: ${date}`)],
        };
      }),
    })),
}));
