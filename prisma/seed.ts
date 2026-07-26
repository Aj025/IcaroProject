import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PASSWORD = bcrypt.hashSync('password123', 10);

async function main() {
  const admin = await prisma.profile.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'rob@icaroprojects.com',
      fullName: 'Rob (Admin)',
      passwordHash: PASSWORD,
      role: 'admin',
      permissions: {
        Financials: true,
        Tenders: true,
        Variations: true,
        RFIs: true,
        Valuations: true,
        Risks: true,
        'Brain Dump': true,
        'Issue to client': true,
      },
    },
  });

  const estimator = await prisma.profile.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'maria@icaroprojects.com',
      fullName: 'Maria (Estimator)',
      passwordHash: PASSWORD,
      role: 'estimator',
      permissions: {
        Financials: true,
        Tenders: true,
        Variations: true,
        RFIs: true,
        Valuations: true,
        Risks: true,
        'Brain Dump': true,
        'Issue to client': true,
      },
    },
  });

  const pm = await prisma.profile.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'pm@icaroprojects.com',
      fullName: 'Project Manager',
      passwordHash: PASSWORD,
      role: 'pm',
      permissions: {
        Financials: false,
        Tenders: true,
        Variations: true,
        RFIs: true,
        Valuations: false,
        Risks: true,
        'Brain Dump': true,
        'Issue to client': false,
      },
    },
  });

  const seedTenders = [
    {
      id: 't1',
      client: 'Private Client',
      job: 'Rear extension + loft conversion',
      email: 'private@client.com',
      received: new Date('2026-06-24'),
      due: new Date('2026-07-05'),
      status: 'Pricing' as const,
      contractSum: 145000,
      createdById: estimator.id,
    },
    {
      id: 't2',
      client: 'Ashcombe Estates',
      job: 'Full refurb — 4 bed detached',
      email: 'ashcombe@estates.com',
      received: new Date('2026-06-28'),
      due: new Date('2026-07-08'),
      status: 'Tendering' as const,
      contractSum: 320000,
      createdById: estimator.id,
    },
    {
      id: 't3',
      client: 'Bramley Developments',
      job: 'New build — 3 townhouses',
      email: 'bramley@dev.co.uk',
      received: new Date('2026-06-10'),
      due: new Date('2026-07-01'),
      status: 'Issued' as const,
      contractSum: 680000,
      createdById: estimator.id,
    },
    {
      id: 't4',
      client: 'Hartley Trust',
      job: 'Heritage barn restoration',
      email: 'hartley@trust.org',
      received: new Date('2026-06-02'),
      due: new Date('2026-06-20'),
      status: 'Won' as const,
      contractSum: 215000,
      isSigned: true,
      createdById: estimator.id,
    },
    {
      id: 't5',
      client: 'Oakridge Homes',
      job: 'Wraparound extension + garage',
      email: 'oakridge@homes.com',
      received: new Date('2026-06-15'),
      due: new Date('2026-06-29'),
      status: 'Lost' as const,
      contractSum: 98000,
      createdById: estimator.id,
    },
  ];

  for (const t of seedTenders) {
    await prisma.tender.upsert({
      where: { id: t.id },
      update: { email: t.email },
      create: t,
    });
  }

  console.log('Seed complete — admin, estimator, pm, and 5 sample tenders created');
  console.log('All accounts use password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
