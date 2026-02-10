import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminExists = await prisma.usuario.findUnique({
    where: { email: 'admin@box73.com' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@box73.com',
        senha: hashedPassword,
        role: UserRole.ADMIN,
        ativo: true,
      },
    });
    console.log('✅ Admin criado: admin@box73.com / admin123');
  } else {
    console.log('ℹ️  Admin já existe');
  }

  console.log('🌱 Seed finalizado!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
