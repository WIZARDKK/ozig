import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedExchanges() {
  try {
    console.log('Starting exchange data seeding...');

    // First, check if we have some orders to base exchanges on
    const orders = await prisma.order.findMany({
      include: { items: { include: { product: true } } },
      take: 5
    });

    if (orders.length === 0) {
      console.log('No orders found. Please run the main seed first to create orders.');
      return;
    }

    // Get the manager user
    const manager = await prisma.user.findFirst({
      where: { email: 'manager@costumeshop.lk' }
    });

    if (!manager) {
      console.log('No manager user found. Please run the main seed first.');
      return;
    }

    // Create sample exchanges
    const exchanges = [
      {
        exchangeNumber: 'EX-2024-001',
        originalOrderId: orders[0].id,
        userId: manager.id,
        customerName: 'Sarah Johnson',
        customerPhone: '+94771234567',
        status: 'COMPLETED' as const,
        exchangeDate: new Date('2024-10-01'),
        totalPriceDifference: 1500.00,
        additionalPaymentRequired: 1500.00
      },
      {
        exchangeNumber: 'EX-2024-002',
        originalOrderId: orders[1] ? orders[1].id : orders[0].id,
        userId: manager.id,
        customerName: 'Mike Chen',
        customerPhone: '+94777654321',
        status: 'COMPLETED' as const,
        exchangeDate: new Date('2024-10-03'),
        totalPriceDifference: -800.00,
        additionalPaymentRequired: 0.00
      },
      {
        exchangeNumber: 'EX-2024-003',
        originalOrderId: orders[2] ? orders[2].id : orders[0].id,
        userId: manager.id,
        customerName: 'Emily Davis',
        customerPhone: '+94712345678',
        status: 'PENDING' as const,
        exchangeDate: new Date('2024-10-05'),
        totalPriceDifference: 2200.00,
        additionalPaymentRequired: 2200.00
      },
      {
        exchangeNumber: 'EX-2024-004',
        originalOrderId: orders[3] ? orders[3].id : orders[0].id,
        userId: manager.id,
        customerName: 'David Wilson',
        customerPhone: '+94709876543',
        status: 'COMPLETED' as const,
        exchangeDate: new Date('2024-10-07'),
        totalPriceDifference: 500.00,
        additionalPaymentRequired: 500.00
      },
      {
        exchangeNumber: 'EX-2024-005',
        originalOrderId: orders[4] ? orders[4].id : orders[0].id,
        userId: manager.id,
        customerName: 'Lisa Anderson',
        customerPhone: '+94765432109',
        status: 'COMPLETED' as const,
        exchangeDate: new Date('2024-10-09'),
        totalPriceDifference: 3200.00,
        additionalPaymentRequired: 3200.00
      }
    ];

    console.log('Creating exchanges...');
    
    for (const exchangeData of exchanges) {
      const exchange = await prisma.exchange.create({
        data: exchangeData
      });
      console.log(`Created exchange: ${exchange.exchangeNumber}`);
    }

    console.log('Exchange seeding completed successfully!');
    
    // Display summary
    const totalExchanges = await prisma.exchange.count();
    const totalValue = await prisma.exchange.aggregate({
      _sum: { additionalPaymentRequired: true }
    });
    
    console.log(`\nSummary:`);
    console.log(`Total Exchanges: ${totalExchanges}`);
    console.log(`Total Value: LKR ${totalValue._sum.additionalPaymentRequired}`);
    
  } catch (error) {
    console.error('Error seeding exchanges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedExchanges();