const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedAdmin() {
  const adminData = {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123', // You can change this
  };

  // Hash the password
  const hashedPassword = await bcrypt.hash(adminData.password, 10);

  // Create admin user
  await prisma.admin.create({
    data: {
      username: adminData.username,
      email: adminData.email,
      password: hashedPassword,
    },
  });

  console.log('Admin user seeded');
}

seedAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
