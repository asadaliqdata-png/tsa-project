import { Scheme, Task, Phase, PreliminaryInfo, DraftAccountingReportData, QUESTIONNAIRE_QUESTIONS, Team, TeamMember, MasterScheme, SchemeContact, ContactType } from './types';
import { addDays, addMonths, subDays, subMonths, format, parseISO } from 'date-fns';
import { getInvestmentManagerEmailTemplate, getAdminTeamEmailTemplate, getClientTeamEmailTemplate, getInvestmentRiskEmailTemplate, getAuditArrangementEmailTemplate } from './email-templates';

// --- People ---
export const preparers = ['Sean Wilson', 'Ben Martinez', 'Claire O\'Brien', 'David Osei', 'Emma Wright',
  'James Wilson', 'Kate Morgan', 'Liam Taylor', 'Nina Patel', 'Oliver Brown'];
export const peerReviewers = ['Kieran Roberts', 'Sam Frost', 'Tanya Shah', 'Will Cooper', 'Zara Hussain'];
const teamLeads = ['Louise Neill', 'George Patel', 'Hannah Kim', 'Robert Clarke', 'Sarah Jennings'];
export const seniorManagers = ['Simon Kent', 'Colette McKinley'];

// --- Teams ---
export function generateMockTeams(): Team[] {
  const teamNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
  return teamNames.map((name, i) => {
    const lead = teamLeads[i];
    const members: TeamMember[] = [];
    for (let j = 0; j < 4; j++) {
      const pIdx = (i * 4 + j) % 20;
      members.push({
        id: `tm-${i}-p-${j}`,
        name: pIdx < preparers.length ? preparers[pIdx] : `Preparer ${pIdx + 1}`,
        email: `preparer${pIdx + 1}@isio.com`,
        role: 'preparer',
        isActive: true,
      });
    }
    for (let j = 0; j < 2; j++) {
      const rIdx = (i * 2 + j) % 10;
      members.push({
        id: `tm-${i}-r-${j}`,
        name: rIdx < peerReviewers.length ? peerReviewers[rIdx] : `Reviewer ${rIdx + 1}`,
        email: `reviewer${rIdx + 1}@isio.com`,
        role: 'peer-reviewer',
        isActive: true,
      });
    }
    return { id: `team-${i}`, name: `Team ${name}`, teamLead: lead, members };
  });
}

// --- Scheme names ---
const schemeNames = [
  'ABC Pension Scheme', 'Meridian Group Pension', 'Northern Trust PS',
  'Caledonia Retirement Fund', 'Sterling Capital Pension', 'Horizon Benefits PS',
  'Commonwealth Pension Fund', 'Pinnacle Group PS', 'Atlas Retirement Plan',
  'Vanguard Staff Pension', 'Eclipse Benefits Fund', 'Summit Pension Scheme',
  'Cornerstone PS', 'Beacon Retirement Fund', 'Sapphire Group Pension',
  'Oakwood Pension Plan', 'Westfield Retirement Fund', 'Ironbridge PS',
  'Thames Valley Pension', 'Highland Capital PS', 'Silverstone Group Pension',
  'Riviera Retirement Plan', 'Pacific Benefits PS', 'Evergreen Pension Fund',
  'Diamond Staff Pension', 'Mayfair Group PS', 'Canterbury Retirement Fund',
  'Ashford Pension Scheme', 'Bristol Capital PS', 'Stratford Benefits Fund',
  'Kensington Retirement Plan', 'Windsor Group PS', 'Harrow Pension Fund',
  'Cheltenham Capital PS', 'Lancaster Benefits Fund', 'Norfolk Staff Pension',
  'Suffolk Retirement Plan', 'Dorset Group PS', 'Devon Pension Fund',
  'Cornwall Benefits PS', 'Hampshire Retirement Fund', 'Wiltshire Capital PS',
  'Somerset Pension Plan', 'Avon Group PS', 'Gloucester Benefits Fund',
  'Hertford Staff Pension', 'Bedford Retirement Plan', 'Cambridge Group PS',
  'Oxford Pension Fund', 'Berkshire Benefits PS', 'Surrey Capital Pension',
  'Kent Retirement Fund', 'Essex Group PS', 'Middlesex Pension Plan',
  'Warwick Benefits Fund', 'Leicester Staff Pension', 'Nottingham Retirement PS',
  'Derby Group Pension', 'Lincoln Capital PS', 'Rutland Benefits Fund',
  'Stafford Pension Scheme', 'Shropshire Retirement Plan', 'Hereford Group PS',
  'Worcester Pension Fund', 'Chester Benefits PS', 'Mersey Capital Pension',
  'Tyne Retirement Fund', 'Wear Group PS', 'Durham Pension Plan',
  'Northumberland Benefits Fund', 'Cumberland Staff Pension', 'Westmorland PS',
  'Yorkshire Retirement Plan', 'Humber Group PS', 'Pennine Pension Fund',
  'Lakeland Benefits PS', 'Cotswold Capital Pension', 'Chiltern Retirement Fund',
  'Mendip Group PS', 'Exmoor Pension Plan', 'Dartmoor Benefits Fund',
  'Snowdon Staff Pension', 'Brecon Retirement Plan', 'Severn Group PS',
  'Trent Pension Fund', 'Avon Valley Benefits PS', 'Kennet Capital Pension',
  'Medway Retirement Fund', 'Wey Group PS', 'Mole Valley Pension Plan',
  'Rother Benefits Fund', 'Arun Staff Pension', 'Adur Retirement Plan',
  'Lewes Group PS', 'Wealden Pension Fund', 'Hastings Benefits PS',
  'Thanet Capital Pension', 'Swale Retirement Fund', 'Shepway Group PS',
  'Tonbridge Pension Plan', 'Sevenoaks Benefits Fund',
];

function computeDueDates(yearEndDate: Date, auditStartDate: Date) {
  return {
    task2: format(subMonths(yearEndDate, 1), 'yyyy-MM-dd'),
    task3: format(subMonths(yearEndDate, 1), 'yyyy-MM-dd'),
    task4: format(yearEndDate, 'yyyy-MM-dd'),
    task5: format(yearEndDate, 'yyyy-MM-dd'),
    task6: format(addMonths(yearEndDate, 1), 'yyyy-MM-dd'),
    taskDraft: format(addMonths(yearEndDate, 2), 'yyyy-MM-dd'),
    task7: format(subDays(auditStartDate, 17), 'yyyy-MM-dd'),
    task8: format(subDays(auditStartDate, 10), 'yyyy-MM-dd'),
    task9: format(subDays(auditStartDate, 7), 'yyyy-MM-dd'),
    task10: format(subDays(auditStartDate, 3), 'yyyy-MM-dd'),
    task11: format(addDays(auditStartDate, 14), 'yyyy-MM-dd'),
    task12: format(addDays(auditStartDate, 21), 'yyyy-MM-dd'),
    task13: format(addDays(auditStartDate, 21), 'yyyy-MM-dd'),
    task14: format(addDays(auditStartDate, 56), 'yyyy-MM-dd'),
    task15: format(addDays(auditStartDate, 63), 'yyyy-MM-dd'),
    task16: format(addDays(auditStartDate, 63), 'yyyy-MM-dd'),
    task17: format(addDays(auditStartDate, 77), 'yyyy-MM-dd'),
    task18: format(addDays(auditStartDate, 84), 'yyyy-MM-dd'),
    task19: format(addMonths(yearEndDate, 7), 'yyyy-MM-dd'),
  };
}

const createTaskTemplate = (dates: ReturnType<typeof computeDueDates>): Omit<Task, 'id'>[] => [
  // Phase 1 – Planning
  {
    number: 1, phase: 'planning',
    title: 'Send investment year end requests',
    description: 'Investment year end requests need to be shared. Standard email generation to investment managers.',
    type: 'email', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task2, dueDateLabel: '1 month before year end', notes: [], isTeamLeadRequired: true,
    contactTypeForRecipients: 'Investment Managers',
    emailRecipients: [], emailHistory: [],
  },
  {
    number: 2, phase: 'planning',
    title: 'Arrange audit date (audit kick off)',
    description: 'Audit date needs to be arranged with the auditors. Contact the auditor to confirm a suitable date, then enter the confirmed audit kick-off date below.',
    type: 'email', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task3, dueDateLabel: '1 month before year end', notes: [], isTeamLeadRequired: false,
    isAuditKickOff: true,
    contactTypeForRecipients: 'Auditor',
    emailRecipients: [], emailHistory: [],
  },
  {
    number: 3, phase: 'planning',
    title: 'Send consultant/client team questionnaire',
    description: 'Consultant/client team questionnaire needs to be shared. A client questionnaire document can be attached to this email.',
    type: 'email', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task4, dueDateLabel: 'At year end date', notes: [], isTeamLeadRequired: true,
    contactTypeForRecipients: 'Client Team/Consultant',
    allowAttachment: true,
    attachmentLabel: 'Client Questionnaire',
    emailRecipients: [], emailHistory: [],
  },
  {
    number: 4, phase: 'planning',
    title: 'Send admin team questionnaire',
    description: 'Admin team questionnaire needs to be shared.',
    type: 'email', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task5, dueDateLabel: 'At year end date', notes: [], isTeamLeadRequired: true,
    contactTypeForRecipients: 'Administrator',
    emailRecipients: [], emailHistory: [],
  },
  {
    number: 5, phase: 'planning',
    title: 'Send investment risk disclosure & implementation statement requests',
    description: 'Investment risk disclosure request and implementation statement request needs to be shared.',
    type: 'email', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task6, dueDateLabel: '1 month after year end', notes: [], isTeamLeadRequired: true,
    contactTypeForRecipients: 'Investment Advisors',
    emailRecipients: [], emailHistory: [],
  },
  {
    number: 6, phase: 'planning',
    title: 'Draft Accounts',
    description: 'Draft accounts need to be prepared.',
    type: 'draft-accounting-report', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.taskDraft, dueDateLabel: '2 months after year end', notes: [], isTeamLeadRequired: false,
  },
  // Phase 2 – Peer Review
  {
    number: 7, phase: 'peer-review',
    title: 'Send draft accounts for peer review',
    description: 'Draft accounts need to be sent to the peer reviewer for review.',
    type: 'reminder', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task7, dueDateLabel: '17 days before audit start', notes: [], isTeamLeadRequired: false,
  },
  {
    number: 8, phase: 'peer-review',
    title: 'Peer review to be completed',
    description: 'Peer review needs to be completed today.',
    type: 'reminder', status: 'pending', assignedTo: ['Peer Reviewer'],
    dueDate: dates.task8, dueDateLabel: '10 days before audit start', notes: [], isTeamLeadRequired: false,
  },
  {
    number: 9, phase: 'peer-review',
    title: 'Team lead check-in on audit status',
    description: 'Team lead to check in on status of audit.',
    type: 'reminder', status: 'pending', assignedTo: ['Team Lead'],
    dueDate: dates.task9, dueDateLabel: '7 days before audit start', notes: [], isTeamLeadRequired: false,
  },
  {
    number: 10, phase: 'peer-review',
    title: 'Audit pack to be shared',
    description: 'Audit pack to be shared today.',
    type: 'reminder', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task10, dueDateLabel: '3 days before audit start', notes: [], isTeamLeadRequired: false,
  },
  // Phase 3 – Audit Process
  {
    number: 11, phase: 'audit-process',
    title: 'Initial audit queries due to be received',
    description: 'Initial audit queries are due to be received today.',
    type: 'reminder', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task11, dueDateLabel: '14 days after audit start', notes: [], isTeamLeadRequired: true,
  },
  {
    number: 12, phase: 'audit-process',
    title: 'Initial audit queries response check',
    description: 'Initial audit queries are due to be responded to today.',
    type: 'reminder', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task12, dueDateLabel: '21 days after audit start', notes: [], isTeamLeadRequired: true,
  },
  {
    number: 13, phase: 'audit-process',
    title: 'Initial audit queries response follow-up',
    description: 'Follow-up that initial audit queries are due to be responded to today.',
    type: 'reminder', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task13, dueDateLabel: '21 days after audit start', notes: [], isTeamLeadRequired: true,
  },
  {
    number: 14, phase: 'audit-process',
    title: 'Final audit queries due to be received',
    description: 'Final audit queries are due to be received today.',
    type: 'reminder', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task14, dueDateLabel: '56 days after audit start', notes: [], isTeamLeadRequired: true,
  },
  {
    number: 15, phase: 'audit-process',
    title: 'Final audit queries response due',
    description: 'Final audit queries are due to be responded to today.',
    type: 'reminder', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task15, dueDateLabel: '63 days after audit start', notes: [], isTeamLeadRequired: true,
  },
  {
    number: 16, phase: 'audit-process',
    title: 'Draft accounts to Trustee(s)',
    description: 'Draft accounts are due to be sent to Trustee(s) today.',
    type: 'reminder', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task16, dueDateLabel: '63 days after audit start', notes: [], isTeamLeadRequired: true,
  },
  // Phase 4 – Audit Sign Off
  {
    number: 17, phase: 'audit-sign-off',
    title: 'Audit clearance due',
    description: 'Audit clearance is due today.',
    type: 'reminder', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task17, dueDateLabel: '77 days after audit start', notes: [], isTeamLeadRequired: true,
  },
  {
    number: 18, phase: 'audit-sign-off',
    title: 'Final accounts to Trustee(s) for signing',
    description: 'Final accounts are due to be signed by Trustee(s) today.',
    type: 'reminder', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task18, dueDateLabel: '84 days after audit start', notes: [], isTeamLeadRequired: true,
  },
  {
    number: 19, phase: 'audit-sign-off',
    title: 'Accounts due to be signed',
    description: 'At signing deadline (7 months after year end), accounts are due to be signed today. Mark as complete when done.',
    type: 'reminder', status: 'pending', assignedTo: ['Preparer'],
    dueDate: dates.task19, dueDateLabel: '7 months after year end', notes: [], isTeamLeadRequired: false,
  },
];

function createDefaultPreliminaryInfo(i: number, name: string, hasCompletedTasks: boolean, yearEndDate: Date): PreliminaryInfo {
  // Any scheme that has progressed (has completed tasks or is allocated and past not-started) must have preliminary checks done
  if (hasCompletedTasks) {
    return {
      schemeRegNo: `007659${(18 + i).toString().padStart(2, '0')}RD`,
      priorYearDocsUploaded: true,
      acPeriodConfirmed: true,
      acPeriodDate: format(yearEndDate, 'dd-MMM-yy'),
      schemeNameConfirmed: true,
      schemeName: name,
      nameAbbreviation: name.split(' ').map(w => w[0]).join('').slice(0, 4),
    };
  }
  return {
    schemeRegNo: '', priorYearDocsUploaded: false, acPeriodConfirmed: false,
    acPeriodDate: '', schemeNameConfirmed: false, schemeName: '', nameAbbreviation: '',
  };
}

// Pre-filled answer values for demo schemes
const prefillValues: Record<number, string> = {
  1: 'Trustees', 2: 'Auditor', 3: 'Defined Benefit', 4: 'No',
  5: '1995-06-15', 6: 'Trust Deed dated 15 June 1995, subsequently amended on 1 March 2010 and 1 April 2018',
  7: 'Yes', 8: 'No', 9: 'Individuals and a corporate', 10: '4',
  11: 'No', 12: 'No', 13: 'No', 14: 'Yes', 15: 'Yes', 16: 'Yes',
  17: 'Yes', 18: 'Thousands (£\'000)', 19: 'Net additions/(withdrawals) from dealings with members',
  20: 'Net increase/(decrease) in the fund during the year', 21: 'No', 22: 'English law',
  23: 'Yes', 24: 'Scheme Actuary', 25: 'No', 26: 'No', 27: 'No', 28: 'Yes',
  29: 'Separately from the main investments', 30: 'With-profits,Unitised', 31: 'Yes',
};

const emptyDoc = (): import('./types').DocumentUpload => ({ uploaded: false });
const uploadedDoc = (name: string, daysAgo: number = 10, formatWarning?: boolean): import('./types').DocumentUpload => ({
  uploaded: true,
  fileName: name,
  uploadedAt: subDays(new Date(), daysAgo).toISOString(),
  ...(formatWarning ? { formatWarning: true } : {}),
});

// Investment manager providers for IM report placeholders
const imProviders = ['Mobius Life', 'Standard Life', 'Aegon Asset Management', 'Fidelity International', 'Aviva International', 'Legal & General'];

function createDefaultDraftAccountingReport(i: number, draftTaskCompleted: boolean, schemeType: string): DraftAccountingReportData {
  const isPastPlanning = i % 20 >= 8;
  const isFullyCompleted = i === 4 || draftTaskCompleted;
  const shouldPrefill = isPastPlanning || isFullyCompleted;
  const answers = QUESTIONNAIRE_QUESTIONS.map((q) => ({
    questionId: q.id,
    answered: shouldPrefill,
    value: shouldPrefill ? (prefillValues[q.id] || (q.type === 'yes-no' ? 'No' : '')) : '',
    subValues: {},
  }));
  const schemeName = schemeNames[i] || `Scheme ${i}`;
  const prepName = preparers[i % preparers.length];

  // Determine which conditional docs apply
  const isDCorHybridDC = schemeType === 'Defined Contribution' || schemeType === 'Hybrid';
  const isDBorHybridDB = schemeType === 'Defined Benefit' || schemeType === 'Hybrid';

  // Create varied upload states for documents
  // Schemes that are past planning get most docs uploaded; planning schemes get partial; not-started get none
  const partialUpload = shouldPrefill;
  const someUploaded = i % 3 !== 2 && partialUpload; // 2/3 of prefilled have extra docs
  const mostUploaded = i % 5 < 3 && partialUpload; // ~60% have most docs

  // Investment manager reports — all 6 providers, varied upload states
  const imUploadCount = shouldPrefill ? (3 + (i % 4)) : (i % 5 === 0 ? 2 : 0); // prefilled: 3-6, otherwise 0 or 2
  const imReports: import('./types').InvestmentManagerReport[] = imProviders
    .slice(0, imUploadCount)
    .map((provider, idx) => ({
      id: `im-${i}-${idx}`,
      name: provider,
      fileName: `${provider.replace(/\s+/g, '_')}_Report_YE2025.pdf`,
      uploadedAt: subDays(new Date(), 15 + idx * 3).toISOString(),
    }));

  return {
    prevYearReportUploaded: shouldPrefill,
    prevYearReportName: shouldPrefill ? 'Annual_Report_2024.pdf' : undefined,
    workingPaperUploaded: shouldPrefill,
    workingPaperName: shouldPrefill ? 'Working_Papers_2024.xlsx' : undefined,
    implementationStatement: someUploaded ? uploadedDoc('Implementation_Statement_2025.pdf', 12 + i % 5, i % 7 === 0) : emptyDoc(),
    chairsStatement: isDCorHybridDC
      ? (mostUploaded ? uploadedDoc('Chairs_Statement_2025.pdf', 8 + i % 4) : emptyDoc())
      : emptyDoc(),
    reportOnActuarialLiabilities: isDBorHybridDB
      ? (someUploaded ? uploadedDoc('Report_Actuarial_Liabilities_2025.pdf', 10 + i % 6) : emptyDoc())
      : emptyDoc(),
    investmentReport: someUploaded ? uploadedDoc('Investment_Report_2025.pdf', 14 + i % 3, i % 5 === 1) : emptyDoc(),
    pensionIncreases: mostUploaded ? uploadedDoc('Pension_Increases_2025.xlsx', 7 + i % 5) : emptyDoc(),
    auditReport: mostUploaded ? uploadedDoc('Audit_Report_2025.docx', 6 + i % 4) : emptyDoc(),
    auditorsStatement: (shouldPrefill && i % 4 === 0) ? uploadedDoc('Auditors_Statement_2025.docx', 5 + i % 3) : emptyDoc(),
    investmentRiskDisclosure: someUploaded ? uploadedDoc('Investment_Risk_Disclosure_2025.pdf', 9 + i % 5) : emptyDoc(),
    scheduleOfContribution: mostUploaded ? uploadedDoc('Schedule_of_Contribution_2025.pdf', 11 + i % 4) : emptyDoc(),
    certificationOfSchedule: (shouldPrefill && i % 3 === 0) ? uploadedDoc('Certification_Schedule_2025.pdf', 8 + i % 6) : emptyDoc(),
    investmentManagerReports: imReports,
    questionnaireAnswers: answers,
    accountsGenerationStatus: isFullyCompleted ? 'generated' : 'not-started',
    generatedFileName: isFullyCompleted ? `${schemeName.replace(/\s+/g, '_')}_Annual_Report_2025_v1.docx` : undefined,
    generationHistory: isFullyCompleted ? [
      { id: 'gen-1', version: 1, generatedAt: '2026-02-20T14:30:00', fileName: `${schemeName.replace(/\s+/g, '_')}_Annual_Report_2025_v1.docx`, questionsAnswered: QUESTIONNAIRE_QUESTIONS.length, totalQuestions: QUESTIONNAIRE_QUESTIONS.length, actionType: 'generated' as const, actionBy: prepName },
    ] : [],
    generationNotes: '',
  };
}

// Map preparer → team lead based on teams
const preparerToTeamLead: Record<string, string> = {
  'Sean Wilson': 'Louise Neill', 'Ben Martinez': 'Louise Neill', 'Claire O\'Brien': 'Louise Neill', 'David Osei': 'Louise Neill',
  'Emma Wright': 'George Patel', 'James Wilson': 'George Patel', 'Kate Morgan': 'George Patel', 'Liam Taylor': 'George Patel',
  'Nina Patel': 'Hannah Kim', 'Oliver Brown': 'Hannah Kim',
};

export function getTeamLeadForPreparer(preparerName: string): string {
  return preparerToTeamLead[preparerName] || 'Louise Neill';
}

export function recomputeNonPlanningDates(yearEndDate: string, auditStartDate: string): Record<number, string> {
  const yed = parseISO(yearEndDate);
  const asd = parseISO(auditStartDate);
  return {
    7: format(subDays(asd, 17), 'yyyy-MM-dd'),
    8: format(subDays(asd, 10), 'yyyy-MM-dd'),
    9: format(subDays(asd, 7), 'yyyy-MM-dd'),
    10: format(subDays(asd, 3), 'yyyy-MM-dd'),
    11: format(addDays(asd, 14), 'yyyy-MM-dd'),
    12: format(addDays(asd, 21), 'yyyy-MM-dd'),
    13: format(addDays(asd, 21), 'yyyy-MM-dd'),
    14: format(addDays(asd, 56), 'yyyy-MM-dd'),
    15: format(addDays(asd, 63), 'yyyy-MM-dd'),
    16: format(addDays(asd, 63), 'yyyy-MM-dd'),
    17: format(addDays(asd, 77), 'yyyy-MM-dd'),
    18: format(addDays(asd, 84), 'yyyy-MM-dd'),
    19: format(addMonths(yed, 7), 'yyyy-MM-dd'),
  };
}

// Helper: get contacts of a given type from master scheme, filtering out ceased/retired
function getActiveContacts(contacts: SchemeContact[], contactType: ContactType): SchemeContact[] {
  return contacts.filter(c =>
    c.contactType === contactType &&
    !c.status // exclude Retired, Ceased, Closed
  );
}

function contactToRecipient(contact: SchemeContact, idx: number): { id: string; name: string; email: string; company?: string; selected: boolean } {
  return {
    id: `cr-${idx}-${contact.id}`,
    name: contact.individualName || contact.companyName || 'Unknown',
    email: contact.email || '',
    company: contact.companyName,
    selected: true,
  };
}

export function generateMockSchemes(): Scheme[] {
  // Pre-generate master schemes so we can look up contacts
  const masterSchemes = generateMockMasterSchemes();

  return schemeNames.map((name, i) => {
    // Varied year end dates spanning a wide range. Current date is ~March 2026.
    // Phase assignment correlates: older YE → further progressed, newer YE → earlier phases.
    // Only 2-3 schemes should end up with overdue tasks.
    const yearEndOptions = [
      new Date('2024-12-31'),  // 0  → completed (signing was Jul 2025)
      new Date('2025-01-31'),  // 1  → completed
      new Date('2025-03-31'),  // 2  → completed (signing Oct 2025)
      new Date('2025-04-30'),  // 3  → audit-sign-off / completed
      new Date('2025-05-31'),  // 4  → audit-sign-off
      new Date('2025-06-30'),  // 5  → audit-process / audit-sign-off
      new Date('2025-07-31'),  // 6  → audit-process
      new Date('2025-08-31'),  // 7  → peer-review / audit-process (signing Mar 2026 — 1-2 may be overdue)
      new Date('2025-10-31'),  // 8  → peer-review
      new Date('2025-12-31'),  // 9  → planning / peer-review
      new Date('2026-02-28'),  // 10 → planning
      new Date('2026-06-30'),  // 11 → not-started / planning
    ];
    const yearEndDate = yearEndOptions[i % yearEndOptions.length];

    // Audit start offset varies (3-5 months after year-end)
    const auditOffset = 100 + (i % 30) * 3;
    const auditStartDate = addDays(yearEndDate, auditOffset);
    const signingDeadline = addMonths(yearEndDate, 7);

    const dates = computeDueDates(yearEndDate, auditStartDate);

    // ~10 unallocated schemes scattered throughout
    const unallocatedIndices = [1, 11, 22, 33, 44, 55, 66, 77, 88, 99];
    const isAllocated = !unallocatedIndices.includes(i);
    const prep = isAllocated ? preparers[i % preparers.length] : '';
    const reviewer = isAllocated ? peerReviewers[i % peerReviewers.length] : '';
    const lead = isAllocated && prep ? getTeamLeadForPreparer(prep) : '';

    // Phase progression based on year-end index — gives a good spread
    const yeIndex = i % yearEndOptions.length;
    const currentPhase: Phase = !isAllocated ? 'not-started' :
      yeIndex <= 2 ? 'completed' :                                          // Dec 24, Jan 25, Mar 25 → completed
      yeIndex === 3 ? (i % 4 === 0 ? 'audit-sign-off' : 'completed') :     // Apr 25 → mostly completed, few in sign-off
      yeIndex === 4 ? 'audit-sign-off' :                                    // May 25 → audit sign-off
      yeIndex === 5 ? (i % 3 === 0 ? 'audit-process' : 'audit-sign-off') : // Jun 25 → audit process / sign-off
      yeIndex === 6 ? 'audit-process' :                                     // Jul 25 → audit process
      yeIndex === 7 ? (i % 3 === 0 ? 'peer-review' : 'audit-process') :    // Aug 25 → peer-review / audit process
      yeIndex === 8 ? 'peer-review' :                                       // Oct 25 → peer review
      yeIndex === 9 ? (i % 2 === 0 ? 'planning' : 'peer-review') :         // Dec 25 → planning / peer review
      yeIndex === 10 ? 'planning' :                                         // Feb 26 → planning
      (i % 2 === 0 ? 'not-started' : 'planning');                           // Jun 26 → not started / planning

    const totalTaskCount = 19;
    const completedTaskCount =
      currentPhase === 'planning' ? (i % 3) :
      currentPhase === 'peer-review' ? 6 + (i % 2) :
      currentPhase === 'audit-process' ? 10 + (i % 4) :
      currentPhase === 'audit-sign-off' ? 16 + (i % 3) :
      totalTaskCount;

    // Look up contacts from master scheme
    const masterScheme = masterSchemes[i];
    const masterContacts = masterScheme?.contacts || [];
    const yearEndFormatted = format(yearEndDate, 'dd MMMM yyyy');
    const replyDeadline = format(addMonths(yearEndDate, 2), 'dd MMMM yyyy');
    const yearStart = format(subMonths(yearEndDate, 11), 'dd MMMM yyyy');

    const tasks = createTaskTemplate(dates).map((t, j) => {
      const task = {
        ...t,
        id: `scheme-${i}-task-${j}`,
        status: j < completedTaskCount ? 'completed' as const :
                j === completedTaskCount ? 'in-progress' as const :
                t.status,
        completedAt: j < completedTaskCount && t.dueDate
          ? (() => {
              const due = parseISO(t.dueDate);
              const daysBefore = (j % 2 === 0) ? 1 : 2;
              const hours = 8 + ((j * 3 + 7) % 10); // varies between 8-17
              const minutes = (j * 13 + 5) % 60;
              const completed = subDays(due, daysBefore);
              completed.setHours(hours, minutes, 0, 0);
              return completed.toISOString();
            })()
          : undefined,
      };

      // Auto-populate email recipients & drafts from contacts
      if (t.contactTypeForRecipients && masterContacts.length > 0) {
        const activeContacts = getActiveContacts(masterContacts, t.contactTypeForRecipients);
        if (activeContacts.length > 0) {
          task.emailRecipients = activeContacts
            .filter(c => c.email) // only contacts with emails
            .map((c, idx) => contactToRecipient(c, idx));
        }

        // Attach email draft template based on contact type
        switch (t.contactTypeForRecipients) {
          case 'Investment Managers':
            task.emailDraftTemplate = getInvestmentManagerEmailTemplate(name, yearEndFormatted, replyDeadline);
            break;
          case 'Administrator':
            task.emailDraftTemplate = getAdminTeamEmailTemplate(name, yearEndFormatted, replyDeadline);
            break;
          case 'Client Team/Consultant':
            task.emailDraftTemplate = getClientTeamEmailTemplate(name, yearEndFormatted, yearStart);
            break;
          case 'Investment Advisors':
            task.emailDraftTemplate = getInvestmentRiskEmailTemplate(name, yearEndFormatted, replyDeadline);
            break;
          case 'Auditor':
            task.emailDraftTemplate = getAuditArrangementEmailTemplate(name, yearEndFormatted);
            break;
        }
      }

      return task;
    });

    // Compute phase from actual task statuses
    const phases: Phase[] = ['planning', 'peer-review', 'audit-process', 'audit-sign-off'];
    let computedPhase: Phase = !isAllocated ? 'not-started' : (currentPhase === 'completed' ? 'completed' : 'audit-sign-off');
    if (isAllocated && currentPhase !== 'completed') {
      for (const phase of phases) {
        const phaseTasks = tasks.filter(t => t.phase === phase);
        if (phaseTasks.length > 0 && phaseTasks.some(t => t.status !== 'completed')) {
          computedPhase = phase;
          break;
        }
      }
    }

    const auditTaskCompleted = tasks[1]?.status === 'completed';
    const hasAuditDate = auditTaskCompleted;

    // Generate a mock last activity for allocated schemes
    const allocationDate = subDays(new Date(), 30 + (i % 20));
    const allocationTrail = { action: `Allocated to ${prep} (Preparer) & ${reviewer} (Reviewer)`, by: seniorManagers[i % 2], at: allocationDate.toISOString() };
    const lastActivityOptions = [
      { action: `Task "${tasks[completedTaskCount - 1]?.title || 'Unknown'}" completed`, by: prep || 'System' },
      { action: 'Note added to task', by: prep || 'System' },
      { action: `Emails sent for "${tasks[Math.min(2, tasks.length - 1)]?.title || 'Unknown'}"`, by: prep || 'System' },
    ];
    const lastAct = isAllocated
      ? (completedTaskCount > 0
        ? { ...lastActivityOptions[i % 3], at: subDays(new Date(), i % 14).toISOString() }
        : allocationTrail)
      : undefined;

    // Generate rich, credible mock audit trail entries for allocated schemes
    const auditTrail: import('./types').AuditTrailEntry[] = [];
    if (isAllocated) {
      let entryId = 0;
      const at = (daysAgo: number, hours: number, mins: number) => {
        const d = subDays(new Date(), daysAgo);
        d.setHours(hours, mins, 0, 0);
        return d.toISOString();
      };

      // 1. Senior manager allocates team
      auditTrail.push({
        id: `at-${i}-${entryId++}`, timestamp: at(60 + i, 9, 15), performedBy: seniorManagers[i % 2],
        action: 'Scheme allocated', detail: `Assigned Preparer: ${prep}, Peer Reviewer: ${reviewer}, Team Lead: ${lead}`, category: 'allocation',
      });
      auditTrail.push({
        id: `at-${i}-${entryId++}`, timestamp: at(60 + i, 9, 16), performedBy: 'System',
        action: 'Notification sent', detail: `Allocation notification emails sent to ${prep}, ${reviewer}, and ${lead}`, category: 'system',
      });

      // 2. Preparer performs preliminary checks (a few days later)
      if (completedTaskCount >= 0) {
        auditTrail.push({
          id: `at-${i}-${entryId++}`, timestamp: at(55 + i, 10, 5), performedBy: prep,
          action: 'Preliminary checks started', detail: 'Opened preliminary checks section', category: 'task',
        });
        auditTrail.push({
          id: `at-${i}-${entryId++}`, timestamp: at(55 + i, 10, 22), performedBy: prep,
          action: 'Accounting period confirmed', detail: `Accounting period ending ${yearEndFormatted} confirmed`, category: 'task',
        });
        auditTrail.push({
          id: `at-${i}-${entryId++}`, timestamp: at(55 + i, 10, 30), performedBy: prep,
          action: 'Scheme name confirmed', detail: `Scheme name "${name}" confirmed and abbreviation set`, category: 'task',
        });
        auditTrail.push({
          id: `at-${i}-${entryId++}`, timestamp: at(55 + i, 10, 35), performedBy: prep,
          action: 'Preliminary checks completed', detail: 'All preliminary checks passed — planning tasks unlocked', category: 'phase',
        });
      }

      // 3. Preparer works through planning phase tasks
      const planningTaskDetails = [
        { taskTitle: 'Send investment year end requests', emailDetail: 'Investment year end request emails sent to 3 investment managers', docDetail: null },
        { taskTitle: 'Arrange audit date (audit kick off)', emailDetail: null, docDetail: `Audit kick-off date confirmed: ${hasAuditDate ? format(auditStartDate, 'dd MMM yyyy') : 'TBC'}` },
        { taskTitle: 'Send consultant/client team questionnaire', emailDetail: 'Client team questionnaire email sent with questionnaire attachment', docDetail: null },
        { taskTitle: 'Send admin team questionnaire', emailDetail: 'Admin team questionnaire email sent to scheme administrator', docDetail: null },
        { taskTitle: 'Send investment risk disclosure & implementation statement requests', emailDetail: 'Investment risk disclosure request sent to investment advisors', docDetail: null },
      ];

      for (let j = 0; j < Math.min(completedTaskCount, 5); j++) {
        const pd = planningTaskDetails[j];
        const t = tasks[j];
        const completedTime = t.completedAt ? parseISO(t.completedAt) : subDays(new Date(), 45 + i - j * 5);
        const preTime = subDays(completedTime, 0);
        preTime.setHours(completedTime.getHours(), completedTime.getMinutes() - 15, 0, 0);

        // Email sent or action taken before completion
        if (pd.emailDetail) {
          auditTrail.push({
            id: `at-${i}-${entryId++}`, timestamp: preTime.toISOString(), performedBy: prep,
            action: 'Emails sent', detail: `${pd.emailDetail} for "${pd.taskTitle}"`, category: 'email',
          });
        }
        if (pd.docDetail) {
          auditTrail.push({
            id: `at-${i}-${entryId++}`, timestamp: preTime.toISOString(), performedBy: prep,
            action: j === 1 ? 'Audit date confirmed' : 'Action completed', detail: pd.docDetail, category: j === 1 ? 'task' : 'document',
          });
        }
        // Task marked complete
        auditTrail.push({
          id: `at-${i}-${entryId++}`, timestamp: t.completedAt || completedTime.toISOString(), performedBy: prep,
          action: 'Task completed', detail: `"${pd.taskTitle}" marked as complete`, category: 'task',
        });

        // Team lead review for tasks that require it
        if (t.isTeamLeadRequired && j < completedTaskCount) {
          const reviewTime = new Date(completedTime);
          reviewTime.setHours(reviewTime.getHours() + 2 + (j % 3));
          auditTrail.push({
            id: `at-${i}-${entryId++}`, timestamp: reviewTime.toISOString(), performedBy: lead,
            action: 'Team lead reviewed', detail: `Reviewed and approved "${pd.taskTitle}"`, category: 'task',
          });
        }
      }

      // 4. Draft accounts — multi-session work over several weeks
      if (completedTaskCount >= 3) {
        const draftStart = subDays(new Date(), 35 + i);
        // Session 1 - initial data entry
        auditTrail.push({
          id: `at-${i}-${entryId++}`, timestamp: (() => { const d = new Date(draftStart); d.setHours(9, 30, 0, 0); return d.toISOString(); })(), performedBy: prep,
          action: 'Draft accounts started', detail: 'Opened draft accounts questionnaire — began entering scheme details', category: 'task',
        });
        auditTrail.push({
          id: `at-${i}-${entryId++}`, timestamp: (() => { const d = new Date(draftStart); d.setHours(11, 45, 0, 0); return d.toISOString(); })(), performedBy: prep,
          action: 'Questionnaire progress saved', detail: 'Saved 8 of 34 questions — awaiting information from admin team', category: 'task',
        });

        // Session 2 - more data after receiving admin responses
        if (completedTaskCount >= 4) {
          const session2 = subDays(draftStart, -5);
          auditTrail.push({
            id: `at-${i}-${entryId++}`, timestamp: (() => { const d = new Date(session2); d.setHours(14, 10, 0, 0); return d.toISOString(); })(), performedBy: prep,
            action: 'Questionnaire progress saved', detail: 'Updated to 16 of 34 questions — incorporated admin team responses on membership data', category: 'task',
          });
          // Document upload
          auditTrail.push({
            id: `at-${i}-${entryId++}`, timestamp: (() => { const d = new Date(session2); d.setHours(14, 25, 0, 0); return d.toISOString(); })(), performedBy: prep,
            action: 'Document uploaded', detail: 'Previous year annual report uploaded to draft accounts', category: 'document',
          });
        }

        // Session 3 - investment data received
        if (completedTaskCount >= 5) {
          const session3 = subDays(draftStart, -12);
          auditTrail.push({
            id: `at-${i}-${entryId++}`, timestamp: (() => { const d = new Date(session3); d.setHours(10, 0, 0, 0); return d.toISOString(); })(), performedBy: prep,
            action: 'Questionnaire progress saved', detail: 'Updated to 26 of 34 questions — investment manager year end valuations received and entered', category: 'task',
          });
          auditTrail.push({
            id: `at-${i}-${entryId++}`, timestamp: (() => { const d = new Date(session3); d.setHours(10, 15, 0, 0); return d.toISOString(); })(), performedBy: prep,
            action: 'Document uploaded', detail: 'Working paper template uploaded with investment reconciliation', category: 'document',
          });

          // Session 4 - final questions after client/advisor responses
          const session4 = subDays(draftStart, -18);
          auditTrail.push({
            id: `at-${i}-${entryId++}`, timestamp: (() => { const d = new Date(session4); d.setHours(15, 30, 0, 0); return d.toISOString(); })(), performedBy: prep,
            action: 'Questionnaire completed', detail: 'All 34 questionnaire items answered — client team and investment advisor information incorporated', category: 'task',
          });
          auditTrail.push({
            id: `at-${i}-${entryId++}`, timestamp: (() => { const d = new Date(session4); d.setHours(15, 45, 0, 0); return d.toISOString(); })(), performedBy: prep,
            action: 'Draft accounts generated', detail: `Draft accounts document generated: ${name.replace(/\s/g, '_')}_Draft_Accounts_v1.docx`, category: 'generation',
          });
        }

        // Draft accounts task completed
        if (completedTaskCount > 5) {
          const draftComplete = tasks[5]?.completedAt;
          if (draftComplete) {
            auditTrail.push({
              id: `at-${i}-${entryId++}`, timestamp: draftComplete, performedBy: prep,
              action: 'Task completed', detail: '"Draft Accounts" marked as complete', category: 'task',
            });
          }
        }
      }

      // Phase transition
      if (completedTaskCount >= 6 && computedPhase !== 'planning') {
        auditTrail.push({
          id: `at-${i}-${entryId++}`, timestamp: at(25 + i, 9, 0), performedBy: 'System',
          action: 'Phase transition', detail: 'All Planning phase tasks completed — scheme progressed to Peer Review', category: 'phase',
        });
      }

      // 5. Peer Review & Audit Process tasks
      const laterTaskDetails: Record<number, { action: string; detail: string; by: 'prep' | 'reviewer' | 'lead' }> = {
        6: { action: 'Draft sent for peer review', detail: 'Draft accounts shared with peer reviewer for detailed review', by: 'prep' },
        7: { action: 'Peer review completed', detail: 'Peer review completed — 3 minor adjustments noted and incorporated', by: 'reviewer' },
        8: { action: 'Team lead check-in completed', detail: 'Team lead confirmed audit readiness — all documentation in order', by: 'lead' },
        9: { action: 'Audit pack shared', detail: 'Full audit pack including draft accounts, working papers, and supporting documents shared with auditors', by: 'prep' },
        10: { action: 'Initial audit queries received', detail: 'Received 12 initial queries from auditors — review commenced', by: 'prep' },
        11: { action: 'Audit queries responded', detail: 'All 12 initial audit queries responded to with supporting documentation', by: 'prep' },
        12: { action: 'Query follow-up completed', detail: 'Follow-up on 3 outstanding items from initial audit queries resolved', by: 'prep' },
        13: { action: 'Final audit queries received', detail: 'Received 4 final audit queries — all relate to investment valuations', by: 'prep' },
        14: { action: 'Final queries responded', detail: 'All final audit queries responded — investment manager confirmations provided', by: 'prep' },
        15: { action: 'Draft accounts sent to Trustees', detail: 'Draft accounts sent to Trustees for their review ahead of signing', by: 'prep' },
        16: { action: 'Audit clearance received', detail: 'Audit clearance letter received from auditors — no material adjustments', by: 'prep' },
        17: { action: 'Final accounts sent for signing', detail: 'Final accounts sent to Trustees for formal signing', by: 'prep' },
        18: { action: 'Accounts signed', detail: 'Trustee-signed accounts received — scheme year end process complete', by: 'prep' },
      };

      for (let j = 6; j < Math.min(completedTaskCount, tasks.length); j++) {
        const t = tasks[j];
        const ltd = laterTaskDetails[j];
        if (ltd && t.completedAt) {
          const performer = ltd.by === 'reviewer' ? reviewer : ltd.by === 'lead' ? lead : prep;
          auditTrail.push({
            id: `at-${i}-${entryId++}`, timestamp: t.completedAt, performedBy: performer,
            action: ltd.action, detail: ltd.detail, category: j <= 9 ? 'task' : (j <= 15 ? 'task' : 'task'),
          });
          // Task completion entry
          auditTrail.push({
            id: `at-${i}-${entryId++}`, timestamp: (() => { const d = parseISO(t.completedAt); d.setMinutes(d.getMinutes() + 2); return d.toISOString(); })(), performedBy: performer,
            action: 'Task completed', detail: `"${t.title}" marked as complete`, category: 'task',
          });
        }
      }

      // Phase transitions for later phases
      if (completedTaskCount >= 10 && (computedPhase === 'audit-process' || computedPhase === 'audit-sign-off' || computedPhase === 'completed')) {
        auditTrail.push({
          id: `at-${i}-${entryId++}`, timestamp: at(18 + i, 9, 0), performedBy: 'System',
          action: 'Phase transition', detail: 'All Peer Review tasks completed — scheme progressed to Audit Process', category: 'phase',
        });
      }
      if (completedTaskCount >= 16 && (computedPhase === 'audit-sign-off' || computedPhase === 'completed')) {
        auditTrail.push({
          id: `at-${i}-${entryId++}`, timestamp: at(8 + i, 9, 0), performedBy: 'System',
          action: 'Phase transition', detail: 'All Audit Process tasks completed — scheme progressed to Audit Sign Off', category: 'phase',
        });
      }
      if (computedPhase === 'completed') {
        auditTrail.push({
          id: `at-${i}-${entryId++}`, timestamp: at(i % 5, 16, 30), performedBy: prep,
          action: 'Scheme accounts completed', detail: 'All tasks across all phases completed — scheme accounts confirmed as finalised', category: 'phase',
        });
      }

      // Sort chronologically
      auditTrail.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    return {
      id: `scheme-${i}`,
      name,
      yearEnd: yearEndFormatted,
      yearEndDate: format(yearEndDate, 'yyyy-MM-dd'),
      auditStartDate: hasAuditDate ? format(auditStartDate, 'yyyy-MM-dd') : '',
      signingDeadline: format(signingDeadline, 'yyyy-MM-dd'),
      preparer: prep,
      peerReviewer: reviewer,
      teamLead: lead,
      currentPhase: computedPhase,
      tasks,
      preliminaryInfo: createDefaultPreliminaryInfo(i, name, completedTaskCount > 0, yearEndDate),
      draftAccountingReport: createDefaultDraftAccountingReport(i, completedTaskCount > 5, ['Defined Benefit', 'Defined Contribution', 'Hybrid'][i % 3]),
      isAllocated,
      completedBy: computedPhase === 'completed' ? prep : undefined,
      completedAt: computedPhase === 'completed' ? subDays(new Date(), i % 30).toISOString() : undefined,
      lastActivity: lastAct,
      auditTrail,
    };
  });
}

const clientNames = ['AAA Group Limited', 'BBB Holdings', 'CCC Corporation', 'DDD Enterprises', 'EEE Partners'];

export function generateMockMasterSchemes(): MasterScheme[] {
  const extraTrustees = [
    { name: 'C Defgh', designation: 'CAT' as const },
    { name: 'D Ghijk', designation: 'MNT' as const },
    { name: 'E Hijkl', designation: 'Corporate Independent' as const },
  ];
  const extraIMs = [
    { company: 'BCD Investment Limited' },
    { company: 'XYZ Capital Management' },
  ];
  const extraAVCs = [
    { company: 'DDD Limited' },
    { company: 'EEE Providers' },
  ];

  return schemeNames.map((name, i) => {
    const contacts: SchemeContact[] = [];

    // Trustees: 2-4 per scheme
    const numTrustees = 2 + (i % 3);
    contacts.push({ id: `c-${i}-1`, contactType: 'Trustee', individualName: 'A Bcdef', appointedDate: '2026-01-01', designation: 'MNT', email: 'a.bcdef@trustee.com' });
    contacts.push({ id: `c-${i}-2`, contactType: 'Trustee', individualName: 'B Cdefg', ceasedDate: '2026-02-01', status: 'Retired', designation: 'MNT', email: 'b.cdefg@trustee.com' });
    if (numTrustees >= 3) contacts.push({ id: `c-${i}-2b`, contactType: 'Trustee', individualName: extraTrustees[i % 3].name, designation: extraTrustees[i % 3].designation, email: `${extraTrustees[i % 3].name.toLowerCase().replace(' ', '.')}@trustee.com` });
    if (numTrustees >= 4) contacts.push({ id: `c-${i}-2c`, contactType: 'Trustee', companyName: 'AAA Trustees Limited', designation: 'Corporate Independent' });

    // Secretary - only some schemes
    if (i % 2 === 0) contacts.push({ id: `c-${i}-4`, contactType: 'Secretary to the trustee', individualName: 'A Bcdef', companyName: 'EEE Limited' });

    // Principal Employer - all
    contacts.push({ id: `c-${i}-5`, contactType: 'Principal Employer', individualName: 'D Efghi', companyName: clientNames[i % clientNames.length], address: `${10 + i} Main Street, Town, City`, email: 'employer@company.com' });

    // Scheme Actuary - all, some have 2
    contacts.push({ id: `c-${i}-6`, contactType: 'Scheme Actuary', individualName: 'E Fghij', appointedDate: '2026-03-01', gender: 'Male' as const, companyName: 'ACT Limited', email: 'E.Fghij@actlimited.com' });
    if (i % 3 === 0) contacts.push({ id: `c-${i}-6b`, contactType: 'Scheme Actuary', individualName: 'F Ghijk', ceasedDate: '2026-02-28', gender: 'Female' as const, companyName: 'BCT Limited', email: 'F.Ghijk@bctlimited.com' });

    // Actuarial Team - most
    if (i % 4 !== 3) contacts.push({ id: `c-${i}-7`, contactType: 'Actuarial Team', individualName: 'H Ijklmn', companyName: 'ACT Limited', email: 'H.Ijklmn@act.com' });

    // Administrator - all (internal @isio.com)
    const adminNames = ['Karen Lewis', 'Laura Mitchell', 'Mark Stevens', 'Natasha Brooks', 'Peter Collins'];
    const adminPrimary = adminNames[i % adminNames.length];
    contacts.push({ id: `c-${i}-8`, contactType: 'Administrator', individualName: adminPrimary, companyName: 'Isio Services Limited', address: 'PO Box 163, Blyth NE24 9GS', email: `${adminPrimary.toLowerCase().replace(' ', '.')}@isio.com` });
    if (i % 5 === 0) {
      const adminSecondary = adminNames[(i + 1) % adminNames.length];
      contacts.push({ id: `c-${i}-8b`, contactType: 'Administrator', individualName: adminSecondary, companyName: 'Isio Services Limited', email: `${adminSecondary.toLowerCase().replace(' ', '.')}@isio.com` });
    }

    // Client Team - some (internal @isio.com)
    const clientTeamNames = ['Michael Norton', 'Sophie Parker', 'Tom Richards', 'Victoria Shaw', 'William Turner'];
    if (i < 6) {
      const ctName = clientTeamNames[i % clientTeamNames.length];
      contacts.push({ id: `c-${i}-8c`, contactType: 'Client Team/Consultant', individualName: ctName, companyName: 'Isio Services Limited', email: `${ctName.toLowerCase().replace(' ', '.')}@isio.com` });
    }

    // Auditor - all
    contacts.push({ id: `c-${i}-9`, contactType: 'Auditor', individualName: i % 2 === 0 ? 'ABC Limited' : 'DEF Audit LLP', appointedDate: '2026-03-01', address: i % 2 === 0 ? 'London' : 'Manchester', email: i % 2 === 0 ? 'audit@abc.com' : 'audit@def.com' });

    // Investment Managers - 1-3 (external companies with their own domains)
    const imCompanies = [
      { company: 'Mobius Life Limited', email: 'clientservices@mobiuslife.co.uk' },
      { company: 'Standard Life Investments', email: 'enquiries@standardlife.com' },
      { company: 'Legal & General Investment Management', email: 'institutional@lgim.com' },
      { company: 'BlackRock Advisors (UK) Limited', email: 'clientservice@blackrock.com' },
      { company: 'Schroders Investment Management', email: 'ukdealingdesk@schroders.com' },
    ];
    const imPrimary = imCompanies[i % imCompanies.length];
    contacts.push({ id: `c-${i}-10`, contactType: 'Investment Managers', companyName: imPrimary.company, email: imPrimary.email });
    if (i % 2 === 0) {
      const imSecondary = imCompanies[(i + 1) % imCompanies.length];
      contacts.push({ id: `c-${i}-10b`, contactType: 'Investment Managers', companyName: imSecondary.company, ceasedDate: '2026-01-10', status: 'Ceased', email: imSecondary.email });
    }
    if (i % 4 === 0) {
      const imTertiary = imCompanies[(i + 2) % imCompanies.length];
      contacts.push({ id: `c-${i}-10c`, contactType: 'Investment Managers', companyName: imTertiary.company, email: imTertiary.email });
    }

    // AVC providers - some
    if (i % 3 !== 2) {
      contacts.push({ id: `c-${i}-11`, contactType: 'AVC providers', companyName: 'CCC Limited', email: 'ccclimited@abc.com' });
      if (i % 3 === 0) contacts.push({ id: `c-${i}-11b`, contactType: 'AVC providers', companyName: extraAVCs[i % 2].company, email: `${extraAVCs[i % 2].company.toLowerCase().replace(' ', '')}@abc.com` });
    }

    // Insurance companies - some
    if (i < 5) contacts.push({ id: `c-${i}-12`, contactType: 'Insurance companies', companyName: i % 2 === 0 ? 'FFF Limited' : 'GGG Limited', email: `insurance${i}@abc.com` });

    // Investment Advisors - some
    if (i % 2 === 1) contacts.push({ id: `c-${i}-13`, contactType: 'Investment Advisors', individualName: 'N Opqrs', companyName: 'GGG Limited', email: 'nopqrs@glimited.com' });

    // Legal Advisers - most
    if (i % 3 !== 1) contacts.push({ id: `c-${i}-14`, contactType: 'Legal Advisers', individualName: 'S Tuvwxy', companyName: 'HHH Limited', email: 'S.Tuvwxy@hhhlimited.com' });

    // Banks - some
    if (i < 7) contacts.push({ id: `c-${i}-15`, contactType: 'Banks', appointedDate: '2026-02-15', companyName: i % 2 === 0 ? 'III Limited' : 'JJJ Limited' });
    if (i === 2) contacts.push({ id: `c-${i}-15b`, contactType: 'Banks', ceasedDate: '2026-01-15', status: 'Closed', companyName: 'KKK Limited' });

    const types: Array<'Defined Benefit' | 'Defined Contribution' | 'Hybrid'> = ['Defined Benefit', 'Defined Contribution', 'Hybrid'];
    const yearEndOptions = ['2026-03-31', '2025-12-31', '2025-09-30', '2026-06-30', '2025-06-30'];
    return {
      id: `master-${i}`,
      schemeName: name,
      registrationNumber: `007659${(18 + i).toString().padStart(2, '0')}RD`,
      schemeType: types[i % 3],
      yearEndDate: yearEndOptions[i % yearEndOptions.length],
      abbreviation: name.split(' ').map(w => w[0]).join('').slice(0, 4),
      clientName: clientNames[i % clientNames.length],
      status: i % 12 === 9 || i % 15 === 14 ? 'De-activated' as const : 'Active' as const,
      contacts,
    };
  });
}
