# PensionFlow — Complete Project Recreation Prompt

> **Instructions**: Copy this entire prompt into a new Lovable project. It will recreate the PensionFlow pension scheme audit workflow management application with 100% matching logic and UI.

---

## PROJECT OVERVIEW

Build **PensionFlow** — a pension scheme audit workflow management application for an audit firm (Isio). It is a single-page React app (no backend/database) using **Zustand** for state management with mock data. The app manages ~100 pension schemes through a 4-phase audit workflow with role-based access, email automation, document management, and a specialized "Draft Accounts" subsystem.

**Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui components, Zustand, date-fns, Lucide icons.

**Design System**: DM Sans font, HSL-based color tokens, dark sidebar, light content area. No dark mode.

---

## DESIGN TOKENS (index.css)

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --background: 220 16% 96%;
  --foreground: 220 50% 5%;
  --card: 0 0% 100%;
  --card-foreground: 220 50% 5%;
  --primary: 220 80% 42%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 20% 88%;
  --secondary-foreground: 220 50% 10%;
  --muted: 220 16% 90%;
  --muted-foreground: 220 15% 35%;
  --accent: 160 70% 34%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 82% 46%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 20% 82%;
  --input: 220 20% 82%;
  --ring: 220 80% 42%;
  --radius: 0.625rem;

  /* Workflow tokens */
  --phase-planning: 220 80% 42%;
  --phase-peer-review: 280 65% 50%;
  --phase-audit: 35 95% 48%;
  --phase-sign-off: 200 60% 42%;
  --task-reminder: 45 100% 48%;
  --task-team-lead: 180 75% 38%;
  --task-query: 300 65% 50%;
  --task-complete: 160 70% 34%;
  --task-overdue: 0 82% 46%;
  --task-pending: 220 15% 60%;

  --sidebar-background: 220 35% 10%;
  --sidebar-foreground: 220 15% 88%;
  --sidebar-primary: 220 80% 55%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 220 30% 16%;
  --sidebar-accent-foreground: 220 15% 88%;
  --sidebar-border: 220 30% 18%;
  --sidebar-ring: 220 80% 42%;
}
```

Add custom Tailwind color tokens for `phase` and `task` in tailwind.config.ts extending the theme. Also add CSS utility classes for phase badges:
- `.phase-badge-planning` → primary/10 bg, primary text
- `.phase-badge-peer-review` → phase-peer-review/10 bg
- `.phase-badge-audit` → phase-audit/10 bg
- `.phase-badge-sign-off` → phase-sign-off/10 bg
- `.phase-badge-completed` → task-complete/10 bg

---

## DATA MODEL (src/lib/types.ts)

### Core Types

```typescript
type Phase = 'not-started' | 'planning' | 'peer-review' | 'audit-process' | 'audit-sign-off' | 'completed';
type UserRole = 'preparer' | 'peer-reviewer' | 'team-lead' | 'manager' | 'admin';
type TaskType = 'standard' | 'reminder' | 'email' | 'team-lead-only' | 'draft-accounting-report';
type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
```

### Task Interface
```typescript
interface Task {
  id: string;
  number: number;
  phase: Phase;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  assignedTo: string[]; // Role names like 'Preparer', 'Peer Reviewer', 'Team Lead'
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
}
```

### EmailRecipient
```typescript
interface EmailRecipient {
  id: string; name: string; email: string; company?: string; sentAt?: string; selected?: boolean;
}
```

### TaskNote
```typescript
interface TaskNote { id: string; text: string; author: string; createdAt: string; }
```

### PreliminaryInfo
```typescript
interface PreliminaryInfo {
  schemeRegNo: string;
  priorYearDocsUploaded: boolean;
  acPeriodConfirmed: boolean;
  acPeriodDate: string;
  schemeNameConfirmed: boolean;
  schemeName: string;
  nameAbbreviation: string;
}
```

### Draft Accounting Report Data
```typescript
type AccountsGenerationStatus = 'not-started' | 'generating' | 'generated';

interface InvestmentManagerReport {
  id: string; name: string; fileName: string; uploadedAt: string;
}

interface AccountsGenerationAttempt {
  id: string; version: number; generatedAt: string; fileName: string;
  questionsAnswered: number; totalQuestions: number; notes?: string;
  actionType: 'generated' | 'uploaded'; actionBy?: string;
}

interface DraftAccountingReportData {
  prevYearReportUploaded: boolean;
  prevYearReportName?: string;
  workingPaperUploaded: boolean;
  workingPaperName?: string;
  investmentManagerReports: InvestmentManagerReport[];
  questionnaireAnswers: QuestionnaireAnswer[];
  accountsGenerationStatus: AccountsGenerationStatus;
  generatedFileName?: string;
  generationHistory: AccountsGenerationAttempt[];
  generationNotes: string;
}
```

### SchemeActivity & Scheme
```typescript
interface SchemeActivity { action: string; by: string; at: string; }

interface Scheme {
  id: string; name: string; yearEnd: string; yearEndDate: string;
  auditStartDate: string; signingDeadline: string;
  preparer: string; peerReviewer: string; teamLead: string;
  currentPhase: Phase; tasks: Task[];
  preliminaryInfo: PreliminaryInfo;
  draftAccountingReport: DraftAccountingReportData;
  isAllocated: boolean;
  completedBy?: string; completedAt?: string;
  lastActivity?: SchemeActivity;
}
```

### Scheme Master List (Admin)
```typescript
type ContactType = 'Trustee' | 'Secretary to the trustee' | 'Principal Employer' | 'Scheme Actuary' | 'Actuarial Team' | 'Administrator' | 'Client Team/Consultant' | 'Auditor' | 'Investment Managers' | 'AVC providers' | 'Insurance companies' | 'Investment Consultant' | 'Legal Advisers' | 'Banks';

interface SchemeContact {
  id: string; contactType: ContactType;
  individualName?: string; appointedDate?: string; ceasedDate?: string; status?: string;
  gender?: 'Male' | 'Female'; designation?: 'MNT' | 'CAT' | 'Corporate Independent';
  companyName?: string; address?: string; email?: string;
}

interface MasterScheme {
  id: string; schemeName: string; registrationNumber: string;
  schemeType: 'Defined Benefit' | 'Defined Contribution' | 'Hybrid';
  yearEndDate: string; abbreviation: string; clientName: string;
  status: 'Active' | 'De-activated'; contacts: SchemeContact[];
}
```

### Questionnaire (34 questions)
Define a `QUESTIONNAIRE_QUESTIONS` array with 34 `QuestionDefinition` objects covering pension scheme annual report preparation. Each question has:
- `id` (1-34), `title`, `description`, `type` (select | yes-no | text | date | multi-select)
- Optional `options` array and `subQuestions` (for yes-no questions that reveal follow-up fields)

**Key questions include**:
1. "Trustee" vs "Trustees" (select)
2. "Auditor" vs "Auditors" (select)
3. Scheme constitution type (select: DB/DC/Hybrid)
4. Buy-in/buy-out status (yes-no with 5 sub-questions)
5. Date scheme established (date)
6-34. Various pension scheme accounting, trustee, investment, and disclosure questions.

### Constants
```typescript
const PHASE_LABELS: Record<Phase, string> = { ... }; // Full labels like "Phase 1 – Planning"
const PHASE_SHORT: Record<Phase, string> = { ... };  // Short labels like "Planning"
const USER_ROLE_LABELS: Record<UserRole, string> = { ... };
const CONTACT_TYPE_FIELDS: Record<ContactType, string[]> = { ... }; // Which fields each contact type has
```

---

## MOCK DATA GENERATION (src/lib/mock-data.ts)

### People
- **10 Preparers**: Sean Wilson, Ben Martinez, Claire O'Brien, David Osei, Emma Wright, James Wilson, Kate Morgan, Liam Taylor, Nina Patel, Oliver Brown
- **5 Peer Reviewers**: Kieran Roberts, Sam Frost, Tanya Shah, Will Cooper, Zara Hussain
- **5 Team Leads**: Louise Neill, George Patel, Hannah Kim, Robert Clarke, Sarah Jennings
- **2 Senior Managers**: Simon Kent, Colette McKinley

### Teams (5 teams)
Alpha through Epsilon. Each team has 4 preparers and 2 reviewers, led by the corresponding team lead.

### Preparer → Team Lead mapping
- Sean Wilson, Ben Martinez, Claire O'Brien, David Osei → Louise Neill
- Emma Wright, James Wilson, Kate Morgan, Liam Taylor → George Patel
- Nina Patel, Oliver Brown → Hannah Kim

### 100 Scheme Names
Generate 100 unique UK-style pension scheme names (ABC Pension Scheme, Meridian Group Pension, Northern Trust PS, etc.).

### Scheme Generation Logic
For each of 100 schemes:
1. **Year end dates**: Cycle through 7 dates (2025-03-31, 2025-06-30, ..., 2026-09-30)
2. **Audit start**: Year end + 90 + (i%40)*3 days
3. **Signing deadline**: Year end + 7 months
4. **Allocation**: ~10 schemes are unallocated (indices 1,11,22,33,44,55,66,77,88,99)
5. **Preparer/Reviewer**: Assigned cyclically from the lists
6. **Team Lead**: Derived from preparer via the mapping

### Task Completion Logic
Each scheme has a `phaseIndex` that determines how many of its 18 tasks are completed:
- Planning phase: 0-2 tasks done
- Peer Review: 5-6 tasks done
- Audit Process: 9-12 tasks done
- Audit Sign Off: 15-17 tasks done
- Completed: all 18 done

**CRITICAL**: The `currentPhase` displayed on the scheme card must be **computed from actual task statuses**, not from the phase index. Find the earliest phase that still has incomplete tasks.

### Draft Accounts Task Consistency
The Draft Accounts task is task index 5 (0-based). When this task is marked completed (completedTaskCount > 5), the `DraftAccountingReportData` must also be fully populated: all 34 questionnaire answers filled, both documents uploaded, accounts generation status = 'generated', and generation history populated. This ensures the task card's status indicators (Questionnaire 34/34 ✓, Documents 2/2 ✓, Draft Accounts Generated ✓) are consistent.

### Preliminary Info
Schemes past planning phase (index >= 8 or < 5) have preliminary info pre-filled.

### Email Recipients
For email-type tasks, auto-populate recipients from the matching master scheme contacts based on `contactTypeForRecipients`. Filter out ceased/retired contacts. Each contact type has a specific email template function.

### Last Activity Trail
Every allocated scheme gets a `lastActivity`:
- If tasks are completed: show latest task action, note addition, or email sent (including task name)
- If no tasks completed: show allocation trail ("Allocated to X (Preparer) & Y (Reviewer)" by senior manager)
- Unallocated schemes: no trail

### Master Scheme Contacts
Each master scheme gets a realistic set of contacts:
- 2-4 Trustees (some retired, various designations: MNT, CAT, Corporate Independent)
- Secretary (50% of schemes)
- Principal Employer (all)
- Scheme Actuary (all, some with ceased secondary)
- Actuarial Team (75%)
- Administrator (all, @isio.com internal emails)
- Client Team (first 6 schemes, @isio.com)
- Auditor (all)
- 1-3 Investment Managers (external company emails)
- AVC providers (67%)
- Insurance companies (first 5)
- Investment Consultant (50%)
- Legal Advisers (67%)
- Banks (first 7)

---

## 18 TASK TEMPLATE

Create exactly 18 tasks per scheme across 4 phases:

### Phase 1 – Planning (5 tasks, all email type)
1. **Send investment year end requests** — email to Investment Managers, 1 month before year end
2. **Arrange audit date (audit kick off)** — email to Auditor, 1 month before year end
3. **Send consultant/client team questionnaire** — email to Client Team/Consultant, at year end, allows attachment
4. **Send admin team questionnaire** — email to Administrator, at year end
5. **Send investment risk disclosure & implementation statement requests** — email to Investment Consultant, 1 month after year end

### Phase 2 – Peer Review (4 tasks)
6. **Draft Accounts** — type: draft-accounting-report, assigned to Preparer, due 17 days before audit start
7. **Peer review to be completed** — reminder, assigned to Peer Reviewer, due 10 days before audit start
8. **Team lead check-in on audit status** — reminder, assigned to Team Lead, due 7 days before audit start
9. **Audit pack to be shared** — reminder, assigned to Preparer, due 3 days before audit start

### Phase 3 – Audit Process (6 tasks, all reminders)
10-15. Audit queries received, response checks, follow-ups, final queries, draft accounts to trustees. Due dates: 14-63 days after audit start.

### Phase 4 – Audit Sign Off (3 tasks, all reminders)
16. Audit clearance due — 77 days after audit start
17. Final accounts to Trustee(s) for signing — 84 days after audit start
18. Accounts due to be signed — 7 months after year end

All email tasks have `isTeamLeadRequired: true` except task 2. All tasks have `assignedTo` using role names ('Preparer', 'Peer Reviewer', 'Team Lead').

---

## EMAIL TEMPLATES (src/lib/email-templates.ts)

Create 6 template functions:
1. `getInvestmentManagerEmailTemplate(schemeName, yearEnd, replyDeadline)` — Requests 8 items: valuation statements, transactions, fair value hierarchy, asset class allocation, pooled vehicle types, self-investment details, custodians, fee details
2. `getAdminTeamEmailTemplate(schemeName, yearEnd, replyDeadline)` — Requests contribution schedules, pension increases, pensioner existence checks
3. `getClientTeamEmailTemplate(schemeName, yearEnd, yearStart)` — Client questionnaire cover letter
4. `getInvestmentRiskEmailTemplate(schemeName, yearEnd, replyDeadline)` — Investment risk disclosures and implementation statement
5. `getAuditArrangementEmailTemplate(schemeName, yearEnd)` — Audit arrangement request
6. `getFollowUpEmailTemplate(schemeName, originalSubject)` — Generic follow-up

All templates are professional formal letters starting with "Dear Sir/Madam" and ending with "Kind regards".

---

## STATE MANAGEMENT (src/lib/workflow-store.ts)

Use Zustand store with these state fields and actions:

### State
- `schemes: Scheme[]`, `teams: Team[]`, `masterSchemes: MasterScheme[]`
- `selectedSchemeId: string | null`, `activePhase: Phase`
- `searchQuery: string`, `showDraftReport: boolean`, `showTeamManagement: boolean`, `showSchemeManagement: boolean`, `showNotifications: boolean`
- `currentUserRole: UserRole` (default: 'preparer'), `currentUserName: string` (default: 'Sean Wilson')

### Key Actions
1. **toggleTaskComplete** — Toggles task status. Records `lastActivity` with task name and action. **CRITICAL**: Recomputes `currentPhase` from task statuses using `computePhaseFromTasks()`.
2. **sendEmails** — Marks selected recipients as sent, records email history. Updates `lastActivity` with `Emails sent for "[task title]"`.
3. **sendFollowUpEmails** — Adds follow-up to email history
4. **allocateScheme** — Sets preparer, reviewer, auto-derives team lead, sets phase to 'planning'. Records `lastActivity` with `Allocated to X (Preparer) & Y (Reviewer)`.
5. **completeScheme** — Sets phase to 'completed', records completedBy/completedAt
6. **answerQuestion** — Updates questionnaire answer
7. **startGenerateAccounts / completeGenerateAccounts** — Simulates generation, adds to generationHistory with versioned .docx filename
8. **uploadDraftVersion** — Adds uploaded file to generationHistory with actionType 'uploaded'
9. **addAdhocTask, addTaskNote, updatePreliminaryInfo, updateDraftAccountingReport**
10. Team/scheme management actions

### computePhaseFromTasks Helper
```typescript
function computePhaseFromTasks(tasks: Task[], isAllocated: boolean): Phase {
  if (!isAllocated) return 'not-started';
  const phases: Phase[] = ['planning', 'peer-review', 'audit-process', 'audit-sign-off'];
  for (const phase of phases) {
    const phaseTasks = tasks.filter(t => t.phase === phase);
    if (phaseTasks.length > 0 && phaseTasks.some(t => t.status !== 'completed')) return phase;
  }
  return 'audit-sign-off'; // All done but not formally completed
}
```

---

## APP STRUCTURE

### Layout (Index.tsx)
Full-screen flex layout: `<AppSidebar />` on left + main content area showing one of:
- `<SchemeManagement />` (admin only)
- `<TeamManagement />` (manager/admin)
- `<SchemeDetail />` (when a scheme is selected)
- `<Dashboard />` (default)

### Sidebar (AppSidebar.tsx)
- Dark sidebar (w-56), "PS" logo icon, "PensionFlow" brand name
- **Role switcher dropdown** — Select from: Preparer, Peer Reviewer, Team Lead, Senior Manager, Admin
- **User switcher dropdown** — Shows users for the selected role
- Navigation: Dashboard, Teams (manager/admin only), Scheme Master (admin only), Notifications (with red badge count), Settings
- Bottom: current user display with role

### Notification Panel (NotificationPanel.tsx)
- Slides out as a panel (w-96) next to sidebar
- Shows tasks due within 7 days or overdue, filtered by current user role
- Two sections: "Overdue" (red header) and "Due within 7 days" (blue header)
- Each notification expandable to show description, due date, and "Go to scheme" button
- `useNotificationCount()` hook for badge count

---

## DASHBOARD (Dashboard.tsx)

### Manager View
- Title: "Manager Dashboard", shows "300 schemes" (scales mock data)
- **Manager Stats Panel**: 4 stat cards:
  1. Scheme Allocation (300 total, X allocated, Y pending, with progress bar)
  2. Phase Breakdown (count per phase with colored dots)
  3. Audit Status (dates arranged, not arranged, past deadline count)
  4. Team Lead Workload (schemes and % per lead)
- Phase filter cards (6 cards including "Pending Allocation")
- Search bar
- Scheme cards (no "My Tasks" tab)

### Non-Manager View
- Title: "Scheme Dashboard"
- Phase filter cards (5 cards, no pending allocation)
- Tabs: "List of Schemes" and "My Tasks" (with red badge showing outstanding count)
- **My Tasks tab**: Shows tasks assigned to current user across all schemes, sorted by due date, filterable to show/hide completed

### Phase Filter Cards
Clickable cards that filter the scheme list. Active cards get a colored ring. Multiple filters supported. Shows "Filtered by:" badges when active.

### Scheme Cards
Each card shows:
- **Row 1**: Scheme name, phase badge (colored), overdue task badge (if any)
- **Row 1 right**: Team members with icons:
  - Preparer: `UserCircle` icon in `text-primary`
  - Reviewer: `Eye` icon in `text-phase-audit`
  - Team Lead: `Shield` icon in `text-task-reminder`
  - Manager gets an edit pencil icon to reallocate
- **Row 2**: Year end, Audit kick-off, Sign-off due dates
- **Row 2 right**: Task progress bar (X/Y tasks, Z%)
- **Row 3**: Last activity trail — `Clock` icon + "{user} · {action} · {date time}"
- Unallocated schemes: Red-tinted border, "Not Allocated" badge, "Allocate" button for managers

### Allocation Dialog
- Modal with scheme name banner, preparer dropdown, auto-derived team lead display, reviewer dropdown, sign-off date picker (defaults to 7 months after year end)
- Also used for reallocation (pre-filled)

---

## SCHEME DETAIL (SchemeDetail.tsx)

### Header
- Back arrow, scheme name, year end, audit start, sign-off due
- Preparer, Reviewer, Lead names, X/Y tasks done
- "+ Ad-hoc Task" button

### Phase Tabs
4 tabs (Planning, Peer Review, Audit Process, Audit Sign Off) with completion counts. Active tab gets phase-specific color.

### Planning Phase
- **Preliminary Information** card at top with 5 clickable field cards:
  1. Scheme Reg No. (text input)
  2. Prior Year Docs (toggle uploaded/not uploaded)
  3. AC Period Confirmed (text input)
  4. Scheme Name (text input)
  5. Abbreviation (select: Scheme/Plan/Fund/Section)
- Shows X/5 completion counter. All 5 must be complete to unlock planning tasks.
- When incomplete: tasks shown blurred with lock overlay message "Complete preliminary information above to unlock tasks"

### Task Cards (regular tasks)
Each task card has:
- **Collapsed state**: Checkmark toggle (green when done, gray circle when pending), task title (strikethrough when done), completion timestamp, ad-hoc badge, overdue badge, phase badge, due date, assigned users, note count, expand/collapse chevron
- **Expanded state**: Description (with "today" replaced by actual due date: "by 21 Sep 2025"), email section (for email tasks), notes section

### Email Task Expanded Content
- **Email Draft**: Editable textarea with white background, pre-populated from template
- **Attachment option** (if `allowAttachment`): Shows attach file button
- **Recipients list**: Granular selection with checkboxes, "Select all" toggle, company names, email addresses
- **Send button**: "Send to Selected (N)" — marks selected recipients as sent with timestamp
- **After all sent**: Shows "Follow Up" button which opens editable follow-up template
- **Send History**: Collapsible section showing previous sends (initial/follow-up) with dates, recipient counts, and full email text

### Task description "today" replacement
When a task's description contains the word "today", replace it with "by {formatted due date}" (e.g., "by 21 Sep 2025").

### Draft Accounts Task Card (Special)
Renders differently from regular tasks:
- **Icon**: FileText icon in primary/10 rounded box (or green checkmark when completed, which is clickable to toggle back to incomplete)
- **Status indicators row** (3 pills):
  1. `Questionnaire X/34` — green checkmark when 34/34, gray circle otherwise
  2. `Documents X/2` — green checkmark when 2/2
  3. `Draft Accounts Generated/Pending` — green checkmark when generated
- **Download row** (inside card, when accounts generated): Shows latest file name (.docx), action type (Generated/Uploaded), author name, timestamp, download button
- **Clickable** with ChevronRight to open the draft accounts working page

### Completion Flow
- **Audit Sign Off tab**: When all 18 tasks are completed, shows "All Tasks Completed" message with "Confirm Scheme Accounts Completed" button (green gradient, party popper icon)
- After completion: Shows "Scheme Accounts Completed" with "Completed by {name} on {date} at {time}"

---

## DRAFT ACCOUNTS WORKING PAGE (DraftAccountingReport.tsx)

Accessed by clicking the Draft Accounts task card. Shows within the same SchemeDetail shell with breadcrumb: Schemes > {Scheme Name} > Draft Accounts.

### Header
- Back arrow, breadcrumb navigation
- Scheme name, "Phase 2 – Peer Review · Year end: X · X/34 questions done"
- Questionnaire counter and Documents status on the right

### Draft Accounts task card summary (not clickable, no arrow)
Shows the same task card with status indicators.

### "Mark Draft Accounts Complete" button
Only visible when accounts are generated. Green gradient button. Clickable checkmark on the task card also toggles completion.

### Three Tabs

#### Tab 1: Upload Documents
- **Previous Year Annual Report**: Upload/replace button, shows file name when uploaded
- **Working Paper**: Upload/replace button, shows file name when uploaded
- **Investment Manager Reports**: List of uploaded IM reports with delete button. Add new via text input + "Upload" button. Shows count badge.

#### Tab 2: Enter Information
- Header: "Questionnaire – X/34 completed" with remaining count badge
- **Two-column grid** of 34 question cards
- Each card: Compact row with checkmark/circle icon, question number + title (truncated), answer value (when answered)
- Clicking a card expands it inline to show the full question with input:
  - `select` → dropdown
  - `yes-no` → two checkboxes, sub-questions appear when "Yes" selected
  - `text` → textarea
  - `date` → date input
  - `multi-select` → multiple checkboxes
- Answered cards have green border and green tint background

#### Tab 3: Generate Accounts
- **Pending items warning** (orange box) when prerequisites not met
- **Generate Accounts center card**: Shows status message, generate button (disabled when prerequisites incomplete)
- After generation: "Re-generate Accounts" and "Upload New Version" buttons
- **Hidden file input** for .docx upload
- Generating state: Shows loading spinner in a dialog
- **Generation Notes**: Textarea for special instructions
- **Draft History**: Reverse-chronological list of all generation/upload events showing:
  - Version badge (v1, v2...)
  - File icon (FileText for generated, FileUp for uploaded)
  - File name, action type (Generated/Uploaded), author, timestamp
  - Questions answered count (for generated only)
  - Download button per entry

---

## TEAM MANAGEMENT (TeamManagement.tsx)

Accessible by managers and admins via sidebar.

- Shows 5 team cards (Alpha through Epsilon)
- Each card: Team name, team lead, active member count, preparer/reviewer count badges
- Expandable to show:
  - Team lead highlighted with Crown icon and primary badge
  - All members with role icons (UserCircle for preparer, Eye for reviewer)
  - Role change dropdown (managers/admins can edit)
  - "Make Team Lead" button (Crown icon)
  - Activate/Deactivate toggle per member
  - "Add Member" dialog with name, email, role fields

---

## SCHEME MANAGEMENT (SchemeManagement.tsx)

Admin-only, accessible via "Scheme Master" in sidebar.

### List View
- Header: "Scheme Master List", X schemes configured, "Add Scheme" button
- **Search + 3 filter dropdowns**: Type, Status, Year End
- **Sortable table** with columns: Scheme Name, Reg No., Type, Year End, Client, Status, Contacts, Actions
- Click column headers to sort (asc/desc with arrow indicators)
- **Pagination**: 25/50/100 per page, page navigation with first/prev/next/last buttons
- Results summary: "Showing X–Y of Z schemes"

### Scheme Detail View (Contacts)
- Click "X contacts" button to enter contact management
- Back arrow, scheme name, reg no, type, year end, abbreviation, client, status
- Contacts grouped by contact type with expandable sections
- Each contact shows: individual name, company, email, appointed/ceased dates, status, designation/gender
- "Add Contact" dialog per contact type with fields specific to that contact type
- Edit/delete buttons per contact

### Add/Edit Scheme Dialog
- Grid form: Scheme Name, Registration Number, Type (select), Year End Date, Abbreviation, Client Name (select), Status (select)

---

## AD-HOC TASK DIALOG (AdhocTaskDialog.tsx)

- Opened from scheme detail header
- Type dropdown: "Audit queries received", "Consultant accounts comments received", "Trustee comments received", "Other"
- If "Other" selected: custom title input
- Description textarea, deadline date picker
- Creates task with type 'standard', assigned to Preparer, in current phase
- Ad-hoc tasks get "Ad-hoc" badge in accent color

---

## ROLE-BASED BEHAVIOR

### Preparer
- Sees only schemes where they are the preparer
- "My Tasks" tab shows only preparer-assigned tasks
- Can complete tasks, send emails, add notes, manage draft accounts

### Peer Reviewer
- Sees only schemes where they are the reviewer
- "My Tasks" shows reviewer-assigned tasks

### Team Lead
- Sees only schemes where they are the lead
- "My Team's Tasks" tab label
- Sees all team tasks

### Senior Manager
- Sees ALL schemes (titled "Manager Dashboard")
- "300 schemes" display (scales from ~100 mock schemes)
- Manager Stats panel with 4 overview cards
- Can allocate/reallocate schemes
- "Pending Allocation" filter card
- No "My Tasks" tab
- Can access Team Management

### Admin
- Can access Scheme Master (CRUD for master scheme list and contacts)
- No notifications bell

---

## KEY BEHAVIORAL DETAILS

1. **Phase computation**: `currentPhase` on scheme cards is always derived from task statuses. When a task is toggled, the phase badge updates immediately.

2. **Audit trail**: Every significant action (allocation, task completion, email send, scheme completion) records `lastActivity` on the scheme. The trail shows on scheme cards as "{user} · {action} · {datetime}".

3. **Email task lifecycle**: Pre-populated draft → user can edit → select recipients → send → collapse draft into history → follow-up available → follow-up editable → send follow-up → shows in history

4. **Draft Accounts task indicators**: Three status pills on the task card showing questionnaire progress (with green ✓ at 34/34), document upload count (with green ✓ at 2/2), and generation status (with green ✓ when generated). Download row appears inside the card when generated.

5. **Draft Accounts completion gate**: The task can only be marked complete when accounts are generated. The green checkmark on a completed task is clickable to toggle it back to incomplete.

6. **Preliminary info gates Planning tasks**: Tasks are blurred/locked until all 5 preliminary fields are filled.

7. **File naming**: Generated files use `.docx` extension: `{Scheme_Name}_Annual_Report_2025_v{N}.docx`

8. **Description date replacement**: Task descriptions containing "today" are replaced with "by {formatted due date}" in the expanded view.

9. **Notifications**: Show tasks due within 7 days or overdue, grouped into "Overdue" and "Due within 7 days" sections, with badge count on sidebar bell icon.

10. **Scheme card progress**: Shows `X/Y tasks` with percentage and a thin progress bar.

---

## IMPLEMENTATION ORDER

Build in this sequence for best results:

1. **Types & constants** (types.ts) — all interfaces, enums, questionnaire questions
2. **Email templates** (email-templates.ts)
3. **Mock data generation** (mock-data.ts) — teams, schemes, master schemes, contacts
4. **Zustand store** (workflow-store.ts) — all state and actions
5. **Design tokens** (index.css, tailwind.config.ts)
6. **UI components** — Install all shadcn/ui components needed
7. **AppSidebar** — Role/user switcher, navigation
8. **Dashboard** — Manager stats, scheme cards, task list, allocation dialog
9. **SchemeDetail** — Phase tabs, preliminary info, task listing
10. **TaskCard** — Regular tasks with email, draft accounts special card
11. **DraftAccountingReport** — 3-tab document management system
12. **NotificationPanel** — Overdue/upcoming task notifications
13. **TeamManagement** — Team CRUD
14. **SchemeManagement** — Master scheme list with contacts
15. **AdhocTaskDialog** — Ad-hoc task creation

---

This prompt covers every feature, data model, business rule, and UI detail of the PensionFlow application. Build it step by step following the implementation order above.
