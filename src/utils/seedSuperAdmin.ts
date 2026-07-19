import prisma from '../config/prisma';
import { hashPassword } from './hash';

async function main() {
  const adminEmail = 'admin@ems.com';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('Super Admin already exists.');
    return;
  }

  const passwordHash = await hashPassword('r080601j210900');

  // We only create a User account for the Super Admin
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password_hash: passwordHash,
      role: 'SUPER_ADMIN',
      status: 'Active'
    }
  });

  console.log('Super Admin User seeded successfully:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
