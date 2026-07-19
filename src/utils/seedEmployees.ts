import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma';

async function main() {
  const password_hash = await bcrypt.hash('123456', 10);

  // 1. HR Manager
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@ems.com' },
    update: { password_hash },
    create: { email: 'hr@ems.com', password_hash, role: Role.HR_MANAGER },
  });
  
  const hrProfile = await prisma.employeeProfile.upsert({
    where: { user_id: hrUser.id },
    update: { name: 'HR Manager', designation: 'HR Manager', salary: 100000 },
    create: {
      user_id: hrUser.id,
      name: 'HR Manager',
      designation: 'HR Manager',
      department: 'HR',
      salary: 100000,
      joining_date: new Date(),
    },
  });

  // 2. Manager
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@ems.com' },
    update: { password_hash },
    create: { email: 'manager@ems.com', password_hash, role: Role.EMPLOYEE },
  });

  const managerProfile = await prisma.employeeProfile.upsert({
    where: { user_id: managerUser.id },
    update: { name: 'Manager', reporting_manager_id: hrProfile.id, designation: 'Manager', salary: 80000 },
    create: {
      user_id: managerUser.id,
      name: 'Manager',
      designation: 'Manager',
      department: 'Engineering',
      salary: 80000,
      joining_date: new Date(),
      reporting_manager_id: hrProfile.id,
    },
  });

  // 3. Employee 1
  const emp1User = await prisma.user.upsert({
    where: { email: 'emp1@ems.com' },
    update: { password_hash },
    create: { email: 'emp1@ems.com', password_hash, role: Role.EMPLOYEE },
  });

  await prisma.employeeProfile.upsert({
    where: { user_id: emp1User.id },
    update: { name: 'Employee 1', reporting_manager_id: managerProfile.id, designation: 'Software Engineer', salary: 60000 },
    create: {
      user_id: emp1User.id,
      name: 'Employee 1',
      designation: 'Software Engineer',
      department: 'Engineering',
      salary: 60000,
      joining_date: new Date(),
      reporting_manager_id: managerProfile.id,
    },
  });

  // 4. Employee 2
  const emp2User = await prisma.user.upsert({
    where: { email: 'emp2@ems.com' },
    update: { password_hash },
    create: { email: 'emp2@ems.com', password_hash, role: Role.EMPLOYEE },
  });

  await prisma.employeeProfile.upsert({
    where: { user_id: emp2User.id },
    update: { name: 'Employee 2', reporting_manager_id: managerProfile.id, designation: 'QA Engineer', salary: 55000 },
    create: {
      user_id: emp2User.id,
      name: 'Employee 2',
      designation: 'QA Engineer',
      department: 'Engineering',
      salary: 55000,
      joining_date: new Date(),
      reporting_manager_id: managerProfile.id,
    },
  });

  console.log('Successfully seeded HR Manager -> Manager -> Employee 1 & 2');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
