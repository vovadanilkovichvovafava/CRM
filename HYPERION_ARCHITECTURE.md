# HYPERION — Enterprise Platform Architecture

> Operating System for Affiliate Business Operations
> Version: 0.1 Draft
> Author: Claude (Tech Lead) + Alex (COO/Architect)

---

## 0. INFRASTRUCTURE OVERVIEW

> Hyperion — бог света, который видит всё сверху. Платформа управления бизнесом.
> Saturn — PaaS инфраструктура, на которой всё живёт.

### Ecosystem Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMPANY TECH ECOSYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         HYPERION                                     │   │
│   │              "Бог света — видит всё сверху"                         │   │
│   │         ═══════════════════════════════════════════                 │   │
│   │         UNIFIED BUSINESS MANAGEMENT PLATFORM                        │   │
│   │                                                                      │   │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│   │   │ Analytics│ │    HR    │ │  Tasks   │ │ Finance  │ │   CRM    │ │   │
│   │   │ (Keitaro)│ │ (HR-bot) │ │(ClickUp) │ │          │ │          │ │   │
│   │   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │   │
│   │        │            │            │            │            │        │   │
│   │        └────────────┴─────┬──────┴────────────┴────────────┘        │   │
│   │                           │                                          │   │
│   │                    ┌──────┴──────┐                                  │   │
│   │                    │ HYPERION    │                                  │   │
│   │                    │   CORE      │                                  │   │
│   │                    │ ──────────  │                                  │   │
│   │                    │ • Auth/SSO  │                                  │   │
│   │                    │ • Permissions│                                 │   │
│   │                    │ • Org Model │                                  │   │
│   │                    │ • AI Layer  │                                  │   │
│   │                    │ • Search    │                                  │   │
│   │                    └─────────────┘                                  │   │
│   │                                                                      │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    │ deployed on                             │
│                                    ▼                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                           SATURN                                      │  │
│   │                  "Self-hosted PaaS Platform"                         │  │
│   │              ═══════════════════════════════════                     │  │
│   │              Based on Coolify — Deploy anything                      │  │
│   │                                                                       │  │
│   │   ┌─────────────────────────────────────────────────────────────┐   │  │
│   │   │                    DEPLOYED SERVICES                         │   │  │
│   │   ├─────────────────────────────────────────────────────────────┤   │  │
│   │   │                                                              │   │  │
│   │   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │  │
│   │   │  │ HYPERION │ │ HR-bot   │ │Prometheus│ │ SEO Gen  │       │   │  │
│   │   │  │ Platform │ │ (legacy) │ │ Learning │ │          │       │   │  │
│   │   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │  │
│   │   │                                                              │   │  │
│   │   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │  │
│   │   │  │ Google   │ │ Podcast  │ │ Keitaro  │ │ iGaming  │       │   │  │
│   │   │  │ Auto-reg │ │    AI    │ │ (future) │ │  Lands   │       │   │  │
│   │   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │  │
│   │   │                                                              │   │  │
│   │   └─────────────────────────────────────────────────────────────┘   │  │
│   │                                                                       │  │
│   │   ┌─────────────────────────────────────────────────────────────┐   │  │
│   │   │                    INFRASTRUCTURE                            │   │  │
│   │   ├─────────────────────────────────────────────────────────────┤   │  │
│   │   │  PostgreSQL │ Redis │ MinIO (S3) │ Traefik │ Docker        │   │  │
│   │   └─────────────────────────────────────────────────────────────┘   │  │
│   │                                                                       │  │
│   └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    │ runs on                                 │
│                                    ▼                                         │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                        BARE METAL / VPS                                │ │
│   │                    ═══════════════════════════                         │ │
│   │           Company-owned servers / Hetzner / OVH                        │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Product Naming Convention (Saturn's Moons)

| Product | Moon | Meaning | Description |
|---------|------|---------|-------------|
| **Saturn** | Saturn itself | Бог времени | PaaS Platform (Coolify fork) |
| **Hyperion** | Hyperion | "Над всем", бог света | Unified Business Platform |
| **Prometheus** | Prometheus | Предвидение | Learning Platform (Вова) |
| **Titan** | Titan | Гигант | Custom Tracker (future Keitaro replacement) |
| **Janus** | Janus | Бог врат, два лица | API Gateway / Auth Service |
| **Rhea** | Rhea | Мать богов | Data Lake / Analytics Engine |
| **Dione** | Dione | Богиня | Mobile App (future) |
| **Enceladus** | Enceladus | Скрытая сила | Background Jobs / Workers |

### Current vs Future State

```
CURRENT STATE (January 2026)
─────────────────────────────────────────────────────────────────────────────
✓ Saturn (Coolify)     — deployed, working, self-hosted PaaS
✓ HR-bot               — production on Railway, moving to Saturn
✓ Prometheus           — learning platform by Vova
✓ Google Auto-reg      — Klim's project, testing
○ SEO Generator        — in development
○ Podcast AI           — in development

FUTURE STATE (Q2-Q4 2026)
─────────────────────────────────────────────────────────────────────────────
★ Hyperion Platform    — unified business management (this document)
  ├── Analytics Module — Keitaro integration, then custom Titan tracker
  ├── HR Module        — HR-bot migrated and enhanced
  ├── Tasks Module     — ClickUp replacement
  ├── Finance Module   — budgets, expenses, payouts
  └── CRM Module       — partners, advertisers

★ All services on Saturn — no external hosting dependencies
★ Single Sign-On       — one account for everything (Janus)
★ Unified Permissions  — ABAC across all products
```

### Technology Decisions

```
WHY SELF-HOSTED (Saturn)?
─────────────────────────────────────────────────────────────────────────────
✓ Full control        — data stays inside company
✓ Cost efficiency     — no per-seat SaaS fees for 120+ people
✓ Customization       — build exactly what we need
✓ Integration         — all services talk to each other natively
✓ Security            — sensitive affiliate data never leaves our servers
✓ Speed               — local network, no external API latency

WHY NOT JUST BUY SAAS?
─────────────────────────────────────────────────────────────────────────────
✗ ClickUp             — $7/user × 120 = $840/month, limited customization
✗ Salesforce          — $25+/user × 120 = $3000+/month, overkill
✗ Monday.com          — similar pricing, doesn't fit affiliate workflow
✗ Keitaro             — PHP, no enterprise features, limited API

TOTAL SAAS COST IF WE BOUGHT EVERYTHING:
  ClickUp:    $840/mo
  CRM:        $1500/mo
  HR system:  $500/mo
  Analytics:  $1000/mo
  ─────────────────────
  TOTAL:      ~$4000/month = $48,000/year

VS SATURN + HYPERION:
  Server:     ~$300/mo (Hetzner dedicated)
  Dev time:   Internal R&D team
  ─────────────────────
  TOTAL:      ~$3600/year + dev investment

ROI: Custom platform pays for itself + we own the IP
```

---

## 1. BUSINESS CONTEXT

### Company Profile
- **Size:** 120+ employees
- **Industry:** Affiliate Marketing / Traffic Arbitrage
- **Structure:** Multi-department, isolated teams, complex hierarchy

### Departments
| Department | Head | Size (approx) | Isolation Level |
|------------|------|---------------|-----------------|
| Google Buyers | Head of Google | ~10 | Team-isolated |
| Facebook Buyers | Head of FB | ~10 | Team-isolated |
| Other Sources | Various | ~10 | Team-isolated |
| Tech | Tech Lead | ? | Cross-team |
| Mobile Dev | Mobile Lead | ? | Project-isolated |
| R&D | R&D Lead | ? | Experimental |
| Finance | CFO | ? | Highly restricted |
| HR | HR Lead | ? | Cross-team |
| Leadership | CEO x2, COO | 3 | Full access |

### Key Metrics (Keitaro-style)
- Clicks (total, unique)
- Conversions (CR%)
- Land → Offer conversion (пробитие)
- Spend
- Revenue
- ROI
- EPC (Earnings per click)
- By: campaign, source, geo, device, buyer, team, time

---

## 2. ARCHITECTURE PHILOSOPHY

### "Ferrari Principle"
```
┌─────────────────────────────────────────────────────────────┐
│                     EXTERIOR (UI)                            │
│  • Beautiful, minimal, intuitive                            │
│  • No visual clutter                                        │
│  • Progressive disclosure — complexity on demand            │
│  • Works for CEO checking high-level stats                  │
│  • Works for buyer drilling into campaign details           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     ENGINE (Backend)                         │
│  • Sophisticated, powerful, precise                         │
│  • Granular permissions (ABAC + RBAC hybrid)               │
│  • Real-time data processing                                │
│  • Audit trails everywhere                                  │
│  • Extensible module system                                 │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles
1. **Progressive Disclosure** — Simple by default, detailed on demand
2. **Context-Aware UI** — Show what's relevant to current user/role
3. **Keyboard + Mouse** — Power users get shortcuts, others use mouse
4. **Universal Shortcuts** — Ctrl (Win/Linux) / Cmd (Mac) automatically
5. **Mobile-Ready** — Responsive, touch-friendly
6. **Offline-Capable** — PWA with sync (future)

---

## 2.5. DESIGN PHILOSOPHY (Attio-Inspired)

> "Красота = Функциональность" — без эстетики это просто инструмент

### Core Design Beliefs

```
┌─────────────────────────────────────────────────────────────┐
│                  HYPERION DESIGN PHILOSOPHY                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. КРАСОТА = ФУНКЦИОНАЛЬНОСТЬ                              │
│     ─────────────────────────────────────────────────────   │
│     Не "красиво ИЛИ удобно", а "красиво ПОТОМУ ЧТО удобно" │
│     Каждый визуальный элемент несёт смысл                   │
│     Пустое пространство — это тоже дизайн                   │
│                                                              │
│  2. 50/50 ПОДХОД                                            │
│     ─────────────────────────────────────────────────────   │
│     50% решений из данных (аналитика, метрики, A/B)        │
│     50% из интуиции и вкуса (экспертиза, насмотренность)   │
│     Данные показывают ЧТО, интуиция — КАК                  │
│                                                              │
│  3. AHA-МОМЕНТЫ                                             │
│     ─────────────────────────────────────────────────────   │
│     Усиливать магические моменты анимацией и цветом        │
│     Первое сохранение → confetti / subtle celebration      │
│     Достижение цели → визуальное подтверждение             │
│     Но НЕ перебарщивать — subtle, not circus               │
│                                                              │
│  4. СИСТЕМНОЕ МЫШЛЕНИЕ                                      │
│     ─────────────────────────────────────────────────────   │
│     Каждая фича интегрируется в целое                      │
│     Нет изолированных "страниц" — всё связано              │
│     Данные текут, а не копируются                          │
│                                                              │
│  5. ДЕТАЛИ РЕШАЮТ                                           │
│     ─────────────────────────────────────────────────────   │
│     Hover state на каждой кнопке                           │
│     Правильный курсор в правильном месте                   │
│     Микро-анимации при переходах (150-300ms)               │
│     Loading states везде (skeleton, не spinner)            │
│                                                              │
│  6. "НЕИЗБЕЖНЫЙ" ДИЗАЙН                                     │
│     ─────────────────────────────────────────────────────   │
│     Пользователь думает: "конечно, это работает так"       │
│     Нет сюрпризов, нет "а как это сделать?"                │
│     Интуитивно понятно С ПЕРВОГО РАЗА                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Visual Language

```
ЦВЕТОВАЯ ФИЛОСОФИЯ
─────────────────────────────────────────────────────────────
Основа: Глубокий чёрный (#0a0a0a) — не серый, именно чёрный
Текст: Чистый белый (#fafafa) — контраст без напряжения
Акценты: Минимально, только для действий и статусов

  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
  │  Blue  │  │ Green  │  │ Amber  │  │  Red   │
  │ Action │  │Success │  │Warning │  │ Danger │
  └────────┘  └────────┘  └────────┘  └────────┘

Правило: Если всё яркое — ничего не выделяется


ТИПОГРАФИКА
─────────────────────────────────────────────────────────────
Font: Inter (или Plus Jakarta Sans)
Weights: 400 (body), 500 (emphasis), 600 (headings)
NO: 300 (слишком тонкий), 700+ (слишком жирный)

Размеры:
  12px — мета-информация, timestamps
  14px — основной текст, таблицы  ← БАЗА
  16px — заголовки секций
  20px — заголовки страниц
  24px+ — только hero-элементы (редко)


ПРОСТРАНСТВО
─────────────────────────────────────────────────────────────
Базовая единица: 4px
Padding внутри элементов: 8px, 12px, 16px
Gap между элементами: 8px, 16px, 24px
Секции: 32px, 48px между ними

Правило: Больше воздуха = легче дышать
         Сжатый UI = стресс


АНИМАЦИИ
─────────────────────────────────────────────────────────────
Hover: 150ms ease
Expand/Collapse: 200ms ease-out
Page transitions: 300ms ease-in-out
Modal appear: 200ms с небольшим scale (0.95 → 1)

Правило: Анимация должна помогать, а не развлекать
         Если можно без анимации — не делай

Framer Motion примеры:
  // Fade in
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}

  // Slide up (для toast, modal)
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}

  // Scale on hover (для cards)
  whileHover={{ scale: 1.01 }}  // subtle!
  whileTap={{ scale: 0.99 }}


ИКОНКИ
─────────────────────────────────────────────────────────────
Style: Lucide icons (или Phosphor)
Size: 16px (inline), 20px (buttons), 24px (navigation)
Stroke: 1.5px — не слишком тонкий, не слишком толстый
Color: Всегда inherit от текста (не хардкод)
```

### Component Personality

```
КНОПКИ
─────────────────────────────────────────────────────────────
Primary: Заполненная, акцентный цвет
  → Только для ГЛАВНОГО действия на странице (одна!)

Secondary: Обводка, без заливки
  → Для важных, но не главных действий

Ghost: Только текст + hover background
  → Для третьестепенных действий

Правило: Если 3+ primary кнопок на странице — передизайн


КАРТОЧКИ
─────────────────────────────────────────────────────────────
Border: 1px solid rgba(255,255,255,0.06) — почти невидимая
Background: Чуть светлее основного фона (#141414)
Hover: Чуть ещё светлее (#1c1c1c) + cursor: pointer
Shadow: Нет или очень мягкая

Правило: Карточка выделяется КОНТЕНТОМ, не рамкой


ТАБЛИЦЫ
─────────────────────────────────────────────────────────────
Headers: Uppercase, 11-12px, text-secondary, letter-spacing
Rows: Zebra striping (через одну) или hover-only highlight
Borders: Только горизонтальные, тонкие
Actions: Появляются на hover строки (не всегда видны)

Правило: Данные важнее декора


ФОРМЫ
─────────────────────────────────────────────────────────────
Labels: Над полем, не placeholder
Inputs: Тёмный фон, светлая обводка на focus
Validation: Inline, сразу после потери фокуса
Required: Красная звёздочка (*)

Правило: Пользователь должен понять что заполнять ДО клика


EMPTY STATES
─────────────────────────────────────────────────────────────
Не просто "Нет данных" — это возможность!

  ┌─────────────────────────────────────────┐
  │                                         │
  │            📋                           │
  │                                         │
  │     Пока нет задач                     │
  │     Создайте первую, чтобы начать      │
  │                                         │
  │     [+ Создать задачу]                 │
  │                                         │
  └─────────────────────────────────────────┘

Правило: Empty state = onboarding opportunity
```

---

## 2.6. AI LAYER ARCHITECTURE

> "AI предлагает, человек решает" — Bounded Autonomy

### AI Philosophy for Hyperion

```
┌─────────────────────────────────────────────────────────────┐
│                    AI LAYER PRINCIPLES                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. BOUNDED AUTONOMY                                        │
│     ─────────────────────────────────────────────────────   │
│     AI НИКОГДА не принимает решения за пользователя        │
│     AI предлагает → пользователь подтверждает              │
│     Критические действия = только после confirm             │
│                                                              │
│  2. 90/10 BALANCE (Gartner 2026 рекомендация)              │
│     ─────────────────────────────────────────────────────   │
│     90% — детерминированные workflows                      │
│         → Предсказуемые, надёжные, быстрые                 │
│         → Автоматизация рутины БЕЗ AI                      │
│                                                              │
│     10% — настоящие AI агенты                              │
│         → Там где реально нужна "умность"                  │
│         → Natural language понимание                       │
│         → Анализ паттернов и аномалий                      │
│                                                              │
│  3. TRANSPARENT AI                                          │
│     ─────────────────────────────────────────────────────   │
│     Пользователь ВСЕГДА знает когда видит AI               │
│     "✨ AI suggestion" — явная маркировка                   │
│     Показываем reasoning: "потому что ROI < 100%"          │
│                                                              │
│  4. GRACEFUL DEGRADATION                                    │
│     ─────────────────────────────────────────────────────   │
│     Если AI недоступен — система работает                  │
│     AI = enhancement, не core functionality                │
│     Fallback на rule-based всегда                          │
│                                                              │
│  5. HUMAN-IN-THE-LOOP                                       │
│     ─────────────────────────────────────────────────────   │
│     High-stakes decisions: AI → Human → Action             │
│     Low-stakes: AI → Auto (с возможностью undo)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### AI Features in Hyperion

```
WHERE AI HELPS (The 10%)
─────────────────────────────────────────────────────────────

1. NATURAL LANGUAGE QUERIES (Command Palette)
   ┌─────────────────────────────────────────────────────┐
   │ 🔍 покажи топ 5 баеров по ROI за эту неделю        │
   ├─────────────────────────────────────────────────────┤
   │ ✨ AI понял: Analytics → Buyers → Sort by ROI       │
   │    → Filter: This week                              │
   │    → Limit: 5                                       │
   │                                                     │
   │ [Показать результат]  [Изменить запрос]            │
   └─────────────────────────────────────────────────────┘

2. ANOMALY DETECTION (Smart Alerts)
   ┌─────────────────────────────────────────────────────┐
   │ ⚠️ AI Alert                                         │
   │                                                     │
   │ Кампания "US_iOS_v3" показывает необычное          │
   │ падение CR: 5.2% → 2.1% за последние 2 часа        │
   │                                                     │
   │ Возможные причины:                                 │
   │ • Landing page недоступен (проверено: ОК)          │
   │ • Изменение в источнике трафика                    │
   │ • Сезонный паттерн (не совпадает)                 │
   │                                                     │
   │ [Посмотреть детали]  [Отложить]  [Игнорировать]   │
   └─────────────────────────────────────────────────────┘

3. SMART SUGGESTIONS (Context-Aware)
   ┌─────────────────────────────────────────────────────┐
   │ ✨ Suggestion                                       │
   │                                                     │
   │ Кандидат Иван Петров ждёт фидбек 5 дней.          │
   │ Обычно вы отвечаете за 2-3 дня.                   │
   │                                                     │
   │ [Написать фидбек]  [Напомнить завтра]             │
   └─────────────────────────────────────────────────────┘

4. AUTO-CATEGORIZATION
   • Новый кандидат → AI определяет подходящие вакансии
   • Новая задача → AI предлагает проект и приоритет
   • Новый расход → AI категоризирует

   Но: Всегда с возможностью изменить!

5. REPORT GENERATION
   User: "Сделай отчёт по Google команде за январь"
   AI: Генерирует PDF/презентацию с ключевыми метриками
       Включает графики, сравнения, выводы


WHERE AI DOESN'T HELP (The 90%)
─────────────────────────────────────────────────────────────

• CRUD операции — просто делай, не думай
• Навигация — роутинг, меню, переходы
• Фильтрация — пользователь знает что ищет
• Сортировка — детерминированная логика
• Валидация — правила, не AI
• Permissions — код, не нейросеть
• Расчёты — математика, не предсказания
• Интеграции — API, не magic
```

### AI Technical Implementation

```yaml
AI Stack:
  LLM:
    primary: Claude API (Anthropic)
    fallback: GPT-4o (OpenAI)
    local: Ollama for sensitive data (optional)

  Embeddings:
    model: text-embedding-3-small (OpenAI) or E5
    storage: pgvector extension in PostgreSQL

  Vector Search:
    similar candidates for vacancy
    similar campaigns by performance pattern
    semantic search across all text

  Structured Output:
    Instructor library (Python) for typed responses
    JSON Schema validation

  Cost Control:
    caching: Redis для повторяющихся запросов
    batching: Группировка мелких запросов
    tiering: Haiku для простого, Opus для сложного
    rate_limiting: Per-user, per-feature limits

AI Endpoints:
  /ai/query          # Natural language → structured query
  /ai/suggest        # Context → suggestions
  /ai/analyze        # Data → insights
  /ai/generate       # Template → content
  /ai/embed          # Text → vector

Security:
  - PII stripping before sending to external AI
  - Audit log for all AI interactions
  - User consent for AI features (opt-in)
  - On-prem option for sensitive deployments
```

### AI UX Patterns

```
LOADING STATE (AI is thinking)
─────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────┐
│ ✨ Analyzing...                                         │
│ ████████░░░░░░░░░░░░                                   │
│                                                         │
│ • Reading campaign data                                │
│ • Comparing with historical patterns                   │
│ • Generating insights                                  │
└─────────────────────────────────────────────────────────┘

Правило: Показывай ЧТО делает AI, не просто "Loading..."


CONFIDENCE INDICATOR
─────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────┐
│ ✨ AI Suggestion (High confidence)                      │
│                                                         │
│ Этот кандидат хорошо подходит для вакансии            │
│ "Senior Media Buyer"                                   │
│                                                         │
│ Match: ████████████░░ 87%                              │
│                                                         │
│ Причины:                                               │
│ ✓ 3+ года опыта в FB Ads                              │
│ ✓ Работал с бюджетами $50K+                           │
│ ✓ Знает Keitaro                                       │
│ ○ Нет опыта в Google Ads (желательно)                 │
└─────────────────────────────────────────────────────────┘


ERROR / UNCERTAINTY
─────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────┐
│ ⚠️ AI не уверен                                        │
│                                                         │
│ Недостаточно данных для анализа.                      │
│ Нужно минимум 7 дней статистики.                      │
│                                                         │
│ [Показать что есть]  [Напомнить позже]                │
└─────────────────────────────────────────────────────────┘

Правило: Лучше сказать "не знаю" чем выдать bullshit
```

---

## 2.7. DEVELOPMENT PHILOSOPHY — "FIRST" APPROACH

> "Порядок имеет значение. То, что делаешь первым — определяет всё остальное."

### The "First" Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│              HYPERION DEVELOPMENT PRIORITIES                  │
│                  (в порядке важности)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1️⃣  DESIGN-FIRST                                           │
│      ─────────────────────────────────────────────────────  │
│      Перед кодом — дизайн. Всегда.                         │
│      Figma/эскиз → Review → Только потом код               │
│      Если нет дизайна — не начинай разработку              │
│                                                              │
│  2️⃣  ANIMATION-FIRST                                        │
│      ─────────────────────────────────────────────────────  │
│      Анимации — не "добавим потом". Это часть дизайна.     │
│      Планируй transitions ДО написания компонента          │
│      initial → animate → exit для каждого состояния        │
│                                                              │
│  3️⃣  AI-FIRST                                               │
│      ─────────────────────────────────────────────────────  │
│      Где AI может помочь — он должен помочь                │
│      Но 90/10 баланс: детерминированное > магия            │
│      AI предлагает, человек решает                         │
│                                                              │
│  4️⃣  KEYBOARD-FIRST                                         │
│      ─────────────────────────────────────────────────────  │
│      Power users живут на клавиатуре                       │
│      ⌘K / Ctrl+K — главный паттерн                         │
│      Каждое действие = keyboard shortcut                   │
│                                                              │
│  5️⃣  MOBILE-FIRST (Responsive)                             │
│      ─────────────────────────────────────────────────────  │
│      Начинай с mobile breakpoint                           │
│      Расширяй для desktop, не сужай                        │
│      Touch-friendly по умолчанию                           │
│                                                              │
│  6️⃣  PERFORMANCE-FIRST                                      │
│      ─────────────────────────────────────────────────────  │
│      Оптимизация — не рефакторинг "потом"                  │
│      Lazy loading, code splitting, caching сразу           │
│      Измеряй перед оптимизацией (не premature)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Design-First Workflow

```
ПРАВИЛЬНЫЙ WORKFLOW:
─────────────────────────────────────────────────────────────

1. CONCEPT
   └─► Описание фичи → что пользователь хочет достичь
   └─► User story: "Как [роль], я хочу [действие], чтобы [цель]"

2. DESIGN
   └─► Low-fi wireframe (бумага/iPad/Excalidraw)
   └─► Review с Alex: "Это то что нужно?"
   └─► Hi-fi mockup (Figma / code prototype)
   └─► Продумать ВСЕ состояния:
       • Default
       • Hover
       • Active/Selected
       • Disabled
       • Loading
       • Error
       • Empty
       • Success

3. ANIMATION SPEC
   └─► Какие элементы анимируются?
   └─► Timing: duration, easing, delay
   └─► Stagger для списков
   └─► Page transitions
   └─► Micro-interactions (hover, click, focus)

4. IMPLEMENTATION
   └─► Компонент с анимацией СРАЗУ (не "добавлю потом")
   └─► Все состояния реализованы
   └─► Keyboard navigation работает
   └─► Responsive проверен

5. REVIEW
   └─► Визуальный diff с дизайном
   └─► Проверка анимаций
   └─► Performance audit
   └─► Accessibility check


НЕПРАВИЛЬНЫЙ WORKFLOW:
─────────────────────────────────────────────────────────────

❌ "Давай быстро накидаем, потом причешем"
   → Никогда не причёсывается, живёт вечно

❌ "Анимации добавим в конце"
   → В конце нет времени, релизим без них

❌ "На дизайн нет времени"
   → Без дизайна = переделывать 3 раза

❌ "Сначала функционал, потом UX"
   → Плохой UX = фичу не используют
```

### Animation-First Specification

```
ДЛЯ КАЖДОГО КОМПОНЕНТА ОПРЕДЕЛИ:
─────────────────────────────────────────────────────────────

1. MOUNT ANIMATION (появление)
   ┌─────────────────────────────────────────────────────┐
   │ initial={{ opacity: 0, y: 20 }}                     │
   │ animate={{ opacity: 1, y: 0 }}                      │
   │ transition={{ duration: 0.3, ease: "easeOut" }}     │
   └─────────────────────────────────────────────────────┘

2. UNMOUNT ANIMATION (исчезновение)
   ┌─────────────────────────────────────────────────────┐
   │ exit={{ opacity: 0, y: -10 }}                       │
   │ transition={{ duration: 0.2 }}                      │
   └─────────────────────────────────────────────────────┘

3. STATE TRANSITIONS
   ┌─────────────────────────────────────────────────────┐
   │ Loading → Content:  fade + scale                    │
   │ Error → Retry:      shake + fade                    │
   │ Success:            scale pulse + checkmark         │
   └─────────────────────────────────────────────────────┘

4. HOVER/FOCUS STATES
   ┌─────────────────────────────────────────────────────┐
   │ Cards:      scale(1.01) + shadow increase           │
   │ Buttons:    background transition 150ms             │
   │ Links:      underline slide-in                      │
   │ Rows:       background color fade                   │
   └─────────────────────────────────────────────────────┘

5. LIST ANIMATIONS (stagger)
   ┌─────────────────────────────────────────────────────┐
   │ staggerChildren: 0.05                               │
   │ delayChildren: 0.1                                  │
   │ // Каждый item появляется с задержкой               │
   └─────────────────────────────────────────────────────┘


TIMING GUIDELINES:
─────────────────────────────────────────────────────────────

Instant feedback (hover, active):     100-150ms
UI transitions (expand, collapse):    200-300ms
Page transitions:                     300-400ms
Complex animations:                   400-600ms
Emphasis (celebration):               600-1000ms

Easing:
  easeOut    — для появления (быстро в начале)
  easeIn     — для исчезновения (быстро в конце)
  easeInOut  — для перемещения (плавно)
  spring     — для bouncy эффектов (Framer Motion)


ANIMATION BUDGET:
─────────────────────────────────────────────────────────────

Правило: 60fps или не делай вообще

Тяжёлые свойства (избегай):
  • width, height (layout thrashing)
  • top, left (используй transform)
  • box-shadow (compositing)

Лёгкие свойства (используй):
  • transform (translate, scale, rotate)
  • opacity
  • filter (с осторожностью)
```

### AI-First Integration Points

```
ГДЕ AI ВСТРАИВАЕТСЯ В КАЖДУЮ ФИЧУ:
─────────────────────────────────────────────────────────────

При проектировании ЛЮБОЙ фичи спроси себя:

1. SEARCH & DISCOVERY
   ┌─────────────────────────────────────────────────────┐
   │ "Может ли AI помочь найти это быстрее?"            │
   │                                                     │
   │ Примеры:                                           │
   │ • Поиск кандидата → AI: "найди похожих на Ивана"  │
   │ • Поиск кампании → AI: "покажи убыточные за неделю"│
   │ • Поиск задачи → AI: "мои просроченные задачи"    │
   └─────────────────────────────────────────────────────┘

2. DATA ENTRY
   ┌─────────────────────────────────────────────────────┐
   │ "Может ли AI заполнить это за пользователя?"       │
   │                                                     │
   │ Примеры:                                           │
   │ • Новый кандидат → AI парсит резюме               │
   │ • Новая задача → AI предлагает проект и теги      │
   │ • Новый расход → AI категоризирует               │
   └─────────────────────────────────────────────────────┘

3. ANALYSIS & INSIGHTS
   ┌─────────────────────────────────────────────────────┐
   │ "Может ли AI показать то, что человек не заметит?" │
   │                                                     │
   │ Примеры:                                           │
   │ • Dashboard → AI: "ROI падает 3 дня подряд"       │
   │ • HR → AI: "Кандидат ждёт ответа 7 дней"          │
   │ • Tasks → AI: "Этот проект выбивается из графика" │
   └─────────────────────────────────────────────────────┘

4. ACTIONS & SUGGESTIONS
   ┌─────────────────────────────────────────────────────┐
   │ "Может ли AI предложить следующее действие?"       │
   │                                                     │
   │ Примеры:                                           │
   │ • После интервью → AI: "Написать фидбек?"         │
   │ • Низкий ROI → AI: "Пауза кампании?"              │
   │ • Задача закрыта → AI: "Обновить связанные?"      │
   └─────────────────────────────────────────────────────┘

5. COMMUNICATION
   ┌─────────────────────────────────────────────────────┐
   │ "Может ли AI помочь с коммуникацией?"              │
   │                                                     │
   │ Примеры:                                           │
   │ • Отказ кандидату → AI генерирует письмо          │
   │ • Еженедельный отчёт → AI собирает из данных      │
   │ • Комментарий к задаче → AI предлагает шаблон     │
   └─────────────────────────────────────────────────────┘


AI INTEGRATION CHECKLIST (для каждой фичи):
─────────────────────────────────────────────────────────────

[ ] Определены точки AI-assistance
[ ] AI suggestions визуально помечены (✨)
[ ] Fallback если AI недоступен
[ ] Пользователь может отключить AI hints
[ ] AI действия требуют подтверждения
[ ] Confidence level показан где уместно
```

### Keyboard-First Implementation

```
КАЖДЫЙ КОМПОНЕНТ ДОЛЖЕН:
─────────────────────────────────────────────────────────────

1. БЫТЬ ФОКУСИРУЕМЫМ
   ┌─────────────────────────────────────────────────────┐
   │ tabIndex={0}  // если интерактивный                │
   │ tabIndex={-1} // если программный фокус            │
   │ role="button" // если div ведёт себя как кнопка    │
   └─────────────────────────────────────────────────────┘

2. ИМЕТЬ VISIBLE FOCUS STATE
   ┌─────────────────────────────────────────────────────┐
   │ focus-visible:ring-2                               │
   │ focus-visible:ring-purple-500                      │
   │ focus-visible:ring-offset-2                        │
   │ // Видно только с клавиатуры, не с мыши           │
   └─────────────────────────────────────────────────────┘

3. ПОДДЕРЖИВАТЬ KEYBOARD ACTIONS
   ┌─────────────────────────────────────────────────────┐
   │ Enter / Space  — activate                          │
   │ Escape         — close/cancel                      │
   │ Arrow keys     — navigate (lists, menus, tabs)     │
   │ Home / End     — first/last item                   │
   └─────────────────────────────────────────────────────┘

4. ПОКАЗЫВАТЬ SHORTCUTS В UI
   ┌─────────────────────────────────────────────────────┐
   │ // В тултипах:                                     │
   │ "Save (⌘S)"                                        │
   │                                                     │
   │ // В меню:                                         │
   │ New Task                           ⌘N              │
   │ Open Palette                       ⌘K              │
   └─────────────────────────────────────────────────────┘


GLOBAL SHORTCUTS (зарегистрировать на уровне App):
─────────────────────────────────────────────────────────────

// Navigation
⌘K / Ctrl+K      — Command Palette (ГЛАВНЫЙ)
⌘/ / Ctrl+/      — Show all shortcuts
G then H         — Go Home
G then A         — Go Analytics
G then T         — Go Tasks
G then P         — Go People

// Actions
⌘N / Ctrl+N      — New (context-aware)
⌘S / Ctrl+S      — Save
⌘Enter           — Submit / Confirm
Escape           — Close / Cancel

// Tables & Lists
J / ↓            — Next item
K / ↑            — Previous item
Enter            — Open/Edit
Space            — Select/Toggle
⌘A / Ctrl+A      — Select all
Delete           — Delete (with confirm)
```

### Component Development Template

```typescript
/**
 * HYPERION COMPONENT TEMPLATE
 *
 * Используй этот шаблон при создании ЛЮБОГО компонента
 */

// 1. IMPORTS
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { forwardRef } from 'react';

// 2. ANIMATION VARIANTS (определи ДО компонента)
const variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  hover: { scale: 1.01 },
  tap: { scale: 0.99 },
};

const transition = {
  duration: 0.2,
  ease: 'easeOut',
};

// 3. COMPONENT (forwardRef для keyboard focus)
export const MyComponent = forwardRef<HTMLDivElement, Props>(
  ({ children, onAction, ...props }, ref) => {

    // 4. KEYBOARD SHORTCUTS
    useHotkeys('enter', () => onAction?.(), {
      enabled: true,
      enableOnFormTags: false,
    });

    // 5. RENDER WITH MOTION
    return (
      <motion.div
        ref={ref}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover="hover"
        whileTap="tap"
        transition={transition}
        // 6. KEYBOARD ACCESSIBILITY
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onAction?.();
          }
        }}
        // 7. FOCUS STYLES (Tailwind)
        className="
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-purple-500
          focus-visible:ring-offset-2
          focus-visible:ring-offset-black
        "
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

// 8. LOADING STATE (отдельный компонент или состояние)
export const MyComponentSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="animate-pulse bg-white/5 rounded-lg"
  />
);

// 9. ERROR STATE
export const MyComponentError = ({ onRetry }: { onRetry: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <p>Something went wrong</p>
    <button onClick={onRetry}>Retry</button>
  </motion.div>
);

// 10. EMPTY STATE
export const MyComponentEmpty = ({ onCreate }: { onCreate: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-12"
  >
    <p className="text-gray-500 mb-4">No items yet</p>
    <button onClick={onCreate}>Create first</button>
  </motion.div>
);
```

### Quality Checklist (Before PR)

```
DESIGN ─────────────────────────────────────────────────────
[ ] Дизайн был утверждён перед началом разработки
[ ] Все состояния реализованы (default, hover, active, disabled, loading, error, empty)
[ ] Выглядит идентично дизайну (pixel-perfect где важно)
[ ] Dark theme работает корректно
[ ] Responsive: mobile, tablet, desktop проверены

ANIMATION ─────────────────────────────────────────────────
[ ] Mount/unmount анимации есть
[ ] Hover/focus transitions плавные (150-300ms)
[ ] Loading states используют skeleton, не spinner
[ ] AnimatePresence для conditional renders
[ ] 60fps на всех анимациях (проверить Performance tab)

AI ────────────────────────────────────────────────────────
[ ] AI integration points определены
[ ] AI suggestions помечены визуально (✨)
[ ] Работает без AI (graceful degradation)
[ ] AI actions требуют подтверждения

KEYBOARD ─────────────────────────────────────────────────
[ ] Все интерактивные элементы focusable
[ ] Tab order логичный
[ ] Enter/Space активируют элементы
[ ] Escape закрывает модалы/dropdowns
[ ] Shortcuts показаны в UI (тултипы, меню)
[ ] focus-visible стили видны

ACCESSIBILITY ────────────────────────────────────────────
[ ] Правильные ARIA roles
[ ] alt текст для изображений
[ ] Цветовой контраст достаточный
[ ] Screen reader тестирован (VoiceOver/NVDA)

PERFORMANCE ──────────────────────────────────────────────
[ ] Lazy loading для тяжёлых компонентов
[ ] Изображения оптимизированы
[ ] Bundle size проверен
[ ] Нет лишних re-renders (React DevTools)
```

---

## 3. MODULE SYSTEM

### Core Platform (Hyperion Core)
```
hyperion-core/
├── auth/           # Authentication, sessions, MFA
├── permissions/    # ABAC + RBAC engine
├── org/            # Organization structure, departments, teams
├── users/          # User profiles, preferences
├── audit/          # Activity logs, compliance
├── notifications/  # Push, email, telegram, in-app
├── integrations/   # External service connectors
├── search/         # Global search engine
├── files/          # File storage abstraction
└── api-gateway/    # Rate limiting, routing, versioning
```

### Business Modules (Pluggable)
```
hyperion-modules/
├── analytics/          # Keitaro-style traffic analytics
│   ├── tracker/        # Click tracking, redirects
│   ├── postbacks/      # Conversion tracking
│   ├── reports/        # Custom report builder
│   └── dashboards/     # Visual dashboards
│
├── hr/                 # HR & Recruitment (based on HR-bot)
│   │                   # ──────────────────────────────────
│   │                   # EXISTING (from HR-bot production):
│   │                   # ✓ Vacancies CRUD + stages
│   │                   # ✓ Candidates database + Telegram parsing
│   │                   # ✓ Kanban pipeline (drag-drop)
│   │                   # ✓ Application tracking
│   │                   # ✓ Entity system (quick-add)
│   │                   # ✓ Analytics dashboard
│   │                   # ✓ Telegram bot integration
│   │                   # ✓ Role-based access (Admin/HR/Viewer)
│   │                   # ──────────────────────────────────
│   ├── recruitment/    # Vacancies, candidates, pipeline
│   ├── onboarding/     # New employee flow (TO BUILD)
│   ├── org-chart/      # Visual org structure (TO BUILD)
│   ├── reviews/        # Performance reviews (TO BUILD)
│   └── analytics/      # HR metrics (EXTEND existing)
│
├── tasks/              # Task Management (ClickUp replacement)
│   ├── projects/       # Projects, boards
│   ├── tasks/          # Tasks, subtasks, checklists
│   ├── workflows/      # Custom workflows, automations
│   ├── time-tracking/  # Time logs
│   └── views/          # List, Board, Gantt, Calendar
│
├── finance/            # Financial operations
│   ├── budgets/        # Team budgets, limits
│   ├── expenses/       # Expense tracking
│   ├── payouts/        # Buyer payouts, bonuses
│   └── reports/        # P&L, cash flow
│
├── crm/                # Client/Partner Relations
│   ├── contacts/       # Partners, advertisers, networks
│   ├── deals/          # Deal pipeline
│   └── communications/ # Email, call logs
│
└── [future-modules]/   # Extensible
    ├── inventory/      # Creative assets, accounts
    ├── compliance/     # Legal, policy management
    └── learning/       # Internal training, docs
```

---

## 4. PERMISSION SYSTEM (Critical)

### Why Complex Permissions Matter
- Buyer A should NOT see Buyer B's campaigns
- Team Lead sees their team only
- Finance sees money data, not campaign details
- HR sees people data, not revenue
- CEO sees everything
- Some data is team-isolated, some is cross-team

### ABAC + RBAC Hybrid Model

```
┌─────────────────────────────────────────────────────────────┐
│                    PERMISSION ENGINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  RBAC Layer (Role-Based)                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Roles: CEO, COO, Head, TeamLead, Buyer, HR, Finance │   │
│  │ Each role has base permissions                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                          +                                   │
│  ABAC Layer (Attribute-Based)                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Attributes:                                          │   │
│  │ • user.department = "google_buyers"                  │   │
│  │ • user.team = "team_alpha"                          │   │
│  │ • resource.owner = user.id                          │   │
│  │ • resource.team = user.team                         │   │
│  │ • resource.sensitivity = "confidential"             │   │
│  └─────────────────────────────────────────────────────┘   │
│                          +                                   │
│  Context Layer                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • Time-based access (working hours only)            │   │
│  │ • Location-based (office IP only for finance)       │   │
│  │ • Device-based (trusted devices)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  Policy Decision Point (PDP)                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ALLOW if:                                            │   │
│  │   role.has_permission(action) AND                   │   │
│  │   attributes.match(policy) AND                      │   │
│  │   context.valid()                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Permission Policies (Examples)

```yaml
# Policy: Buyers see only their own campaigns
- name: buyer_campaign_isolation
  resource: analytics.campaign
  action: [read, update]
  condition:
    - resource.owner_id == user.id
    - OR resource.team_id == user.team_id AND user.role == "team_lead"
    - OR user.role IN ["head", "coo", "ceo"]

# Policy: Finance sees spend/revenue, not campaign details
- name: finance_data_access
  resource: analytics.*
  action: read
  condition:
    - user.department == "finance"
  fields_allowed:
    - spend
    - revenue
    - roi
    - payout
  fields_denied:
    - campaign_name
    - landing_url
    - offer_details

# Policy: HR sees org data, not business metrics
- name: hr_data_access
  resource: org.*
  action: [read, update]
  condition:
    - user.department == "hr"
  resource_denied:
    - analytics.*
    - finance.*

# Policy: Team isolation for buyer teams
- name: team_isolation
  resource: "*"
  action: "*"
  condition:
    - resource.team_id == user.team_id
    - OR user.has_cross_team_access == true
```

### Role Hierarchy

```
CEO (x2)
  └── COO (Alex)
        ├── Head of Google Buyers
        │     └── Team Leads
        │           └── Buyers
        ├── Head of Facebook Buyers
        │     └── Team Leads
        │           └── Buyers
        ├── Tech Lead
        │     └── Developers
        ├── Mobile Lead
        │     └── Mobile Devs
        ├── R&D Lead
        │     └── Researchers
        ├── CFO
        │     └── Finance Team
        └── HR Lead
              └── HR Team
```

### Special Access Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| **Self** | User sees only their own data | Buyer → own campaigns |
| **Team** | User sees their team's data | Team Lead → team campaigns |
| **Department** | User sees department data | Head → all buyers in dept |
| **Cross-team** | Explicit grant for cross access | Tech → all for debugging |
| **Global** | Sees everything | CEO, COO |
| **Functional** | Sees specific data type across org | Finance → all spend data |

---

## 5. DATA MODEL (Unified)

### Core Entities

```
┌─────────────────────────────────────────────────────────────┐
│                      PERSON (Central)                        │
├─────────────────────────────────────────────────────────────┤
│ id: uuid                                                     │
│ type: employee | candidate | partner | contact              │
│ status: active | inactive | archived                        │
│ personal: { name, email, phone, telegram, ... }             │
│ employment: { department, team, role, hire_date, ... }      │
│ recruitment: { vacancy_id, stage, ... } (if candidate)      │
│ partner: { company, type, ... } (if partner)                │
└─────────────────────────────────────────────────────────────┘
          │
          │ One person can be:
          │ • Employee (current)
          │ • Candidate (was recruited)
          │ • Partner contact (external)
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     ORGANIZATION                             │
├─────────────────────────────────────────────────────────────┤
│ Departments[] ──► Teams[] ──► Persons[]                     │
│                                                              │
│ Department: { id, name, head_id, parent_id }                │
│ Team: { id, name, department_id, lead_id }                  │
│ Position: { person_id, team_id, role, start_date }          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     ANALYTICS ENTITIES                       │
├─────────────────────────────────────────────────────────────┤
│ Campaign: { id, name, owner_id, team_id, source, status }   │
│ Click: { id, campaign_id, timestamp, ip, geo, device, ... } │
│ Conversion: { id, click_id, type, payout, timestamp }       │
│ Spend: { campaign_id, date, amount, source }                │
│ Report: { id, type, filters, owner_id, shared_with[] }      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     TASK ENTITIES                            │
├─────────────────────────────────────────────────────────────┤
│ Project: { id, name, team_id, status, visibility }          │
│ Task: { id, project_id, assignee_id, status, priority }     │
│ Comment: { id, task_id, author_id, content, timestamp }     │
│ TimeLog: { id, task_id, user_id, duration, date }           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     HR ENTITIES                              │
├─────────────────────────────────────────────────────────────┤
│ Vacancy: { id, title, department_id, status, requirements } │
│ Application: { id, vacancy_id, person_id, stage, score }    │
│ Interview: { id, application_id, interviewer_id, ... }      │
│ Onboarding: { id, person_id, checklist[], progress }        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     FINANCE ENTITIES                         │
├─────────────────────────────────────────────────────────────┤
│ Budget: { id, team_id, period, amount, spent }              │
│ Expense: { id, budget_id, amount, category, approved_by }   │
│ Payout: { id, person_id, amount, type, status }             │
└─────────────────────────────────────────────────────────────┘
```

### Data Relationships

```
Person ─┬─► Employee ─► Team ─► Department
        ├─► Candidate ─► Application ─► Vacancy
        └─► Partner ─► Deals

Campaign ─► Owner (Person)
        ─► Team
        ─► Clicks ─► Conversions
        ─► Spend

Task ─► Project ─► Team
     ─► Assignee (Person)
     ─► Comments
     ─► TimeLogs
```

---

## 6. TECH STACK

### Backend
```yaml
Core:
  runtime: Python 3.12+
  framework: FastAPI (async)
  orm: SQLAlchemy 2.0 + asyncpg
  migrations: Alembic
  validation: Pydantic v2

Database:
  primary: PostgreSQL 16 (main data)
  cache: Redis (sessions, cache, queues)
  search: Meilisearch (full-text search)
  timeseries: TimescaleDB extension (analytics)

Processing:
  queue: Redis + arq (async tasks)
  scheduler: APScheduler

Security:
  auth: JWT + refresh tokens
  mfa: TOTP (Google Authenticator)
  encryption: at-rest + in-transit

Integrations:
  tracker: Custom (Go for speed) or Keitaro API initially
  telegram: aiogram 3.x
  email: SMTP / SendGrid
  files: MinIO (S3-compatible)
```

### Frontend
```yaml
Framework: Next.js 15 (App Router)
Language: TypeScript 5.x (strict)
Styling: Tailwind CSS + CSS Variables
Components: shadcn/ui + custom design system
State:
  client: Zustand
  server: TanStack Query
Animation: Framer Motion
Charts: Recharts / Apache ECharts
Tables: TanStack Table
Forms: React Hook Form + Zod
Keyboard: cmdk (command palette)
```

### Infrastructure
```yaml
Hosting: Railway (start) → Kubernetes (scale)
CI/CD: GitHub Actions
Monitoring:
  metrics: Prometheus + Grafana
  logs: Loki
  errors: Sentry
  uptime: Better Uptime
```

### Future: Custom Tracker
```yaml
# High-performance click tracking
Language: Go or Rust
Database: ClickHouse (analytics) + Redis (real-time)
Features:
  - Sub-millisecond redirects
  - Real-time stats
  - Bot filtering
  - Geo/Device detection
  - Postback processing
  - Anti-fraud
```

---

## 7. UI/UX SYSTEM

### Design Tokens

```css
/* Colors - Dark theme primary */
--bg-primary: #0a0a0a;
--bg-secondary: #141414;
--bg-tertiary: #1c1c1c;
--bg-elevated: #242424;

--text-primary: #fafafa;
--text-secondary: #a1a1a1;
--text-tertiary: #6b6b6b;

--border-default: #2e2e2e;
--border-subtle: #1f1f1f;

--accent-primary: #3b82f6;    /* Blue */
--accent-success: #22c55e;    /* Green */
--accent-warning: #f59e0b;    /* Amber */
--accent-danger: #ef4444;     /* Red */

/* Typography */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */

/* Spacing - 4px base */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */

/* Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 6px rgba(0,0,0,0.3);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.3);

/* Transitions */
--transition-fast: 100ms ease;
--transition-base: 150ms ease;
--transition-slow: 300ms ease;
```

### Component Library

```
hyperion-ui/
├── primitives/          # Base building blocks
│   ├── Button
│   ├── Input
│   ├── Select
│   ├── Checkbox
│   ├── Radio
│   ├── Switch
│   ├── Slider
│   └── ...
│
├── layout/              # Page structure
│   ├── Sidebar
│   ├── Header
│   ├── PageContainer
│   ├── Card
│   ├── Modal
│   ├── Drawer
│   └── ...
│
├── data-display/        # Show information
│   ├── Table (DataTable)
│   ├── List
│   ├── Tree
│   ├── Badge
│   ├── Avatar
│   ├── Stat
│   ├── Chart
│   └── ...
│
├── navigation/          # Move around
│   ├── Tabs
│   ├── Breadcrumb
│   ├── Pagination
│   ├── CommandPalette   # ⌘K / Ctrl+K
│   └── ...
│
├── feedback/            # System responses
│   ├── Toast
│   ├── Alert
│   ├── Progress
│   ├── Skeleton
│   ├── Spinner
│   └── ...
│
├── patterns/            # Complex combinations
│   ├── DataTableWithFilters
│   ├── FormBuilder
│   ├── KanbanBoard
│   ├── GanttChart
│   ├── OrgChart
│   ├── MetricCard
│   └── ...
│
└── brand/               # Hyperion-specific
    ├── Logo
    ├── EmptyStates
    ├── Onboarding
    └── ...
```

### Keyboard Shortcuts (Universal)

```javascript
// Auto-detect platform
const mod = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';

const shortcuts = {
  // Global
  [`${mod}+K`]: 'Open command palette',
  [`${mod}+/`]: 'Show keyboard shortcuts',
  [`${mod}+.`]: 'Quick actions menu',

  // Navigation
  'G then H': 'Go to Home',
  'G then A': 'Go to Analytics',
  'G then T': 'Go to Tasks',
  'G then P': 'Go to People',

  // Actions
  [`${mod}+N`]: 'New item (context-aware)',
  [`${mod}+S`]: 'Save',
  [`${mod}+Enter`]: 'Submit / Confirm',
  'Escape': 'Close / Cancel',

  // Tables
  'J': 'Next row',
  'K': 'Previous row',
  'Enter': 'Open selected',
  [`${mod}+A`]: 'Select all',

  // Filters
  'F': 'Focus filter',
  [`${mod}+F`]: 'Global search',
};
```

### Command Palette (⌘K / Ctrl+K)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Type a command or search...                    ⌘K        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ QUICK ACTIONS                                               │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ ➕  Create new task                          ⌘+N     │    │
│ │ 📊  Open analytics dashboard                 G A     │    │
│ │ 👤  Find person...                           /p      │    │
│ │ 📋  My tasks                                 /mt     │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                              │
│ RECENT                                                       │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📊  Google Buyers Dashboard                          │    │
│ │ 👤  Иван Петров                                      │    │
│ │ 📋  Project: Q1 Scaling                              │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                              │
│ NATURAL LANGUAGE (AI)                                       │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ "покажи ROI за последнюю неделю по Google"          │    │
│ │ "кто свободен для интервью завтра"                  │    │
│ │ "топ 5 баеров по профиту"                           │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. PROGRESSIVE DISCLOSURE UI

### Level 1: Dashboard (CEO/COO View)
```
┌─────────────────────────────────────────────────────────────┐
│  HYPERION                              🔍 ⌘K    👤 Alex (COO) │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TODAY'S OVERVIEW                              Jan 26, 2026  │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ $124.5K │  │ $89.2K  │  │  139%   │  │   23    │        │
│  │ Revenue │  │  Spend  │  │   ROI   │  │  Hires  │        │
│  │  ↑ 12%  │  │  ↑ 8%   │  │  ↑ 4%   │  │ this mo │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  NEEDS ATTENTION                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  🔴 Campaign "US_iOS_v2" ROI dropped below 100%     │   │
│  │  🟡 3 candidates waiting for interview > 5 days     │   │
│  │  🟡 Budget approval pending: Google Team ($50K)     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  TOP PERFORMERS      │  │  TEAM HEALTH             │    │
│  │  ────────────────    │  │  ────────────────        │    │
│  │  1. Buyer A  $45K    │  │  Google: ████████░ 89%   │    │
│  │  2. Buyer B  $38K    │  │  FB:     ███████░░ 76%   │    │
│  │  3. Buyer C  $31K    │  │  Tech:   █████████░ 95%  │    │
│  └──────────────────────┘  └──────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Level 2: Department View (Head View)
```
┌─────────────────────────────────────────────────────────────┐
│  HYPERION › Analytics › Google Buyers        🔍 ⌘K    👤 Head │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GOOGLE BUYERS DEPARTMENT                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Filters: [Today ▼] [All Teams ▼] [All Geos ▼] +     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TEAM COMPARISON                                     │   │
│  │  ───────────────────────────────────────────────────│   │
│  │  Team      │ Spend   │ Revenue │ ROI   │ Conv     │   │
│  │  ──────────┼─────────┼─────────┼───────┼──────────│   │
│  │  Alpha     │ $23.4K  │ $31.2K  │ 133%  │ 4.2%     │   │
│  │  Beta      │ $18.1K  │ $22.8K  │ 126%  │ 3.8%     │   │
│  │  Gamma     │ $15.7K  │ $19.1K  │ 122%  │ 3.5%     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Click any row to drill down to team details]              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Level 3: Campaign Details (Buyer View)
```
┌─────────────────────────────────────────────────────────────┐
│  HYPERION › Campaign: US_iOS_Offer_v3        🔍 ⌘K   👤 Buyer │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  US_iOS_Offer_v3                           Status: 🟢 Active │
│  Owner: Me │ Source: Google │ Created: Jan 15               │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  2,847  │  │  $1.2K  │  │   147   │  │  5.16%  │        │
│  │ Clicks  │  │  Spend  │  │  Conv   │  │   CR    │        │
│  │  today  │  │  today  │  │  today  │  │         │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HOURLY BREAKDOWN                              [···] │   │
│  │  [Interactive chart with clicks, conv, spend]        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CLICK LOG                              [Export ↓]   │   │
│  │  ───────────────────────────────────────────────────│   │
│  │  Time    │ IP          │ Geo │ Device │ Conv       │   │
│  │  ────────┼─────────────┼─────┼────────┼────────────│   │
│  │  14:23   │ 192.168...  │ US  │ iOS    │ ✓ $8.50   │   │
│  │  14:22   │ 10.0.1...   │ US  │ iOS    │ -          │   │
│  │  [... more rows ...]                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. IMPLEMENTATION ROADMAP

### Phase 0: Foundation (Current)
- [x] HR-bot backend (FastAPI)
- [x] HR-bot frontend (React)
- [x] Basic auth & roles
- [x] Railway deployment

### Phase 1: Hyperion Core (4-6 weeks)
- [ ] Unified auth system (JWT + refresh + MFA)
- [ ] Permission engine (ABAC + RBAC)
- [ ] Organization structure (departments, teams)
- [ ] User management
- [ ] Audit logging
- [ ] Design system foundation
- [ ] Command palette (⌘K)

### Phase 2: HR Module Migration (2-3 weeks)
- [ ] Migrate HR-bot to Hyperion module
- [ ] Integrate with new permission system
- [ ] Update UI to design system
- [ ] Add missing features

### Phase 3: Analytics Module (4-6 weeks)
- [ ] Keitaro API integration (or mock data)
- [ ] Dashboard builder
- [ ] Custom reports
- [ ] Team/buyer views with permissions
- [ ] Real-time updates

### Phase 4: Task Module (3-4 weeks)
- [ ] Projects & tasks
- [ ] Board/List/Timeline views
- [ ] Workflows & automations
- [ ] Time tracking

### Phase 5: Finance Module (2-3 weeks)
- [ ] Budgets
- [ ] Expense tracking
- [ ] Payout management
- [ ] Reports

### Phase 6: Custom Tracker (8-12 weeks) - FUTURE
- [ ] Click tracking engine (Go/Rust)
- [ ] ClickHouse analytics
- [ ] Migration from Keitaro
- [ ] Advanced features

---

## 10. QUESTIONS FOR ALEX

1. **Keitaro Integration** — У вас есть API доступ к Keitaro? Или сначала работаем с mock data?

2. **Приоритет модулей** — В каком порядке важнее?
   - Analytics (Keitaro данные)
   - HR (уже есть)
   - Tasks (замена ClickUp)
   - Finance

3. **Деплой** — Railway продолжаем или сразу свой сервер?

4. **Домен** — Есть домен для Hyperion? (hyperion.yourcompany.com?)

5. **Команда** — Кто ещё будет работать над Hyperion? Только мы или есть devs?

---

## APPENDIX A: HR-BOT → HYPERION HR MODULE MIGRATION

> HR-bot — это не "тупо модуль", это production-ready система которая станет ядром People Management в Hyperion

### Current HR-bot Capabilities (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                    HR-BOT CURRENT STATE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BACKEND (FastAPI + SQLAlchemy 2.0 + PostgreSQL)            │
│  ─────────────────────────────────────────────────────────  │
│  ✓ Vacancies: CRUD, stages, requirements, departments       │
│  ✓ Candidates: DB, Telegram parsing, photo handling         │
│  ✓ Applications: Full pipeline, stage transitions           │
│  ✓ Entities: Quick-add candidates (simplified flow)         │
│  ✓ Analytics: Funnel metrics, hire rates, stage timing      │
│  ✓ Users: Admin/HR/Viewer roles, JWT auth                   │
│  ✓ Audit: Activity logging                                  │
│  ✓ Telegram Bot: aiogram 3.x, webhook                       │
│                                                              │
│  FRONTEND (React + TypeScript + TailwindCSS)                │
│  ─────────────────────────────────────────────────────────  │
│  ✓ Dashboard with metrics                                   │
│  ✓ Vacancies list + detail views                            │
│  ✓ Kanban board (drag-drop applications)                    │
│  ✓ Candidates table with filters                            │
│  ✓ Analytics charts (Recharts)                              │
│  ✓ Responsive design                                        │
│  ✓ Dark theme                                               │
│                                                              │
│  DEPLOYMENT                                                  │
│  ─────────────────────────────────────────────────────────  │
│  ✓ Railway (backend + frontend + PostgreSQL + Redis)        │
│  ✓ GitHub Actions CI/CD                                     │
│  ✓ Production URL: hr-bot-production-c613.up.railway.app   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Migration Strategy: HR-bot → Hyperion HR Module

```
PHASE 1: EXTRACTION (No Breaking Changes)
─────────────────────────────────────────────────────────────
1. Extract HR-bot backend into hyperion-modules/hr/
2. Keep existing API contracts
3. Add Hyperion Core dependencies (auth, permissions)
4. HR-bot continues working as standalone (backwards compat)

PHASE 2: INTEGRATION
─────────────────────────────────────────────────────────────
1. Replace HR-bot auth with Hyperion Core auth
2. Integrate Person model (candidate = person type)
3. Connect to Hyperion permission engine
4. Add cross-module links (candidate → future employee)

PHASE 3: ENHANCEMENT
─────────────────────────────────────────────────────────────
1. Redesign UI to Hyperion design system
2. Add AI features (candidate matching, smart suggestions)
3. Onboarding module (checklist, first-day flow)
4. Org chart visualization
5. Performance reviews

PHASE 4: FULL INTEGRATION
─────────────────────────────────────────────────────────────
1. Hired candidate → auto-create Employee in Hyperion
2. Employee → linked to Teams, Departments
3. HR analytics → part of Hyperion global analytics
4. Telegram bot → Hyperion notifications system
```

### Data Model Evolution

```
CURRENT (HR-bot standalone):
─────────────────────────────────────────────────────────────
Candidate {
  id, full_name, email, phone, telegram_id,
  source, resume_url, photo_url, notes,
  status, created_at
}

Vacancy {
  id, title, department, description,
  requirements, status, stages[]
}

Application {
  candidate_id, vacancy_id, stage,
  stage_order, feedback, created_at
}


FUTURE (Hyperion HR Module):
─────────────────────────────────────────────────────────────
Person {  // UNIFIED - used across Hyperion
  id, type: "candidate" | "employee" | "partner",
  personal: { name, email, phone, telegram, photo },
  ...
}

Candidate extends Person {
  source, resume_url, notes,
  skills[], experience[], education[]
}

Employee extends Person {
  department_id, team_id, position,
  hire_date, manager_id,
  onboarding_status, performance_reviews[]
}

// When candidate is hired:
Person.type: "candidate" → "employee"
// Same person, new type, history preserved
```

### What HR-bot Brings to Hyperion

```
VALUE ALREADY BUILT:
─────────────────────────────────────────────────────────────
✓ Proven recruitment workflow (Kanban, stages)
✓ Telegram integration (candidate sourcing)
✓ Analytics foundation (funnels, metrics)
✓ Role-based access patterns
✓ Production-tested code

WHAT HYPERION ADDS:
─────────────────────────────────────────────────────────────
+ Unified Person model (candidate → employee journey)
+ Enterprise permissions (ABAC + team isolation)
+ Cross-module insights (HR + Analytics + Finance)
+ AI enhancements (matching, suggestions)
+ Hyperion design system (Attio-inspired)
+ Global search (find anyone, anywhere)
+ Command palette integration
```

---

## APPENDIX B: Security Considerations

### Authentication Flow
```
1. User enters email/password
2. Server validates, returns access_token (15min) + refresh_token (7d)
3. Access token in memory (not localStorage!)
4. Refresh token in httpOnly cookie
5. Token refresh happens automatically
6. MFA required for: Finance, Admin, HR sensitive actions
```

### Data Encryption
- At rest: PostgreSQL TDE + application-level for sensitive fields
- In transit: TLS 1.3 everywhere
- Secrets: HashiCorp Vault or Railway secrets

### Audit Requirements
- Every data access logged (who, what, when, from where)
- Every permission check logged (especially denials)
- Retention: 2 years minimum
- Export capability for compliance

---

## APPENDIX C: Integration Points

### Current
- Telegram (aiogram) — notifications, HR bot
- Railway — hosting

### Planned
- Keitaro API — traffic data
- Google Workspace — SSO, Calendar
- Slack/Discord — notifications (optional)
- GitHub — dev workflow

### Future
- Custom tracker — replace Keitaro
- BI tools — data export
- Mobile app — React Native or Flutter
