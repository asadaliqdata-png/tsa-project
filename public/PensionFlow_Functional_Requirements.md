# PensionFlow — Functional Requirements Document

**Document Version:** 1.0  
**Date:** 8 March 2026  
**Prepared for:** Development Team  
**Application:** PensionFlow — Pension Scheme Audit Workflow Management System

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Data Model](#4-data-model)
5. [Dashboard](#5-dashboard)
6. [Scheme Detail View](#6-scheme-detail-view)
7. [Task Management](#7-task-management)
8. [Email Automation](#8-email-automation)
9. [Draft Accounts Subsystem](#9-draft-accounts-subsystem)
10. [Preliminary Checks](#10-preliminary-checks)
11. [Notifications](#11-notifications)
12. [Team Management](#12-team-management)
13. [Scheme Master List (Admin)](#13-scheme-master-list-admin)
14. [Ad-hoc Tasks](#14-ad-hoc-tasks)
15. [Workflow & Phase Transitions](#15-workflow--phase-transitions)
16. [Audit Trail](#16-audit-trail)
17. [Appendix A: 34-Question Questionnaire](#appendix-a-34-question-questionnaire)
18. [Appendix B: 18-Task Template](#appendix-b-18-task-template)
19. [Appendix C: Contact Types & Fields](#appendix-c-contact-types--fields)

---

## 1. Executive Summary

PensionFlow is a web-based pension scheme audit workflow management application designed for an audit firm. It manages approximately 100+ pension schemes through a structured 4-phase audit workflow. The system provides role-based access, automated email communications, document management, a specialised questionnaire-driven draft accounts generation system, and comprehensive audit trail logging.

### Key Capabilities
- Multi-phase audit workflow management (Planning → Peer Review → Audit Process → Audit Sign Off)
- Role-based dashboards for 5 user types
- Automated email template management with recipient selection
- 34-question pension scheme questionnaire for draft account generation
- Scheme master list with contact management
- Team management with role assignment
- Real-time notification system for overdue and upcoming tasks
- Full audit trail on every scheme

---

## 2. System Overview

### 2.1 Architecture
- **Frontend**: Single-page application (React, TypeScript)
- **State Management**: Centralised store (Zustand)
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **No backend/database** in the current prototype — all data is mock-generated in-memory

### 2.2 Layout Structure
The application uses a fixed sidebar + main content area layout:
- **Left sidebar** (dark theme, 224px wide): Navigation, role/user switcher, user info
- **Main content area** (light theme): Displays one of Dashboard, Scheme Detail, Team Management, Scheme Master, or Notification Panel

> **UI Reference — Dashboard (Preparer View):**
> The preparer sees their assigned schemes with phase filter cards, search, and a "My Tasks" tab showing all tasks across schemes sorted by due date.

> **UI Reference — Dashboard (Manager View):**
> The manager sees all 300 schemes (scaled from 100 mock schemes × 3) with 4 analytics cards: Scheme Allocation, Phase Breakdown, Audit Status, and Team Lead Workload. Includes a "Pending Allocation" filter and allocation controls.

---

## 3. User Roles & Access Control

### 3.1 Role Definitions

| Role | Label | Dashboard Title | Sees Schemes | Features |
|------|-------|----------------|--------------|----------|
| `preparer` | Preparer | Scheme Dashboard | Where assigned as preparer | My Tasks tab, task completion, email send, draft accounts |
| `peer-reviewer` | Peer Reviewer | Scheme Dashboard | Where assigned as reviewer | My Tasks tab, task completion |
| `team-lead` | Team Lead | Scheme Dashboard | Where assigned as lead | "My Team's Tasks" tab |
| `manager` | Senior Manager | Manager Dashboard | ALL schemes (300) | Stats panel, allocation, reallocation, Team Management, no My Tasks tab |
| `admin` | Admin | Scheme Dashboard | ALL schemes | Scheme Master CRUD, no notifications bell |

### 3.2 People (Mock Data)
- **10 Preparers**: Sean Wilson, Ben Martinez, Claire O'Brien, David Osei, Emma Wright, James Wilson, Kate Morgan, Liam Taylor, Nina Patel, Oliver Brown
- **5 Peer Reviewers**: Kieran Roberts, Sam Frost, Tanya Shah, Will Cooper, Zara Hussain
- **5 Team Leads**: Louise Neill, George Patel, Hannah Kim, Robert Clarke, Sarah Jennings
- **2 Senior Managers**: Simon Kent, Colette McKinley

### 3.3 Team Structure
5 teams (Alpha through Epsilon), each with:
- 1 Team Lead
- 4 Preparers
- 2 Peer Reviewers

### 3.4 Preparer → Team Lead Mapping
| Preparer | Team Lead |
|----------|-----------|
| Sean Wilson, Ben Martinez, Claire O'Brien, David Osei | Louise Neill |
| Emma Wright, James Wilson, Kate Morgan, Liam Taylor | George Patel |
| Nina Patel, Oliver Brown | Hannah Kim |

---

## 4. Data Model

### 4.1 Scheme
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Scheme name (e.g., "ABC Pension Scheme") |
| `yearEnd` | string | Formatted year end (e.g., "30 March 2025") |
| `yearEndDate` | string | ISO date (e.g., "2025-03-30") |
| `auditStartDate` | string | ISO date or empty string ("Not arranged") |
| `signingDeadline` | string | ISO date, defaults to year end + 7 months |
| `preparer` | string | Assigned preparer name |
| `peerReviewer` | string | Assigned peer reviewer name |
| `teamLead` | string | Auto-derived from preparer |
| `currentPhase` | Phase | Computed from task statuses |
| `tasks` | Task[] | Array of 18+ tasks (includes ad-hoc) |
| `preliminaryInfo` | PreliminaryInfo | Preliminary checks data |
| `draftAccountingReport` | DraftAccountingReportData | Draft accounts subsystem data |
| `isAllocated` | boolean | Whether scheme has been assigned |
| `completedBy` | string? | Name of person who completed the scheme |
| `completedAt` | string? | Timestamp of completion |
| `lastActivity` | SchemeActivity? | Most recent action for audit trail |

### 4.2 Task
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `number` | number | Sequential task number |
| `phase` | Phase | Which workflow phase this task belongs to |
| `title` | string | Task title |
| `description` | string | Detailed description |
| `type` | TaskType | `standard`, `reminder`, `email`, `team-lead-only`, `draft-accounting-report` |
| `status` | TaskStatus | `pending`, `in-progress`, `completed`, `overdue` |
| `assignedTo` | string[] | Role names (e.g., ['Preparer', 'Team Lead']) |
| `dueDate` | string | ISO date |
| `dueDateLabel` | string | Human-readable relative due date description |
| `completedAt` | string? | Timestamp when completed |
| `notes` | TaskNote[] | User-added notes |
| `emailRecipients` | EmailRecipient[]? | For email tasks: list of contacts |
| `emailHistory` | EmailHistory[]? | Record of sent emails |
| `isTeamLeadRequired` | boolean | Whether team lead approval is needed |
| `contactTypeForRecipients` | ContactType? | Which contact type to pull recipients from |
| `emailDraftTemplate` | string? | Pre-populated email template text |
| `allowAttachment` | boolean? | Whether file attachment is allowed |
| `attachmentLabel` | string? | Label for the attachment button |
| `isAuditKickOff` | boolean? | Special flag for audit date task |

### 4.3 Phase Enum
```
not-started → Planning → Peer Review → Audit Process → Audit Sign Off → Completed
```

### 4.4 Preliminary Checks Data
| Field | Type | Description |
|-------|------|-------------|
| `acPeriodConfirmed` | boolean | Whether accounting period is confirmed |
| `acPeriodDate` | string | The accounting period date |
| `schemeNameConfirmed` | boolean | Whether scheme name is confirmed |
| `schemeName` | string | The confirmed scheme name |
| `nameAbbreviation` | string | Selected abbreviation type |

### 4.5 Draft Accounting Report Data
| Field | Type | Description |
|-------|------|-------------|
| `prevYearReportUploaded` | boolean | Previous year report upload status |
| `prevYearReportName` | string? | File name |
| `workingPaperUploaded` | boolean | Working paper upload status |
| `workingPaperName` | string? | File name |
| `investmentManagerReports` | InvestmentManagerReport[] | List of IM reports |
| `questionnaireAnswers` | QuestionnaireAnswer[] | 34 answers |
| `accountsGenerationStatus` | AccountsGenerationStatus | `not-started`, `generating`, `generated` |
| `generatedFileName` | string? | Latest generated file name |
| `generationHistory` | AccountsGenerationAttempt[] | Version history |
| `generationNotes` | string | Special instructions for generation |

---

## 5. Dashboard

### 5.1 Preparer / Peer Reviewer / Team Lead View

**Header:**
- Title: "Scheme Dashboard" with role badge
- Subtitle: "{N} schemes · Logged in as {Name}"

**Phase Filter Cards (5 cards):**
- Planning, Peer Review, Audit Process, Audit Sign Off, Completed
- Each shows count and is clickable to filter the scheme list
- Multiple filters can be active simultaneously
- Active cards display a coloured ring border matching the phase colour

**Tabs:**
- **List of Schemes**: Shows scheme cards filtered by user's assignments
- **My Tasks** (with red badge showing outstanding count): Shows all tasks assigned to the current user across all schemes, sorted by due date

> **UI Reference — Scheme Card:**
> Each scheme card displays:
> - Row 1: Scheme name, phase badge (coloured), overdue task count badge (red)
> - Row 1 right: Team member names with role icons (● Preparer, ◉ Reviewer, ○ Lead)
> - Row 2: Year end, Audit kick-off date, Sign-off due date
> - Row 2 right: Task progress bar showing "X/Y tasks" and percentage
> - Row 3: Last activity trail — clock icon + "{user} · {action} · {datetime}"

**Unallocated Schemes:**
- Red-tinted border
- "Not Allocated" grey badge
- "Allocate" button (manager only)

### 5.2 Manager View

**Additional Features:**
- Title: "Manager Dashboard"
- Shows "300 schemes" (scaled from mock data)
- **4 Manager Stats Cards:**
  1. **Scheme Allocation**: Total count, allocated vs pending, progress bar
  2. **Phase Breakdown**: Count per phase with coloured dots
  3. **Audit Status**: Dates arranged, not yet arranged, past sign-off deadline (red warning)
  4. **Team Lead Workload**: Schemes per lead with percentage bars
- **Pending Allocation** filter card (with red styling)
- Edit (pencil) icon on each scheme card for reallocation
- No "My Tasks" tab

### 5.3 Allocation Dialog
- Modal with scheme name banner
- **Preparer** dropdown
- **Team Lead** auto-derived display (read-only)
- **Peer Reviewer** dropdown
- **Sign-off due date** picker (defaults to year end + 7 months)
- Used for both initial allocation and reallocation

---

## 6. Scheme Detail View

> **UI Reference — Scheme Detail:**
> Shows a header banner with scheme info, then phase tabs below with task lists.

### 6.1 Header
- Back arrow ("Back to schemes")
- Scheme name, phase badge, overdue count badge
- Team member names with role icons
- Key dates: Year end, Audit kick-off, Sign-off due
- Task progress: "X/Y tasks" with percentage
- Last activity trail
- "+ Ad-hoc Task" button

### 6.2 Phase Tabs
4 tabs with completion counts:
- **Planning** (X/6)
- **Peer Review** (X/4)
- **Audit Process** (X/6)
- **Audit Sign Off** (X/3)

Each tab has a phase-specific colour when active. A coloured progress strip runs below the tabs.

### 6.3 Phase Content
Each phase tab shows:
- Phase title (e.g., "Phase 1 – Planning")
- List of task cards for that phase
- Special content depending on the phase (e.g., Preliminary Checks in Planning)

### 6.4 Completion Flow
When viewing the **Audit Sign Off** tab and ALL tasks across ALL phases are completed:
- Shows "All Tasks Completed" message
- Displays "Confirm Scheme Accounts Completed" button (green gradient with party popper icon)
- After confirmation: Shows "Scheme Accounts Completed — Completed by {name} on {date} at {time}"

---

## 7. Task Management

### 7.1 Task Card — Collapsed State
| Element | Description |
|---------|-------------|
| Checkmark toggle | Green circle when complete, grey outline when pending. Clickable to toggle. |
| Task title | Bold text, strikethrough when completed |
| Completion timestamp | Shown when completed |
| Badges | "Ad-hoc" badge (accent colour), "Overdue" badge (red), phase badge (in My Tasks view only) |
| Due date | Shown with clock icon, red text if overdue |
| Assigned users | Names with role icons |
| Note count | Badge showing number of notes |
| Expand/collapse chevron | Right side |

### 7.2 Task Card — Expanded State
- **Description**: Full task description. Any occurrence of the word "today" is replaced with "by {formatted due date}" (e.g., "by 21 Sep 2025")
- **Email section** (for email-type tasks): See [Section 8](#8-email-automation)
- **Notes section**: List of timestamped notes with author. "Add a note" input field.

### 7.3 Task Completion
- Clicking the checkmark toggles the task between `completed` and `pending`
- Completion records a timestamp and updates the scheme's `lastActivity`
- Phase recomputation occurs immediately (the scheme's `currentPhase` badge updates)

### 7.4 Draft Accounts Task Card (Special Rendering)
This task type renders differently:
- **Icon**: FileText icon in a primary-coloured rounded box (green checkmark when completed)
- **Status indicator pills** (3 inline):
  1. `Questionnaire X/34` — green ✓ when 34/34, grey ○ otherwise
  2. `Documents X/2` — green ✓ when 2/2
  3. `Draft Accounts Generated` or `Pending` — green ✓ when generated
- **Download row** (when accounts generated): Latest file name, action type, author, timestamp, download button
- Clicking opens the Draft Accounts working page (see [Section 9](#9-draft-accounts-subsystem))

---

## 8. Email Automation

### 8.1 Email Task Lifecycle
1. Task card expands to show email draft section
2. User can view/edit the pre-populated email template
3. User selects recipients from the contact list (checkboxes)
4. User clicks "Send to Selected (N)" — marks selected recipients as sent with timestamp
5. After all recipients sent: "Follow Up" button becomes available
6. Follow-up opens an editable follow-up template
7. Follow-up can be sent and recorded
8. All sends appear in the Send History section

### 8.2 Email Draft
- Editable textarea with white background
- Pre-populated from the task's email template function
- Text is sent as part of the email history record

### 8.3 Recipient Selection
- List of recipients pulled from scheme master contacts based on `contactTypeForRecipients`
- Ceased/retired contacts are filtered out
- Each recipient shows: name, company, email address
- Individual checkboxes + "Select all" toggle
- "Send to Selected (N)" button with count

### 8.4 Attachment
- Some email tasks have `allowAttachment: true`
- Shows an "Attach file" button with the specified label
- Simulated — no actual file upload in the prototype

### 8.5 Send History
- Collapsible section showing previous sends
- Each entry shows: send type (Initial/Follow-up), date, recipient count, full email text

### 8.6 Email Templates (6 templates)
| Template | Used For | Key Content |
|----------|----------|-------------|
| Investment Manager | Task 1 | Requests 8 items: valuation statements, transactions, fair value hierarchy, etc. |
| Audit Arrangement | Task 2 | Audit date arrangement request |
| Client Team Questionnaire | Task 3 | Client questionnaire cover letter |
| Admin Team | Task 4 | Contribution schedules, pension increases, pensioner checks |
| Investment Risk | Task 5 | Investment risk disclosures and implementation statement |
| Follow-up (generic) | Any email task | Generic follow-up referencing original subject |

All templates use formal business letter format: "Dear Sir/Madam" → content → "Kind regards".

---

## 9. Draft Accounts Subsystem

### 9.1 Overview
The Draft Accounts subsystem is a major milestone at the end of the Planning phase. It features a dedicated full-width working page accessed by clicking the Draft Accounts task card.

**Completion is gated by three requirements:**
1. All 34 questionnaire items answered
2. All required documents uploaded (2 base documents)
3. Draft accounts generated

### 9.2 Navigation
- Accessed from the Peer Review phase in Scheme Detail
- Breadcrumb: Schemes > {Scheme Name} > Draft Accounts
- Phase tabs remain interactive for navigation back

### 9.3 Header
- Back arrow to return to scheme detail
- Scheme name, "Phase 2 – Peer Review · Year end: X · X/34 questions done"
- Questionnaire counter and document status on the right

### 9.4 Draft Accounts Task Card Summary
Shows the same task card with the 3 status indicator pills (non-clickable, no arrow).

### 9.5 "Mark Draft Accounts Complete" Button
- Only visible when accounts are generated
- Green gradient button
- The green checkmark on a completed task card is also clickable to toggle back to incomplete

### 9.6 Tab 1: Upload Documents
| Document | Description |
|----------|-------------|
| Previous Year Annual Report | Upload/replace button, shows file name when uploaded |
| Working Paper | Upload/replace button, shows file name when uploaded |
| Investment Manager Reports | List with delete capability. Add via text input + "Upload". Shows count badge. |

### 9.7 Tab 2: Enter Information (Questionnaire)

**Layout:**
- Header: "Questionnaire – X/34 completed" with remaining count badge
- Two-column grid of 34 question cards

**Question Card (Collapsed):**
- Checkmark/circle icon (green ✓ when answered, grey ○ when pending)
- Question number + title (truncated)
- Answer value (when answered)

**Question Card (Expanded — click to expand inline):**
- Full question text with description
- Input control based on question type:
  - `select` → Dropdown
  - `yes-no` → Two radio-style options, sub-questions appear when "Yes" is selected
  - `text` → Textarea
  - `date` → Date input
  - `multi-select` → Multiple checkboxes
- **Clear Answer** button (X icon) — allows user to reset an answered question to unanswered state

**Visual States:**
- Answered: Green border + green tint background
- Unanswered: Default border

### 9.8 Tab 3: Generate Accounts

**Prerequisites Warning:**
- Orange warning box shown when prerequisites are not met (missing questions or documents)
- Lists specific pending items

**Generate Section:**
- Status message showing current state
- "Generate Accounts" button (disabled when prerequisites incomplete)
- After generation: "Re-generate Accounts" and "Upload New Version" buttons
- Hidden file input for .docx upload
- Generating state: Loading spinner in a modal dialog

**Generation Notes:**
- Textarea for special instructions that accompany the generation

**Draft History:**
- Reverse-chronological list of all generation/upload events
- Each entry shows:
  - Version badge (v1, v2, etc.)
  - File icon (FileText for generated, FileUp for uploaded)
  - File name (format: `{Scheme_Name}_Annual_Report_2025_v{N}.docx`)
  - Action type: "Generated" or "Uploaded"
  - Author name and timestamp
  - Questions answered count (for generated entries only)
  - Download button

---

## 10. Preliminary Checks

> **UI Reference — Preliminary Checks:**
> Displayed at the top of the Planning phase tab. Shows 3 field cards in a row with a completion counter (X/3).

### 10.1 Overview
Preliminary Checks is a gating mechanism for Planning phase tasks. All 3 checks must be completed before tasks are unlocked.

### 10.2 Fields
| Field | Label | Input Type | Description |
|-------|-------|-----------|-------------|
| `acPeriodConfirmed` | AC Period Confirmed? | Text input | Accounting period date |
| `schemeNameConfirmed` | Scheme Name Confirmed? | Text input | Confirmed scheme name |
| `nameAbbreviation` | Abbreviation Confirmed? | Select dropdown | Options: Scheme, Plan, Fund, Section |

### 10.3 Behaviour
- Each field card is clickable to open an inline editor
- Completed fields show a green check icon
- Pending fields show "Pending" text
- Counter shows "X/3" with green colour when all complete
- **When incomplete**: Planning tasks are shown blurred with a lock overlay message: "Complete preliminary information above to unlock tasks"

---

## 11. Notifications

### 11.1 Notification Panel
- Slides out as a panel (384px wide) adjacent to the sidebar
- Triggered by clicking the bell icon in the sidebar

### 11.2 Content
Shows tasks meeting either criterion:
- **Overdue**: Tasks past their due date (red header section)
- **Due within 7 days**: Tasks due in the next 7 days (blue header section)

Filtered by the current user's role — only shows tasks relevant to the logged-in user.

### 11.3 Each Notification
- Expandable to show: task description, due date
- "Go to scheme" button that navigates directly to the scheme

### 11.4 Badge Count
- Red badge on the sidebar bell icon showing the total notification count
- `useNotificationCount()` hook provides the count
- Not shown for Admin role

---

## 12. Team Management

### 12.1 Access
Available to **Manager** and **Admin** roles via the "Teams" sidebar link.

### 12.2 Team Cards (5 teams)
Each card shows:
- Team name (e.g., "Team Alpha")
- Team Lead name
- Active member count
- Preparer/reviewer count badges

### 12.3 Expanded Team View
- Team Lead highlighted with Crown icon and primary badge
- All members listed with role icons:
  - UserCircle icon for Preparer
  - Eye icon for Reviewer
- **Actions per member:**
  - Role change dropdown (Preparer ↔ Reviewer)
  - "Make Team Lead" button (Crown icon)
  - Activate/Deactivate toggle
- **Add Member** dialog: Name, Email, Role (Preparer/Reviewer) fields

---

## 13. Scheme Master List (Admin)

### 13.1 Access
**Admin role only**, via "Scheme Master" sidebar link.

### 13.2 List View
- Header: "Scheme Master List", "{N} schemes configured", "Add Scheme" button
- **Search** text input
- **3 Filter Dropdowns**: Type (DB/DC/Hybrid), Status (Active/Deactivated), Year End
- **Sortable Table** with columns:

| Column | Sortable |
|--------|----------|
| Scheme Name | ✓ |
| Registration No. | ✓ |
| Type | ✓ |
| Year End | ✓ |
| Client | ✓ |
| Status | ✓ |
| Contacts (button) | ✗ |
| Actions (edit/delete) | ✗ |

- Click column headers to sort ascending/descending (arrow indicators)
- **Pagination**: 25/50/100 per page, page navigation (first/prev/next/last)
- Results summary: "Showing X–Y of Z schemes"

### 13.3 Contact Management View
Accessed by clicking the "X contacts" button on a scheme row.
- Header: Scheme name, reg no, type, year end, abbreviation, client, status
- Contacts grouped by contact type with expandable/collapsible sections
- Each contact displays: individual name, company, email, appointed/ceased dates, status, designation/gender
- **Actions**: "Add Contact" per type, Edit/Delete per contact

### 13.4 Add/Edit Scheme Dialog
Grid form with fields:
- Scheme Name (text)
- Registration Number (text)
- Type (select: Defined Benefit, Defined Contribution, Hybrid)
- Year End Date (date)
- Abbreviation (text)
- Client Name (select)
- Status (select: Active, De-activated)

### 13.5 Contact Types
14 contact types with type-specific fields. See [Appendix C](#appendix-c-contact-types--fields).

---

## 14. Ad-hoc Tasks

### 14.1 Creation
- Opened from the "+ Ad-hoc Task" button in scheme detail header
- **Type dropdown**: "Audit queries received", "Consultant accounts comments received", "Trustee comments received", "Other"
- If "Other" is selected: custom title text input appears
- Description textarea
- Deadline date picker

### 14.2 Properties
- Type: `standard`
- Assigned to: Preparer
- Phase: Current active phase
- Displays "Ad-hoc" badge in accent colour

---

## 15. Workflow & Phase Transitions

### 15.1 Phase Computation
The scheme's `currentPhase` is **always computed from actual task statuses**, never stored independently.

**Algorithm:**
```
function computePhaseFromTasks(tasks, isAllocated):
  if not allocated → return 'not-started'
  for each phase in [planning, peer-review, audit-process, audit-sign-off]:
    if any task in this phase is not completed → return this phase
  return 'audit-sign-off'  // All done but not formally completed
```

### 15.2 Lifecycle
1. **Not Started** → Scheme exists but is unallocated
2. **Allocation** → Manager assigns preparer + reviewer. Sign-off due date is set. Phase becomes Planning.
3. **Planning** → Gated by Preliminary Checks. 6 tasks (5 email + 1 special draft accounts prep)
4. **Peer Review** → 4 tasks including Draft Accounts and peer review. Gated by audit kick-off date arrangement.
5. **Audit Process** → 6 reminder tasks tracking the audit lifecycle
6. **Audit Sign Off** → 3 final tasks
7. **Completed** → Explicit user action via confirmation button when all tasks are done

### 15.3 Audit Kick-Off Date
- Task 2 ("Arrange audit date") is an email task in Planning
- When completed, if the scheme has an audit start date set, tasks in Phases 2-4 have their due dates recomputed relative to this date
- If no audit start date is arranged, Phases 2-4 show: "Audit kick off date not arranged yet — Tasks will be generated once the audit kick-off date is confirmed in the Planning phase."

### 15.4 Date Calculations
| Task | Due Date Formula |
|------|-----------------|
| Tasks 1-2 | Year end − 1 month |
| Tasks 3-4 | Year end |
| Task 5 | Year end + 1 month |
| Task 6 (Draft) | Year end + 2 months |
| Task 7 | Audit start − 17 days |
| Task 8 | Audit start − 10 days |
| Task 9 | Audit start − 7 days |
| Task 10 | Audit start − 3 days |
| Tasks 11-12 | Audit start + 14/21 days |
| Task 13 | Audit start + 21 days |
| Task 14 | Audit start + 56 days |
| Tasks 15-16 | Audit start + 63 days |
| Task 17 | Audit start + 77 days |
| Task 18 | Audit start + 84 days |
| Task 19 | Year end + 7 months |

---

## 16. Audit Trail

### 16.1 Last Activity Recording
Every significant action records a `lastActivity` entry on the scheme:

| Action | Trail Text |
|--------|-----------|
| Scheme allocation | "Allocated to {Preparer} (Preparer) & {Reviewer} (Reviewer)" by senior manager |
| Task completion | "Marked '{task title}' as complete" or "Marked '{task title}' as incomplete" |
| Email sent | "Emails sent for '{task title}'" |
| Note added | "Note added to task" |
| Scheme completion | "Scheme accounts completed" |

### 16.2 Display
- Shown on scheme cards in the dashboard
- Shown in scheme detail header
- Format: Clock icon + "{user} · {action} · {date time}"

---

## Appendix A: 34-Question Questionnaire

The questionnaire covers pension scheme annual report preparation. Each question drives content in the generated draft accounts document.

| # | Title | Type | Options/Notes |
|---|-------|------|---------------|
| 1 | Should the documents refer to "Trustee" or "Trustees"? | Select | Trustee, Trustees |
| 2 | Should the documents refer to "Auditor" or "Auditors"? | Select | Auditor, Auditors |
| 3 | What is the scheme constitution? | Select | Defined Benefit, Defined Contribution, Hybrid |
| 4 | Is the Scheme going through a buy-in/buy-out? | Yes/No | 5 sub-questions when Yes |
| 5 | What date was the scheme established? | Date | — |
| 6 | Date of Trust Deed and Rules? | Text | — |
| 7 | Closed to new entrants? | Yes/No | — |
| 8 | Closed to future accrual? | Yes/No | — |
| 9 | Make up of the trustee board? | Select | Individuals, Corporate, Independent, Individuals and a corporate |
| 10 | How many trustee meetings in the year? | Text | — |
| 11 | Change to scheme constitution/rules? | Yes/No | — |
| 12 | Change to Transfer Values? | Yes/No | — |
| 13 | Change to GMP equalisation notes? | Yes/No | — |
| 14 | Only one Schedule of Contribution? | Yes/No | — |
| 15 | Contributions received per SoC? | Yes/No | — |
| 16 | Year-end contributions received per SoC? | Yes/No | — |
| 17 | Trustee signing section correct? | Yes/No | — |
| 18 | Figures rounded to? | Select | £, £'000, £m |
| 19 | Fund Account "Net additions/withdrawals"? | Select | 4 options |
| 20 | Fund Account "Net increase/decrease"? | Select | 4 options |
| 21 | Update to going concern paragraph? | Yes/No | — |
| 22 | Under which law is the Scheme established? | Select | English, Northern Ireland, Scottish |
| 23 | Accounting policies correct? | Yes/No | — |
| 24 | Annuity/insurance valuation policy? | Select | Scheme Actuary, Provider |
| 25 | Changes to judgements and estimates? | Yes/No | — |
| 26 | Update to deficit funding note? | Yes/No | — |
| 27 | Notes on net rents? | Yes/No | — |
| 28 | Transaction costs disclosed? | Yes/No | — |
| 29 | AVC investment type? | Select | None, Separate, Within, Both |
| 30 | Form of AVC investments? | Multi-select | With-profits, Unitised, Bank accounts, Other |
| 31 | AVC statements to year end? | Yes/No | — |
| 32 | Change to Related Party Transactions? | Yes/No | — |
| 33 | Subsequent events note needed? | Yes/No | — |
| 34 | Signed after 7 month deadline? | Yes/No | — |

---

## Appendix B: 18-Task Template

### Phase 1 — Planning (6 tasks)

| # | Title | Type | Assigned To | Due Date | Notes |
|---|-------|------|-------------|----------|-------|
| 1 | Send investment year end requests | Email | Preparer, Team Lead | YE − 1 month | Recipients: Investment Managers |
| 2 | Arrange audit date (audit kick off) | Email | Preparer | YE − 1 month | Recipients: Auditor. Sets audit start date. |
| 3 | Send consultant/client team questionnaire | Email | Preparer, Team Lead | Year end | Recipients: Client Team. Allows attachment. |
| 4 | Send admin team questionnaire | Email | Preparer, Team Lead | Year end | Recipients: Administrator |
| 5 | Send investment risk disclosure requests | Email | Preparer, Team Lead | YE + 1 month | Recipients: Investment Advisors |
| 6 | Draft Accounts | Draft-accounting-report | Preparer | YE + 2 months | Special task type. See Section 9. |

### Phase 2 — Peer Review (4 tasks)

| # | Title | Type | Assigned To | Due Date |
|---|-------|------|-------------|----------|
| 7 | Send draft accounts for peer review | Reminder | Preparer | Audit − 17 days |
| 8 | Peer review to be completed | Reminder | Peer Reviewer | Audit − 10 days |
| 9 | Team lead check-in on audit status | Reminder | Team Lead | Audit − 7 days |
| 10 | Audit pack to be shared | Reminder | Preparer | Audit − 3 days |

### Phase 3 — Audit Process (6 tasks)

| # | Title | Type | Assigned To | Due Date |
|---|-------|------|-------------|----------|
| 11 | Audit queries received from auditor | Reminder | Preparer | Audit + 14 days |
| 12 | Audit queries responded to | Reminder | Preparer | Audit + 21 days |
| 13 | Follow up on any audit queries | Reminder | Preparer, Team Lead | Audit + 21 days |
| 14 | Final audit queries and clearance | Reminder | Preparer | Audit + 56 days |
| 15 | Draft accounts to be sent to trustees | Reminder | Preparer | Audit + 63 days |
| 16 | Trustee comments received | Reminder | Preparer | Audit + 63 days |

### Phase 4 — Audit Sign Off (3 tasks)

| # | Title | Type | Assigned To | Due Date |
|---|-------|------|-------------|----------|
| 17 | Audit clearance due | Reminder | Preparer, Team Lead | Audit + 77 days |
| 18 | Final accounts to Trustee(s) for signing | Reminder | Preparer | Audit + 84 days |
| 19 | Accounts due to be signed | Reminder | Preparer, Team Lead | YE + 7 months |

---

## Appendix C: Contact Types & Fields

| Contact Type | Fields |
|-------------|--------|
| Trustee | Individual Name, Appointed Date, Ceased Date, Status (Retired/Ceased/Closed), Designation (MNT/CAT/Corporate Independent), Company, Address, Email |
| Secretary to the Trustee | Individual Name, Company, Email |
| Principal Employer | Individual Name, Company, Address, Email |
| Scheme Actuary | Individual Name, Appointed Date, Ceased Date, Gender (Male/Female), Company, Email |
| Actuarial Team | Individual Name, Company, Email |
| Administrator | Individual Name, Company, Address, Email |
| Client Team/Consultant | Individual Name, Company, Email |
| Auditor | Individual Name, Appointed Date, Ceased Date, Status, Company, Address, Email |
| Investment Managers | Appointed Date, Ceased Date, Status, Company, Email |
| AVC Providers | Company, Email |
| Insurance Companies | Company, Email |
| Investment Advisors | Individual Name, Company, Email |
| Legal Advisers | Individual Name, Company, Email |
| Banks | Appointed Date, Ceased Date, Status, Company |

---

## Appendix D: Design Tokens

### Colour System (HSL)
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--primary` | 220 80% 42% | Primary blue — Planning phase, links, buttons |
| `--phase-peer-review` | 280 65% 50% | Purple — Peer Review phase |
| `--phase-audit` | 35 95% 48% | Orange — Audit Process phase |
| `--phase-sign-off` | 200 60% 42% | Teal — Audit Sign Off phase |
| `--task-complete` | 160 70% 34% | Green — Completed tasks/phases |
| `--destructive` | 0 82% 46% | Red — Overdue, errors, warnings |
| `--task-reminder` | 45 100% 48% | Amber — Reminder tasks |
| `--accent` | 160 70% 34% | Green — Success states |
| `--sidebar-background` | 220 35% 10% | Dark navy — Sidebar background |

### Typography
- **Font Family**: DM Sans (Google Fonts)
- **Monospace**: JetBrains Mono (for code/data)

---

*End of Document*
