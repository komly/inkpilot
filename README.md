# InkPilot - AI Writing Assistant

InkPilot - это интеллектуальный копилот для написания текстов, который помогает улучшить грамматику, пунктуацию и стиль, не переписывая ваш контент.

## Особенности

- 🤖 **AI-анализ текста**: Проверка грамматики, пунктуации и стиля с помощью OpenAI
- ✨ **Интерактивные подсказки**: Кликабельные выделения с рекомендациями
- 📝 **Редактор текста**: Современный редактор с поддержкой подсветки
- 💾 **Управление проектами**: Сохранение и управление вашими текстами
- 🔐 **Авторизация**: Безопасный вход через Clerk
- 📊 **Статистика**: Отслеживание количества слов и прогресса

## Технологический стек

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma, PostgreSQL
- **AI**: Vercel AI SDK, OpenAI GPT-4
- **Auth**: Clerk
- **Data Fetching**: SWR

## Установка и настройка

### 1. Клонирование проекта

```bash
git clone <repository-url>
cd ink-pilot
```

### 2. Установка зависимостей

```bash
pnpm install
```

### 3. Настройка базы данных

Создайте локальную PostgreSQL базу данных:

```bash
createdb inkpilot
```

### 4. Настройка переменных окружения

Создайте файл `.env.local` и добавьте следующие переменные:

```env
# Database
DATABASE_URL="postgresql://username@localhost:5432/inkpilot"

# Clerk (получите ключи на https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk redirects
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI (получите ключ на https://platform.openai.com)
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Настройка Clerk

1. Зарегистрируйтесь на [Clerk](https://clerk.com)
2. Создайте новое приложение
3. Скопируйте ключи в `.env.local`
4. В настройках Clerk добавьте URL приложения: `http://localhost:3000`

### 6. Миграция базы данных

```bash
pnpm prisma migrate dev
```

### 7. Запуск приложения

```bash
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Использование

### Landing Page
- Публичная страница с описанием возможностей
- Регистрация и вход через Clerk

### Dashboard
- Обзор всех проектов
- Статистика написанного
- Создание новых проектов

### Editor
- Редактирование текста
- AI-анализ грамматики и стиля
- Интерактивные подсказки
- Автосохранение проектов

## API Endpoints

- `GET /api/projects` - Получить все проекты пользователя
- `POST /api/projects` - Создать новый проект
- `GET /api/projects/[id]` - Получить конкретный проект
- `PUT /api/projects/[id]` - Обновить проект
- `DELETE /api/projects/[id]` - Удалить проект
- `POST /api/ai/grammar` - Проверить грамматику и пунктуацию
- `POST /api/ai/style` - Получить рекомендации по стилю

## Структура проекта

```
ink-pilot/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard страница
│   ├── editor/           # Редактор
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   └── ui/               # shadcn/ui компоненты
├── lib/
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Утилиты
├── prisma/
│   ├── schema.prisma     # Схема базы данных
│   └── migrations/       # Миграции
└── middleware.ts         # Clerk middleware
```

## Разработка

### Команды

```bash
# Разработка
pnpm dev

# Сборка
pnpm build

# Запуск продакшн версии
pnpm start

# Линтинг
pnpm lint

# Работа с базой данных
pnpm prisma studio
pnpm prisma migrate dev
pnpm prisma generate
```

### Добавление компонентов shadcn/ui

```bash
pnpm dlx shadcn@latest add [component-name]
```

## Деплой

Приложение готово для деплоя на Vercel:

1. Подключите GitHub репозиторий к Vercel
2. Добавьте переменные окружения
3. Настройте PostgreSQL базу данных (например, Supabase или Neon)
4. Обновите URL в настройках Clerk

## Лицензия

MIT License
