import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CheckoutService } from '../../src/modules/checkout/checkout.service';
import { listedStoreSupplyForProduct } from '../../src/modules/store/store-availability';

function fixture(quantity = 1, stock = 5, visible = true) {
  const supply = { productId: 'current', supplyName: 'Adult Cat Food', isActive: true,
    storeListed: visible, status: 'AVAILABLE', quantity: stock };
  const product = { productId: 'current', productName: 'Adult Cat Food', unitPrice: '12.50', supplies: [supply] };
  const cart = { cartId: 'cart', cartItems: [
    { product: { productId: 'legacy', productName: 'Cat Food', unitPrice: '8.00', supplies: [] }, quantity: 1 },
    { product, quantity },
  ] };
  const savedItems: any[] = [];
  let savedOrder: any;
  const stockLookups: string[] = [];
  const notices: string[] = [];
  const qb = (value: any) => {
    const builder: any = {};
    for (const method of ['setLock', 'andWhere']) builder[method] = () => builder;
    builder.where = (_: string, params: any) => { if (params.productId) stockLookups.push(params.productId); return builder; };
    builder.getOne = async () => value;
    return builder;
  };
  const manager: any = { getRepository: (entity: any) => {
    switch (entity.name) {
      case 'User': return { createQueryBuilder: () => qb({ userId: 'user' }) };
      case 'Cart': return { createQueryBuilder: () => qb(cart), findOne: async () => cart };
      case 'Supply': return { createQueryBuilder: () => qb(supply) };
      case 'Order': return { create: (v: any) => v, save: async (v: any) => (savedOrder = { ...v, orderId: 'order', orderReference: 'PET-2026-000123' }), findOne: async () => savedOrder };
      case 'OrderItem': return { create: (v: any) => v, save: async (v: any[]) => savedItems.push(...v) };
      case 'ActivityLog': return { create: (v: any) => v, save: async () => {} };
      default: throw new Error(entity.name);
    }
  }};
  const service = new CheckoutService({ transaction: (fn: any) => fn(manager) } as any,
    { notifyUsers: async (_: any, title: string, message: string) => notices.push(message), notifyRoles: async (_: any, title: string, message: string) => notices.push(message) } as any);
  return { service, savedItems, stockLookups, product, notices };
}
const delivery = { recipientName: 'Test', phoneNumber: '123456789', addressLine: 'Test Street', city: 'Amman' };

test('review orders only visible inventory-backed items, ignoring hidden legacy Cat Food', async () => {
  const f = fixture();
  const order = await f.service.checkout('user', delivery);
  assert.equal(order.totalPrice, '12.50');
  assert.equal(order.orderReference, 'PET-2026-000123');
  assert.deepEqual(f.notices, ['Your order PET-2026-000123 was created.', 'Order PET-2026-000123 was created.']);
  assert.deepEqual(f.stockLookups, ['current']);
  assert.equal(f.savedItems.length, 1);
  assert.equal(f.savedItems[0].productId, 'current');
});

test('review still rejects quantities above available stock', async () => {
  const f = fixture(6, 5);
  await assert.rejects(() => f.service.checkout('user', delivery), /Only 5 item/);
  assert.equal(f.savedItems.length, 0);
});

test('a cart containing only hidden or unavailable items cannot create an empty order', async () => {
  for (const f of [fixture(1, 0), fixture(1, 5, false)]) {
    await assert.rejects(() => f.service.checkout('user', delivery), /empty cart/);
    assert.equal(f.savedItems.length, 0);
  }
});

test('cart eligibility excludes inactive, unlisted, and unavailable supplies', () => {
  const f = fixture();
  assert.ok(listedStoreSupplyForProduct(f.product as any));
  for (const change of [{ isActive: false }, { storeListed: false }, { status: 'DISCONTINUED' }, { quantity: 0 }]) {
    assert.equal(listedStoreSupplyForProduct({ ...f.product, supplies: [{ ...f.product.supplies[0], ...change }] } as any), undefined);
  }
});
