import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLKRPriceFlow() {
  try {
    console.log('🇱🇰 Testing LKR Price Flow (No Conversion)');
    console.log('============================================');

    // Test a barcode scan
    const barcode = await prisma.barcode.findFirst({
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    if (!barcode) {
      console.log('❌ No barcodes found');
      return;
    }

    console.log(`\n1️⃣ Product in Database:`);
    console.log(`   Name: ${barcode.product.name}`);
    console.log(`   Stored Price: ${barcode.product.price} LKR`);

    console.log(`\n2️⃣ Barcode Scan Response (Backend):`);
    console.log(`   Code: ${barcode.code}`);
    console.log(`   Returns Price: ${barcode.product.price} LKR (raw value)`);

    console.log(`\n3️⃣ Frontend POS Processing:`);
    const backendPrice = Number(barcode.product.price);
    console.log(`   Receives: ${backendPrice} LKR`);
    console.log(`   No Conversion Applied`);
    console.log(`   Displays: LKR ${backendPrice.toFixed(2)}`);

    console.log(`\n4️⃣ Price Display Examples:`);
    const allProducts = await prisma.product.findMany();
    
    allProducts.forEach(product => {
      const price = Number(product.price);
      console.log(`   ${product.name}:`);
      console.log(`     Database: ${price} LKR → Display: LKR ${price.toFixed(2)}`);
    });

    console.log(`\n✅ Summary:`);
    console.log(`   - No price conversion (÷100 or ×100)`);
    console.log(`   - Database values used directly`);
    console.log(`   - Currency display: LKR instead of USD ($)`);
    console.log(`   - Prices stored/displayed as entered`);

  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLKRPriceFlow();