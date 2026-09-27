import { translateText, TextParams } from './text';
export function localizeNotification(value: string, tx: (source: string, params?: TextParams) => string = translateText) {
  const publicOrder = /^(Your order|Order) (PET-\d{4}-\d{6,}) was (created|cancelled|completed|paid and completed)\.$/.exec(value);
  if (publicOrder) return tx(`${publicOrder[1]} {reference} was ${publicOrder[3]}.`, { reference: publicOrder[2] });
  // Older saved notifications embedded internal UUIDs in their messages.
  const orderMessage = /^(Your order|Order) [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12} was (created|cancelled|completed|paid and completed)\.$/i.exec(value);
  if (orderMessage) {
    return tx(`${orderMessage[1].toLowerCase() === 'your order' ? 'Your order' : 'An order'} was ${orderMessage[2].toLowerCase()}.`);
  }
  let match = /^New message from (.+)$/.exec(value);
  if (match) return tx('New message from {name}', { name: match[1] });
  match = /^(.+) submitted an adoption request for (.+)\.$/.exec(value);
  if (match) return tx('{name} submitted an adoption request for {pet}.', { name: match[1], pet: match[2] });
  match = /^Your adoption request for (.+) was (approved|rejected|cancelled)\.$/.exec(value);
  if (match) return tx(`Your adoption request for {pet} was ${match[2]}.`, { pet: match[1] });
  match = /^(.+) has quantity (\d+)\. Minimum stock is (\d+)\.$/.exec(value);
  if (match) return tx('{name} has quantity {quantity}. Minimum stock is {minimum}.', { name: match[1], quantity: match[2], minimum: match[3] });
  return tx(value);
}
