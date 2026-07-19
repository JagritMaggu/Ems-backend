import prisma from './src/config/prisma';
import { comparePassword } from './src/utils/hash';
import { generateToken } from './src/utils/jwt';

async function testLogin() {
  try {
    console.log("1. Finding user...");
    const user = await prisma.user.findUnique({
      where: { email: 'admin@ems.com' },
      include: { employee_profile: { select: { name: true } } }
    });
    console.log("Found:", !!user);

    console.log("2. Comparing password...");
    const isPasswordValid = await comparePassword('r080601j210900', user!.password_hash);
    console.log("Password valid:", isPasswordValid);

    console.log("3. Generating token...");
    const token = generateToken({ id: user!.id, role: user!.role });
    console.log("Token generated:", !!token);

  } catch (e) {
    console.error("ERROR CAUGHT:", e);
  }
}
testLogin();
