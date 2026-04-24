import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não configurada');
  process.exit(1);
}

async function seedProducts() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // Limpar produtos existentes (opcional)
    // await connection.execute('DELETE FROM products');

    const products = [
      {
        name: 'Conta Uber',
        description: 'Recuperação e criação de conta Uber',
        valueRandom: 'R$ 350,00',
        valueFirst: 'R$ 500,00',
        valueFull: 'R$ 800,00',
        enableRandom: 1,
        enableFirst: 1,
        enableFull: 1,
        requireProfilePhoto: 1,
        requireCarDocument: 1,
        requireAlvara: 0,
        requireCondutaxi: 0,
        requireVehicle2016: 1,
        isPdfOnly: 0,
        showYearField: 0,
        isActive: 1,
        sortOrder: 1,
      },
      {
        name: 'Conta 99',
        description: 'Recuperação e criação de conta 99',
        valueRandom: 'R$ 400,00',
        valueFirst: 'R$ 600,00',
        valueFull: 'Consulte',
        enableRandom: 1,
        enableFirst: 1,
        enableFull: 0,
        requireProfilePhoto: 1,
        requireCarDocument: 1,
        requireAlvara: 0,
        requireCondutaxi: 0,
        requireVehicle2016: 1,
        isPdfOnly: 0,
        showYearField: 0,
        isActive: 1,
        sortOrder: 2,
      },
      {
        name: 'Conta InDrive',
        description: 'Recuperação e criação de conta InDrive',
        valueRandom: 'R$ 250,00',
        valueFirst: 'R$ 400,00',
        valueFull: 'Consulte',
        enableRandom: 1,
        enableFirst: 1,
        enableFull: 0,
        requireProfilePhoto: 1,
        requireCarDocument: 1,
        requireAlvara: 0,
        requireCondutaxi: 0,
        requireVehicle2016: 1,
        isPdfOnly: 0,
        showYearField: 0,
        isActive: 1,
        sortOrder: 3,
      },
      {
        name: 'UBER TAXI',
        description: 'Recuperação e criação de conta Uber Taxi',
        valueRandom: 'R$ 600,00',
        valueFirst: 'R$ 800,00',
        valueFull: 'Consulte',
        enableRandom: 1,
        enableFirst: 1,
        enableFull: 0,
        requireProfilePhoto: 1,
        requireCarDocument: 1,
        requireAlvara: 1,
        requireCondutaxi: 1,
        requireVehicle2016: 1,
        isPdfOnly: 0,
        showYearField: 0,
        isActive: 1,
        sortOrder: 4,
      },
      {
        name: 'EDIÇÃO DE DOCUMENTO',
        description: 'Edição e atualização de documentos',
        valueRandom: 'R$ 125,00',
        valueFirst: 'R$ 125,00',
        valueFull: 'Consulte',
        enableRandom: 1,
        enableFirst: 1,
        enableFull: 0,
        requireProfilePhoto: 0,
        requireCarDocument: 0,
        requireAlvara: 0,
        requireCondutaxi: 0,
        requireVehicle2016: 0,
        isPdfOnly: 1,
        showYearField: 1,
        isActive: 1,
        sortOrder: 5,
      },
    ];

    for (const product of products) {
      // Verificar se já existe
      const [existing] = await connection.execute(
        'SELECT id FROM products WHERE name = ?',
        [product.name]
      );

      if (existing.length === 0) {
        await connection.execute(
          `INSERT INTO products (
            name, description, valueRandom, valueFirst, valueFull,
            enableRandom, enableFirst, enableFull,
            requireProfilePhoto, requireCarDocument, requireAlvara, requireCondutaxi,
            requireVehicle2016, isPdfOnly, showYearField, isActive, sortOrder
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.name,
            product.description,
            product.valueRandom,
            product.valueFirst,
            product.valueFull,
            product.enableRandom,
            product.enableFirst,
            product.enableFull,
            product.requireProfilePhoto,
            product.requireCarDocument,
            product.requireAlvara,
            product.requireCondutaxi,
            product.requireVehicle2016,
            product.isPdfOnly,
            product.showYearField,
            product.isActive,
            product.sortOrder,
          ]
        );
        console.log(`✅ Produto criado: ${product.name}`);
      } else {
        console.log(`⏭️  Produto já existe: ${product.name}`);
      }
    }

    console.log('✅ Seed concluído!');
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedProducts();
