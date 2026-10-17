async (page) => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const jwt = `${b64({ alg: "none" })}.${b64({ role: "super_admin", exp: Math.floor(Date.now() / 1000) + 86400 })}.x`;
  await page.addInitScript((t) => {
    localStorage.setItem("access_token", t);
    localStorage.setItem("user", JSON.stringify({ name: "Buddhi Gayan" }));
  }, jwt);

  const STATUSES = ["pending", "preparing", "delivering", "delivered", "completed", "cancelled", "delivery_failed"];
  const PAYMENTS = ["pending", "paid", "unpaid", "ignored"];
  const NAMES = ["Nimal Perera", "Kumari Silva", "Ruwan Fernando", "Dilani Jayasinghe", "Chaminda Wickramasinghe", "Sanduni Rajapaksa", "Tharindu Bandara"];
  const orders = Array.from({ length: 30 }, (_, i) => ({
    id: `ORD-20261018-${String(i + 1).padStart(4, "0")}`,
    customer_id: `c${i % 7}000000-0000-0000-0000-000000000000`,
    customer_name: NAMES[i % 7],
    area_id: (i % 3) + 1,
    status: STATUSES[i % 7],
    payment_status: PAYMENTS[i % 4],
    total_price: String(450 + i * 35),
    meal_time: "lunch",
    created_at: new Date(Date.UTC(2026, 9, 18, 3, 0) - i * 3600e3).toISOString(),
    order_items: [{ id: `i${i}`, quantity: (i % 3) + 1, food_name: "Rice and curry" }],
  }));
  const areas = [1, 2, 3].map((n) => ({ area_id: n, area_name: ["Colombo 03", "Nugegoda", "Dehiwala"][n - 1] }));

  // [path suffix, response body]; first match wins, anything else gets {}
  const FIXED = [
    ["/areas", areas],
    ["/analytics/attention", { pendingApprovals: 3, unpaidOrders: 5, failedDeliveries: 1, blockedUsers: 2 }],
    ["/users/admins", { admins: [] }],
    ["/users/customers", []],
    ["/users/notices", { notices: [] }],
    ["/users/audit-logs", { rows: [], total: 0, page_size: 25 }],
    ["/users/settings", { auto_block_unpaid_threshold: 3, max_threshold: 20 }],
    ["/food-items", { data: { foodItems: [] } }],
    ["/meal-sessions", { data: { mealSessions: [] } }],
  ];

  await page.route(/localhost:400\d\/api/, (route) => {
    const url = new URL(route.request().url());
    const json = (body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    if (route.request().method() !== "GET") return json({});
    if (url.pathname.endsWith("/orders")) {
      const limit = Number(url.searchParams.get("limit") ?? 26);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const pay = url.searchParams.get("payment_status");
      const rows = pay ? orders.filter((o) => o.payment_status === pay) : orders;
      return json({ orders: rows.slice(offset, offset + limit) });
    }
    if (url.pathname.includes("delivery-persons")) return json({ deliveryPersons: [] });
    const hit = FIXED.find(([suffix]) => url.pathname.endsWith(suffix));
    return json(hit ? hit[1] : {});
  });
  return "stubbed";
}
