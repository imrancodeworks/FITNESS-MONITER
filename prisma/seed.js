const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

function generateId() {
  return crypto.randomUUID();
}

async function main() {
  console.log('Seeding demo data...');
  const memberCount = await prisma.member.count();
  if (memberCount > 0) {
    console.log('Database already contains members. Skipping demo seed to prevent overwriting or duplication.');
    return;
  }
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitnessmonitoring.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@fitnessmonitoring.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  // Create Membership Plans
  const plansData = [
    { name: '1 Month', durationMonths: 1, durationDays: 0, fee: 1000, isActive: true, order: 1 },
    { name: '3 Months', durationMonths: 3, durationDays: 0, fee: 2500, isActive: true, order: 2 },
    { name: '6 Months', durationMonths: 6, durationDays: 0, fee: 4500, isActive: true, order: 3 },
    { name: '1 Year', durationMonths: 12, durationDays: 0, fee: 8000, isActive: true, order: 4 },
    { name: 'Weekly Pass', durationMonths: 0, durationDays: 7, fee: 400, isActive: true, order: 5 },
    { name: 'Daily Pass', durationMonths: 0, durationDays: 1, fee: 100, isActive: true, order: 6 },
  ];
  
  const plans = [];
  for (const p of plansData) {
    const plan = await prisma.membershipPlan.create({ data: p });
    plans.push(plan);
  }

  // Create Members
  const now = new Date();
  for (let i = 1; i <= 20; i++) {
    const member = await prisma.member.create({
      data: {
        memberId: `FM-${String(i).padStart(3, '0')}`,
        fullName: `Demo Member ${i}`,
        phoneNumber: `555-01${String(i).padStart(2, '0')}`,
        emailAddress: `member${i}@example.com`,
        gender: i % 2 === 0 ? 'Female' : 'Male',
      }
    });

    // Assign memberships based on i
    let plan = plans[i % plans.length];
    
    // Status distribution: 
    // i=1..8: Fully paid (Active)
    // i=9..13: Partially paid (Active)
    // i=14..17: Unpaid (Active)
    // i=18..20: Expired (Fully paid)

    let startDate = new Date(now);
    let endDate = new Date(now);
    
    if (i >= 18) {
      // Expired
      startDate.setMonth(startDate.getMonth() - 6);
      endDate.setMonth(endDate.getMonth() - 3);
    } else {
      // Active
      startDate.setMonth(startDate.getMonth() - 1);
      endDate.setMonth(endDate.getMonth() + (plan.durationMonths || 1));
    }

    const membership = await prisma.membership.create({
      data: {
        memberId: member.id,
        planId: plan.id,
        startDate: startDate,
        endDate: endDate,
        fee: plan.fee,
        admissionFee: 500,
        discount: 0,
      }
    });

    const totalDue = plan.fee + 500;

    let amountToPay = 0;
    if (i <= 8 || i >= 18) {
      amountToPay = totalDue; // Fully paid
    } else if (i >= 9 && i <= 13) {
      amountToPay = totalDue / 2; // Partially paid
    } else {
      amountToPay = 0; // Unpaid
    }

    if (amountToPay > 0) {
      const payment = await prisma.payment.create({
        data: {
          memberId: member.id,
          amount: amountToPay,
          date: startDate,
          method: 'cash',
          recordedById: admin.id,
        }
      });
      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          membershipId: membership.id,
          amount: amountToPay,
        }
      });
    }

    // Attendance
    if (i % 3 === 0) {
      // Checked in today
      await prisma.attendance.create({
        data: {
          memberId: member.id,
          checkIn: now,
          date: now.toISOString().split('T')[0]
        }
      });
    } else if (i % 2 === 0) {
      // Checked out today
      const checkInTime = new Date(now);
      checkInTime.setHours(now.getHours() - 2);
      await prisma.attendance.create({
        data: {
          memberId: member.id,
          checkIn: checkInTime,
          checkOut: now,
          date: now.toISOString().split('T')[0]
        }
      });
    }
  }

  console.log('Seeding completed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
