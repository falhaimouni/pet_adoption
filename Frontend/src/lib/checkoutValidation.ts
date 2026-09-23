export const checkoutLimits = {
  recipientName: 160,
  phoneNumber: 30,
  addressLine: 255,
  city: 120,
  postalCode: 20,
  deliveryNotes: 500,
} as const;

export type CheckoutForm = Record<keyof typeof checkoutLimits, string>;
export type CheckoutErrors = Partial<Record<keyof CheckoutForm, string>>;

export function validateCheckout(form: CheckoutForm, t: (key: string) => string): CheckoutErrors {
  const errors: CheckoutErrors = {};
  for (const field of Object.keys(checkoutLimits) as (keyof CheckoutForm)[]) {
    const value = form[field].trim();
    if (!value && field !== "postalCode" && field !== "deliveryNotes") {
      errors[field] = t("checkout_field_required");
    } else if ([...value].length > checkoutLimits[field]) {
      errors[field] = t("checkout_field_max").replace("{max}", String(checkoutLimits[field]));
    }
  }
  const phone = form.phoneNumber.trim().replace(/[\u0660-\u0669\u06f0-\u06f9]/g, digit =>
    String(digit.charCodeAt(0) - (digit.charCodeAt(0) >= 0x06f0 ? 0x06f0 : 0x0660)));
  if (phone && !errors.phoneNumber && (!/^\+?[\d\s().-]+$/.test(phone) || !/^\d{7,15}$/.test(phone.replace(/\D/g, "")))) {
    errors.phoneNumber = t("checkout_phone_invalid");
  }
  return errors;
}
