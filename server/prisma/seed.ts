import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create roles with permissions
  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: { 
      name: 'MANAGER',
      permissions: JSON.stringify([
        'ALL_PERMISSIONS',
        'MANAGE_PRODUCTS',
        'MANAGE_USERS', 
        'VIEW_REPORTS',
        'APPROVE_EXCHANGES',
        'APPROVE_RETURNS',
        'MANAGE_DISCOUNTS',
        'VIEW_COST_PRICES'
      ])
    }
  });

  const cashierRole = await prisma.role.upsert({
    where: { name: 'CASHIER' },
    update: {},
    create: { 
      name: 'CASHIER',
      permissions: JSON.stringify([
        'PROCESS_SALES',
        'VIEW_PRODUCTS',
        'APPLY_DISCOUNTS',
        'CREATE_EXCHANGES',
        'CREATE_RETURNS',
        'VIEW_DAILY_REPORTS'
      ])
    }
  });

  // Create default manager user
  const hashedPassword = await bcrypt.hash('manager123', 10);
  await prisma.user.upsert({
    where: { email: 'manager@costumeshop.lk' },
    update: {},
    create: {
      email: 'manager@costumeshop.lk',
      name: 'Shop Manager',
      password: hashedPassword,
      roleId: managerRole.id
    }
  });

  // Create default cashier user
  const hashedCashierPassword = await bcrypt.hash('cashier123', 10);
  await prisma.user.upsert({
    where: { email: 'cashier@costumeshop.lk' },
    update: {},
    create: {
      email: 'cashier@costumeshop.lk', 
      name: 'Cashier User',
      password: hashedCashierPassword,
      roleId: cashierRole.id
    }
  });

  // Create product categories
  const categories = [
    { name: 'Wedding Dresses' },
    { name: 'Party Wear' },
    { name: 'Traditional Sarees' },
    { name: 'Mens Formal' },
    { name: 'Kids Costumes' },
    { name: 'Cultural Dress' },
    { name: 'Accessories' }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  // Create sample products
  const weddingCategory = await prisma.category.findUnique({ where: { name: 'Wedding Dresses' } });
  const partyCategory = await prisma.category.findUnique({ where: { name: 'Party Wear' } });

  if (weddingCategory && partyCategory) {
    const sampleProducts = [
      {
        sku: 'WD001',
        name: 'Elegant White Wedding Dress',
        description: 'Beautiful white wedding dress with lace details',
        categoryId: weddingCategory.id,
        brand: 'Bridal Collection',
        size: 'M',
        color: 'White',
        gender: 'Female',
        price: 45000.00,
        costPrice: 30000.00
      },
      {
        sku: 'PW001', 
        name: 'Red Evening Gown',
        description: 'Stunning red evening gown for parties',
        categoryId: partyCategory.id,
        brand: 'Party Line',
        size: 'L',
        color: 'Red',
        gender: 'Female',
        price: 25000.00,
        costPrice: 15000.00
      }
    ];

    for (const product of sampleProducts) {
      const createdProduct = await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product
      });

      // Create inventory for the product
      await prisma.inventory.upsert({
        where: { productId: createdProduct.id },
        update: {},
        create: {
          productId: createdProduct.id,
          quantity: 10,
          minStockLevel: 2,
          maxStockLevel: 50,
          reorderPoint: 5
        }
      });
    }
  }

  // Create sample discount
  await prisma.discount.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      name: 'Welcome Discount',
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10.00,
      minAmount: 5000.00,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      usageLimit: 100
    }
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
