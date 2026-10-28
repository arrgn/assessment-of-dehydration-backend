# assessment-of-dehydration-backend

Бэкенд приложения для оценки обезвоживания (Vibes-подобная лента карточек). REST API на NestJS + TypeORM + PostgreSQL, медиафайлы хранятся в Silo (MinIO).

## HTTP методы

### Услуги (`/api/dehydration`)

| # | Метод | URL | Описание |
|---|---|---|---|
| 1 | GET | `/api/dehydration/signs` | список опубликованных услуг с фильтром |
| 2 | GET | `/api/dehydration/feed`<br>`/api/dehydration/feed/:id` | лента опубликованных услуг |
| 3 | GET | `/api/dehydration/add` | черновик текущего пользователя |
| 4 | POST | `/api/dehydration/add` | создание черновика с файлами |
| 5 | PUT | `/api/dehydration/add` | публикация черновика |
| 6 | DELETE | `/api/dehydration/delete/:id` | soft delete своей услуги |
| 7 | POST | `/api/dehydration/like/:id` | поставить или снять лайк |

#### 1. GET `/api/dehydration/signs`

Query-параметры (все необязательные):

| Параметр | Тип | Описание |
|---|---|---|
| `search` | string | поиск по названию (без учёта регистра) |
| `min` | int ≥ 0 | нижняя граница `dehydratingCoefficient` |
| `max` | int ≥ 0 | верхняя граница `dehydratingCoefficient` |

Границы ограничиваются диапазоном `0..sliderMax`, перепутанные `min`/`max` меняются местами.

Ответ `200`:

```json
{
  "signs": [
    {
      "id": 3,
      "title": "Сухие губы",
      "description": "Краткая информация",
      "dehydratingCoefficient": 4,
      "maxDehydratingCoefficient": 10,
      "vidSrc": "http://localhost:9000/dehydration/<uuid>.mp4",
      "imgSrc": "http://localhost:9000/dehydration/<uuid>.jpg",
      "status": "Опубликован",
      "createdAt": "2026-10-28T10:00:00.000Z",
      "updatedAt": "2026-10-28T10:05:00.000Z",
      "isMine": 1,
      "likesCount": 2
    }
  ],
  "filters": { "min": 0, "max": 8, "sliderMax": 8 }
}
```

`isMine` равен `1`, если создатель услуги совпадает с текущим пользователем. `sliderMax` - максимальный коэффициент среди найденных по `search` услуг.

#### 2. GET `/api/dehydration/feed[/:id]`

| Вариант | Результат |
|---|---|
| `/feed` | первая опубликованная услуга |
| `/feed/:id` | первая опубликованная услуга с `id >= :id` |
| `/feed/:id?next=true` | следующая опубликованная услуга после `:id` |

После последней услуги возвращается первая. Если опубликованных услуг нет - `404`.

Ответ `200` - объект услуги (поля как в п. 1, без `isMine` и `likesCount`) с признаком `isLiked`: `1`, если текущий пользователь лайкнул услугу.

#### 3. GET `/api/dehydration/add`

Идентификатор не указывается. Ответ `200` - объект услуги в статусе `Черновик`. Если черновика нет - `404`.

#### 4. POST `/api/dehydration/add`

`Content-Type: multipart/form-data`

| Поле | Тип | Описание |
|---|---|---|
| `title` | text, обязательное, ≤ 255 | название |
| `image` | file, обязательное | jpg, png, webp, gif |
| `video` | file, обязательное | mp4, webm, mov |

Максимальный размер файла - 50 МБ. Файлы сохраняются в MinIO под сгенерированными именами `<uuid>.<расширение>` (латиница), имена записываются в `imgSrc` и `vidSrc`.

Ответ `201` - объект созданного черновика. Ошибки: `400` (нет файлов, недопустимый тип, пустое название), `409` (черновик уже существует: не более одного на пользователя).

#### 5. PUT `/api/dehydration/add`

Публикует черновик текущего пользователя, идентификатор не передаётся.

```json
{
  "title": "Сухие губы",
  "description": "Краткая информация",
  "dehydratingCoefficient": 4,
  "maxDehydratingCoefficient": 10
}
```

Все поля обязательны, коэффициенты - целые `0..32767`. Ответ `200` - опубликованная услуга. `404`, если у текущего пользователя нет черновика.

#### 6. DELETE `/api/dehydration/delete/:id`

Помечает услугу текущего пользователя статусом `Удален`. Ответ `204` без тела. `404`, если услуга не найдена, уже удалена или принадлежит другому пользователю.

#### 7. POST `/api/dehydration/like/:id`

```json
{ "like": 1 }
```

`like`: `1` - поставить лайк, `0` - отменить. Операция идемпотентна. Ответ `200`:

```json
{ "isLiked": 1, "likesCount": 3 }
```

`404`, если услуга не опубликована или не найдена.

### Пользователи (`/api/users`)

| # | Метод | URL | Описание |
|---|---|---|---|
| 8 | POST | `/api/users/register` | регистрация |
| 9 | POST | `/api/users/login` | аутентификация (заглушка для лабораторной 4) |
| 10 | POST | `/api/users/logout` | деавторизация (заглушка для лабораторной 4) |

#### 8. POST `/api/users/register`

```json
{ "name": "Иван", "login": "ivan_1", "password": "secret123" }
```

| Поле | Правила |
|---|---|
| `name` | обязательное, ≤ 255 |
| `login` | 3-64 символа: латиница, цифры, `_ . -`; уникальный |
| `password` | 6-128 символов; хранится как scrypt-хэш |

Ответ `201`: `{ "id": 2, "name": "Иван", "login": "ivan_1", "createdAt": "..." }`. `409`, если логин занят.

#### 9-10. POST `/api/users/login`, `/api/users/logout`

Заглушки, ответ `200` с полем `message`. `login` принимает тело `{ "login": "...", "password": "..." }`, `logout` - без тела.

## Таблицы БД

### `Users`

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | serial | PK | идентификатор |
| `name` | varchar(255) | NOT NULL | имя |
| `login` | varchar(64) | UNIQUE, NULL | логин |
| `passwordHash` | varchar(255) | NULL | хэш пароля `salt:hash` |
| `createdAt` | timestamptz | NOT NULL, default `now()` | дата регистрации |

### `Dehydration_signs`

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | serial | PK | идентификатор |
| `title` | varchar(255) | NOT NULL, индекс | название |
| `creatorId` | int | NOT NULL, FK → `Users.id`, индекс | создатель |
| `description` | text | NULL | описание |
| `dehydratingCoefficient` | smallint | NULL | коэффициент обезвоживания |
| `maxDehydratingCoefficient` | smallint | NOT NULL, default `10` | максимальный коэффициент |
| `vidSrc` | varchar(255) | NULL | имя видеофайла в MinIO |
| `imgSrc` | varchar(255) | NULL | имя изображения в MinIO |
| `status` | enum `Dehydration_sign_status_enum` | NOT NULL, default `Черновик`, индекс | `Черновик`, `Опубликован`, `Удален` |
| `createdAt` | timestamptz | NOT NULL, default `now()` | дата создания |
| `updatedAt` | timestamptz | NOT NULL, default `now()` | дата изменения |

Частичный уникальный индекс `UQ_Dehydration_signs_creator_draft` по `creatorId` для `status = 'Черновик'` гарантирует не более одного черновика на пользователя.

### `Dehydration_likes`

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | serial | PK | идентификатор |
| `userId` | int | NOT NULL, FK → `Users.id`, индекс | кто лайкнул |
| `signId` | int | NOT NULL, FK → `Dehydration_signs.id`, индекс | что лайкнул |

Уникальная пара (`userId`, `signId`): один лайк на услугу от пользователя.

## Структура кода

```text
dehydration/src/
├── common/current-user.ts      # singleton текущего пользователя
├── entities/                   # User, DehydrationSign, DehydrationLike
├── minio/                      # загрузка файлов и ссылки на медиа
├── signs/                      # домен услуг: controller, service, dto
└── users/                      # домен пользователя: controller, service, dto
```
