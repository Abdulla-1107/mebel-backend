import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}
  async create(createOrderDto: CreateOrderDto) {
    // 1️⃣ Barcha productlarni olish
    const productIds = createOrderDto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // 2️⃣ Productlarni map ga o‘tkazish (O(1) lookup)
    const productMap: Record<string, { price: number; name_uz: string }> = {};
    products.forEach((p) => {
      productMap[p.id] = { price: Number(p.price), name_uz: p.name_uz };
    });

    // 3️⃣ OrderItem data va totalPrice hisoblash
    let totalPrice = 0;
    const orderItemsData = createOrderDto.items.map((item) => {
      const product = productMap[item.productId];
      const itemTotal = product.price * item.quantity;
      totalPrice += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
      };
    });

    // 4️⃣ Order yaratish
    const order = await this.prisma.order.create({
      data: {
        fullName: createOrderDto.fullName,
        phone: createOrderDto.phone,
        address: createOrderDto.address,
        email: createOrderDto.email,
        oferta: createOrderDto.oferta,
        totalPrice, // backend avtomatik hisoblagan Int
        OrderItem: {
          create: orderItemsData,
        },
      },
      include: { OrderItem: { include: { Product: true } } },
    });

    // 5️⃣ Telegramga xabar yuborish
    const orderText = `
🆕 <b>Yangi buyurtma!</b>
👤 Ism: ${order.fullName}
📞 Telefon: ${order.phone}
📍 Manzil: ${order.address}
💰 Narxi: ${order.totalPrice} so'm
🧾 Buyurtma ID: ${order.id}

🛍️ <b>Mahsulotlar:</b>
${order.OrderItem.map(
  (item) =>
    `• ${item.Product.name_uz} — ${item.quantity} dona — ${item.Product.price} so'm`,
).join('\n')}
`;

    await this.telegram.sendMessage(orderText);

    return {
      message: 'Buyurtma yaratildi va Telegramga yuborildi ✅',
      data: order,
    };
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { OrderItem: { include: { Product: true } } },
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} order`;
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }
}
