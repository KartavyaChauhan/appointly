# Appointly

A polished, production-ready appointment booking application built with **Next.js 16**, **Prisma**, and **PostgreSQL**.

**Live Demo** → [appointly-mauve.vercel.app](https://appointly-mauve.vercel.app)

---

## Features

- **Browse Available Slots** — View upcoming appointment slots organised by day, with 9 AM–5 PM availability across a rolling 7-day window.
- **Book in One Click** — Select a time, enter your name and email, and receive a unique 6-character reference code instantly.
- **My Appointments** — Look up your bookings by email + reference ID. View confirmed and cancelled appointments at a glance.
- **Cancel Anytime** — Cancel a confirmed appointment with a single click; the slot is immediately released for others.
- **Concurrent-Safe** — Optimistic locking (`updateMany` guard) inside a Prisma transaction prevents double-booking even under simultaneous requests.
- **Auto-Seeding** — The API lazily seeds the database on first request if no slots exist, so the app is always ready to demo.

---

## Tech Stack

| Layer      | Technology                       |
|------------|----------------------------------|
| Framework  | Next.js 16 (App Router)         |
| Language   | TypeScript                       |
| ORM        | Prisma 5                         |
| Database   | PostgreSQL (Prisma Postgres)     |
| Styling    | Vanilla CSS (custom design system) |
| Hosting    | Vercel                           |

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── slots/route.ts          # GET available slots (+ auto-seed)
│   │   └── appointments/
│   │       ├── route.ts            # POST book / GET list
│   │       └── [id]/route.ts       # PATCH cancel
│   ├── my-appointments/page.tsx    # Lookup & cancel UI
│   ├── page.tsx                    # Booking UI
│   ├── layout.tsx                  # Root layout + fonts
│   └── globals.css                 # Full design system
├── lib/
│   └── prisma.ts                   # Singleton Prisma client
prisma/
├── schema.prisma                   # Data model
└── seed.mjs                        # Standalone seeder (dev)
```

### Data Model

```
User  1 ──── * Appointment * ──── 1 Slot
```

- **User** — `id`, `name`, `email` (unique)
- **Slot** — `id`, `startTime`, `endTime`, `isBooked`
- **Appointment** — `id`, `referenceId` (unique, 6-char hex), `userId`, `slotId` (unique), `status`, `createdAt`

The `slotId` unique constraint on `Appointment` plus the `isBooked` optimistic-lock check together guarantee that no two users can book the same slot.

---

## API Reference

| Method  | Endpoint                  | Description                        |
|---------|---------------------------|------------------------------------|
| `GET`   | `/api/slots`              | List all future, unbooked slots    |
| `POST`  | `/api/appointments`       | Book a slot (body: `name`, `email`, `slotId`) |
| `GET`   | `/api/appointments?email=&referenceId=` | Retrieve appointments  |
| `PATCH` | `/api/appointments/:id`   | Cancel an appointment              |

### Booking Flow

1. Client fetches available slots via `GET /api/slots`.
2. User selects a slot and submits name + email.
3. Server opens a Prisma `$transaction`:
   - `slot.updateMany({ where: { id, isBooked: false }, data: { isBooked: true } })` — if 0 rows updated, the slot was already taken → return `409 Conflict`.
   - Upsert the user by email.
   - Create the appointment with a random `referenceId`.
4. Client displays the confirmation with the reference code.

### Cancellation Flow

1. `PATCH /api/appointments/:id` sets `status → CANCELLED` and releases the slot (`isBooked → false`), all inside a transaction.

---

## Getting Started (Local Development)

```bash
# 1. Clone
git clone https://github.com/KartavyaChauhan/appointly.git
cd appointly

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Add your DATABASE_URL to .env

# 4. Push schema & seed
npx prisma db push
node prisma/seed.mjs

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Design Decisions

- **Vanilla CSS over Tailwind** — A hand-crafted design system with CSS custom properties gives full control over the botanical/sage-green aesthetic without framework overhead.
- **Optimistic Locking over Pessimistic Locks** — `updateMany` with a `where` guard is lighter than `SELECT … FOR UPDATE` and works well within Prisma's transaction model.
- **Auto-Seed on Empty** — Rather than relying on a separate seed step during CI/CD, the slots API checks on each request and seeds lazily. This makes the app zero-config for reviewers.
- **Reference IDs** — Short, human-friendly hex codes (e.g. `A3F1B2`) are easier to communicate than UUIDs and provide a lightweight lookup mechanism without requiring user accounts or authentication.

---

## License

MIT
