/**
 * Email draft templates for planning phase tasks.
 * Variables in {braces} are replaced with scheme-specific values.
 */

export function getInvestmentManagerEmailTemplate(schemeName: string, yearEnd: string, replyDeadline: string): string {
  return `Dear Sir/Madam,

Investment manager

We are currently preparing the Trustee's Report and Financial Statements for the ${schemeName} for the year ended ${yearEnd} and would be grateful if you could provide us with the following information when it is available.

1. A copy of the valuation statement as at ${yearEnd} (based on bid price),
2. A list of transactions during the year ended ${yearEnd},
3. Allocation of a category in the fair value hierarchy to each investment held, based on the fair value hierarchy under the International Financial Reporting Standards (Levels 1, 2 and 3), as at ${yearEnd} along with an explanation setting out how the basis of the categorisation for each type,
4. Allocation of a category of asset class at ${yearEnd} split by equities, bonds, LDI, etc,
5. Identification of the legal nature of pooled investment vehicles held at ${yearEnd} between for example; Unit Linked Life Insurance Contracts, Authorised Unit Trusts, Open Ended Investment Companies and Shares of Limited Liability Partnerships,
6. Details of any self-investment or employer related investments held at ${yearEnd},
7. Details of the appointed custodian(s) and
8. Basis of investment managers fees and copies of any invoices issued in respect of the year ended ${yearEnd} (including invoices due but paid after that date).

I look forward to receiving your reply by ${replyDeadline} but if you are unable to meet this deadline, please confirm when the information will be available.

Kind regards`;
}

export function getAdminTeamEmailTemplate(schemeName: string, yearEnd: string, replyDeadline: string): string {
  return `Dear Sir/Madam,

Admin Team

To assist with the preparation of the accounts for the ${schemeName} for the year ended ${yearEnd}, I would be grateful if you could provide the following information:

Contribution schedules – Please provide copies of any monthly contribution schedules received from the client (or link to where they are saved on the system)?
NOTE TO PFA: Only request if there are any based on your check of contributions received and previous year's request or if you cannot obtain yourself.

Pension increases exercises – Please provide copies/system links to the final pension increases calculation spreadsheets applicable for the year which include the rates of pension increases across each tranche, effective dates of the increases and the pension amounts pre and post increase.

Pension increases note – Could you please update the following note extracted from the previous year's signed accounts for the year end _________ regarding pension increases.
NOTE TO PFA: only request if pension increases rates are included in the note. Copy and paste last year's note here!

Pensioner existence checks – Please advise whether any pensioner existence checks have been performed during the year or are expected to take place post year end, with details of where the results are filed.

Can I please have a response by ${replyDeadline}? If this is not achievable, please can you advise an alternative response date?

Kind regards`;
}

export function getClientTeamEmailTemplate(schemeName: string, yearEnd: string, yearStart: string): string {
  return `Dear Sir/Madam,

Request to client team to assist with the preparation of the Trustee Annual Report and Accounts

Scheme: ${schemeName}
Year end: ${yearEnd}
Completed by (name and position): Actuary/Client team
Date completed: __/__/____

We are currently gathering information for the preparation of the accounts for the year ended ${yearEnd} and would be grateful if you could complete responses to the points listed below by ${yearEnd}.

Please note that the queries below cover the period from ${yearStart} (the start of the accounting period) to date. Also please advise any future information that you may be aware of up to the date of signing.

Please find attached the Client Questionnaire document for your completion.

Kind regards`;
}

export function getInvestmentRiskEmailTemplate(schemeName: string, yearEnd: string, replyDeadline: string): string {
  return `Dear Sir/Madam,

Investment risk disclosure & implementation statement

We are currently preparing the Trustee's Report and Financial Statements for the ${schemeName} for the year ended ${yearEnd}.

As part of the preparation, we require the following:

1. Investment risk disclosures – Please provide details of any investment risks applicable to the scheme's investments, including credit risk, market risk, and currency risk exposures as at ${yearEnd}.

2. Implementation statement – Please provide the implementation statement covering the scheme's Statement of Investment Principles for the year ended ${yearEnd}, including details of how investment policies have been followed during the year.

I look forward to receiving your reply by ${replyDeadline}. If you are unable to meet this deadline, please confirm when the information will be available.

Kind regards`;
}

export function getAuditArrangementEmailTemplate(schemeName: string, yearEnd: string): string {
  return `Dear Sir/Madam,

We are writing to arrange the audit for the ${schemeName} for the year ended ${yearEnd}.

Could you please confirm your availability for the audit and provide proposed dates? We would also be grateful if you could confirm the audit fee for the current year.

Please let us know if you require any preliminary information in advance of the audit.

Kind regards`;
}


export function getFollowUpEmailTemplate(schemeName: string, originalSubject: string): string {
  return `Dear Sir/Madam,

I am writing to follow up on our previous correspondence regarding the ${schemeName}.

We sent our initial request on the above matter and have not yet received a response. We would be grateful if you could provide the requested information at your earliest convenience.

If you have already responded, please disregard this message. If you require any clarification on what was requested, please do not hesitate to contact us.

Kind regards`;
}