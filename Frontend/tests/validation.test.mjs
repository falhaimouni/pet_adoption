import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

async function loadModule(path) {
  const result = await build({ entryPoints: [new URL(path, import.meta.url).pathname], bundle: true, write: false, format: 'esm', platform: 'node' });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const { formSchemas, validateFields, validateRequest } = await loadModule('../src/lib/formValidation.ts');
const { validateCheckout } = await loadModule('../src/lib/checkoutValidation.ts');
const t = key => key;
const uuid = '11111111-1111-4111-8111-111111111111';
const validDelivery = { recipientName: 'Joud Adopter', phoneNumber: '+962 79 123 4567', addressLine: '12 Main Street', city: 'Amman', postalCode: '', deliveryNotes: '' };

test('checkout rejects missing fields and invalid phones, supports optional fields and Arabic digits', () => {
  assert.deepEqual(validateCheckout(validDelivery, t), {});
  assert.deepEqual(validateCheckout({ ...validDelivery, phoneNumber: '٠٧٩١٢٣٤٥٦٧' }, t), {});
  assert.ok(validateCheckout({ ...validDelivery, recipientName: '   ' }, t).recipientName);
  assert.ok(validateCheckout({ ...validDelivery, phoneNumber: 'hello' }, t).phoneNumber);
  assert.ok(validateCheckout({ ...validDelivery, phoneNumber: '123' }, t).phoneNumber);
  assert.ok(validateCheckout({ ...validDelivery, postalCode: 'a'.repeat(21), deliveryNotes: 'a'.repeat(501) }, t).postalCode);
  assert.ok(validateCheckout({ ...validDelivery, deliveryNotes: 'a'.repeat(501) }, t).deliveryNotes);
});

test('profile rejects blank names, invalid contacts and oversized addresses', () => {
  const errors = validateFields(formSchemas.profile, { firstName: ' ', lastName: 'x'.repeat(81), phone: 'bad', address: 'x'.repeat(1001) }, t);
  assert.deepEqual(Object.keys(errors).sort(), ['address', 'firstName', 'lastName', 'phone']);
});

test('employee creation validates email, department, salary and hire date', () => {
  const errors = validateFields(formSchemas.employee, { firstName: 'Sara', lastName: 'Ali', email: 'bad', password: 'StrongPass1!', departmentId: 'bad', roleId: uuid, salary: Infinity, hireDate: '2026-02-30' }, t);
  for (const field of ['email', 'departmentId', 'salary', 'hireDate']) assert.ok(errors[field], field);
});

test('supplier requires every backend-required contact field', () => {
  const errors = validateFields(formSchemas.supplier, { supplierName: 'Supplies' }, t);
  assert.deepEqual(Object.keys(errors).sort(), ['address', 'city', 'country', 'email', 'phone']);
});

test('inventory rejects empty numeric fields, fractional quantities and excess price precision', () => {
  const data = { supplyName: 'Pet food', category: 'FOOD', supplierId: uuid, quantity: '', lowStockLimit: 1.5, minimumOrderQuantity: 0, sellingPrice: '1.234', purchasePrice: -1, deliveryTimeDays: 'NaN', status: 'INVALID' };
  const errors = validateFields(formSchemas.supply, data, t);
  for (const field of ['quantity', 'lowStockLimit', 'minimumOrderQuantity', 'sellingPrice', 'purchasePrice', 'deliveryTimeDays', 'status']) assert.ok(errors[field], field);
  assert.deepEqual(validateFields(formSchemas.supply, { ...data, quantity: 0, lowStockLimit: 1, minimumOrderQuantity: 1, sellingPrice: '1.01', purchasePrice: 0, deliveryTimeDays: '', status: 'AVAILABLE' }, t), {});
});

test('pet forms validate species, optional measurements and text limits', () => {
  const errors = validateFields(formSchemas.pet, { name: 'Luna', species: 'Invalid', age: -1, weight: 'not a number', breed: 'x'.repeat(121), color: 'x'.repeat(81), description: 'x'.repeat(5001) }, t);
  for (const field of ['species', 'age', 'weight', 'breed', 'color', 'description']) assert.ok(errors[field], field);
});

test('medical and vaccine forms validate dates, status, length, and chronological order', () => {
  assert.ok(validateFields(formSchemas.medical, { diagnosis: ' ', treatment: 'x'.repeat(5001), medicalDate: 'invalid', vaccinationStatus: 'bad' }, t).diagnosis);
  const errors = validateFields(formSchemas.vaccination, { vaccineName: 'Rabies', vaccinationDate: '2026-09-20', nextDueDate: '2026-09-19', batch: 'x'.repeat(121) }, t);
  assert.ok(errors.nextDueDate);
  assert.ok(errors.batch);
});

test('department and local vet profile fields are validated', () => {
  assert.ok(validateFields(formSchemas.department, { departmentName: ' ', description: 'x'.repeat(1001) }, t).description);
  assert.ok(validateFields(formSchemas.vetProfile, { experience: -1 }, t).experience);
});

test('request validation runs before HTTP for authentication, profiles, suppliers, messages and reports', () => {
  const cases = [
    ['/auth/login', 'POST', { email: 'bad', password: 'valid' }],
    ['/auth/signup', 'POST', { firstName: 'Sara', lastName: 'Ali', email: 'a@example.test', password: 'StrongPass1!', confirmPassword: 'mismatch' }],
    ['/auth/change-password', 'POST', { currentPassword: '', newPassword: 'StrongPass1!', confirmPassword: 'StrongPass1!' }],
    ['/users/profile', 'PATCH', { phone: 'invalid' }],
    ['/inventory/suppliers', 'POST', { supplierName: 'Example' }],
    ['/messages/send', 'POST', { conversationId: uuid, message: 'x'.repeat(5001) }],
    ['/adoption/requests', 'POST', { petId: uuid, notes: 'x'.repeat(1001) }],
  ];
  for (const [path, method, body] of cases) assert.throws(() => validateRequest(path, { method, body: JSON.stringify(body) }), path);
  assert.throws(() => validateRequest('/reports/adoptions?from=2026-09-20&to=2026-09-19', {}));
  assert.throws(() => validateRequest('/reports/pets/export/pdf?minAge=5&maxAge=2', {}));
  assert.doesNotThrow(() => validateRequest('/users/profile', { method: 'PATCH', body: JSON.stringify({ phone: '', address: '' }) }));
});

test('upload validation rejects inappropriate files before upload', () => {
  const body = new FormData();
  body.append('file', new File(['hello'], 'wrong.txt', { type: 'text/plain' }));
  assert.throws(() => validateRequest('/users/profile/avatar', { method: 'POST', body }));
});
