export type Phase = 'not-started' | 'planning' | 'peer-review' | 'audit-process' | 'audit-sign-off' | 'completed';

export type UserRole = 'preparer' | 'peer-reviewer' | 'team-lead' | 'manager' | 'admin';

export type TaskType = 'standard' | 'reminder' | 'email' | 'team-lead-only' | 'draft-accounting-report';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';

export interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  company?: string;
  sentAt?: string;
  selected?: boolean;
}

export interface TaskNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Task {
  id: string;
  number: number;
  phase: Phase;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  assignedTo: string[];
  dueDate: string;
  dueDateLabel: string;
  completedAt?: string;
  notes: TaskNote[];
  emailRecipients?: EmailRecipient[];
  emailHistory?: { sentAt: string; recipientCount: number; type?: 'initial' | 'follow-up'; emailText?: string }[];
  isTeamLeadRequired: boolean;
  contactTypeForRecipients?: ContactType;
  emailDraftTemplate?: string;
  allowAttachment?: boolean;
  attachmentLabel?: string;
  isAuditKickOff?: boolean;
}

export interface PreliminaryInfo {
  schemeRegNo: string;
  priorYearDocsUploaded: boolean;
  acPeriodConfirmed: boolean;
  acPeriodDate: string;
  schemeNameConfirmed: boolean;
  schemeName: string;
  nameAbbreviation: string;
}

export interface QuestionnaireAnswer {
  questionId: number;
  answered: boolean;
  value: string;
  subValues?: Record<string, string>;
}

export type AccountsGenerationStatus = 'not-started' | 'generating' | 'generated';

export interface InvestmentManagerReport {
  id: string;
  name: string;
  fileName: string;
  uploadedAt: string;
}

export interface AccountsGenerationAttempt {
  id: string;
  version: number;
  generatedAt: string;
  fileName: string;
  questionsAnswered: number;
  totalQuestions: number;
  notes?: string;
  actionType: 'generated' | 'uploaded';
  actionBy?: string;
}

export interface DocumentUpload {
  uploaded: boolean;
  fileName?: string;
  uploadedAt?: string;
  formatWarning?: boolean;
}

export interface DraftAccountingReportData {
  prevYearReportUploaded: boolean;
  prevYearReportName?: string;
  workingPaperUploaded: boolean;
  workingPaperName?: string;
  implementationStatement: DocumentUpload;
  chairsStatement: DocumentUpload;
  reportOnActuarialLiabilities: DocumentUpload;
  investmentReport: DocumentUpload;
  pensionIncreases: DocumentUpload;
  auditReport: DocumentUpload;
  auditorsStatement: DocumentUpload;
  investmentRiskDisclosure: DocumentUpload;
  scheduleOfContribution: DocumentUpload;
  certificationOfSchedule: DocumentUpload;
  investmentManagerReports: InvestmentManagerReport[];
  questionnaireAnswers: QuestionnaireAnswer[];
  accountsGenerationStatus: AccountsGenerationStatus;
  generatedFileName?: string;
  generationHistory: AccountsGenerationAttempt[];
  generationNotes: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'preparer' | 'peer-reviewer';
  isActive: boolean;
}

export interface Team {
  id: string;
  name: string;
  teamLead: string;
  members: TeamMember[];
}

export interface SchemeActivity {
  action: string;
  by: string;
  at: string;
}

export type AuditTrailCategory = 'allocation' | 'task' | 'email' | 'document' | 'generation' | 'phase' | 'system';

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  performedBy: string;
  action: string;
  detail?: string;
  category: AuditTrailCategory;
}

export interface Scheme {
  id: string;
  name: string;
  yearEnd: string;
  yearEndDate: string;
  auditStartDate: string; // empty string means "Not arranged"
  signingDeadline: string;
  preparer: string;
  peerReviewer: string;
  teamLead: string;
  currentPhase: Phase;
  tasks: Task[];
  preliminaryInfo: PreliminaryInfo;
  draftAccountingReport: DraftAccountingReportData;
  isAllocated: boolean;
  completedBy?: string;
  completedAt?: string;
  lastActivity?: SchemeActivity;
  auditTrail: AuditTrailEntry[];
}


export const PHASE_LABELS: Record<Phase, string> = {
  'not-started': 'Not Started',
  'planning': 'Phase 1 – Planning',
  'peer-review': 'Phase 2 – Peer Review',
  'audit-process': 'Phase 3 – Audit Process',
  'audit-sign-off': 'Phase 4 – Audit Sign Off',
  'completed': 'Completed',
};

export const PHASE_SHORT: Record<Phase, string> = {
  'not-started': 'Not Started',
  'planning': 'Planning',
  'peer-review': 'Peer Review',
  'audit-process': 'Audit Process',
  'audit-sign-off': 'Audit Sign Off',
  'completed': 'Completed',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  'preparer': 'Preparer',
  'peer-reviewer': 'Peer Reviewer',
  'team-lead': 'Team Lead',
  'manager': 'Senior Manager',
  'admin': 'Admin',
};

// --- Scheme Master List & Contacts ---

export type SchemeType = 'Defined Benefit' | 'Defined Contribution' | 'Hybrid';
export type SchemeStatus = 'Active' | 'De-activated';

export type ContactType =
  | 'Trustee'
  | 'Secretary to the trustee'
  | 'Principal Employer'
  | 'Scheme Actuary'
  | 'Actuarial Team'
  | 'Administrator'
  | 'Client Team/Consultant'
  | 'Auditor'
  | 'Investment Managers'
  | 'AVC providers'
  | 'Insurance companies'
  | 'Investment Advisors'
  | 'Legal Advisers'
  | 'Banks';

export type TrusteeDesignation = 'MNT' | 'CAT' | 'Corporate Independent';
export type TrusteeStatus = 'Retired' | 'Ceased' | 'Closed' | '';
export type ActuaryGender = 'Male' | 'Female';

export interface SchemeContact {
  id: string;
  contactType: ContactType;
  individualName?: string;
  appointedDate?: string;
  ceasedDate?: string;
  status?: string; // Retired/Ceased/Closed for trustees & auditors; ceased for investment managers/banks
  gender?: ActuaryGender; // Scheme Actuary only
  designation?: TrusteeDesignation; // Trustee only
  companyName?: string;
  address?: string;
  email?: string;
}

export interface MasterScheme {
  id: string;
  schemeName: string;
  registrationNumber: string;
  schemeType: SchemeType;
  yearEndDate: string;
  abbreviation: string;
  clientName: string;
  status: SchemeStatus;
  contacts: SchemeContact[];
}

export const CONTACT_TYPE_FIELDS: Record<ContactType, string[]> = {
  'Trustee': ['individualName', 'appointedDate', 'ceasedDate', 'status', 'designation', 'companyName', 'address', 'email'],
  'Secretary to the trustee': ['individualName', 'companyName', 'email'],
  'Principal Employer': ['individualName', 'companyName', 'address', 'email'],
  'Scheme Actuary': ['individualName', 'appointedDate', 'ceasedDate', 'gender', 'companyName', 'email'],
  'Actuarial Team': ['individualName', 'companyName', 'email'],
  'Administrator': ['individualName', 'companyName', 'address', 'email'],
  'Client Team/Consultant': ['individualName', 'companyName', 'email'],
  'Auditor': ['individualName', 'appointedDate', 'ceasedDate', 'status', 'companyName', 'address', 'email'],
  'Investment Managers': ['appointedDate', 'ceasedDate', 'status', 'companyName', 'email'],
  'AVC providers': ['companyName', 'email'],
  'Insurance companies': ['companyName', 'email'],
  'Investment Advisors': ['individualName', 'companyName', 'email'],
  'Legal Advisers': ['individualName', 'companyName', 'email'],
  'Banks': ['appointedDate', 'ceasedDate', 'status', 'companyName'],
};

export interface QuestionDefinition {
  id: number;
  title: string;
  description: string;
  type: 'select' | 'yes-no' | 'text' | 'date' | 'multi-select' | 'select-with-details';
  options?: string[];
  subQuestions?: { id: string; label: string; type: 'text' | 'yes-no' | 'select' | 'date'; options?: string[] }[];
}

export const QUESTIONNAIRE_QUESTIONS: QuestionDefinition[] = [
  {
    id: 1,
    title: 'Should the documents refer to "Trustee" or "Trustees"?',
    description: 'If "Trustee" is selected then text will be in singular (e.g. "Trustee\'s", "the Trustee is"). If "Trustees" is selected then text will be in plural (e.g. "Trustees\'", "the Trustees are").',
    type: 'select',
    options: ['Trustee', 'Trustees'],
  },
  {
    id: 2,
    title: 'Should the documents refer to "Auditor" or "Auditors"?',
    description: 'If "Auditor" is selected then text will be in singular. If "Auditors" is selected then text will be in plural.',
    type: 'select',
    options: ['Auditor', 'Auditors'],
  },
  {
    id: 3,
    title: 'What is the scheme constitution?',
    description: 'Select the scheme type. This drives several notes and disclosures in the Annual Report.',
    type: 'select',
    options: ['Defined Benefit', 'Defined Contribution', 'Hybrid'],
  },
  {
    id: 4,
    title: 'Is the Scheme going through a buy-in and moving towards buy-out?',
    description: 'If Yes then there are a number of checks and disclosures required.',
    type: 'yes-no',
    subQuestions: [
      { id: '4.1', label: 'Update note below membership table', type: 'text' },
      { id: '4.2', label: 'Has the accounting period changed?', type: 'yes-no' },
      { id: '4.3', label: 'Is this the final set of accounts?', type: 'yes-no' },
      { id: '4.4', label: 'Any surplus distribution details', type: 'text' },
      { id: '4.5', label: 'Update Notes to Account', type: 'text' },
    ],
  },
  { id: 5, title: 'What date was the scheme established?', description: 'The date will appear in the Trustee Report under the heading "Constitution".', type: 'date' },
  { id: 6, title: 'What is the date of the Trust Deed and Rules and has it subsequently been amended?', description: 'This information appears under the "Constitution" heading in the Trustee Report.', type: 'text' },
  { id: 7, title: 'Has the Scheme been closed to new entrants and confirm the effective date?', description: 'The date will appear in the Trustee Report under the heading "Constitution".', type: 'yes-no' },
  { id: 8, title: 'Has the Scheme been closed to future accrual and confirm the effective date?', description: 'The closure details appear in the Trustee Report under "Constitution".', type: 'yes-no' },
  { id: 9, title: 'What is the make up of the trustee board?', description: 'Select the appropriate trustee board composition.', type: 'select', options: ['Individuals', 'Corporate (not independent)', 'Independent', 'Individuals and a corporate'] },
  { id: 10, title: 'How many meetings of the trustee took place in the accounting year?', description: 'The number will appear in the Trustee Report under "Trustee".', type: 'text' },
  { id: 11, title: 'Have there been any change to the scheme constitution or scheme rules during the accounting period?', description: 'If Yes then a paragraph needs to be populated with the details. If No, standard wording will be used.', type: 'yes-no' },
  { id: 12, title: 'Has there been any change to the calculation or payment of Transfer Values since the prior year?', description: 'If Yes then a paragraph needs to be populated with the details.', type: 'yes-no' },
  { id: 13, title: 'Has there been any change to the GMP equalisation notes since the prior year?', description: 'This applies to three notes: GMPe note in Trustees Report, GMPe note in financial statements, and benefits paid or payable note.', type: 'yes-no' },
  { id: 14, title: 'Has there been only one Schedule of Contribution (SoC) in place during the current accounting period?', description: 'If Yes, refer to "Schedule of Contribution". If No, refer to "Schedules of Contribution" and enter dates.', type: 'yes-no' },
  { id: 15, title: 'Have contributions due during the year been received in accordance with the Schedule(s) of Contributions?', description: 'This affects employer-related investment disclosures and the Summary of Contributions.', type: 'yes-no' },
  { id: 16, title: 'Have contributions due at the year end been received in accordance with the Schedule of Contributions?', description: 'This affects the current assets note in the financial statements.', type: 'yes-no' },
  { id: 17, title: 'Is the Trustee signing section correct?', description: 'Amend here once and it will appear in all three sections where Trustees sign.', type: 'yes-no' },
  { id: 18, title: 'Are the figures in the financial statements rounded to the nearest Pound Sterling/thousand (£\'000)/millions (£m)?', description: 'These appear as column headers in the Fund Account, Statement of Net Assets and all notes.', type: 'select', options: ['Pound Sterling (£)', 'Thousands (£\'000)', 'Millions (£m)'] },
  { id: 19, title: 'Does the Fund Account correctly refer to "Net additions/(withdrawals) from dealings with members"?', description: 'Select the appropriate wording based on the figures.', type: 'select', options: ['Net additions from dealings with members', 'Net withdrawals from dealings with members', 'Net additions/(withdrawals) from dealings with members', 'Net (withdrawals)/additions from dealings with members'] },
  { id: 20, title: 'Does the Fund Account correctly refer to "Net increase/(decrease) in the fund during the year"?', description: 'Select the appropriate wording based on the figures.', type: 'select', options: ['Net increase in the fund during the year', 'Net decrease in the fund during the year', 'Net increase/(decrease) in the fund during the year', 'Net (decrease)/increase in the fund during the year'] },
  { id: 21, title: 'Has there been any update to the going concern paragraph under basis of preparation?', description: 'If Yes, enter the updated text. If No, wording can be rolled forward from the prior year.', type: 'yes-no' },
  { id: 22, title: 'Under which law is the Scheme established as a trust?', description: 'This appears in Note 2 to the financial statements.', type: 'select', options: ['English law', 'Northern Ireland law', 'Scottish law'] },
  { id: 23, title: 'Confirm that the accounting policies are correct?', description: 'The accounting policies are standard wording but will only appear if there are figures in the current and previous periods.', type: 'yes-no' },
  { id: 24, title: 'Can you confirm the accounting policy for the valuation of the annuity/insurance policy?', description: 'Confirm who values the policy and the methodology used.', type: 'select', options: ['Scheme Actuary', 'Pension annuity provider/insurance company'] },
  { id: 25, title: 'Has there been any changes to the note on significant judgements and estimates?', description: 'If Yes, enter updated text. If No, wording can be rolled forward.', type: 'yes-no' },
  { id: 26, title: 'Has there been any update to the note under the contributions table referring to deficit funding contributions?', description: 'If Yes, enter updated text. If No, wording can be rolled forward.', type: 'yes-no' },
  { id: 27, title: 'Are there any notes required under the investment income table in respect of net rents?', description: 'If Yes, enter the amount of property related expenses.', type: 'yes-no' },
  { id: 28, title: 'Are there any transaction costs being disclosed?', description: 'If Yes, transaction costs will be analysed by asset class. If No, standard indirect costs wording will be used.', type: 'yes-no' },
  { id: 29, title: 'What type of AVC investments does the scheme hold?', description: 'This determines the AVC investments note in the Annual Report.', type: 'select', options: ['None', 'Separately from the main investments', 'Within the main investments', 'Both separately from and within the main investments'] },
  { id: 30, title: 'What form of AVC investments does the scheme hold?', description: 'Select all applicable forms of AVC investments.', type: 'multi-select', options: ['With-profits', 'Unitised', 'Bank accounts', 'Other'] },
  { id: 31, title: 'Are the annual AVC statements made up to the year end?', description: 'If No, select the specific date the AVC statements are made up to.', type: 'yes-no' },
  { id: 32, title: 'Has there been any change to the Related Party Transactions note since the prior year?', description: 'If Yes, provide details of changes. If No, wording will be the same as the prior year.', type: 'yes-no' },
  { id: 33, title: 'Should a subsequent events note be included in the notes to the financial statements?', description: 'If Yes, a paragraph needs to be populated with the details.', type: 'yes-no' },
  { id: 34, title: 'Has the Annual Report been signed after the 7 month statutory deadline?', description: 'If Yes, additional text is required under "Financial development" in the Trustee\'s Report.', type: 'yes-no' },
];
