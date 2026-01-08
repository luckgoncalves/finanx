import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dados do localStorage
const localStorageData = {
  "transactions": [
    {"description":"Nubank","amount":3199.27,"type":"expense","category":"cartao","date":"2026-01-07","month":1,"year":2026,"id":"6a072697-e73c-408c-ba8a-c2da127d00b5","createdAt":"2026-01-07T14:03:45.480Z"},
    {"description":"Salário","amount":15531.48,"type":"income","category":"salario","date":"2026-01-07","month":1,"year":2026,"id":"74e9fb03-5dcc-4947-8dcc-c1265f83db62","createdAt":"2026-01-07T14:04:26.727Z"},
    {"description":"Dental Uni","amount":55.1,"type":"expense","category":"saude","date":"2026-01-07","month":1,"year":2026,"id":"6843057a-d61e-44e3-8956-7dea3755ebaa","createdAt":"2026-01-07T14:26:31.150Z"},
    {"description":"Copel","amount":221.19,"type":"expense","category":"luz","date":"2026-01-07","month":1,"year":2026,"id":"c4f6fabe-df7a-42aa-9388-cf6adea5b163","createdAt":"2026-01-07T14:26:43.949Z"},
    {"description":"Condominio","amount":303.14,"type":"expense","category":"condominio","date":"2026-01-07","month":1,"year":2026,"id":"f3be60de-cda1-475f-9cef-69af9517c43a","createdAt":"2026-01-07T14:27:05.737Z"},
    {"description":"Client CO Servicos de Rede Nordeste","amount":102.24,"type":"expense","category":"outros","date":"2026-01-07","month":1,"year":2026,"id":"0c51a6e8-2dac-43da-816e-1a1d6eff4162","createdAt":"2026-01-07T14:27:44.699Z"},
    {"description":"Itau","amount":331.52,"type":"expense","category":"cartao","date":"2026-01-07","month":1,"year":2026,"id":"bb75958c-c53b-46b9-a4a7-2f6b117f5d82","createdAt":"2026-01-07T14:28:17.222Z"},
    {"description":"C6","amount":10404.66,"type":"expense","category":"cartao","date":"2026-01-07","month":1,"year":2026,"id":"8efa2092-79a3-4972-9db2-83749ee5653a","createdAt":"2026-01-07T14:29:06.391Z"},
    {"description":"Cactus","amount":215.31,"type":"expense","category":"ipva","date":"2026-02-13","month":2,"year":2026,"id":"23bd3ecf-657a-4b21-9a31-d5d2177a5014","createdAt":"2026-01-07T14:30:31.959Z"},
    {"description":"Cactus","amount":215.31,"type":"expense","category":"ipva","date":"2026-03-13","month":3,"year":2026,"id":"aea99c1c-e0a3-4c10-8e3e-f42db1184038","createdAt":"2026-01-07T14:30:51.288Z"},
    {"description":"Cactus","amount":215.31,"type":"expense","category":"ipva","date":"2026-04-15","month":4,"year":2026,"id":"bbb2d92d-7daf-4a04-80e4-390587c5efa5","createdAt":"2026-01-07T14:31:16.387Z"},
    {"description":"Cactus","amount":215.32,"type":"expense","category":"ipva","date":"2026-05-15","month":5,"year":2026,"id":"10ac416c-866c-4559-ab7a-d4f9ab4ffa0c","createdAt":"2026-01-07T14:31:30.184Z"},
    {"description":"ITAU - Nio Fibra","amount":102.24,"type":"expense","category":"telefone","date":"2026-01-07","month":1,"year":2026,"id":"cb4628ff-a177-4a60-9d92-b52298386a3d","createdAt":"2026-01-07T14:32:54.182Z"},
    {"description":"ITAU - Financimento AP","amount":1457.9,"type":"expense","category":"outros","date":"2026-01-07","month":1,"year":2026,"id":"57439e39-fcf9-4e40-b704-cfb0db6fa61f","createdAt":"2026-01-07T14:33:16.888Z"},
    {"description":"ITAU - Vivo Lucas","amount":149.98,"type":"expense","category":"telefone","date":"2026-01-07","month":1,"year":2026,"id":"0f0ac1e6-7de8-4d8c-8907-15f3e06977ff","createdAt":"2026-01-07T14:33:50.196Z"},
    {"description":"Seguro Carro (ALIRO)","amount":276.2,"type":"expense","category":"outros","date":"2026-01-07","month":1,"year":2026,"id":"17481925-4258-42ff-96eb-f863adedfe7a","createdAt":"2026-01-07T14:35:36.225Z"},
    {"description":"Ingles","amount":250,"type":"expense","category":"outros","date":"2026-01-07","month":1,"year":2026,"id":"1cd06655-8b81-4b64-a20d-85e749993381","createdAt":"2026-01-07T14:35:51.054Z"},
    {"description":"Vo Isa","amount":343.88,"type":"expense","category":"outros","date":"2026-01-07","month":1,"year":2026,"id":"c7e85d65-b881-4b9d-b57c-2a8a8c858a21","createdAt":"2026-01-07T14:36:18.177Z"},
    {"description":"Ammy","amount":523,"type":"expense","category":"outros","date":"2026-01-07","month":1,"year":2026,"id":"b65b57f2-5940-4026-9903-8d23bb6b31a8","createdAt":"2026-01-07T14:37:32.022Z"},
    {"description":"Ammy","amount":403,"type":"expense","category":"outros","date":"2026-02-07","month":2,"year":2026,"id":"9f2ec067-1d23-4245-9326-8e037"}
  ]
};

async function migrate() {
  console.log('🚀 Iniciando migração de dados...\n');

  // Buscar o primeiro usuário (ou criar um se não existir)
  let user = await prisma.user.findFirst();
  
  if (!user) {
    console.log('⚠️  Nenhum usuário encontrado. Criando usuário padrão...');
    user = await prisma.user.create({
      data: {
        email: 'lucas@finanx.app',
        password: 'e6b5e2c6e5e5c7e3e8e9e0e1e2e3e4e5e6e7e8e9e0e1e2e3e4e5e6e7e8e9e0e1', // hash fictício
        name: 'Lucas',
      },
    });
    console.log('✅ Usuário criado:', user.email);
  } else {
    console.log('✅ Usuário encontrado:', user.email);
  }

  console.log('\n📦 Inserindo transações...\n');

  let inserted = 0;
  let skipped = 0;

  for (const t of localStorageData.transactions) {
    try {
      // Verificar se já existe
      const existing = await prisma.transaction.findUnique({
        where: { id: t.id }
      });

      if (existing) {
        console.log(`⏭️  Pulando (já existe): ${t.description}`);
        skipped++;
        continue;
      }

      await prisma.transaction.create({
        data: {
          id: t.id,
          userId: user.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: new Date(t.date),
          month: t.month,
          year: t.year,
          createdAt: new Date(t.createdAt),
        },
      });
      
      console.log(`✅ Inserido: ${t.description} - R$ ${t.amount}`);
      inserted++;
    } catch (error) {
      console.error(`❌ Erro ao inserir ${t.description}:`, error);
    }
  }

  console.log('\n========================================');
  console.log(`✅ Migração concluída!`);
  console.log(`   Inseridos: ${inserted}`);
  console.log(`   Pulados: ${skipped}`);
  console.log('========================================\n');

  await prisma.$disconnect();
}

migrate().catch(console.error);

