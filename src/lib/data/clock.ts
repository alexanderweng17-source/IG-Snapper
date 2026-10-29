/**
 * Reference "now" for the prototype so relative mock dates ("expires in 5 days") stay stable.
 * When real data is connected, replace usages with `new Date()` (or server time).
 */
export const MOCK_NOW = new Date("2026-10-29T09:00:00+07:00");
