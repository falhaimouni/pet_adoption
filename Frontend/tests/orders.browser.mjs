import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Run against a dev or built frontend with VITE_USE_MOCKS=false.
// API fixtures keep checkout tests isolated from real accounts and orders.
const base = process.env.TEST_URL ?? 'http://127.0.0.1:5173';
const userId = '11111111-1111-4111-8111-111111111111';
const productId = '22222222-2222-4222-8222-222222222222';
const item = { cartItemId: 'test-item', productId, quantity: 2, unitPrice: '12.50', subtotal: '25.00', product: { productId, productName: 'Pet food', unitPrice: '12.50', isActive: true } };
let cartItems = [item];
const orders = [];
const requests = [];
let failPayment = true;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 443, height: 794 } });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(userId => {
    sessionStorage.setItem('petopia_auth_user', JSON.stringify({ id: userId, role: 'adopter', name: 'Test Adopter', email: 'test@example.test' }));
  }, userId);
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.port !== '3000' && !url.pathname.startsWith('/api/')) return route.continue();
    const path = url.pathname.replace(/^\/api/, '');
    const method = route.request().method();
    requests.push({ path, method });
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' } });
    const reply = (json, status = 200) => route.fulfill({ status, json, headers: { 'Access-Control-Allow-Origin': '*' } });
    if (path === '/users/profile') return reply({ userId, firstName: 'Test', lastName: 'Adopter', email: 'test@example.test', role: { roleName: 'ADOPTER' } });
    if (path === '/notifications/unread-count') return reply({ count: 0 });
    if (path === '/cart/me') return reply({ cartId: 'test-cart', userId, cartItems });
    if (path === '/orders/me') return reply(orders);
    if (path.startsWith('/orders/me/')) return reply(orders.find(order => order.orderId === path.split('/').at(-1)) ?? { message: 'Order not found' });
    if (path === '/checkout') {
      const order = { ...route.request().postDataJSON(), orderId: crypto.randomUUID(), userId, orderStatus: 'PENDING', totalPrice: '25.00', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), orderItems: cartItems.map(value => ({ ...value, orderItemId: value.cartItemId })), payments: [] };
      orders.push(order);
      return reply(order);
    }
    const action = path.match(/^\/checkout\/([^/]+)\/(pay|cancel)$/);
    if (action) {
      const order = orders.find(value => value.orderId === action[1]);
      if (!order || order.orderStatus !== 'PENDING') return reply({ message: 'Only pending orders can be changed' }, 400);
      if (action[2] === 'pay' && failPayment) { failPayment = false; return reply({ message: 'Payment unavailable. Please try again.' }, 503); }
      order.orderStatus = action[2] === 'pay' ? 'COMPLETED' : 'CANCELED';
      if (action[2] === 'pay') cartItems = [];
      return reply(order);
    }
    return reply({ message: 'Not part of this test' }, 404);
  });
  const checkoutCount = () => requests.filter(request => request.path === '/checkout' && request.method === 'POST').length;
  const review = () => page.getByRole('button', { name: 'Review order', exact: true });
  const fillDelivery = async () => {
    for (const [field, value] of Object.entries({ recipientName: 'Test Adopter', phoneNumber: '+962791234567', addressLine: '12 Main Street', city: 'Amman' })) await page.locator(`#checkout-${field}`).fill(value);
  };

  await page.goto(`${base}/#/cart`, { waitUntil: 'domcontentloaded' });
  await review().click();
  await page.locator('#checkout-recipientName[aria-invalid="true"]').waitFor();
  assert.equal(checkoutCount(), 0);
  await fillDelivery();
  await page.locator('#checkout-phoneNumber').fill('invalid phone');
  await review().click();
  await page.locator('#checkout-phoneNumber[aria-invalid="true"]').waitFor();
  assert.equal(checkoutCount(), 0);
  await page.locator('#checkout-phoneNumber').fill('+962791234567');
  await review().click();
  await page.waitForURL('**/#/orders?orderId=*');
  await page.getByRole('button', { name: 'Pay with cash', exact: true }).waitFor();
  assert.equal(checkoutCount(), 1);
  assert.equal(requests.filter(request => request.path.endsWith('/pay')).length, 0, 'review must not automatically pay');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Pay with cash', exact: true }).waitFor();
  assert.equal(checkoutCount(), 1, 'reload must fetch the existing order');
  for (const width of [320, 443, 1280]) {
    await page.setViewportSize({ width, height: 794 });
    assert.ok(await page.locator('main').evaluate(el => el.scrollWidth <= el.clientWidth + 1), `order details overflow at ${width}px`);
  }
  await page.getByRole('button', { name: 'Cancel order', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel order', exact: true }).last().click();
  await page.getByText('Order canceled. Your cart items have been kept.', { exact: true }).waitFor();
  assert.equal(cartItems.length, 1);
  assert.equal(await page.getByRole('button', { name: 'Pay with cash', exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Back to cart', exact: true }).click();
  await fillDelivery();
  await review().click();
  await page.getByRole('button', { name: 'Pay with cash', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Payment unavailable' }).waitFor();
  assert.equal(cartItems.length, 1);
  await page.getByRole('button', { name: 'Pay with cash', exact: true }).click();
  await page.getByText('Payment confirmed. Your order is complete.', { exact: true }).waitFor();
  assert.equal(cartItems.length, 0);
  assert.equal(await page.getByRole('button', { name: 'Cancel order', exact: true }).count(), 0);
  assert.equal(checkoutCount(), 2);
  await page.getByRole('button', { name: 'All orders', exact: true }).click();
  await page.getByRole('button', { name: 'View order details', exact: true }).first().waitFor();
  assert.equal(await page.getByRole('button', { name: 'View order details', exact: true }).count(), 2);
  assert.deepEqual(pageErrors, []);
  console.log('PASS: validation blocks requests; review is separate; reload preserves order; cancellation keeps cart; payment retry completes; history and responsive layout work.');
} finally {
  await browser.close();
}
