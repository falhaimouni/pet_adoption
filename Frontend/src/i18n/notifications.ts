import { translateText, TextParams } from './text';
export function localizeNotification(value: string, tx: (source: string, params?: TextParams) => string = translateText) {
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
