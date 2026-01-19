# 🚀 Quick Start Guide - Enterprise CRM

## Быстрый старт для Claude Code

### Шаг 1: Подготовка (5 минут)

```bash
# 1. Клонируй mini-zapier как базу
git clone <mini-zapier-repo> enterprise-crm
cd enterprise-crm

# 2. Переименуй в package.json
# "name": "enterprise-crm"

# 3. Очисти ненужное
rm -rf .git
git init
git add .
git commit -m "chore: initial project setup from mini-zapier"
```

### Шаг 2: Скопируй спецификацию

```bash
# Скопируй эти файлы в корень проекта:
# - ENTERPRISE_CRM_SPECIFICATION.md
# - CLAUDE.md

cp path/to/ENTERPRISE_CRM_SPECIFICATION.md .
cp path/to/CLAUDE.md .
```

### Шаг 3: Главный промпт для Claude Code

Открой Claude Code в корне проекта и используй этот промпт:

```
Привет! Мне нужно построить Enterprise CRM + Project Management систему.

📋 У меня есть полная спецификация в файле ENTERPRISE_CRM_SPECIFICATION.md
📏 Правила разработки в файле CLAUDE.md

🎯 Текущая задача: Day 1-2 Foundation & Core CRM

Начни с:
1. Изучи оба файла (specification + CLAUDE.md)
2. Задай уточняющие вопросы если что-то неясно
3. Начни реализацию с database schema

Важные напоминания:
- Используй mini-zapier как reference для архитектуры
- Максимум 700 строк на файл
- TypeScript strict mode
- Делай коммиты после каждой фичи
- Проверяй линтером и билдом

Готов? Поехали! 🚀
```

### Шаг 4: Окружение (во время разработки)

```bash
# Создай .env файл:
cp .env.example .env

# Основные переменные для начала:
DATABASE_URL="postgresql://user:password@localhost:5432/crm"
REDIS_HOST="localhost"
REDIS_PORT=6379
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-key"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"

# Запусти инфраструктуру:
docker compose up -d postgres redis minio
```

### Шаг 5: Процесс работы

```bash
# Claude Code будет:
1. Создавать/изменять файлы
2. Делать коммиты
3. Запускать линтер
4. Проверять билд
5. Спрашивать твоего подтверждения для следующего этапа

# Ты будешь:
1. Проверять результаты
2. Давать feedback
3. Одобрять переход к следующему этапу
4. Тестировать функциональность
```

---

## 📅 Timeline по дням

### Day 1-2: Foundation ✅
**Что будет сделано:**
- ✅ Prisma schema (полная схема БД)
- ✅ NestJS модули (Objects, Fields, Records, Views)
- ✅ Гибкая data model система
- ✅ Supabase Auth
- ✅ Next.js App Router структура
- ✅ Базовый UI (sidebar, navbar, command palette)
- ✅ Table view для records
- ✅ Record detail page
- ✅ Real-time collaboration (Socket.io)

**Как проверить:**
```bash
# Backend
cd apps/api
pnpm dev
# Должно запуститься на :3001
# Swagger docs: http://localhost:3001/api

# Frontend
cd apps/web
pnpm dev
# Должно запуститься на :3000
# Login page: http://localhost:3000/login
```

### Day 3-4: CRM Advanced + PM Foundation ✅
**Что будет сделано:**
- ✅ Pipelines (stages, drag & drop)
- ✅ Lead scoring
- ✅ Sales forecasting
- ✅ Email templates & sequences
- ✅ Projects module
- ✅ Tasks module (Board + List views)
- ✅ Task hierarchy (subtasks)
- ✅ Comments system

**Как проверить:**
```bash
# 1. Создай pipeline
POST /api/pipelines
{
  "name": "Sales Pipeline",
  "objectId": "deals",
  "stages": [
    {"name": "Lead", "probability": 20},
    {"name": "Qualified", "probability": 40},
    {"name": "Proposal", "probability": 60},
    {"name": "Negotiation", "probability": 80},
    {"name": "Closed Won", "probability": 100}
  ]
}

# 2. Создай project
POST /api/projects
{
  "name": "Q1 Campaign",
  "description": "Launch new campaign",
  "ownerId": "user-id"
}

# 3. Создай task
POST /api/tasks
{
  "projectId": "project-id",
  "title": "Design landing page",
  "status": "TODO",
  "priority": "HIGH"
}

# 4. Проверь в UI:
# - Board view должен работать
# - Drag & drop работает
# - Can create subtasks
# - Can add comments
```

### Day 5-6: PM Advanced + Traffic Arbitrage ✅
**Что будет сделано:**
- ✅ Time tracking (timer widget, timesheets)
- ✅ Task dependencies
- ✅ Gantt chart
- ✅ Milestones & Sprints
- ✅ Calendar view
- ✅ Workload view
- ✅ Keitaro integration
- ✅ Webmaster scoring
- ✅ Offers management
- ✅ Analytics dashboard
- ✅ AI insights

**Как проверить:**
```bash
# 1. Keitaro connection
POST /api/integrations/keitaro
{
  "apiUrl": "https://your-keitaro.com",
  "apiKey": "your-key"
}

# 2. Sync campaigns
POST /api/integrations/keitaro/sync

# 3. Check webmaster score
GET /api/arbitrage/webmasters/{id}/score

# 4. Проверь в UI:
# - Keitaro widget shows stats
# - Webmaster leaderboard works
# - Offers catalog loads
# - Analytics charts render
```

### Day 7-8: Polish & Deploy ✅
**Что будет сделано:**
- ✅ UI/UX polish
- ✅ Mobile responsive
- ✅ Performance optimization
- ✅ Tests (80%+ coverage)
- ✅ Documentation
- ✅ Docker setup
- ✅ Deployment ready

**Финальная проверка:**
```bash
# 1. Run all tests
pnpm test

# 2. Check coverage
pnpm test:coverage

# 3. Build production
pnpm build

# 4. Deploy
docker compose -f docker-compose.prod.yml up -d --build

# 5. Health check
curl http://localhost:3001/health
curl http://localhost:3000
```

---

## 🎯 Промпты для каждого этапа

### Day 1: Database Schema

```
Отлично! Начнем с Day 1.

Задача: Создать полную Prisma схему из спецификации.

1. Открой apps/api/prisma/schema.prisma
2. Замени содержимое на схему из ENTERPRISE_CRM_SPECIFICATION.md
3. Проверь что все модели присутствуют:
   - Object, Field, Record (flexible data model)
   - Project, Task, TimeEntry (PM)
   - Pipeline, LeadScore, Forecast (Sales)
   - Activity, Comment, File (collaboration)
   - KeitaroIntegration, WebmasterScore, Offer (arbitrage)
4. Добавь все необходимые indexes
5. Сделай коммит: "feat: add complete database schema"

Готов начать?
```

### Day 1: Backend Core

```
Отлично! Схема готова. Теперь backend core.

Задача: Создать основные NestJS модули.

Создай модули в следующем порядке:
1. objects/ - Meta-model system
   - objects.controller.ts
   - objects.service.ts
   - fields.service.ts
   - dto/create-object.dto.ts, update-object.dto.ts
   
2. records/ - Dynamic CRUD
   - records.controller.ts
   - records.service.ts
   - record-validation.service.ts
   - relations.service.ts
   - dto/

3. views/ - Custom views
   - views.controller.ts
   - views.service.ts
   - dto/

Важно:
- Каждый файл <700 строк
- Comprehensive error handling
- Input validation с class-validator
- TypeScript strict mode
- OpenAPI decorators для Swagger

Делай коммит после каждого модуля.
Готов?
```

### Day 1: Frontend Setup

```
Backend core готов! Теперь frontend.

Задача: Setup Next.js с основными компонентами.

1. Структура:
   - app/(dashboard)/layout.tsx (main layout)
   - app/(dashboard)/page.tsx (dashboard)
   - app/(dashboard)/[object]/page.tsx (dynamic object list)
   - app/(dashboard)/[object]/[id]/page.tsx (record detail)

2. Layout компоненты:
   - components/layout/sidebar.tsx
   - components/layout/navbar.tsx
   - components/layout/command-palette.tsx (Cmd+K)

3. Object/Record компоненты:
   - components/objects/object-list.tsx (TanStack Table)
   - components/objects/record-detail.tsx
   - components/objects/field-editor.tsx

4. Setup:
   - TanStack Query для API calls
   - Zustand для state
   - Socket.io client для real-time

Используй shadcn/ui компоненты.
Делай коммит после каждой группы компонентов.
Готов?
```

### Day 2: Real-time Collaboration

```
Базовый UI готов! Добавляем real-time.

Задача: WebSocket для collaboration.

Backend:
1. collaboration/ module
   - collaboration.gateway.ts (Socket.io)
   - presence.service.ts (who's online)
   - comments.service.ts
   
2. События:
   - user:join, user:leave
   - record:updated
   - comment:added
   - task:moved

Frontend:
1. hooks/use-real-time.ts
2. components/collaboration/
   - presence-avatars.tsx (show who's here)
   - comment-thread.tsx
   - activity-feed.tsx

Real-time должен работать:
- Cursors других пользователей
- Instant updates при изменениях
- Comments в реальном времени

Тест: Открой в 2 окнах, измени запись в одном - должно обновиться во втором.
Готов?
```

### Day 3: Projects & Tasks

```
Day 3! Добавляем Project Management.

Задача: Projects и Tasks модули.

Backend:
1. projects/ module
   - Full CRUD
   - Team members
   - Progress calculation
   
2. tasks/ module
   - Full CRUD
   - Subtasks (recursive)
   - Dependencies
   - Position management (for drag & drop)

Frontend:
1. components/tasks/task-board.tsx (Kanban)
   - react-beautiful-dnd
   - Columns: TODO, IN_PROGRESS, IN_REVIEW, DONE
   - Drag & drop между колонками
   
2. components/tasks/task-list.tsx (Table)
   - TanStack Table
   - Inline editing
   - Bulk actions
   
3. components/tasks/task-detail.tsx
   - Modal или side panel
   - All task info
   - Subtasks
   - Comments
   - Files

Делай коммиты часто!
Готов?
```

### Day 5: Keitaro Integration

```
Day 5! Traffic arbitrage features.

Задача: Keitaro integration.

Backend:
1. integrations/keitaro/
   - keitaro.service.ts (API client)
   - keitaro.sync.ts (BullMQ job для sync)
   - dto/

API Methods:
- connect(apiUrl, apiKey)
- syncCampaigns()
- getCampaignStats(campaignId)
- getRealtimeStats()

2. arbitrage/ module
   - webmaster-scoring.service.ts
   - offers.service.ts

Scoring Algorithm:
- Volume score (20%)
- Quality/CR score (30%)
- Reliability score (25%)
- Communication score (15%)
- Payment score (10%)

Frontend:
1. components/arbitrage/keitaro-widget.tsx
   - Real-time stats
   - Charts (Recharts)
   - Alert indicators
   
2. components/arbitrage/webmaster-score.tsx
   - Score breakdown
   - Grade badges (Gold/Silver/Bronze)
   - Trend chart

Должно обновляться каждые 30 секунд.
Готов?
```

---

## 💡 Полезные команды

### Development
```bash
# Start everything
pnpm dev

# Just API
cd apps/api && pnpm dev

# Just Web
cd apps/web && pnpm dev

# Prisma Studio (DB GUI)
pnpm db:studio
```

### Testing
```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Database
```bash
# Push schema changes
pnpm db:push

# Create migration
pnpm db:migrate

# Reset DB (careful!)
pnpm db:reset
```

### Quality
```bash
# Lint
pnpm lint

# Format
pnpm format

# Type check
pnpm type-check

# Build
pnpm build
```

---

## 🔍 Проверка прогресса

### После Day 1-2
```bash
✅ Database schema deployed
✅ Can create custom object
✅ Can add fields to object
✅ Can create/edit records
✅ Table view works
✅ Search/filters work
✅ Real-time updates work
✅ Can login/logout
```

### После Day 3-4
```bash
✅ Can create project
✅ Can create tasks
✅ Board view works
✅ Can drag tasks
✅ Can create subtasks
✅ Can add comments
✅ Can track time
✅ Pipeline works
✅ Lead scoring calculates
```

### После Day 5-6
```bash
✅ Keitaro connects
✅ Campaigns sync
✅ Stats display
✅ Webmaster scores calculate
✅ Offers load
✅ Analytics dashboard renders
✅ AI insights work
```

### После Day 7-8
```bash
✅ All tests pass
✅ Build succeeds
✅ Mobile responsive
✅ Performance good (<200ms)
✅ Documentation complete
✅ Docker works
✅ Ready for production
```

---

## 🚨 Troubleshooting

### Database connection failed
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check connection string
echo $DATABASE_URL

# Restart PostgreSQL
docker compose restart postgres
```

### Redis connection failed
```bash
# Check Redis is running
docker compose ps redis

# Test connection
redis-cli ping
# Should return PONG
```

### Frontend won't start
```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Reinstall dependencies
pnpm install

# Check environment variables
cat apps/web/.env.local
```

### Real-time not working
```bash
# Check Socket.io connection in browser console
# Should see: "Socket connected"

# Check CORS settings
# CORS_ORIGIN should match frontend URL

# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:3001/socket.io/
```

---

## 📞 Поддержка

Если что-то идет не так:
1. Проверь логи: `docker compose logs -f`
2. Проверь консоль браузера
3. Проверь Swagger docs: http://localhost:3001/api
4. Спроси у Claude Code - он поможет debug!

---

**Готов строить будущее? Запускай! 🚀**
