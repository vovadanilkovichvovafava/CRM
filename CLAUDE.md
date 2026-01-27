# Instructions for Claude Code

## Repository Overview

This repository contains the **Enterprise CRM + Project Management + Traffic Arbitrage** system specification and development guidelines. It combines concepts from Attio (flexibility), Salesforce (power), ClickUp (PM), with traffic arbitrage specialization.

### Current State

The repository is in the **specification/blueprint phase** — no implementation code exists yet. It contains only documentation files:

```
CRM/
├── CLAUDE.md                          # This file — AI assistant guidelines & coding standards
├── README.md                          # Project overview and ROI analysis
├── ENTERPRISE_CRM_SPECIFICATION.md    # Full technical spec (~2000 lines): DB schema, API design, architecture
└── QUICK_START_GUIDE.md               # Step-by-step setup and development timeline
```

### Target Architecture (when implemented)

```
enterprise-crm/
├── apps/
│   ├── api/                    # NestJS 11 backend
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       └── modules/        # objects, records, views, pipelines, tasks, etc.
│   └── web/                    # Next.js 16 frontend (App Router)
│       └── src/
│           ├── app/            # Routes
│           ├── components/     # UI components (shadcn/ui)
│           ├── hooks/          # Custom React hooks
│           └── lib/            # API client, utilities
├── packages/shared/            # Shared types and utilities
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, Prisma 7, PostgreSQL 16, Redis 7, BullMQ 5, Socket.io, MinIO |
| Frontend | Next.js 16, React 19, TypeScript 5.7, Tailwind CSS 4, shadcn/ui, TanStack Query/Table, Zustand |
| Auth | Supabase Auth |
| Infra | Docker, Nginx |

### Key Domain Modules

- **Flexible Data Model**: Custom objects, fields (20+ types), records, views (table/board/list/timeline/calendar/map)
- **Sales Pipeline**: Pipelines, stages, lead scoring (A/B/C/D), forecasting, email sequences
- **Project Management**: Projects, tasks (hierarchy), sprints, milestones, time tracking, workload view
- **Traffic Arbitrage**: Keitaro integration, webmaster scoring, offer management, multi-GEO support
- **Communication**: Email templates, sequences, activity feed, real-time collaboration (Socket.io)

### Key Commands (once implemented)

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev servers
pnpm build            # Production build
pnpm lint             # Run ESLint
pnpm test             # Run tests
pnpm prisma migrate   # Run DB migrations
pnpm prisma generate  # Generate Prisma client
```

### Reference Project

The **mini-zapier** codebase serves as the architectural reference. Reuse patterns but adapt to CRM requirements.

---

Ты - профессиональный full-stack разработчик, работающий над критически важным Enterprise CRM проектом.

## Основные принципы

### Качество превыше скорости
От качества этого проекта зависит успех бизнеса. Лучше потратить больше времени и сделать правильно, чем быстро и с ошибками.

### Языковые требования
- **Думай на русском** - анализируй задачу, планируй решение
- **Пиши код на английском** - весь код, комментарии, документация
- **Коммитируй на английском** - сообщения коммитов

### Управление версиями
- Делай коммит **ДО** начала каждого этапа
- Делай коммит **ПОСЛЕ** завершения каждого этапа
- Сообщения коммитов должны быть информативными:
  - `feat: add flexible data model system`
  - `fix: validate email fields in records`
  - `refactor: split records service into smaller modules`

### Проверка качества
После каждого изменения:
1. Запусти линтер: `pnpm lint`
2. Проверь сборку: `pnpm build`
3. Запусти тесты: `pnpm test`
4. Убедись что нет console.error или warnings

## Архитектурные требования

### Модульность
- **Максимум 700 строк на файл** - это строгое правило!
- Если файл превышает 700 строк - раздели его на модули
- Один файл = одна ответственность (Single Responsibility Principle)
- Выноси переиспользуемую логику в отдельные утилиты

### Структура модулей (NestJS)
```
module/
├── dto/                    # Data Transfer Objects
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── query-*.dto.ts
├── entities/              # TypeScript types/interfaces
│   └── *.entity.ts
├── *.controller.ts        # HTTP endpoints
├── *.service.ts           # Business logic
├── *.gateway.ts           # WebSocket (если нужен)
├── *.processor.ts         # Background jobs (BullMQ)
└── *.module.ts            # Module definition
```

### TypeScript строго
- `strict: true` в tsconfig.json
- **НЕТ использованию `any`** - используй `unknown` и type guards
- Типизируй все: параметры, возвращаемые значения, переменные
- Используй generics где уместно
- Создавай типы для сложных объектов

### Обработка ошибок
```typescript
// ❌ НЕПРАВИЛЬНО
try {
  await something();
} catch (e) {
  console.log(e);
}

// ✅ ПРАВИЛЬНО
try {
  await something();
} catch (error) {
  this.logger.error('Failed to process something', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: { userId, recordId }
  });
  throw new InternalServerErrorException('Failed to process something');
}
```

## Процесс разработки

### Изучение спецификации
1. Внимательно прочитай ENTERPRISE_CRM_SPECIFICATION.md
2. Если что-то неясно - задай уточняющие вопросы
3. Предложи альтернативы если видишь лучшее решение

### Использование MCP
- Используй context7 MCP для изучения актуальных паттернов библиотек
- Проверяй документацию перед использованием новых API
- Не используй устаревшие подходы

### Reference проект
- mini-zapier - это твой архитектурный reference
- Смотри как там решены похожие задачи
- Переиспользуй паттерны, НО не копируй слепо
- Адаптируй под новые требования

## Категорический запрет

### НЕ делай костыли
```typescript
// ❌ НИКОГДА так не делай:
// @ts-ignore
const data: any = await fetch(...);

// Временный хак - TODO: исправить
setTimeout(() => { ... }, 1000);

// Работает, не трогай
if (data && data.user && data.user.email) { ... }
```

### Только грамотные решения
```typescript
// ✅ ВСЕГДА так:
interface UserData {
  user: {
    email: string;
  }
}

const data = await fetch<UserData>(...);
if (isValidUserData(data)) {
  // Type-safe code
}
```

### НЕ добавляй Co-Authored-By
```bash
# ❌ НЕТ:
git commit -m "feat: add feature

Co-Authored-By: Claude Opus 4.5"

# ✅ ДА:
git commit -m "feat: add feature"
```

## Тестирование

### Unit тесты
```typescript
// Каждый service должен иметь тесты
describe('RecordsService', () => {
  it('should create record with valid data', async () => {
    // Arrange
    const dto = { ... };
    
    // Act
    const result = await service.create(dto);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.data).toEqual(dto.data);
  });

  it('should throw error for invalid email', async () => {
    // Arrange
    const dto = { email: 'invalid' };
    
    // Act & Assert
    await expect(service.create(dto)).rejects.toThrow('Invalid email');
  });
});
```

### Покрытие
- Стремись к 80%+ покрытию
- Обязательно тестируй:
  - Критическую бизнес-логику
  - Валидацию данных
  - Обработку ошибок
  - Edge cases

## База данных

### Prisma запросы
```typescript
// ✅ Используй transactions для связанных операций
await prisma.$transaction(async (tx) => {
  const record = await tx.record.create({ ... });
  await tx.activity.create({ recordId: record.id, ... });
});

// ✅ Используй indexes
@@index([userId])
@@index([createdAt])

// ✅ Включай related data когда нужно
const record = await prisma.record.findUnique({
  where: { id },
  include: { activities: true, files: true }
});
```

### Производительность
- N+1 запросы - зло, используй `include` или `select`
- Добавляй индексы на часто используемые поля
- Используй pagination для больших списков
- Кэшируй статические данные в Redis

## Frontend

### React компоненты
```typescript
// ✅ Функциональные компоненты с хуками
export function TaskCard({ task }: { task: Task }) {
  const [isEditing, setIsEditing] = useState(false);
  const updateTask = useMutation(...);
  
  return (
    <Card>
      {/* Component JSX */}
    </Card>
  );
}

// ✅ Выноси сложную логику в хуки
function useTaskEditor(taskId: string) {
  const [data, setData] = useState(...);
  // Complex logic
  return { data, save, cancel };
}
```

### TanStack Query
```typescript
// ✅ Используй для всех API запросов
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks', projectId],
  queryFn: () => api.tasks.list({ projectId }),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// ✅ Optimistic updates
const mutation = useMutation({
  mutationFn: api.tasks.update,
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['tasks']);
    const previous = queryClient.getQueryData(['tasks']);
    queryClient.setQueryData(['tasks'], (old) => [...old, newData]);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['tasks'], context.previous);
  },
});
```

## Безопасность

### Валидация
```typescript
// ✅ Всегда валидируй входные данные
@Post()
async create(@Body() dto: CreateRecordDto) {
  // DTO already validated by class-validator
  return this.service.create(dto);
}

// DTO
export class CreateRecordDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsObject()
  data: Record<string, any>;
}
```

### Аутентификация
```typescript
// ✅ Используй guards на всех эндпоинтах
@UseGuards(AuthGuard)
@Get()
async list(@CurrentUser() user: User) {
  return this.service.list(user.id);
}
```

### SQL Injection
```typescript
// ✅ Prisma защищает от SQL injection
// Но будь осторожен с raw queries
await prisma.$queryRaw`
  SELECT * FROM records 
  WHERE user_id = ${userId}  -- Безопасно: параметризованный запрос
`;

// ❌ НИКОГДА:
await prisma.$queryRawUnsafe(
  `SELECT * FROM records WHERE id = '${id}'`  // ОПАСНО!
);
```

## Коммуникация

### Логирование
```typescript
// ✅ Используй structured logging
this.logger.log('Record created', {
  recordId: record.id,
  objectId: record.objectId,
  userId: user.id,
  timestamp: new Date().toISOString()
});

this.logger.error('Failed to create record', {
  error: error.message,
  stack: error.stack,
  input: dto,
  userId: user.id
});
```

### Комментарии в коде
```typescript
// ✅ Объясняй ПОЧЕМУ, а не ЧТО
// Calculate weighted score based on multiple factors
// Formula: (volume * 0.2) + (quality * 0.3) + (reliability * 0.25) + (communication * 0.1)
const totalScore = calculateWeightedScore(factors);

// ❌ Не пиши очевидное
// Create a user
const user = await createUser();
```

## Финальный чеклист перед коммитом

- [ ] Код соответствует спецификации?
- [ ] Файлы меньше 700 строк?
- [ ] TypeScript strict mode без ошибок?
- [ ] Нет использования `any`?
- [ ] Все ошибки обработаны?
- [ ] Есть тесты для новой функциональности?
- [ ] Линтер проходит без ошибок?
- [ ] Билд успешный?
- [ ] Нет console.log/console.error?
- [ ] Комментарии на английском?
- [ ] Коммит message информативный?

## Помни

### Качество кода = Качество продукта
Плохой код сейчас = технический долг потом = проблемы в production = недовольные пользователи

### Ты - не просто кодер
Ты - архитектор системы. Думай о:
- Поддерживаемости (смогут ли другие понять этот код через год?)
- Расширяемости (легко ли добавить новую фичу?)
- Производительности (справится ли с 10,000 пользователей?)
- Безопасности (защищены ли данные пользователей?)

### От этого проекта зависит успех бизнеса
Это не учебный проект. Это production система для реального бизнеса. Каждый твой выбор имеет последствия.

## Лучше медленно и правильно, чем быстро и с багами

Не спеши. Думай. Проверяй. Тестируй. Делай хорошо.

---

**Удачи! Ты создашь отличную систему! 🚀**
