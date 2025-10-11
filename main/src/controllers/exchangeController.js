const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all exchanges with optional filters
const getExchanges = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const filters = {};
    
    // Status filter
    if (status && status !== 'all') {
      filters.status = status.toUpperCase();
    }
    
    // Date range filter
    if (startDate || endDate) {
      filters.exchangeDate = {};
      if (startDate) {
        filters.exchangeDate.gte = new Date(startDate);
      }
      if (endDate) {
        filters.exchangeDate.lte = new Date(endDate);
      }
    }
    
    const exchanges = await prisma.exchange.findMany({
      where: filters,
      include: {
        originalOrder: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        },
        items: {
          include: {
            originalOrderItem: {
              include: {
                product: true
              }
            },
            newProduct: true
          }
        }
      },
      orderBy: {
        exchangeDate: 'desc'
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      exchanges: exchanges.map(exchange => ({
        id: exchange.id,
        exchangeNumber: exchange.exchangeNumber,
        originalOrderId: exchange.originalOrderId,
        originalOrderNumber: exchange.originalOrder?.orderNumber,
        customerName: exchange.customerName,
        customerPhone: exchange.customerPhone,
        status: exchange.status,
        exchangeDate: exchange.exchangeDate,
        totalPriceDifference: exchange.totalPriceDifference,
        additionalPaymentRequired: exchange.additionalPaymentRequired,
        items: exchange.items?.map(item => ({
          id: item.id,
          orderItemId: item.originalOrderItemId,
          originalProduct: {
            id: item.originalOrderItem?.product?.id,
            name: item.originalOrderItem?.product?.name,
            sku: item.originalOrderItem?.product?.sku,
            price: parseFloat(item.originalOrderItem?.product?.price || 0)
          },
          newProduct: {
            id: item.newProduct?.id,
            name: item.newProduct?.name,
            sku: item.newProduct?.sku,
            price: parseFloat(item.newProduct?.price || 0)
          },
          quantity: item.quantity,
          priceDifference: item.priceDifference
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching exchanges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exchanges'
    });
  }
};

// Get exchange by ID
const getExchangeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exchange = await prisma.exchange.findUnique({
      where: { id: parseInt(id) },
      include: {
        originalOrder: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        },
        items: {
          include: {
            originalOrderItem: {
              include: {
                product: true
              }
            },
            newProduct: true
          }
        }
      }
    });
    
    if (!exchange) {
      return res.status(404).json({
        success: false,
        error: 'Exchange not found'
      });
    }
    
    res.json({
      success: true,
      exchange: {
        id: exchange.id,
        exchangeNumber: exchange.exchangeNumber,
        originalOrderId: exchange.originalOrderId,
        originalOrderNumber: exchange.originalOrder?.orderNumber,
        customerName: exchange.customerName,
        customerPhone: exchange.customerPhone,
        status: exchange.status,
        exchangeDate: exchange.exchangeDate,
        totalPriceDifference: exchange.totalPriceDifference,
        additionalPaymentRequired: exchange.additionalPaymentRequired,
        items: exchange.items?.map(item => ({
          id: item.id,
          orderItemId: item.originalOrderItemId,
          originalProduct: {
            id: item.originalOrderItem?.product?.id,
            name: item.originalOrderItem?.product?.name,
            sku: item.originalOrderItem?.product?.sku,
            price: parseFloat(item.originalOrderItem?.product?.price || 0)
          },
          newProduct: {
            id: item.newProduct?.id,
            name: item.newProduct?.name,
            sku: item.newProduct?.sku,
            price: parseFloat(item.newProduct?.price || 0)
          },
          quantity: item.quantity,
          priceDifference: item.priceDifference
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching exchange:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exchange'
    });
  }
};

// Get order for exchange (validate order exists and can be exchanged)
const getOrderForExchange = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if order is eligible for exchange (e.g., not too old, already completed, etc.)
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    const maxAgeForExchange = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    if (orderAge > maxAgeForExchange) {
      return res.status(400).json({
        success: false,
        error: 'Order is too old for exchange (must be within 30 days)'
      });
    }
    
    res.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          product: {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            price: parseFloat(item.product.price)
          }
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching order for exchange:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
};

// Create new exchange
const createExchange = async (req, res) => {
  try {
    const {
      exchangeNumber,
      originalOrderId,
      originalOrderNumber,
      customerName,
      customerPhone,
      items,
      totalPriceDifference,
      additionalPaymentRequired,
      status = 'COMPLETED'
    } = req.body;
    
    // Validate required fields
    if (!exchangeNumber || !originalOrderId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required exchange data'
      });
    }
    
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create exchange record
      const exchange = await tx.exchange.create({
        data: {
          exchangeNumber,
          originalOrderId: parseInt(originalOrderId),
          customerName,
          customerPhone,
          status: status.toUpperCase(),
          exchangeDate: new Date(),
          totalPriceDifference: parseFloat(totalPriceDifference || 0),
          additionalPaymentRequired: parseFloat(additionalPaymentRequired || 0)
        }
      });
      
      // Create exchange items and update inventory
      for (const item of items) {
        // Create exchange item record
        await tx.exchangeItem.create({
          data: {
            exchangeId: exchange.id,
            originalOrderItemId: parseInt(item.orderItemId),
            newProductId: parseInt(item.newProduct.id),
            quantity: parseInt(item.quantity || 1),
            priceDifference: parseFloat(item.priceDifference || 0)
          }
        });
        
        // Update inventory: Remove new product stock, Add original product stock back
        await tx.product.update({
          where: { id: parseInt(item.newProduct.id) },
          data: {
            stock: {
              decrement: parseInt(item.quantity || 1)
            }
          }
        });
        
        await tx.product.update({
          where: { id: parseInt(item.originalProduct.id) },
          data: {
            stock: {
              increment: parseInt(item.quantity || 1)
            }
          }
        });
      }
      
      return exchange;
    });
    
    // Fetch the complete exchange with relations
    const completeExchange = await prisma.exchange.findUnique({
      where: { id: result.id },
      include: {
        originalOrder: true,
        items: {
          include: {
            originalOrderItem: {
              include: {
                product: true
              }
            },
            newProduct: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Exchange created successfully',
      exchange: {
        id: completeExchange.id,
        exchangeNumber: completeExchange.exchangeNumber,
        originalOrderId: completeExchange.originalOrderId,
        originalOrderNumber: completeExchange.originalOrder?.orderNumber,
        customerName: completeExchange.customerName,
        customerPhone: completeExchange.customerPhone,
        status: completeExchange.status,
        exchangeDate: completeExchange.exchangeDate,
        totalPriceDifference: completeExchange.totalPriceDifference,
        additionalPaymentRequired: completeExchange.additionalPaymentRequired,
        items: completeExchange.items?.map(item => ({
          id: item.id,
          orderItemId: item.originalOrderItemId,
          originalProduct: {
            id: item.originalOrderItem?.product?.id,
            name: item.originalOrderItem?.product?.name,
            sku: item.originalOrderItem?.product?.sku,
            price: parseFloat(item.originalOrderItem?.product?.price || 0)
          },
          newProduct: {
            id: item.newProduct?.id,
            name: item.newProduct?.name,
            sku: item.newProduct?.sku,
            price: parseFloat(item.newProduct?.price || 0)
          },
          quantity: item.quantity,
          priceDifference: item.priceDifference
        }))
      }
    });
  } catch (error) {
    console.error('Error creating exchange:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create exchange'
    });
  }
};

// Cancel exchange
const cancelExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const exchange = await prisma.exchange.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true
      }
    });
    
    if (!exchange) {
      return res.status(404).json({
        success: false,
        error: 'Exchange not found'
      });
    }
    
    if (exchange.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Exchange is already cancelled'
      });
    }
    
    // Start transaction to cancel exchange and revert inventory changes
    await prisma.$transaction(async (tx) => {
      // Update exchange status
      await tx.exchange.update({
        where: { id: parseInt(id) },
        data: {
          status: 'CANCELLED',
          cancelReason: reason
        }
      });
      
      // Revert inventory changes
      for (const item of exchange.items) {
        // Add back new product stock, Remove original product stock
        await tx.product.update({
          where: { id: item.newProductId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
        
        // Get original product ID from order item
        const orderItem = await tx.orderItem.findUnique({
          where: { id: item.originalOrderItemId },
          include: { product: true }
        });
        
        if (orderItem) {
          await tx.product.update({
            where: { id: orderItem.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Exchange cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling exchange:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel exchange'
    });
  }
};

module.exports = {
  getExchanges,
  getExchangeById,
  getOrderForExchange,
  createExchange,
  cancelExchange
};