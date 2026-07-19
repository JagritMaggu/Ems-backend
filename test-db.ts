import prisma from './src/config/prisma';

async function test() {
  try {
    console.log("Testing Prisma Connection...");
    const user = await prisma.user.findUnique({
      where: { email: 'admin@ems.com' },
      include: { employee_profile: { select: { name: true } } }
    });
    console.log("Found User:", user);
  } catch (e) {
    console.error("ERRORRR:", e);
  }
}
test();
