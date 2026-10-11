const lkr = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

/** "—" when the dashboard section failed to load (null). */
export const formatMoney = (n: number | null) => (n === null ? "—" : lkr.format(n));
