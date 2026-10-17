async (page) => {
  const OUT = "C:/Users/budglk/RC/Admin/docs/superpowers/ui-baseline/before"; // use .../after for the final comparison
  const PAGES = ["dashboard", "users", "admins", "delivery-areas", "notices", "orders", "sessions", "food-items", "delivery-persons", "reports", "settings", "audit-logs"];
  const SIZES = [["desktop", 1440, 900], ["mobile", 390, 800]];
  const done = [];
  for (const [name, w, h] of SIZES) {
    await page.setViewportSize({ width: w, height: h });
    for (const p of PAGES) {
      await page.goto(`http://localhost:5173/${p}`);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUT}/${p}-${name}.png` });
      done.push(`${p}-${name}`);
    }
  }
  return done;
}
