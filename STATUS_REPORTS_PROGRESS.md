# Status Reports Feature - Implementation Progress

## ✅ COMPLETED (Phase 1)

### Database Migration
- **File Created**: `server/migrations/002_create_report_tables.sql`
- **Tables**:
  1. ✅ `augusto_report_configs` - Per-project report settings
  2. ✅ `augusto_report_external_recipients` - External email recipients per project
  3. ✅ `augusto_report_internal_recipients` - Internal team member recipients
  4. ✅ `augusto_reports` - Generated reports with PM narrative
  5. ✅ `augusto_quickbooks_invoices` - Synced QB invoice data
  6. ✅ `augusto_harvest_time_entries` - Synced time tracking data

**Next Action**: Run migration: `node server/run-migration.js server/migrations/002_create_report_tables.sql`

---

## 🔄 IN PROGRESS (Phase 2)

### Backend API Routes
Need to create two route files following the existing pattern (`module.exports = (db) => { ... return router; }`):

####  File 1: `server/routes/reports.js`
**Status**: Needs to be created properly

**Endpoints to implement** (23 total):
```javascript
// Report Configuration (3)
GET    /api/projects/:code/report-config
POST   /api/projects/:code/report-config
DELETE /api/projects/:code/report-config

// Recipients (6)
GET    /api/projects/:code/report-recipients
POST   /api/projects/:code/report-recipients/external
DELETE /api/projects/:code/report-recipients/external/:id
POST   /api/projects/:code/report-recipients/internal
DELETE /api/projects/:code/report-recipients/internal/:id

// Report Management (9)
GET    /api/projects/:code/reports
POST   /api/projects/:code/reports/generate
GET    /api/reports/:id
GET    /api/reports/:id/preview
GET    /api/reports/:id/pdf
PUT    /api/reports/:id/narrative
PUT    /api/reports/:id/approve
POST   /api/reports/:id/send
DELETE /api/reports/:id
GET    /api/reports/pending-review

// Data (2)
GET    /api/projects/:code/invoices
GET    /api/projects/:code/time-entries
```

#### File 2: `server/routes/webhooks.js`
**Status**: Needs to be created

**Endpoints** (3 webhooks):
```javascript
POST /api/webhooks/n8n/invoices          // Sync QB invoices
POST /api/webhooks/n8n/time-entries      // Sync Harvest time
GET  /api/webhooks/n8n/scheduled-reports // List projects needing reports today
POST /api/webhooks/n8n/report-sent       // Mark report as sent
```

#### File 3: Update `server/index.js`
Add after line 106:
```javascript
const reportRoutes = require('./routes/reports')(db);
const webhookRoutes = require('./routes/webhooks')(db);
app.use('/api', reportRoutes);
app.use('/api/webhooks', webhookRoutes);
```

---

## ⏳ PENDING

### Phase 3: Report Services
Create:
- `server/services/reportGenerator.js` - Calculate budget, spending, etc.
- `server/services/pdfGenerator.js` - Generate PDF from HTML template
- `server/templates/reportTemplate.html` - PDF template

### Phase 4: Frontend Components
Create:
- `client/src/components/ReportReview.tsx`
- `client/src/components/ReportPreview.tsx`
- `client/src/api/reports.ts`
- `client/src/types/reports.ts`

Update:
- `client/src/components/Projects.tsx` - Add Reports tab
- `client/src/App.tsx` - Add routes
- `client/src/components/Header.tsx` - Add navigation

### Phase 5-9: PDF, n8n, Email, Permissions, UI Polish

---

## 📝 Key Decisions

1. **Recipients**:
   - Internal recipients reference `augusto_team_members`
   - External recipients stored per project
   - Report PM stored in `augusto_project_data`

2. **Scheduling**:
   - n8n handles cron scheduling
   - Standard times: Tuesday 10 AM (weekly/bi-weekly), day after first Monday (monthly)

3. **PDF**: Use Puppeteer for HTML → PDF

4. **Email**: SendGrid recommended, configured in n8n

---

## 🚀 To Resume

Simply say: "Continue implementing status reports - create the route files for Phase 2"

The database schema is complete and ready. Next step is to create the two route files (`reports.js` and `webhooks.js`) and register them in `server/index.js`.
