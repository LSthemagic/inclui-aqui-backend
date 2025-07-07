import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário administrador
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@incluiaqui.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@incluiaqui.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  console.log('✅ Usuário administrador criado:', admin.email);

  // Criar usuário proprietário de exemplo
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'proprietario@exemplo.com' },
    update: {},
    create: {
      name: 'João Silva',
      email: 'proprietario@exemplo.com',
      password: ownerPassword,
      role: 'OWNER',
      status: 'ACTIVE'
    }
  });

  console.log('✅ Usuário proprietário criado:', owner.email);

  // Criar usuário comum de exemplo
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'usuario@exemplo.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'usuario@exemplo.com',
      password: userPassword,
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  console.log('✅ Usuário comum criado:', user.email);

  // Criar estabelecimentos de exemplo
  const establishment1 = await prisma.establishment.create({
    data: {
      name: 'Restaurante Acessível',
      description: 'Um restaurante com excelente acessibilidade, rampas de acesso, banheiros adaptados e cardápio em braile.',
      phone: '(11) 99999-9999',
      category: 'RESTAURANT',
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      latitude: -23.5505,
      longitude: -46.6333,
      ownerId: owner.id
    }
  });

  console.log('✅ Estabelecimento criado:', establishment1.name);

  const establishment2 = await prisma.establishment.create({
    data: {
      name: 'Farmácia Vida',
      description: 'Farmácia com atendimento especializado para pessoas com deficiência.',
      phone: '(11) 88888-8888',
      category: 'HEALTH',
      street: 'Avenida Paulista',
      number: '456',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      latitude: -23.5618,
      longitude: -46.6565,
      ownerId: owner.id
    }
  });

  console.log('✅ Estabelecimento criado:', establishment2.name);

  // Criar avaliações de exemplo
  const review1 = await prisma.review.create({
    data: {
      title: 'Excelente acessibilidade!',
      comment: 'Fiquei impressionado com a estrutura do restaurante. Rampas bem construídas, banheiros amplos e funcionários muito atenciosos.',
      rating: 5,
      establishmentId: establishment1.id,
      ownerId: user.id
    }
  });

  console.log('✅ Avaliação criada para:', establishment1.name);

  const review2 = await prisma.review.create({
    data: {
      title: 'Bom atendimento',
      comment: 'A farmácia tem boa acessibilidade, mas poderia melhorar a sinalização para pessoas com deficiência visual.',
      rating: 4,
      establishmentId: establishment2.id,
      ownerId: user.id
    }
  });

  console.log('✅ Avaliação criada para:', establishment2.name);

  // Criar mais um usuário e avaliação
  const user2Password = await bcrypt.hash('user456', 10);
  const user2 = await prisma.user.create({
    data: {
      name: 'Carlos Oliveira',
      email: 'carlos@exemplo.com',
      password: user2Password,
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  const review3 = await prisma.review.create({
    data: {
      title: 'Muito bom!',
      comment: 'Restaurante com ótima estrutura para cadeirantes. Recomendo!',
      rating: 5,
      establishmentId: establishment1.id,
      ownerId: user2.id
    }
  });

  console.log('✅ Usuário e avaliação adicional criados');

  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('👤 Usuários criados:');
  console.log('   Admin: admin@incluiaqui.com / admin123');
  console.log('   Proprietário: proprietario@exemplo.com / owner123');
  console.log('   Usuário 1: usuario@exemplo.com / user123');
  console.log('   Usuário 2: carlos@exemplo.com / user456');
  console.log('');
  console.log('🏢 Estabelecimentos criados: 2');
  console.log('⭐ Avaliações criadas: 3');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

