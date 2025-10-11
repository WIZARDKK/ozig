import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class POSController {
  // Create new order
  async createOrder(req: Request, res: Response) {
    try {
      const {
        orderNumber,
        items,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        customerName,
        customerPhone,
        paymentMethod,
        amountPaid,
        change
      } = req.body;
      
      const userId = (req as any).user.id;

      // Validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Order items are required'
        });
      }

      if (!paymentMethod || !['CASH', 'CARD', 'MOBILE', 'BANK_TRANSFER'].includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          error: 'Valid payment method is required'
        });
      }

      // Create order with items
      const order = await prisma.order.create({
        data: {
          orderNumber: orderNumber || `POS-${Date.now()}`,
          userId,
          customerName,
          customerPhone,
          subtotal,
          discountAmount,
          taxAmount,
          total,
          paymentMethod,
          status: 'COMPLETED',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              discount: item.discount || 0
            }))
          },
          payments: {
            create: {
              amount: amountPaid,
              method: paymentMethod,
              status: 'COMPLETED'
            }
          }
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          },
          payments: true,
          user: {
            select: {
              name: true
            }
          }
        }
      });

      // Update inventory (both Product.stock and Inventory.quantity)
      await Promise.all(
        items.map(async (item: any) => {
          // Update Product stock
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity }
            }
          });
          
          // Update Inventory quantity
          return prisma.inventory.updateMany({
            where: { productId: item.productId },
            data: {
              quantity: { decrement: item.quantity }
            }
          });
        })
      );

      res.status(201).json({
        success: true,
        order: {
          ...order,
          amountPaid,
          change
        },
        message: 'Order created successfully'
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create order'
      });
    }
  }

  // Get orders with filtering
  async getOrders(req: Request, res: Response) {
    try {
      const {
        search,
        status,
        paymentMethod,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          { orderNumber: { contains: search as string } },
          { customerName: { contains: search as string } },
          { customerPhone: { contains: search as string } }
        ];
      }

      // Status filter
      if (status) {
        where.status = status;
      }

      // Payment method filter
      if (paymentMethod) {
        where.paymentMethod = paymentMethod;
      }

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      const [orders, totalCount] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true
                  }
                }
              }
            },
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.order.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / Number(limit));

      res.json({
        success: true,
        orders,
        pagination: {
          total: totalCount,
          totalPages,
          currentPage: Number(page),
          limit: Number(limit)
        }
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders'
      });
    }
  }

  // Get single order
  async getOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orderId = Number(id);

      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          },
          payments: true,
          user: {
            select: {
              name: true,
              email: true
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

      res.json({
        success: true,
        order
      });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch order'
      });
    }
  }

  // Get available discounts
  async getDiscounts(req: Request, res: Response) {
    try {
      const discounts = await prisma.discount.findMany({
        where: {
          isActive: true
        },
        orderBy: { name: 'asc' }
      });

      res.json({
        success: true,
        discounts
      });
    } catch (error) {
      console.error('Get discounts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch discounts'
      });
    }
  }

  // Get POS statistics
  async getPOSStats(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [
        todayOrders,
        todayRevenue,
        totalOrders,
        totalRevenue
      ] = await Promise.all([
        prisma.order.count({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            },
            status: 'COMPLETED'
          }
        }),
        prisma.order.aggregate({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            },
            status: 'COMPLETED'
          },
          _sum: {
            total: true
          }
        }),
        prisma.order.count({
          where: {
            status: 'COMPLETED'
          }
        }),
        prisma.order.aggregate({
          where: {
            status: 'COMPLETED'
          },
          _sum: {
            total: true
          }
        })
      ]);

      res.json({
        success: true,
        stats: {
          todayOrders,
          todayRevenue: todayRevenue._sum.total || 0,
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0
        }
      });
    } catch (error) {
      console.error('Get POS stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }
}