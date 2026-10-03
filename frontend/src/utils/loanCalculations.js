/**
 * Calculate the daily installment for a DL (Daily Loan) account.
 * Business Rule:
 * - <= 0: 0
 * - ₹1 to ₹5,000: Flat ₹50 / day
 * - ₹5,001 to ₹10,000: Flat ₹100 / day
 * - > ₹10,000: Math.round(amount / 100)
 */
export function calculateDLDailyInstallment(loanAmount) {
  const amount = Number(loanAmount) || 0;
  if (amount <= 0) return 0;
  if (amount <= 5000) return 50;
  if (amount <= 10000) return 100;
  return Math.round(amount / 100);
}
