import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";
import type { Country } from "react-phone-number-input";

/** ITU E.164: + followed by 8–15 digits, no leading zero after +. */
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export const PHONE_E164_EXAMPLE = "+2348141153727";

export const PHONE_E164_ERROR =
  "Invalid phone number. Select a country code and enter the exact national digit count (no leading 0). Example: +2348141153727.";

export const DEFAULT_COUNTRY_CODE = "+234";

type NationalLengthRule = {
  lengths: number[];
  minLength: number;
  maxLength: number;
};

/** Expected national lengths (no trunk `0`) per dial code, from mobile examples. */
const NATIONAL_LENGTH_BY_DIAL: Map<string, NationalLengthRule> = (() => {
  const byDial = new Map<string, Set<number>>();

  for (const iso of getCountries()) {
    const example = getExampleNumber(iso as Country, examples);
    if (!example?.nationalNumber) continue;
    const dial = `+${getCountryCallingCode(iso as Country)}`;
    const set = byDial.get(dial) ?? new Set<number>();
    set.add(example.nationalNumber.length);
    byDial.set(dial, set);
  }

  const rules = new Map<string, NationalLengthRule>();
  for (const [dial, set] of byDial) {
    const lengths = [...set].sort((a, b) => a - b);
    rules.set(dial, {
      lengths,
      minLength: lengths[0]!,
      maxLength: lengths.at(-1)!,
    });
  }
  return rules;
})();

function compactPhone(value: string) {
  return value.trim().replace(/[\s()-]/g, "");
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeDialCode(countryCode?: string) {
  const dial = digitsOnly(countryCode ?? "");
  return dial ? `+${dial}` : "";
}

/** Digits only, strip leading trunk zeros (UI never sends the leading 0). */
export function sanitizeNationalDigits(value: string) {
  return digitsOnly(value).replace(/^0+/, "");
}

/** Expected national digit length(s) for a dial code like `+234`. */
export function getNationalLengthRule(
  countryCode?: string,
): NationalLengthRule | null {
  const dial = normalizeDialCode(countryCode);
  if (!dial) return null;
  return NATIONAL_LENGTH_BY_DIAL.get(dial) ?? null;
}

export function getExpectedNationalLength(countryCode?: string): number | null {
  const rule = getNationalLengthRule(countryCode);
  if (!rule) return null;
  // Prefer a single expected length when the dial code is unambiguous.
  return rule.lengths.length === 1 ? rule.lengths[0]! : rule.maxLength;
}

export function isNationalLengthValid(
  phoneNumber: string,
  countryCode?: string,
): boolean {
  const rule = getNationalLengthRule(countryCode);
  if (!rule) return false;
  const national = sanitizeNationalDigits(phoneNumber);
  if (!national) return false;
  return rule.lengths.includes(national.length);
}

export function phoneLengthErrorMessage(
  phoneNumber: string,
  countryCode?: string,
): string | null {
  const rule = getNationalLengthRule(countryCode);
  if (!rule) {
    return "Select a country code first.";
  }
  const national = sanitizeNationalDigits(phoneNumber);
  if (!national) {
    return `Enter ${formatExpectedLength(rule)} (without the leading 0).`;
  }
  if (rule.lengths.includes(national.length)) return null;
  return `Enter ${formatExpectedLength(rule)} for ${normalizeDialCode(countryCode)} (without the leading 0). You entered ${national.length}.`;
}

/** Prefer a length-specific message when national digit count is wrong. */
export function getPhoneValidationError(
  phoneNumber: string,
  countryCode?: string,
): string {
  if (!isNationalLengthValid(phoneNumber, countryCode)) {
    return (
      phoneLengthErrorMessage(phoneNumber, countryCode) ?? PHONE_E164_ERROR
    );
  }
  return PHONE_E164_ERROR;
}

function formatExpectedLength(rule: NationalLengthRule) {
  if (rule.lengths.length === 1) {
    return `exactly ${rule.lengths[0]} digits`;
  }
  return `${rule.minLength}–${rule.maxLength} digits`;
}

/**
 * Convert a local or international number to E.164.
 * `+2348100001427` is returned as-is; `8100001427` + `+234` becomes that value.
 * National length must match the selected country's expected digit count.
 */
export function toE164PhoneNumber(
  phoneNumber: string,
  countryCode?: string,
): string | null {
  const compact = compactPhone(phoneNumber);
  if (!compact) return null;

  if (compact.startsWith("+")) {
    const e164 = `+${digitsOnly(compact.slice(1))}`;
    return E164_PATTERN.test(e164) ? e164 : null;
  }

  const dial = digitsOnly(countryCode ?? "");
  let national = sanitizeNationalDigits(compact);
  if (!dial || !national) return null;

  if (national.startsWith(dial) && national.length > dial.length) {
    const withoutDial = sanitizeNationalDigits(national.slice(dial.length));
    if (withoutDial) national = withoutDial;
  }

  // Exact national length for the selected country (e.g. NG = 10 without leading 0).
  if (!isNationalLengthValid(national, `+${dial}`)) return null;

  const e164 = `+${dial}${national}`;
  return E164_PATTERN.test(e164) ? e164 : null;
}

/** Split a stored E.164 (or local) number for country-code + national inputs. */
export function splitPhoneFields(
  phoneNumber = "",
  countryCode = "",
): { countryCode: string; nationalNumber: string } {
  const compact = compactPhone(phoneNumber);
  const dialDigits = digitsOnly(countryCode);
  const normalizedCode = dialDigits ? `+${dialDigits}` : "";

  if (compact.startsWith("+")) {
    const digits = digitsOnly(compact.slice(1));
    if (dialDigits && digits.startsWith(dialDigits)) {
      return {
        countryCode: normalizedCode,
        nationalNumber: digits.slice(dialDigits.length),
      };
    }

    const parsed = parsePhoneNumberFromString(compact);
    if (parsed?.countryCallingCode) {
      return {
        countryCode: `+${parsed.countryCallingCode}`,
        nationalNumber: parsed.nationalNumber,
      };
    }

    return {
      countryCode: normalizedCode,
      nationalNumber: `+${digits}`,
    };
  }

  return {
    countryCode: normalizedCode,
    nationalNumber: sanitizeNationalDigits(compact) || compact,
  };
}

export function withE164PhoneNumber<
  T extends { phoneNumber?: string; countryCode?: string },
>(data: T): T {
  const phone = data.phoneNumber?.trim();
  if (!phone) return data;
  const e164 = toE164PhoneNumber(phone, data.countryCode);
  if (!e164) return data;
  return { ...data, phoneNumber: e164 };
}

/** E.164 phone for invite-user; `countryCode` is UI-only and must not be posted. */
export function toInviteUserApiBody<
  T extends { phoneNumber?: string; countryCode?: string },
>(data: T): Omit<T, "countryCode"> {
  const { countryCode: _countryCode, ...body } = withE164PhoneNumber(data);
  return body;
}
