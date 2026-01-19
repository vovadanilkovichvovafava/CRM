# Enterprise CRM + Project Management System
## Technical Specification for Claude Code

---

## 🎯 PROJECT OVERVIEW

Build a modern, AI-native CRM with integrated Project Management that combines:
- **Attio's flexibility** (custom objects, modern UX, real-time collaboration)
- **Salesforce's power** (lead scoring, forecasting, advanced analytics)
- **ClickUp's PM features** (projects, tasks, multiple views, time tracking)
- **Traffic Arbitrage specialization** (Keitaro integration, webmaster scoring, offer management)

**Reference Architecture:** Use mini-zapier codebase as architectural foundation

---

## 📋 DEVELOPMENT PHILOSOPHY (CRITICAL)

### Code Quality Requirements (from CLAUDE.md)

```
✅ Think in Russian, but write code comments in English
✅ Make commits before/after each stage
✅ Verify code with linter and build checks
✅ Strict modular architecture - separate logic across files
✅ Maximum 700 lines per file
✅ Study SPEC and follow requirements exactly
✅ Use MCP for up-to-date library patterns
✅ NO shortcuts - only proper solutions
✅ Better slow with verification than fast and poor quality
✅ TypeScript strict mode
✅ Comprehensive error handling
✅ Unit tests for core functionality
✅ This project quality is CRITICAL - take time to do it right
```

---

## 🏗 TECH STACK

### Backend
```typescript
Core:
- NestJS 11 (framework)
- Prisma 7 (ORM with PostgreSQL)
- PostgreSQL 16 (primary database)
- Redis 7 (caching + job queue)
- BullMQ 5 (background jobs)

New Components:
- Socket.io (real-time collaboration)
- ElasticSearch 8 (advanced search - optional for later)

AI/ML:
- OpenAI API (GPT-4 for enrichment)
- Anthropic Claude API (for analysis)

Integrations:
- Supabase Auth (authentication)
- Resend (transactional emails)
- Telegram Bot API
- Gmail API (email sync)
- Apollo.io API (data enrichment)
- Hunter.io API (email verification)
- Keitaro API (traffic tracking)
```

### Frontend
```typescript
Core:
- Next.js 16 (App Router)
- React 19
- TypeScript 5.7
- Tailwind CSS 4

UI Libraries:
- shadcn/ui (component library)
- TanStack Table (tables)
- TanStack Query (data fetching)
- React Flow (relationship graphs)
- React DnD (drag & drop)
- Recharts (analytics)
- Tiptap (rich text editor)
- Cmdk (command palette)
- FullCalendar (calendar view)
- Zustand (state management)

Real-time:
- Socket.io client
- Optimistic updates
```

### Infrastructure
```
- Docker & Docker Compose
- Nginx (reverse proxy)
- MinIO (S3-compatible file storage)
```

---

## 📊 DATABASE SCHEMA (Prisma)

### Complete Schema File

```prisma
// This is your Prisma schema file
// Reference: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// FLEXIBLE DATA MODEL (Attio-style)
// ============================================================================

// Meta-model: Define custom objects dynamically
model Object {
  id          String   @id @default(cuid())
  name        String   @unique // "contacts", "companies", "webmasters"
  displayName String   // "Contacts", "Companies", "Webmasters"
  type        ObjectType @default(CUSTOM)
  icon        String?  // Emoji or icon name
  color       String?  // Hex color for UI
  schema      Json     // Field definitions
  settings    Json     @default("{}") // View settings, permissions
  position    Int      @default(0) // Order in sidebar
  isArchived  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  fields      Field[]
  records     Record[]
  views       View[]
  workflows   Workflow[]

  @@index([type])
}

enum ObjectType {
  SYSTEM  // Pre-configured (Contacts, Companies, Deals)
  CUSTOM  // User-created
}

// Field definitions for custom objects
model Field {
  id          String    @id @default(cuid())
  objectId    String
  name        String    // "email", "company_size", "quality_score"
  displayName String    // "Email Address", "Company Size"
  type        FieldType
  config      Json      @default("{}") // Type-specific config, validation rules
  isRequired  Boolean   @default(false)
  isUnique    Boolean   @default(false)
  defaultValue String?
  position    Int       @default(0)
  isSystem    Boolean   @default(false) // System fields can't be deleted
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  object      Object    @relation(fields: [objectId], references: [id], onDelete: Cascade)

  @@unique([objectId, name])
  @@index([objectId])
}

enum FieldType {
  TEXT
  LONG_TEXT
  NUMBER
  DECIMAL
  EMAIL
  PHONE
  URL
  DATE
  DATETIME
  BOOLEAN
  SELECT        // Single select
  MULTI_SELECT  // Multiple select
  RELATION      // Relation to another object
  FORMULA       // Computed field
  FILE          // File upload
  CURRENCY
  PERCENT
  RATING        // 1-5 stars
  USER          // Assign to user
}

// Records - actual data
model Record {
  id          String   @id @default(cuid())
  objectId    String
  data        Json     // Field values as JSON
  ownerId     String   // User who owns this record
  
  // Metadata
  score       Float?   // Lead score (if applicable)
  stage       String?  // Current stage/status
  isArchived  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String
  updatedBy   String

  object      Object     @relation(fields: [objectId], references: [id], onDelete: Cascade)
  activities  Activity[]
  files       File[]
  comments    Comment[]
  tasks       Task[]     // Tasks can be linked to any record
  relations   RecordRelation[] @relation("RecordFrom")
  relatedTo   RecordRelation[] @relation("RecordTo")
  timeEntries TimeEntry[]

  @@index([objectId])
  @@index([ownerId])
  @@index([createdAt])
  @@index([score])
}

// Relations between records
model RecordRelation {
  id          String   @id @default(cuid())
  fromRecordId String
  toRecordId  String
  relationType String  // "company", "deal", "contact", etc.
  metadata    Json     @default("{}") // Additional relation data
  createdAt   DateTime @default(now())

  fromRecord  Record   @relation("RecordFrom", fields: [fromRecordId], references: [id], onDelete: Cascade)
  toRecord    Record   @relation("RecordTo", fields: [toRecordId], references: [id], onDelete: Cascade)

  @@unique([fromRecordId, toRecordId, relationType])
  @@index([fromRecordId])
  @@index([toRecordId])
}

// Custom views for objects
model View {
  id          String   @id @default(cuid())
  objectId    String
  name        String
  type        ViewType
  config      Json     // Filters, sorting, columns, etc.
  isDefault   Boolean  @default(false)
  isShared    Boolean  @default(false)
  ownerId     String
  position    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  object      Object   @relation(fields: [objectId], references: [id], onDelete: Cascade)

  @@index([objectId])
  @@index([ownerId])
}

enum ViewType {
  TABLE
  BOARD
  LIST
  TIMELINE
  CALENDAR
  MAP
}

// ============================================================================
// ACTIVITY & COLLABORATION
// ============================================================================

model Activity {
  id          String       @id @default(cuid())
  recordId    String?      // Optional: linked to record
  type        ActivityType
  title       String
  description String?
  metadata    Json         @default("{}") // Type-specific data
  userId      String
  occurredAt  DateTime     @default(now())
  createdAt   DateTime     @default(now())

  record      Record?      @relation(fields: [recordId], references: [id], onDelete: Cascade)

  @@index([recordId])
  @@index([userId])
  @@index([occurredAt])
}

enum ActivityType {
  EMAIL_SENT
  EMAIL_RECEIVED
  CALL_MADE
  CALL_RECEIVED
  MEETING
  NOTE
  TASK_CREATED
  TASK_COMPLETED
  STAGE_CHANGED
  FIELD_UPDATED
  FILE_UPLOADED
  COMMENT_ADDED
}

model Comment {
  id          String   @id @default(cuid())
  content     String
  recordId    String?
  taskId      String?
  projectId   String?
  
  authorId    String
  mentions    String[] // User IDs mentioned with @
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  record      Record?  @relation(fields: [recordId], references: [id], onDelete: Cascade)
  task        Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([recordId])
  @@index([taskId])
  @@index([projectId])
  @@index([authorId])
}

model File {
  id          String   @id @default(cuid())
  name        String
  originalName String
  mimeType    String
  size        Int      // bytes
  url         String   // MinIO/S3 URL
  thumbnailUrl String? // For images
  
  recordId    String?
  taskId      String?
  projectId   String?
  commentId   String?
  
  uploadedBy  String
  createdAt   DateTime @default(now())

  record      Record?  @relation(fields: [recordId], references: [id], onDelete: Cascade)
  task        Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([recordId])
  @@index([taskId])
  @@index([projectId])
}

// ============================================================================
// PROJECT MANAGEMENT (ClickUp-style)
// ============================================================================

model Project {
  id          String        @id @default(cuid())
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  priority    Priority      @default(MEDIUM)
  
  // Dates
  startDate   DateTime?
  dueDate     DateTime?
  completedAt DateTime?
  
  // CRM Integration
  recordId    String?       // Optional: linked to CRM record (Deal, Company, etc.)
  
  // Ownership
  ownerId     String        // Project manager
  teamIds     String[]      // Team member IDs
  
  // Progress
  progress    Int           @default(0) // 0-100%
  
  // Budget & Time
  budget      Decimal?
  timeEstimate Int?         // minutes
  timeSpent   Int           @default(0) // minutes
  
  // UI
  color       String?       // Hex color
  emoji       String?       // Project icon
  
  isArchived  Boolean       @default(false)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  createdBy   String

  tasks       Task[]
  milestones  Milestone[]
  sprints     Sprint[]
  members     ProjectMember[]
  comments    Comment[]
  files       File[]

  @@index([ownerId])
  @@index([status])
  @@index([recordId])
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
  CANCELLED
}

model ProjectMember {
  id          String      @id @default(cuid())
  projectId   String
  userId      String
  role        ProjectRole @default(MEMBER)
  
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
}

enum ProjectRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  
  // Hierarchy
  projectId   String?
  parentId    String?    // For subtasks
  
  // Assignment
  assigneeId  String?
  
  // CRM Integration
  recordId    String?    // Optional: linked to CRM record
  
  // Dates
  startDate   DateTime?
  dueDate     DateTime?
  completedAt DateTime?
  
  // Tracking
  timeEstimate Int?      // minutes
  timeSpent   Int        @default(0) // minutes
  
  // Position (for ordering in views)
  position    Float      @default(0)
  
  // Labels/Tags
  labels      String[]
  
  isArchived  Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  createdBy   String

  project     Project?   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parent      Task?      @relation("Subtasks", fields: [parentId], references: [id], onDelete: Cascade)
  subtasks    Task[]     @relation("Subtasks")
  record      Record?    @relation(fields: [recordId], references: [id], onDelete: SetNull)
  
  comments    Comment[]
  files       File[]
  checklist   ChecklistItem[]
  timeEntries TimeEntry[]
  dependencies TaskDependency[] @relation("Task")
  dependents  TaskDependency[] @relation("DependsOn")

  @@index([projectId])
  @@index([assigneeId])
  @@index([status])
  @@index([recordId])
  @@index([parentId])
  @@index([position])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  BLOCKED
  DONE
  CANCELLED
}

enum Priority {
  URGENT
  HIGH
  MEDIUM
  LOW
}

model TaskDependency {
  id          String         @id @default(cuid())
  taskId      String
  dependsOnId String
  type        DependencyType @default(BLOCKS)
  
  task        Task           @relation("Task", fields: [taskId], references: [id], onDelete: Cascade)
  dependsOn   Task           @relation("DependsOn", fields: [dependsOnId], references: [id], onDelete: Cascade)

  @@unique([taskId, dependsOnId])
  @@index([taskId])
  @@index([dependsOnId])
}

enum DependencyType {
  BLOCKS       // Task A blocks Task B
  BLOCKED_BY   // Task A blocked by Task B
  RELATED      // Just related
}

model ChecklistItem {
  id          String  @id @default(cuid())
  taskId      String
  title       String
  isCompleted Boolean @default(false)
  position    Int
  
  task        Task    @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
}

model Milestone {
  id          String   @id @default(cuid())
  name        String
  description String?
  projectId   String
  dueDate     DateTime
  isCompleted Boolean  @default(false)
  position    Int      @default(0)
  
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}

model Sprint {
  id          String   @id @default(cuid())
  name        String
  projectId   String
  startDate   DateTime
  endDate     DateTime
  goal        String?
  isActive    Boolean  @default(false)
  
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}

model TimeEntry {
  id          String   @id @default(cuid())
  userId      String
  taskId      String?
  projectId   String?
  recordId    String?
  
  description String?
  duration    Int      // minutes
  startTime   DateTime
  endTime     DateTime?
  
  // Billing
  isBillable  Boolean  @default(false)
  hourlyRate  Decimal?
  
  createdAt   DateTime @default(now())

  task        Task?    @relation(fields: [taskId], references: [id], onDelete: SetNull)
  record      Record?  @relation(fields: [recordId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([taskId])
  @@index([recordId])
  @@index([startTime])
}

// ============================================================================
// SALES & PIPELINE (Salesforce-style)
// ============================================================================

model Pipeline {
  id          String        @id @default(cuid())
  name        String
  objectId    String        // Which object this pipeline is for
  stages      Json          // Array of stage definitions
  isDefault   Boolean       @default(false)
  isArchived  Boolean       @default(false)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([objectId])
}

model LeadScore {
  id          String   @id @default(cuid())
  recordId    String   @unique
  totalScore  Float    // 0-100
  factors     Json     // Breakdown by category
  grade       String   // A, B, C, D
  calculatedAt DateTime @default(now())
  
  @@index([totalScore])
  @@index([grade])
}

model Forecast {
  id          String   @id @default(cuid())
  recordId    String   // Deal record
  period      String   // "2026-Q1", "2026-01"
  amount      Decimal
  probability Int      // 0-100
  category    ForecastCategory
  createdAt   DateTime @default(now())
  
  @@index([recordId])
  @@index([period])
}

enum ForecastCategory {
  PIPELINE
  BEST_CASE
  COMMIT
  CLOSED
}

// ============================================================================
// COMMUNICATION
// ============================================================================

model EmailTemplate {
  id          String   @id @default(cuid())
  name        String
  subject     String
  body        String   // HTML with {{tokens}}
  category    String?
  isShared    Boolean  @default(false)
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  sequences   EmailSequenceStep[]

  @@index([ownerId])
  @@index([category])
}

model EmailSequence {
  id          String              @id @default(cuid())
  name        String
  description String?
  isActive    Boolean             @default(false)
  ownerId     String
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  steps       EmailSequenceStep[]
  enrollments EmailEnrollment[]

  @@index([ownerId])
}

model EmailSequenceStep {
  id          String        @id @default(cuid())
  sequenceId  String
  templateId  String
  stepNumber  Int
  delayDays   Int
  delayHours  Int           @default(0)
  
  sequence    EmailSequence @relation(fields: [sequenceId], references: [id], onDelete: Cascade)
  template    EmailTemplate @relation(fields: [templateId], references: [id])

  @@unique([sequenceId, stepNumber])
  @@index([sequenceId])
}

model EmailEnrollment {
  id          String        @id @default(cuid())
  sequenceId  String
  recordId    String
  currentStep Int           @default(1)
  status      EnrollmentStatus @default(ACTIVE)
  enrolledAt  DateTime      @default(now())
  completedAt DateTime?
  
  sequence    EmailSequence @relation(fields: [sequenceId], references: [id], onDelete: Cascade)

  @@unique([sequenceId, recordId])
  @@index([sequenceId])
  @@index([status])
}

enum EnrollmentStatus {
  ACTIVE
  PAUSED
  COMPLETED
  UNSUBSCRIBED
}

// ============================================================================
// AUTOMATION & WORKFLOWS
// ============================================================================

model Workflow {
  id          String        @id @default(cuid())
  name        String
  description String?
  objectId    String        // Which object triggers this
  trigger     WorkflowTrigger
  conditions  Json          // Array of condition rules
  actions     Json          // Array of actions to execute
  isActive    Boolean       @default(false)
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  createdBy   String

  object      Object        @relation(fields: [objectId], references: [id], onDelete: Cascade)
  executions  WorkflowExecution[]

  @@index([objectId])
  @@index([isActive])
}

enum WorkflowTrigger {
  RECORD_CREATED
  RECORD_UPDATED
  RECORD_DELETED
  FIELD_CHANGED
  STAGE_CHANGED
  TIME_BASED
}

model WorkflowExecution {
  id          String   @id @default(cuid())
  workflowId  String
  recordId    String?
  status      WorkflowExecutionStatus
  result      Json?    // Execution results
  error       String?
  executedAt  DateTime @default(now())
  
  workflow    Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@index([workflowId])
  @@index([status])
  @@index([executedAt])
}

enum WorkflowExecutionStatus {
  SUCCESS
  FAILED
  PARTIAL
}

// ============================================================================
// TRAFFIC ARBITRAGE SPECIFIC
// ============================================================================

model KeitaroIntegration {
  id          String   @id @default(cuid())
  userId      String   @unique
  apiUrl      String
  apiKey      String   // Encrypted
  lastSync    DateTime?
  isActive    Boolean  @default(true)
  
  campaigns   KeitaroCampaign[]

  @@index([userId])
}

model KeitaroCampaign {
  id              String   @id @default(cuid())
  integrationId   String
  keitaroId       String   // ID in Keitaro
  name            String
  
  // Stats
  clicks          Int      @default(0)
  conversions     Int      @default(0)
  revenue         Decimal  @default(0)
  cost            Decimal  @default(0)
  
  // Calculated
  roi             Decimal  @default(0)
  cr              Decimal  @default(0) // Conversion rate
  epc             Decimal  @default(0) // Earnings per click
  
  // CRM Links
  recordId        String?  // Linked to partner/webmaster
  
  lastSynced      DateTime @default(now())
  createdAt       DateTime @default(now())
  
  integration     KeitaroIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@unique([integrationId, keitaroId])
  @@index([integrationId])
  @@index([recordId])
}

model WebmasterScore {
  id              String   @id @default(cuid())
  recordId        String   @unique // Webmaster record
  
  // Score components (0-100 each)
  volumeScore     Float    @default(0)
  qualityScore    Float    @default(0)
  reliabilityScore Float   @default(0)
  communicationScore Float @default(0)
  
  // Total (weighted average)
  totalScore      Float    @default(0)
  grade           String   // "Gold", "Silver", "Bronze"
  
  // Metadata
  factors         Json     // Detailed breakdown
  calculatedAt    DateTime @default(now())

  @@index([totalScore])
  @@index([grade])
}

model Offer {
  id          String   @id @default(cuid())
  name        String
  partnerId   String   // Record ID of partner network
  vertical    String   // "casino", "betting", "finance", etc.
  
  // Multi-GEO support
  geos        Json     // Array of {geo, payout, cap, current, cr}
  
  status      OfferStatus @default(ACTIVE)
  requirements String?
  landingUrl  String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([partnerId])
  @@index([vertical])
  @@index([status])
}

enum OfferStatus {
  ACTIVE
  PAUSED
  ARCHIVED
}

// ============================================================================
// SYSTEM & SETTINGS
// ============================================================================

model User {
  id          String   @id // Supabase auth.users.id
  email       String   @unique
  name        String?
  avatar      String?
  role        UserRole @default(MEMBER)
  
  // Settings
  timezone    String   @default("UTC")
  locale      String   @default("en")
  preferences Json     @default("{}")
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([email])
}

enum UserRole {
  ADMIN
  MANAGER
  MEMBER
  VIEWER
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  type        String
  title       String
  message     String
  data        Json?
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}

model Webhook {
  id          String   @id @default(cuid())
  url         String
  events      String[] // Array of event types to listen to
  secret      String?  // For HMAC verification
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  deliveries  WebhookDelivery[]

  @@index([isActive])
}

model WebhookDelivery {
  id          String   @id @default(cuid())
  webhookId   String
  event       String
  payload     Json
  response    String?
  statusCode  Int?
  success     Boolean
  attempts    Int      @default(1)
  deliveredAt DateTime @default(now())
  
  webhook     Webhook  @relation(fields: [webhookId], references: [id], onDelete: Cascade)

  @@index([webhookId])
  @@index([deliveredAt])
}
```

---

## 🗂 PROJECT STRUCTURE

```
enterprise-crm/
├── apps/
│   ├── api/                          # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── objects/         # Meta-model system
│   │   │   │   │   ├── objects.controller.ts
│   │   │   │   │   ├── objects.service.ts
│   │   │   │   │   ├── fields.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── records/         # CRUD for records
│   │   │   │   │   ├── records.controller.ts
│   │   │   │   │   ├── records.service.ts
│   │   │   │   │   ├── relations.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── views/           # Custom views
│   │   │   │   │   ├── views.controller.ts
│   │   │   │   │   ├── views.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── projects/        # Project Management
│   │   │   │   │   ├── projects.controller.ts
│   │   │   │   │   ├── projects.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── tasks/           # Task Management
│   │   │   │   │   ├── tasks.controller.ts
│   │   │   │   │   ├── tasks.service.ts
│   │   │   │   │   ├── dependencies.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── time-tracking/   # Time entries
│   │   │   │   │   ├── time-tracking.controller.ts
│   │   │   │   │   ├── time-tracking.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── activities/      # Activity tracking
│   │   │   │   │   ├── activities.controller.ts
│   │   │   │   │   ├── activities.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── collaboration/   # Real-time features
│   │   │   │   │   ├── collaboration.gateway.ts
│   │   │   │   │   ├── comments.service.ts
│   │   │   │   │   ├── presence.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── files/           # File management
│   │   │   │   │   ├── files.controller.ts
│   │   │   │   │   ├── files.service.ts
│   │   │   │   │   ├── storage.service.ts (MinIO)
│   │   │   │   │   └── dto/
│   │   │   │   ├── pipelines/       # Sales pipelines
│   │   │   │   │   ├── pipelines.controller.ts
│   │   │   │   │   ├── pipelines.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── scoring/         # Lead scoring
│   │   │   │   │   ├── scoring.service.ts
│   │   │   │   │   ├── scoring.processor.ts (BullMQ)
│   │   │   │   │   └── dto/
│   │   │   │   ├── forecasting/     # Sales forecasting
│   │   │   │   │   ├── forecasting.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── emails/          # Email system
│   │   │   │   │   ├── emails.controller.ts
│   │   │   │   │   ├── templates.service.ts
│   │   │   │   │   ├── sequences.service.ts
│   │   │   │   │   ├── sender.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── workflows/       # Automation
│   │   │   │   │   ├── workflows.controller.ts
│   │   │   │   │   ├── workflows.service.ts
│   │   │   │   │   ├── workflow.processor.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── integrations/    # External APIs
│   │   │   │   │   ├── keitaro/
│   │   │   │   │   │   ├── keitaro.service.ts
│   │   │   │   │   │   ├── keitaro.sync.ts
│   │   │   │   │   │   └── dto/
│   │   │   │   │   ├── apollo/
│   │   │   │   │   │   └── apollo.service.ts
│   │   │   │   │   ├── hunter/
│   │   │   │   │   │   └── hunter.service.ts
│   │   │   │   │   └── telegram/
│   │   │   │   │       └── telegram.bot.ts
│   │   │   │   ├── analytics/       # Reporting
│   │   │   │   │   ├── analytics.controller.ts
│   │   │   │   │   ├── reports.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── ai/              # AI features
│   │   │   │   │   ├── enrichment.service.ts
│   │   │   │   │   ├── insights.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── arbitrage/       # Traffic arbitrage specific
│   │   │   │   │   ├── webmaster-scoring.service.ts
│   │   │   │   │   ├── offers.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   └── auth/            # Authentication
│   │   │   │       ├── auth.guard.ts
│   │   │   │       ├── auth.module.ts
│   │   │   │       └── supabase.service.ts
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── filters/
│   │   │   │   └── utils/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # Next.js Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── (dashboard)/
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx           # Main dashboard
│       │   │   │   ├── [object]/          # Dynamic object routes
│       │   │   │   │   ├── page.tsx       # Object list view
│       │   │   │   │   └── [id]/
│       │   │   │   │       └── page.tsx   # Record detail
│       │   │   │   ├── projects/
│       │   │   │   │   ├── page.tsx       # Projects list
│       │   │   │   │   └── [id]/
│       │   │   │   │       └── page.tsx   # Project detail
│       │   │   │   ├── tasks/
│       │   │   │   │   └── page.tsx       # All tasks view
│       │   │   │   ├── analytics/
│       │   │   │   │   └── page.tsx       # Analytics dashboard
│       │   │   │   └── settings/
│       │   │   │       └── page.tsx
│       │   │   ├── auth/
│       │   │   │   ├── login/
│       │   │   │   └── callback/
│       │   │   ├── layout.tsx
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── objects/
│       │   │   │   ├── object-list.tsx
│       │   │   │   ├── record-detail.tsx
│       │   │   │   ├── field-editor.tsx
│       │   │   │   └── relation-picker.tsx
│       │   │   ├── views/
│       │   │   │   ├── table-view.tsx
│       │   │   │   ├── board-view.tsx
│       │   │   │   ├── list-view.tsx
│       │   │   │   ├── timeline-view.tsx
│       │   │   │   └── calendar-view.tsx
│       │   │   ├── projects/
│       │   │   │   ├── project-card.tsx
│       │   │   │   ├── project-header.tsx
│       │   │   │   └── project-settings.tsx
│       │   │   ├── tasks/
│       │   │   │   ├── task-board.tsx      # Kanban
│       │   │   │   ├── task-list.tsx       # Table
│       │   │   │   ├── task-card.tsx
│       │   │   │   ├── task-detail.tsx
│       │   │   │   ├── task-form.tsx
│       │   │   │   ├── subtask-list.tsx
│       │   │   │   ├── checklist.tsx
│       │   │   │   └── dependency-graph.tsx
│       │   │   ├── time-tracking/
│       │   │   │   ├── time-entry-form.tsx
│       │   │   │   ├── timer-widget.tsx
│       │   │   │   └── timesheet.tsx
│       │   │   ├── collaboration/
│       │   │   │   ├── comment-thread.tsx
│       │   │   │   ├── mention-input.tsx
│       │   │   │   ├── presence-avatars.tsx
│       │   │   │   └── activity-feed.tsx
│       │   │   ├── analytics/
│       │   │   │   ├── dashboard-widget.tsx
│       │   │   │   ├── chart-builder.tsx
│       │   │   │   └── report-viewer.tsx
│       │   │   ├── arbitrage/
│       │   │   │   ├── keitaro-widget.tsx
│       │   │   │   ├── webmaster-score.tsx
│       │   │   │   └── offer-catalog.tsx
│       │   │   ├── layout/
│       │   │   │   ├── sidebar.tsx
│       │   │   │   ├── navbar.tsx
│       │   │   │   ├── command-palette.tsx
│       │   │   │   └── notifications.tsx
│       │   │   └── ui/              # shadcn/ui components
│       │   │       ├── button.tsx
│       │   │       ├── dialog.tsx
│       │   │       ├── dropdown-menu.tsx
│       │   │       └── ... (all shadcn components)
│       │   ├── hooks/
│       │   │   ├── use-objects.ts
│       │   │   ├── use-records.ts
│       │   │   ├── use-projects.ts
│       │   │   ├── use-tasks.ts
│       │   │   ├── use-real-time.ts
│       │   │   └── use-command-palette.ts
│       │   ├── lib/
│       │   │   ├── api.ts           # API client
│       │   │   ├── socket.ts        # Socket.io client
│       │   │   ├── supabase/
│       │   │   │   ├── client.ts
│       │   │   │   └── server.ts
│       │   │   └── utils.ts
│       │   ├── stores/
│       │   │   ├── objects-store.ts
│       │   │   ├── tasks-store.ts
│       │   │   └── ui-store.ts
│       │   └── types/
│       │       ├── objects.ts
│       │       ├── records.ts
│       │       ├── projects.ts
│       │       └── tasks.ts
│       ├── public/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/
│       └── src/
│           └── types/               # Shared types
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## 📅 DEVELOPMENT TIMELINE

### Day 1-2: Foundation & Core CRM

**Database & API Core**
```bash
Tasks:
1. Setup project structure (clone mini-zapier as base)
2. Create Prisma schema (complete schema above)
3. Setup database migrations
4. Create core NestJS modules:
   - Objects module (meta-model)
   - Fields module
   - Records module
   - Views module
5. Implement flexible data model:
   - CRUD for objects
   - CRUD for fields
   - Dynamic record CRUD based on object schema
   - Field validation engine
   - Computed fields engine
6. Setup authentication (Supabase)
7. Setup real-time (Socket.io gateway)

Success Criteria:
✅ Can create custom object via API
✅ Can add fields to object
✅ Can create/read/update/delete records
✅ Field validation works
✅ API documented in Swagger
✅ All endpoints return proper error messages
```

**Frontend Foundation**
```bash
Tasks:
1. Setup Next.js 16 with App Router
2. Setup Tailwind CSS 4
3. Install and configure shadcn/ui
4. Create authentication flow
5. Create main layout:
   - Sidebar with object list
   - Top navbar
   - Command palette (Cmd+K)
6. Create object list page:
   - Table view with TanStack Table
   - Filters
   - Search
   - Sorting
7. Create record detail page:
   - Dynamic form based on object schema
   - Inline editing
   - Related records
8. Setup API client (TanStack Query)
9. Setup real-time connection (Socket.io)

Success Criteria:
✅ Can login/logout
✅ Can see list of objects in sidebar
✅ Can view records in table
✅ Can create/edit record
✅ Can search and filter
✅ Real-time updates when others edit
✅ Responsive on mobile
```

### Day 3-4: CRM Advanced Features & PM Foundation

**Salesforce-style Features**
```bash
Tasks:
1. Implement Pipelines:
   - Create/edit pipeline API
   - Pipeline stages configuration
   - Drag & drop stage changes
   - Kanban board view component
2. Lead Scoring:
   - Scoring rules engine
   - Auto-calculation on record changes
   - Score history tracking
   - Grade assignment (A/B/C/D)
3. Sales Forecasting:
   - Forecast calculation service
   - Weighted pipeline forecast
   - Revenue projections
   - Forecast reports
4. Email Templates:
   - Template CRUD API
   - Rich text editor (Tiptap)
   - Token replacement {{firstName}}
   - Template categories
5. Email Sequences:
   - Sequence builder
   - Step delays
   - Enrollment system
   - Auto-send processor (BullMQ)

Success Criteria:
✅ Can create pipeline with stages
✅ Can drag deals between stages
✅ Lead score auto-updates
✅ Forecast shows accurate projections
✅ Can create email template
✅ Can create sequence with delays
✅ Sequences send automatically
```

**Project Management Foundation**
```bash
Tasks:
1. Projects module:
   - CRUD API
   - Project-record linking
   - Team members
   - Progress tracking
2. Tasks module:
   - CRUD API
   - Task hierarchy (subtasks)
   - Task assignment
   - Status changes
   - Position/ordering
3. Task views:
   - Board view (Kanban with react-beautiful-dnd)
   - List view (Table with TanStack Table)
   - Quick task creation
   - Inline editing
4. Task detail modal:
   - Full task editor
   - Subtasks list
   - Checklist
   - Comments
   - File attachments
5. Real-time task updates:
   - Socket events for task changes
   - Optimistic updates
   - Presence indicators

Success Criteria:
✅ Can create project
✅ Can create tasks in project
✅ Can create subtasks
✅ Can drag tasks between columns (Board view)
✅ Can switch between Board/List views
✅ Tasks update in real-time
✅ Can add comments to tasks
✅ Can upload files to tasks
```

### Day 5-6: PM Advanced & Traffic Arbitrage

**Project Management Advanced**
```bash
Tasks:
1. Time Tracking:
   - Time entry CRUD
   - Timer widget
   - Timesheet view
   - Time estimates vs actuals
   - Billable hours
2. Task Dependencies:
   - Dependency CRUD API
   - Dependency types (blocks, blocked_by)
   - Gantt chart view (react-gantt-chart)
   - Critical path calculation
3. Milestones & Sprints:
   - Milestone CRUD
   - Sprint CRUD
   - Sprint board
   - Burndown chart
4. Calendar View:
   - FullCalendar integration
   - Task due dates
   - Drag to reschedule
   - Month/Week/Day views
5. Workload View:
   - By assignee
   - Capacity visualization
   - Overload warnings
6. Project Templates:
   - Template creation
   - Apply template to new project
   - Pre-configured tasks

Success Criteria:
✅ Can track time on tasks
✅ Timer works and saves entries
✅ Can set task dependencies
✅ Gantt chart shows timeline
✅ Can create milestones
✅ Calendar shows all tasks
✅ Workload view shows team capacity
✅ Can create project from template
```

**Traffic Arbitrage Specialization**
```bash
Tasks:
1. Keitaro Integration:
   - Connection setup UI
   - API client for Keitaro
   - Campaign sync service (BullMQ job)
   - Real-time stats display
   - Alert system for CR drops
2. Webmaster Scoring:
   - Scoring algorithm
   - Auto-calculation service
   - Score breakdown UI
   - Leaderboard component
   - Quality tiers (Gold/Silver/Bronze)
3. Offer Management:
   - Offer catalog
   - Multi-GEO support
   - Cap tracking
   - Auto-pause on cap
   - Offer comparison tool
4. Analytics Dashboard:
   - Traffic map (Mapbox)
   - GEO performance heatmap
   - Revenue funnel
   - Hourly patterns chart
   - Device/OS breakdown
5. AI Insights:
   - OpenAI integration
   - Automated insights generation
   - Pattern detection
   - Recommendations engine

Success Criteria:
✅ Keitaro syncs campaigns automatically
✅ Real-time traffic stats display
✅ Webmaster scores calculate correctly
✅ Can see leaderboard
✅ Offers sync from networks
✅ Cap monitoring works
✅ Analytics dashboard loads <500ms
✅ AI insights are relevant
```

### Day 7-8: Polish, Testing & Documentation

**Polish & UX**
```bash
Tasks:
1. UI/UX improvements:
   - Smooth animations
   - Loading states
   - Empty states
   - Error states
   - Toast notifications
   - Keyboard shortcuts
2. Mobile responsive:
   - Mobile navigation
   - Touch-friendly
   - Responsive tables
   - Mobile task editing
3. Performance optimization:
   - Query optimization
   - Index creation
   - Caching strategy
   - Lazy loading
   - Image optimization
4. Dark mode (if time permits)

Success Criteria:
✅ All interactions feel smooth
✅ Loading states everywhere
✅ Works great on mobile
✅ Pages load in <200ms
✅ No console errors
```

**Testing & Quality**
```bash
Tasks:
1. Backend tests:
   - Unit tests for services
   - Integration tests for APIs
   - E2E tests for critical flows
2. Frontend tests:
   - Component tests
   - Hook tests
   - Integration tests
3. Manual QA:
   - Test all features
   - Cross-browser testing
   - Mobile testing
4. Bug fixes

Success Criteria:
✅ 80%+ test coverage
✅ All critical paths tested
✅ No major bugs
✅ Works in Chrome, Safari, Firefox
✅ Works on iOS and Android
```

**Documentation & Deployment**
```bash
Tasks:
1. Documentation:
   - README with setup instructions
   - API documentation (Swagger)
   - User guide
   - Admin guide
2. Deployment:
   - Docker Compose setup
   - Nginx configuration
   - SSL certificates
   - Environment variables guide
   - Backup strategy
3. Monitoring:
   - Error tracking (Sentry)
   - Performance monitoring
   - Uptime monitoring

Success Criteria:
✅ Complete documentation
✅ Can deploy with one command
✅ HTTPS enabled
✅ Monitoring in place
✅ Backup automated
```

---

## 🎯 SUCCESS CRITERIA

### MVP Requirements (Must Have)

**Core CRM:**
- ✅ Flexible data model (custom objects, fields)
- ✅ CRUD operations on records
- ✅ Multiple view types (Table, Board, List)
- ✅ Search and filters
- ✅ Real-time collaboration
- ✅ Comments and activity feed
- ✅ File attachments

**Project Management:**
- ✅ Projects and tasks
- ✅ Board view (Kanban)
- ✅ List view (Table)
- ✅ Task assignment and status
- ✅ Subtasks
- ✅ Comments on tasks

**Sales Features:**
- ✅ Pipelines with stages
- ✅ Lead scoring
- ✅ Basic forecasting

**Integrations:**
- ✅ Email sending (Resend)
- ✅ Keitaro sync

### Performance Requirements

- Page load: <200ms
- API response: <100ms
- Real-time updates: <100ms latency
- Search: <500ms
- Support 10,000+ records
- Support 100+ concurrent users

### Quality Requirements

- TypeScript strict mode
- 80%+ test coverage
- All files <700 lines
- Modular architecture
- Comprehensive error handling
- OpenAPI documentation
- Mobile responsive

---

## 🔐 SECURITY REQUIREMENTS

```typescript
1. Authentication:
   - Supabase JWT tokens
   - Secure session management
   - Password requirements
   - 2FA support (future)

2. Authorization:
   - Role-based access control (RBAC)
   - Row-level security in Prisma queries
   - API endpoint guards
   - Object-level permissions

3. Data Protection:
   - Encrypt sensitive fields (API keys, tokens)
   - HTTPS only
   - CORS configuration
   - Rate limiting
   - SQL injection prevention (Prisma)
   - XSS prevention (sanitize inputs)

4. API Security:
   - API key authentication
   - Request validation
   - Error message sanitization
   - Audit logging

5. File Security:
   - Virus scanning
   - File type validation
   - Size limits
   - Secure URLs (signed)
```

---

## 🚀 DEPLOYMENT GUIDE

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crm"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="xxx"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxx"

# MinIO (S3)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="crm-files"

# Email
RESEND_API_KEY="re_xxx"
EMAIL_FROM="noreply@yourcompany.com"

# APIs
OPENAI_API_KEY="sk-xxx"
ANTHROPIC_API_KEY="sk-ant-xxx"
APOLLO_API_KEY="xxx"
HUNTER_API_KEY="xxx"

# Telegram
TELEGRAM_BOT_TOKEN="xxx"

# App
API_BASE_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"
CORS_ORIGIN="http://localhost:3000"
JWT_SECRET="xxx"
ENCRYPTION_KEY="xxx" # Generate with: openssl rand -hex 32
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: crm
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD: crm_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - DATABASE_URL=postgresql://crm_user:crm_password@postgres:5432/crm
      - REDIS_HOST=redis
      - MINIO_ENDPOINT=minio
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
      - minio

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3001
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

---

## 📝 EXAMPLE CODE SNIPPETS

### API Example: Records Service

```typescript
// apps/api/src/modules/records/records.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto, UpdateRecordDto } from './dto';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new record with validation
   */
  async create(objectId: string, dto: CreateRecordDto, userId: string) {
    // Get object schema
    const object = await this.prisma.object.findUnique({
      where: { id: objectId },
      include: { fields: true },
    });

    if (!object) {
      throw new NotFoundException('Object not found');
    }

    // Validate data against schema
    this.validateData(dto.data, object.fields);

    // Create record
    return this.prisma.record.create({
      data: {
        objectId,
        data: dto.data,
        ownerId: userId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  /**
   * Validate record data against field schema
   */
  private validateData(data: any, fields: any[]) {
    for (const field of fields) {
      const value = data[field.name];

      // Check required fields
      if (field.isRequired && !value) {
        throw new Error(`Field ${field.name} is required`);
      }

      // Type validation
      if (value !== undefined) {
        this.validateFieldType(field, value);
      }
    }
  }

  /**
   * Validate field value type
   */
  private validateFieldType(field: any, value: any) {
    switch (field.type) {
      case 'EMAIL':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error(`Invalid email: ${value}`);
        }
        break;
      case 'NUMBER':
        if (typeof value !== 'number') {
          throw new Error(`${field.name} must be a number`);
        }
        break;
      case 'URL':
        try {
          new URL(value);
        } catch {
          throw new Error(`Invalid URL: ${value}`);
        }
        break;
      // Add more validations...
    }
  }
}
```

### Frontend Example: Task Board

```typescript
// apps/web/src/components/tasks/task-board.tsx

'use client';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TaskCard } from './task-card';
import { api } from '@/lib/api';

export function TaskBoard({ projectId }: { projectId: string }) {
  // Fetch tasks
  const { data: tasks } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.tasks.list({ projectId }),
  });

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: ({ id, data }: any) => api.tasks.update(id, data),
  });

  // Handle drag end
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    
    updateTask.mutate({
      id: draggableId,
      data: {
        status: destination.droppableId,
        position: destination.index,
      },
    });
  };

  // Group tasks by status
  const tasksByStatus = {
    TODO: tasks?.filter(t => t.status === 'TODO') || [],
    IN_PROGRESS: tasks?.filter(t => t.status === 'IN_PROGRESS') || [],
    IN_REVIEW: tasks?.filter(t => t.status === 'IN_REVIEW') || [],
    DONE: tasks?.filter(t => t.status === 'DONE') || [],
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {Object.entries(tasksByStatus).map(([status, tasks]) => (
          <div key={status} className="flex-shrink-0 w-80">
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-4">{status}</h3>
              
              <Droppable droppableId={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 min-h-[200px]"
                  >
                    {tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
```

---

## ⚠️ CRITICAL NOTES

### DO's
- ✅ Follow mini-zapier architecture patterns
- ✅ Keep files under 700 lines
- ✅ Write comprehensive tests
- ✅ Use TypeScript strict mode
- ✅ Validate all inputs
- ✅ Handle all errors gracefully
- ✅ Use transactions for multi-step operations
- ✅ Index database queries
- ✅ Cache frequently accessed data
- ✅ Use optimistic updates in UI
- ✅ Make commits after each feature
- ✅ Document complex logic
- ✅ Use English for code comments
- ✅ Think in Russian, code in English

### DON'Ts
- ❌ Don't use 'any' type in TypeScript
- ❌ Don't hardcode values
- ❌ Don't skip validation
- ❌ Don't ignore errors
- ❌ Don't use shortcuts/hacks
- ❌ Don't copy-paste code without understanding
- ❌ Don't commit without testing
- ❌ Don't create God objects/services
- ❌ Don't skip documentation
- ❌ Don't add Co-Authored-By in commits

---

## 🎯 STARTING PROMPT FOR CLAUDE CODE

When you're ready to start, use this prompt in Claude Code:

```
I need you to build an Enterprise CRM + Project Management system following the complete specification in ENTERPRISE_CRM_SPECIFICATION.md.

This is a critical project - quality is more important than speed.

Key requirements:
1. Use mini-zapier codebase as architectural reference
2. Follow the development philosophy strictly (from CLAUDE.md)
3. Maximum 700 lines per file
4. TypeScript strict mode
5. Comprehensive error handling
6. Unit tests for core functionality
7. Make commits after each major feature

Start with Day 1-2 tasks:
- Setup project structure based on mini-zapier
- Implement complete Prisma schema from spec
- Create core NestJS modules (Objects, Fields, Records, Views)
- Build flexible data model system
- Setup Supabase authentication
- Create basic Next.js frontend with authentication

After completing each stage, wait for my review before proceeding to the next.

Let's build something amazing! 🚀
```

---

## 📚 ADDITIONAL RESOURCES

### References
- mini-zapier codebase (architectural reference)
- Attio.com (UX inspiration)
- ClickUp.com (PM features inspiration)
- Salesforce (enterprise features reference)

### Libraries Documentation
- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs
- Next.js 16: https://nextjs.org/docs
- TanStack Query: https://tanstack.com/query
- shadcn/ui: https://ui.shadcn.com
- React Beautiful DnD: https://github.com/atlassian/react-beautiful-dnd
- Socket.io: https://socket.io/docs

### Tools
- Prisma Studio: `pnpm db:studio`
- Swagger UI: http://localhost:3001/api
- Redis Commander: https://joeferner.github.io/redis-commander/

---

**Version:** 1.0  
**Last Updated:** January 17, 2026  
**Status:** Ready for Development

---

Good luck! This will be an amazing system! 🚀
