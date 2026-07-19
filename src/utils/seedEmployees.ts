import prisma from '../config/prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Starting seed process...');
  
  // Clean up existing seeded users (if any, excluding super admin)
  await prisma.employeeProfile.deleteMany({
    where: { user: { email: { not: 'admin@ems.com' } } }
  });
  await prisma.user.deleteMany({
    where: { email: { not: 'admin@ems.com' } }
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create HR Manager
  console.log('Creating HR Manager...');
  const hrUser = await prisma.user.create({
    data: {
      email: 'sarah.hr@ems.com',
      password_hash: passwordHash,
      role: 'HR_MANAGER',
      status: 'Active',
      employee_profile: {
        create: {
          name: 'Sarah Connor',
          phone: '5551234567',
          department: 'Human Resources',
          designation: 'HR Director',
          salary: 95000,
          joining_date: new Date('2023-01-15')
        }
      }
    },
    include: { employee_profile: true }
  });

  // 2. Create Engineering Manager
  console.log('Creating Engineering Manager...');
  const engManager = await prisma.user.create({
    data: {
      email: 'john.eng@ems.com',
      password_hash: passwordHash,
      role: 'EMPLOYEE',
      status: 'Active',
      employee_profile: {
        create: {
          name: 'John Smith',
          phone: '5559876543',
          department: 'Engineering',
          designation: 'Engineering Manager',
          salary: 120000,
          joining_date: new Date('2022-06-01')
        }
      }
    },
    include: { employee_profile: true }
  });

  // 3. Create Senior Developer (Reports to Eng Manager)
  console.log('Creating Senior Developer...');
  const dev1 = await prisma.user.create({
    data: {
      email: 'alice.dev@ems.com',
      password_hash: passwordHash,
      role: 'EMPLOYEE',
      status: 'Active',
      employee_profile: {
        create: {
          name: 'Alice Johnson',
          phone: '5551112222',
          department: 'Engineering',
          designation: 'Senior Frontend Developer',
          salary: 90000,
          joining_date: new Date('2024-02-10'),
          reporting_manager_id: engManager.employee_profile!.id
        }
      }
    }
  });

  // 4. Create Junior Developer (Reports to Eng Manager)
  console.log('Creating Junior Developer...');
  const dev2 = await prisma.user.create({
    data: {
      email: 'bob.dev@ems.com',
      password_hash: passwordHash,
      role: 'EMPLOYEE',
      status: 'Active',
      employee_profile: {
        create: {
          name: 'Bob Williams',
          phone: '5553334444',
          department: 'Engineering',
          designation: 'Junior Backend Developer',
          salary: 65000,
          joining_date: new Date('2025-05-20'),
          reporting_manager_id: engManager.employee_profile!.id
        }
      }
    }
  });

  // 5. Create Marketing Specialist
  console.log('Creating Marketing Specialist...');
  const mktg = await prisma.user.create({
    data: {
      email: 'emma.mktg@ems.com',
      password_hash: passwordHash,
      role: 'EMPLOYEE',
      status: 'Inactive',
      employee_profile: {
        create: {
          name: 'Emma Davis',
          phone: '5559998888',
          department: 'Marketing',
          designation: 'SEO Specialist',
          salary: 75000,
          joining_date: new Date('2023-11-05')
        }
      }
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
