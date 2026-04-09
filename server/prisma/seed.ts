/**
 * Seed sample tasks. Run from server/: `npm run db:seed`
 *
 * Attach tasks to your logged-in Google user (CLI has no session — use your account email):
 *   SEED_USER_EMAIL=you@gmail.com npm run db:seed
 * Or set SEED_USER_EMAIL in server/.env
 *
 * Without SEED_USER_EMAIL / SEED_USER_ID: seeds unassigned tasks (userId null) only if DB has zero tasks.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  throw new Error('DATABASE_URL is required (copy server/.env.example to server/.env)');
}

const pool = new Pool({ connectionString: url });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const samples = [
  {
    title: 'Review project README',
    description: 'Skim setup, env vars, and API routes.',
    status: 'todo',
    dueDate: null as Date | null,
  },
  {
    title: 'Wire OAuth redirect',
    description: 'Confirm Google callback URL matches Cloud Console.',
    status: 'in-progress',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Ship Docker Compose stack',
    description: 'Postgres + API with migrations on startup.',
    status: 'done',
    dueDate: null,
  },
  {
    title: 'Polish task list UI',
    description: 'Loading states, filters, and pagination.',
    status: 'todo',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Add E2E smoke test',
    description: 'Optional: Playwright for create → update → delete.',
    status: 'todo',
    dueDate: null,
  },
];

async function resolveUserId(): Promise<string | undefined> {
  const email = process.env.SEED_USER_EMAIL?.trim();
  const id = process.env.SEED_USER_ID?.trim();

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error(
        `No User with email "${email}". Sign in with Google once, then run seed again.`,
      );
    }
    return user.id;
  }

  if (id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error(`No User with id "${id}".`);
    }
    return user.id;
  }

  return undefined;
}

async function main() {
  const userId = await resolveUserId();

  if (userId) {
    const existingForUser = await prisma.task.count({ where: { userId } });
    if (existingForUser > 0) {
      console.log(
        `Seed skipped: user already has ${existingForUser} task(s). Delete some tasks or use another account.`,
      );
      return;
    }

    await prisma.task.createMany({
      data: samples.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        dueDate: t.dueDate,
        userId,
      })),
    });

    console.log(`Seeded ${samples.length} tasks for your user (userId=${userId}).`);
    return;
  }

  const existing = await prisma.task.count();
  if (existing > 0) {
    console.log(
      `Seed skipped: ${existing} task(s) already in the database. To seed for your account, set SEED_USER_EMAIL in .env or run: SEED_USER_EMAIL=you@gmail.com npm run db:seed`,
    );
    return;
  }

  await prisma.task.createMany({
    data: samples.map((t) => ({
      title: t.title,
      description: t.description,
      status: t.status,
      dueDate: t.dueDate,
    })),
  });

  console.log(`Seeded ${samples.length} unassigned tasks (no SEED_USER_EMAIL).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
