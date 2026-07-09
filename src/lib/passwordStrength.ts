export type StrengthLevel = "empty" | "weak" | "fair" | "good" | "strong";

export type PasswordCheck = {
  label: string;
  passed: boolean;
};

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4 | 5;
  level: StrengthLevel;
  label: string;
  checks: PasswordCheck[];
  meetsRequirements: boolean;
  message: string;
};

// Minimum bar for acceptance: length + upper + lower + number + special
const MIN_LENGTH = 10;

const COMMON_WEAK = new Set([
  "password",
  "password1",
  "password123",
  "qwerty",
  "qwerty123",
  "letmein",
  "welcome",
  "admin",
  "111111",
  "123456",
  "12345678",
  "iloveyou",
  "abc123",
  "monkey",
  "dragon",
  "liberated",
  "kings",
  "liberatedkings",
]);

export function evaluatePassword(pw: string): PasswordStrength {
  const trimmed = pw ?? "";
  const lower = trimmed.toLowerCase();

  const hasLength = trimmed.length >= MIN_LENGTH;
  const hasUpper = /[A-Z]/.test(trimmed);
  const hasLower = /[a-z]/.test(trimmed);
  const hasNumber = /[0-9]/.test(trimmed);
  const hasSpecial = /[^A-Za-z0-9]/.test(trimmed);
  const notCommon = trimmed.length > 0 && !COMMON_WEAK.has(lower);

  const checks: PasswordCheck[] = [
    { label: `At least ${MIN_LENGTH} characters`, passed: hasLength },
    { label: "One uppercase letter (A-Z)", passed: hasUpper },
    { label: "One lowercase letter (a-z)", passed: hasLower },
    { label: "One number (0-9)", passed: hasNumber },
    { label: "One symbol (e.g. # ! @ $)", passed: hasSpecial },
  ];

  const meetsRequirements =
    hasLength && hasUpper && hasLower && hasNumber && hasSpecial && notCommon;

  // Score 0..5 based on how many core rules passed, with a bonus for length >= 14.
  let score =
    (hasLength ? 1 : 0) +
    (hasUpper ? 1 : 0) +
    (hasLower ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSpecial ? 1 : 0);
  if (score === 5 && trimmed.length >= 14 && notCommon) score = 5;
  if (!notCommon) score = Math.min(score, 2);
  const finalScore = Math.max(0, Math.min(5, score)) as PasswordStrength["score"];

  let level: StrengthLevel;
  let label: string;
  if (trimmed.length === 0) {
    level = "empty";
    label = "";
  } else if (finalScore <= 2) {
    level = "weak";
    label = "Password not strong enough";
  } else if (finalScore === 3) {
    level = "fair";
    label = "Getting there";
  } else if (finalScore === 4) {
    level = "good";
    label = "Almost strong";
  } else {
    level = "strong";
    label = "Password is good";
  }

  const message = !notCommon && trimmed.length > 0
    ? "That password is too common - pick something unique."
    : label;

  return { score: finalScore, level, label, checks, meetsRequirements, message };
}

export const PASSWORD_REQUIREMENTS_TEXT =
  `At least ${MIN_LENGTH} characters, with an uppercase letter, a number, and a symbol (e.g. #).`;