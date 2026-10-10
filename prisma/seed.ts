import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    { name: '1 Month', durationMonths: 1, durationDays: null, fee: 1500, order: 1 },
    { name: '3 Months', durationMonths: 3, durationDays: null, fee: 4000, order: 2 },
    { name: '6 Months', durationMonths: 6, durationDays: null, fee: 7500, order: 3 },
    { name: '12 Months', durationMonths: 12, durationDays: null, fee: 14000, order: 4 },
  ];

  for (const plan of plans) {
    const exists = await prisma.membershipPlan.findFirst({ where: { name: plan.name } });
    if (!exists) {
      await prisma.membershipPlan.create({ data: plan });
    }
  }

  // Secure admin creation
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@a1fitness.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn("WARNING: ADMIN_PASSWORD environment variable not set. Skipping admin user creation.");
  } else {
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          name: 'Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log(`Admin user created with email: ${adminEmail}`);
    } else {
      // Force update password to hashed version (in case it was plaintext from old seed)
      await prisma.user.update({
        where: { email: adminEmail },
        data: { password: hashedPassword }
      });
      console.log(`Admin user ${adminEmail} updated with hashed password.`);
    }
  }

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
