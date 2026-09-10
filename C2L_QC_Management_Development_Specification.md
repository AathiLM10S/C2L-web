# C2L QC Management Application — Development Specification

> Version: 1.0  
> Date: 2026-09-09  
> Status: Initial development baseline

## 1. Business Overview

The C2L process manages batches of work performed by employees. The
current process is maintained primarily through Excel.

The core lifecycle is:

``` text
C2L Log
  ↓
Employee completes batch
  ↓
C2L Audit
  ↓
┌─────────────────────┐
│ Audit Passed?       │
├──────────┬──────────┤
│ No       │ Yes      │
↓          ↓
QC Issue   C2L Batch Status
↓          ↓
Correction Fully Completed
↓          ↓
Re-Audit   Client Report
```

The application will centralize this workflow in PostgreSQL and expose
it through a web application for employees/QC users, Leads, Managers, BU
Heads and Admin users according to their permissions.

------------------------------------------------------------------------

## 2. Current Business Data

### C2L Log

The C2L Log is the employee work/production record.

Current fields include:

- Sl. No.
- Assigned To
- Batch No.
- Batch Type
- Location
- Type of Work
- Start Date
- End Date
- Total Hours
- Status
- QC Status
- QC By
- Remarks

The final database mapping must be validated against the actual CSV
before production migration.

### C2L Audit

When employee work is completed, the batch becomes eligible for audit.

The audit records:

- Batch
- Auditor
- Audit date
- Audit result
- Audit remarks
- Re-audit history where required

A batch can have multiple audit attempts. Audit history must not be
overwritten.

### C2L Batch Status

A batch is fully completed when:

``` text
Work Status = COMPLETED
AND
Audit Status = PASSED
```

This state makes the batch eligible for client reporting.

A separate `c2l_batch_status` table is not required initially; the final
state can be derived from the batch and audit data.

### QC Issue Log

The QC Issue Log permanently records issues found during audit.

Required business fields:

| Field         | Purpose                        |
|---------------|--------------------------------|
| Sl. No.       | Display sequence               |
| Batch         | Affected batch                 |
| Batch Owner   | Employee responsible for batch |
| QC Date       | Date issue was identified      |
| QC Checked By | Person who identified issue    |
| Issue Type    | CAD, Assessment, PDF, etc.     |
| Remark        | Issue description              |
| Proof         | Screenshot/evidence            |
| Status        | Current issue state            |

A resolved issue should remain in the historical log.

### C2L Scenario Log

The Scenario Log is reusable workflow/reference knowledge, not a
batch-specific issue table.

Required fields:

| Field               | Purpose                      |
|---------------------|------------------------------|
| Sl. No.             | Display sequence             |
| Scenario            | Workflow/work scenario       |
| Remark              | Latest clarification         |
| Scenario Updated By | Person who updated scenario  |
| Updated Date        | Date of update               |
| Individual / Team   | Scope of the scenario        |
| Last Snip           | Latest supporting screenshot |

------------------------------------------------------------------------

## 3. Business Pain Points

1.  Multiple Excel sheets are used to manage related stages of the same
    batch.
2.  Leads and BU Heads do not have one centralized view.
3.  Date-range reporting is manual.
4.  QC remarks may be removed from the operational sheet after
    resolution, causing loss of historical evidence.
5.  Screenshots/snips are difficult to manage consistently inside Excel.
6.  The same batch lifecycle is spread across C2L Log, Audit, Batch
    Status and QC records.
7.  Client-ready batches need to be identified reliably without manual
    consolidation.
8.  Managers need quick visibility into work progress, audit results and
    QC issues.

------------------------------------------------------------------------

## 4. Proposed Solution

Build a C2L QC Management Application with:

- Central PostgreSQL database.
- Next.js web frontend.
- FastAPI backend.
- CSV import for the initial migration.
- Date-range filtering.
- C2L work tracking.
- Audit tracking and audit history.
- Permanent QC issue records.
- QC proof/evidence links.
- C2L Scenario reference route.
- Completed/client-ready batch view.
- On-demand reports from existing database data.
- Role-based access.
- Future SharePoint synchronization through Microsoft Graph.

------------------------------------------------------------------------

## 5. Core Database Design

The initial database contains five core tables:

``` text
users
c2l_batches
c2l_audits
qc_issues
c2l_scenarios
```

There is intentionally no:

``` text
reports
import_history
c2l_batch_status
```

table in the initial design.

Reports are generated from existing business data. CSV import is an
initial data-loading mechanism, not a business entity.

------------------------------------------------------------------------

## 6. Table: users

Purpose: application users and roles.

| Column     | Type         | Constraints      | Purpose            |
|------------|--------------|------------------|--------------------|
| id         | BIGSERIAL    | PK               | Internal user ID   |
| name       | VARCHAR(150) | NOT NULL         | Display name       |
| email      | VARCHAR(255) | UNIQUE, NOT NULL | User identity      |
| role       | VARCHAR(50)  | NOT NULL         | Application role   |
| is_active  | BOOLEAN      | DEFAULT TRUE     | Active/inactive    |
| created_at | TIMESTAMP    | DEFAULT NOW()    | Creation timestamp |
| updated_at | TIMESTAMP    | DEFAULT NOW()    | Update timestamp   |

Potential roles:

``` text
EMPLOYEE
QC
LEAD
MANAGER
BU_HEAD
ADMIN
```

Final permissions must be confirmed with the business owner.

------------------------------------------------------------------------

## 7. Table: c2l_batches

Purpose: central entity representing a C2L batch and its current work
state.

| Column          | Type          | Constraints   | Purpose                    |
|-----------------|---------------|---------------|----------------------------|
| id              | BIGSERIAL     | PK            | Internal batch record ID   |
| batch_no        | VARCHAR(50)   | NOT NULL      | Business batch number      |
| batch_type      | VARCHAR(50)   | NULL          | 7-Digit / 10-Digit etc.    |
| location        | VARCHAR(150)  | NULL          | Location                   |
| work_type       | VARCHAR(100)  | NULL          | Type of work               |
| assigned_to_id  | BIGINT        | FK users.id   | Assigned employee          |
| start_date      | DATE          | NULL          | Work start                 |
| end_date        | DATE          | NULL          | Work end                   |
| total_hours     | NUMERIC(10,2) | NULL          | Total hours                |
| work_status     | VARCHAR(50)   | NOT NULL      | Current work state         |
| audit_status    | VARCHAR(50)   | NOT NULL      | Current audit state        |
| current_remarks | TEXT          | NULL          | Current operational remark |
| created_at      | TIMESTAMP     | DEFAULT NOW() | Creation timestamp         |
| updated_at      | TIMESTAMP     | DEFAULT NOW() | Update timestamp           |

Important: `batch_no` should not automatically be the PostgreSQL primary
key. The correct business uniqueness rule must be confirmed from the
actual CSV.

------------------------------------------------------------------------

## 8. Table: c2l_audits

Purpose: maintain audit history.

| Column        | Type        | Constraints       | Purpose            |
|---------------|-------------|-------------------|--------------------|
| id            | BIGSERIAL   | PK                | Audit ID           |
| batch_id      | BIGINT      | FK c2l_batches.id | Audited batch      |
| audited_by_id | BIGINT      | FK users.id       | Auditor            |
| audit_date    | DATE        | NOT NULL          | Audit date         |
| audit_result  | VARCHAR(50) | NOT NULL          | PASS / FAIL / etc. |
| remarks       | TEXT        | NULL              | Audit remarks      |
| created_at    | TIMESTAMP   | DEFAULT NOW()     | Creation timestamp |

Relationship:

``` text
c2l_batches 1 ─── N c2l_audits
```

Example:

``` text
Batch 38
  ├── Audit #1 → FAIL
  └── Audit #2 → PASS
```

------------------------------------------------------------------------

## 9. Table: qc_issues

Purpose: issues identified during audits.

| Column           | Type         | Constraints       | Purpose                  |
|------------------|--------------|-------------------|--------------------------|
| id               | BIGSERIAL    | PK                | Internal issue ID        |
| batch_id         | BIGINT       | FK c2l_batches.id | Affected batch           |
| audit_id         | BIGINT       | FK c2l_audits.id  | Audit that found issue   |
| issue_type       | VARCHAR(100) | NOT NULL          | Issue category           |
| remark           | TEXT         | NOT NULL          | Issue description        |
| proof_url        | TEXT         | NULL              | Evidence/snippet URL     |
| qc_checked_by_id | BIGINT       | FK users.id       | Person identifying issue |
| qc_date          | DATE         | NOT NULL          | Issue date               |
| status           | VARCHAR(50)  | NOT NULL          | Open/Resolved/etc.       |
| created_at       | TIMESTAMP    | DEFAULT NOW()     | Creation timestamp       |
| updated_at       | TIMESTAMP    | DEFAULT NOW()     | Update timestamp         |

Relationships:

``` text
c2l_batches 1 ─── N qc_issues
c2l_audits  1 ─── N qc_issues
```

`audit_id` identifies the specific audit attempt in which an issue was
found.

------------------------------------------------------------------------

## 10. Table: c2l_scenarios

Purpose: reusable C2L workflow and scenario reference.

| Column             | Type        | Constraints   | Purpose              |
|--------------------|-------------|---------------|----------------------|
| id                 | BIGSERIAL   | PK            | Internal scenario ID |
| scenario           | TEXT        | NOT NULL      | Scenario             |
| remark             | TEXT        | NULL          | Latest clarification |
| updated_by_id      | BIGINT      | FK users.id   | Person who updated   |
| updated_date       | DATE        | NOT NULL      | Update date          |
| individual_or_team | VARCHAR(50) | NULL          | Individual / Team    |
| last_snip_url      | TEXT        | NULL          | Latest screenshot    |
| created_at         | TIMESTAMP   | DEFAULT NOW() | Creation timestamp   |
| updated_at         | TIMESTAMP   | DEFAULT NOW() | Update timestamp     |

The Scenario Log is separate from QC Issues because scenarios are
reusable knowledge rather than batch-specific transactions.

------------------------------------------------------------------------

## 11. Database Relationships

``` text
                         users
                    /       |                          /        |                          ↓         ↓         ↓
          c2l_batches   c2l_audits   c2l_scenarios
                │
                │
                └──────────┐
                           ↓
                       qc_issues
```

More specifically:

``` text
users
  ├── assigned_to ───────→ c2l_batches
  ├── audited_by ────────→ c2l_audits
  ├── qc_checked_by ─────→ qc_issues
  └── updated_by ────────→ c2l_scenarios

c2l_batches
  ├── 1:N → c2l_audits
  └── 1:N → qc_issues

c2l_audits
  └── 1:N → qc_issues
```

------------------------------------------------------------------------

## 12. Status Model

### Work Status

Initial candidate values:

``` text
IN_PROGRESS
COMPLETED
ON_HOLD
CANCELLED
```

### Audit Status

Initial candidate values:

``` text
PENDING
IN_PROGRESS
FAILED
RE_AUDIT
PASSED
```

### Client-ready logic

``` text
work_status = COMPLETED
AND
audit_status = PASSED
        ↓
CLIENT_READY
```

The exact business statuses must be mapped from the existing Excel
values before production use.

------------------------------------------------------------------------

## 13. QC Issue Lifecycle

``` text
Issue Found
    ↓
QC Issue Created
    ↓
OPEN
    ↓
Correction
    ↓
RESOLVED
    ↓
Re-Audit if required
```

Historical QC issue records should not be deleted when resolved.

------------------------------------------------------------------------

## 14. CSV Import — Phase 1

The first implementation uses the existing CSV.

``` text
CSV
 ↓
FastAPI Upload API
 ↓
CSV Import Service
 ↓
Validate
 ↓
Transform / Normalize
 ↓
PostgreSQL
```

Example endpoint:

``` http
POST /api/import/c2l
Content-Type: multipart/form-data
```

Example response:

``` json
{
  "total_rows": 100,
  "inserted": 95,
  "updated": 5,
  "failed": 0
}
```

The importer should validate:

- Required columns
- Dates
- Numeric values
- Status values
- Blank/null values
- Duplicate/business-key behavior
- Employee/user mapping

The exact duplicate rule must be confirmed from the real CSV.

------------------------------------------------------------------------

## 15. Initial CSV Mapping

Expected mapping:

| CSV Column   | PostgreSQL Field                 | Type      |
|--------------|----------------------------------|-----------|
| Sl No.       | Display/import value if required | INTEGER   |
| Assigned To  | assigned_to_id                   | BIGINT FK |
| Batch No     | batch_no                         | VARCHAR   |
| Batch Type   | batch_type                       | VARCHAR   |
| Location     | location                         | VARCHAR   |
| Type of Work | work_type                        | VARCHAR   |
| Start Date   | start_date                       | DATE      |
| End Date     | end_date                         | DATE      |
| Total Hours  | total_hours                      | NUMERIC   |
| Status       | work_status                      | VARCHAR   |
| QC Status    | audit_status                     | VARCHAR   |
| QC By        | audited_by/user reference        | BIGINT FK |
| Remarks      | current_remarks                  | TEXT      |

This mapping is provisional and must be validated against the actual
CSV.

------------------------------------------------------------------------

## 16. API Design

Initial API groups:

``` text
/api/import/c2l

/api/c2l/batches
/api/c2l/batches/{id}

/api/c2l/audits
/api/c2l/audits/{id}

/api/qc/issues
/api/qc/issues/{id}

/api/c2l/scenarios
/api/c2l/scenarios/{id}

/api/dashboard

/api/reports
```

Date filtering example:

``` http
GET /api/c2l/batches?start_date=2026-09-01&end_date=2026-09-09
```

QC issue filtering example:

``` http
GET /api/qc/issues?start_date=2026-09-01&end_date=2026-09-09
```

------------------------------------------------------------------------

## 17. Frontend Routes

Recommended Next.js routes:

``` text
/dashboard

/c2l/log
/c2l/audit
/c2l/completed

/qc/issues

/c2l-scenarios

/reports
```

### Dashboard

For Leads, Managers and BU Heads.

Possible metrics:

- Total batches
- In progress
- Work completed
- Pending audit
- Audit failed
- Audit passed
- Open QC issues
- Resolved QC issues
- Client-ready batches

### C2L Log

Employee work records.

### C2L Audit

Pending, completed, failed and re-audit records.

### QC Issues

Permanent QC issue history with filters.

### C2L Scenarios

Reusable workflow/scenario reference.

### Completed Batches

Batches where work and audit are complete.

### Reports

Date-range based report generation.

------------------------------------------------------------------------

## 18. Reporting

No separate report table is required.

Reports are generated from existing PostgreSQL data.

``` text
Manager/Admin
    ↓
Start Date + End Date
    ↓
FastAPI
    ↓
PostgreSQL
    ├── c2l_batches
    ├── c2l_audits
    └── qc_issues
    ↓
Report Generator
    ↓
Excel / CSV / PDF
```

Potential report filters:

- Start date
- End date
- Employee
- Batch
- Batch type
- Work status
- Audit status
- Issue type

The exact report columns should be confirmed with the business team.

------------------------------------------------------------------------

## 19. SharePoint — Future Phase

SharePoint is not required for the first version.

### Current Phase

``` text
CSV
 ↓
FastAPI
 ↓
PostgreSQL
```

### Future Phase

``` text
SharePoint
 ↓
Microsoft Graph
 ↓
FastAPI
 ↓
PostgreSQL
```

The database should remain independent of the source system.

This allows the application to transition from CSV to SharePoint without
redesigning the business model.

------------------------------------------------------------------------

## 20. Microsoft Authentication

The application should use Microsoft Entra ID / OpenID Connect rather
than storing Teams passwords.

Conceptually:

``` text
User
 ↓
Microsoft Entra ID
 ↓
Next.js / BFF
 ↓
FastAPI
```

For SharePoint:

``` text
FastAPI
 ↓
Microsoft Graph
 ↓
SharePoint
```

Microsoft Graph permissions should follow least privilege and must be
approved according to organizational policy.

------------------------------------------------------------------------

## 21. Evidence / Snip Strategy

Avoid storing large screenshot binaries directly in PostgreSQL
initially.

Preferred production flow:

``` text
Screenshot
   ↓
SharePoint Evidence Folder
   ↓
Shareable/authorized URL
   ↓
qc_issues.proof_url
```

For scenarios:

``` text
c2l_scenarios.last_snip_url
```

The application displays:

``` text
[ View Snip ]
```

Suggested naming:

``` text
QC_Batch38_CAD_Error_2026-09-09.png
QC_Batch53_Assessment_2026-09-09.png
QC_Batch55_PDF_2026-09-09.png
```

------------------------------------------------------------------------

## 22. Security

The application should provide:

- Microsoft identity authentication.
- Role-based authorization.
- Backend authorization checks.
- No database credentials in frontend code.
- No direct browser-to-PostgreSQL access.
- No Teams password storage.
- Restricted SharePoint access.
- CSV input validation.
- Parameterized database access through SQLAlchemy.
- Secure handling of evidence links.
- Appropriate audit/history preservation.

------------------------------------------------------------------------

## 23. Suggested FastAPI Structure

``` text
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── c2l_batches.py
│   │   ├── c2l_audits.py
│   │   ├── qc_issues.py
│   │   ├── c2l_scenarios.py
│   │   ├── imports.py
│   │   ├── dashboard.py
│   │   └── reports.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── c2l_batch.py
│   │   ├── c2l_audit.py
│   │   ├── qc_issue.py
│   │   └── c2l_scenario.py
│   │
│   ├── schemas/
│   ├── services/
│   │   ├── c2l_service.py
│   │   ├── audit_service.py
│   │   ├── qc_service.py
│   │   ├── scenario_service.py
│   │   ├── csv_import_service.py
│   │   ├── report_service.py
│   │   └── sharepoint_service.py
│   │
│   ├── db/
│   │   ├── database.py
│   │   └── migrations/
│   │
│   └── core/
│       ├── config.py
│       ├── security.py
│       └── permissions.py
│
├── tests/
├── alembic.ini
└── requirements.txt
```

------------------------------------------------------------------------

## 24. Suggested Next.js Structure

``` text
frontend/
├── app/
│   ├── dashboard/
│   ├── c2l/
│   │   ├── log/
│   │   ├── audit/
│   │   └── completed/
│   ├── qc/
│   │   └── issues/
│   ├── c2l-scenarios/
│   └── reports/
│
├── components/
│   ├── dashboard/
│   ├── c2l/
│   ├── audit/
│   ├── qc/
│   ├── scenarios/
│   └── common/
│
├── lib/
│   ├── api/
│   ├── auth/
│   └── utils/
│
├── types/
└── middleware.ts
```

------------------------------------------------------------------------

## 25. Development Milestones

### Milestone 1 — Database

- PostgreSQL setup
- Alembic migrations
- users
- c2l_batches
- c2l_audits
- qc_issues
- c2l_scenarios

### Milestone 2 — CSV Import

- CSV upload
- Header validation
- Data validation
- Transformation
- Insert/update logic
- Import error reporting

### Milestone 3 — Backend APIs

- Batch APIs
- Audit APIs
- QC issue APIs
- Scenario APIs
- Date filtering
- Pagination
- Swagger verification

### Milestone 4 — Basic Frontend

- C2L Log
- C2L Audit
- QC Issues
- C2L Scenarios

### Milestone 5 — Dashboard

- Date range
- KPI cards
- Completion metrics
- Audit metrics
- QC issue metrics

### Milestone 6 — Reports

- Date selection
- Report query
- Excel/CSV/PDF generation
- Download

### Milestone 7 — Authentication

- Microsoft login
- Roles
- Permissions

### Milestone 8 — SharePoint

- Microsoft Graph
- SharePoint data access
- Evidence links
- Synchronization

------------------------------------------------------------------------

## 26. Immediate Development Plan

The first development sprint should focus only on data foundation:

``` text
1. Obtain actual C2L CSV
        ↓
2. Inspect headers and real values
        ↓
3. Identify null/blank values
        ↓
4. Identify duplicate/business-key behavior
        ↓
5. Identify all status values
        ↓
6. Finalize column mapping
        ↓
7. Create PostgreSQL migration
        ↓
8. Create SQLAlchemy models
        ↓
9. Build CSV import service
        ↓
10. Create POST /api/import/c2l
        ↓
11. Verify PostgreSQL records
        ↓
12. Create GET /api/c2l/batches
        ↓
13. Test through Swagger
```

------------------------------------------------------------------------

## 27. Important Business Rules to Confirm

Before production, confirm:

1.  What uniquely identifies a batch?
2.  Can the same batch number appear more than once?
3.  Can one batch have multiple employees?
4.  Can a batch have multiple audit attempts?
5.  Can one audit have multiple QC issues?
6.  What are all possible work statuses?
7.  What are all possible audit/QC statuses?
8.  Which date controls dashboard/report filtering?
9.  What exactly qualifies a batch as client-ready?
10. Who can create/update QC issues?
11. Who can update C2L scenarios?
12. Who can download client reports?
13. Which evidence location should be used?
14. What SharePoint permissions will be approved?

------------------------------------------------------------------------

## 28. Final Target Architecture

``` text
                     Microsoft 365
                          |
                     SharePoint
                          |
                   Microsoft Graph
                          |
                          v
+------------------------------------------------+
|                    FastAPI                     |
|                                                |
| C2L Service                                    |
| Audit Service                                  |
| QC Issue Service                               |
| Scenario Service                               |
| CSV Import Service                             |
| Report Service                                 |
| SharePoint Integration                         |
+-------------------------+----------------------+
                          |
                          v
+------------------------------------------------+
|                  PostgreSQL                    |
|                                                |
| users                                          |
| c2l_batches                                    |
| c2l_audits                                     |
| qc_issues                                      |
| c2l_scenarios                                  |
+-------------------------+----------------------+
                          |
                          v
+------------------------------------------------+
|                    Next.js                     |
|                                                |
| Dashboard                                      |
| C2L Log                                        |
| C2L Audit                                      |
| QC Issues                                      |
| C2L Scenarios                                  |
| Completed Batches                              |
| Reports                                        |
+------------------------------------------------+
```

## 29. Business Outcome

The target result is:

``` text
Employee Work
     ↓
Centralized C2L Tracking
     ↓
Controlled Audit
     ↓
Permanent QC Issue Evidence
     ↓
Validated Completed Batches
     ↓
Lead / Manager / BU Head Visibility
     ↓
Client-Ready Reporting
```

The first technical deliverable is therefore:

``` text
Actual C2L CSV
    ↓
Final PostgreSQL Schema
    ↓
FastAPI CSV Import API
    ↓
Correct PostgreSQL Data
    ↓
Swagger Verification
```

Do not finalize the production schema until the actual CSV has been
inspected for real column values, nulls, duplicates, status variations,
and batch identity rules.
