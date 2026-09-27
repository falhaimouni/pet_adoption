import { translateText, TextParams } from './text';

function matchTemplate(
  value: string,
  pattern: RegExp,
  template: string,
  paramNames: string[],
  tx: (source: string, params?: TextParams) => string,
) {
  const match = pattern.exec(value);
  if (!match) return undefined;
  const params = Object.fromEntries(paramNames.map((name, index) => [name, match[index + 1]]));
  return tx(template, params);
}

export function localizeNotification(value: string, tx: (source: string, params?: TextParams) => string = translateText) {
  const publicOrder = /^(Your order|Order) (PET-\d{4}-\d{6,}) was (created|cancelled|completed|paid and completed)\.$/.exec(value);
  if (publicOrder) return tx(`${publicOrder[1]} {reference} was ${publicOrder[3]}.`, { reference: publicOrder[2] });
  // Older saved notifications embedded internal UUIDs in their messages.
  const orderMessage = /^(Your order|Order) [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12} was (created|cancelled|completed|paid and completed)\.$/i.exec(value);
  if (orderMessage) {
    return tx(`${orderMessage[1].toLowerCase() === 'your order' ? 'Your order' : 'An order'} was ${orderMessage[2].toLowerCase()}.`);
  }
  let match = /^New message from (.+)$/.exec(value);
  if (match) return tx('New message from {name}', { name: match[1] === 'Petopia Support' ? tx('Petopia Support') : match[1] });
  const localized =
    matchTemplate(value, /^(.+) was added to the shelter\.$/, '{name} was added to the shelter.', ['name'], tx) ??
    matchTemplate(value, /^(.+) was updated\.$/, '{name} was updated.', ['name'], tx) ??
    matchTemplate(value, /^A new image was uploaded for (.+)\.$/, 'A new image was uploaded for {name}.', ['name'], tx) ??
    matchTemplate(value, /^(.+) was added to inventory\.$/, '{name} was added to inventory.', ['name'], tx) ??
    matchTemplate(value, /^(.+) was deleted from inventory\.$/, '{name} was deleted from inventory.', ['name'], tx) ??
    matchTemplate(value, /^(.+) was restored\.$/, '{name} was restored.', ['name'], tx) ??
    matchTemplate(value, /^(.+) was added\.$/, '{name} was added.', ['name'], tx) ??
    matchTemplate(value, /^(.+) was deleted\.$/, '{name} was deleted.', ['name'], tx) ??
    matchTemplate(value, /^(.+) department was created\.$/, '{name} department was created.', ['name'], tx) ??
    matchTemplate(value, /^(.+) department was updated\.$/, '{name} department was updated.', ['name'], tx) ??
    matchTemplate(value, /^(.+) assignments were updated\.$/, '{name} assignments were updated.', ['name'], tx) ??
    matchTemplate(value, /^(.+) was created\.$/, '{name} was created.', ['name'], tx) ??
    matchTemplate(value, /^(.+) was deactivated\.$/, '{name} was deactivated.', ['name'], tx) ??
    matchTemplate(value, /^(.+) was added for (.+)\.$/, '{name} was added for {pet}.', ['name', 'pet'], tx) ??
    matchTemplate(value, /^(.+) was updated for (.+)\.$/, '{name} was updated for {pet}.', ['name', 'pet'], tx) ??
    matchTemplate(value, /^(.+) was archived for (.+)\.$/, '{name} was archived for {pet}.', ['name', 'pet'], tx) ??
    matchTemplate(value, /^A medical entry was added for (.+)\.$/, 'A medical entry was added for {pet}.', ['pet'], tx) ??
    matchTemplate(value, /^A medical entry was updated for (.+)\.$/, 'A medical entry was updated for {pet}.', ['pet'], tx) ??
    matchTemplate(value, /^A medical entry was archived for (.+)\.$/, 'A medical entry was archived for {pet}.', ['pet'], tx);
  if (localized) return localized;
  match = /^(.+) submitted an adoption request for (.+)\.$/.exec(value);
  if (match) return tx('{name} submitted an adoption request for {pet}.', { name: match[1], pet: match[2] });
  match = /^Your adoption request for (.+) was (approved|rejected|cancelled)\.$/.exec(value);
  if (match) return tx(`Your adoption request for {pet} was ${match[2]}.`, { pet: match[1] });
  match = /^(.+) has quantity (\d+)\. Minimum stock is (\d+)\.$/.exec(value);
  if (match) return tx('{name} has quantity {quantity}. Minimum stock is {minimum}.', { name: match[1], quantity: match[2], minimum: match[3] });
  return tx(value);
}
