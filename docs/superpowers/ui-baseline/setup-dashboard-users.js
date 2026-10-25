async (page) => {
  // [name, email, phone, area_id, customer_status, created_at]
  const people = [
    ["Amaya Rathnayake", "amaya.r@mail.lk", "077 412 8890", 1, "pending", "2026-10-18T02:42:00Z"],
    ["Kasun Madushanka", "kasun.m@mail.lk", "071 220 5513", 2, "pending", "2026-10-18T02:10:00Z"],
    ["Fathima Rizna", "rizna.f@mail.lk", "076 901 2244", 3, "pending", "2026-10-17T12:45:00Z"],
    ["Nimal Perera", "nimal.p@mail.lk", "077 100 2001", 1, "accepted", "2026-09-02T04:00:00Z"],
    ["Kumari Silva", "kumari.s@mail.lk", "071 100 2002", 2, "accepted", "2026-09-03T04:00:00Z"],
    ["Ruwan Fernando", "ruwan.f@mail.lk", "076 100 2003", 3, "accepted", "2026-09-04T04:00:00Z"],
    ["Dilani Jayasinghe", "dilani.j@mail.lk", "077 100 2004", 1, "accepted", "2026-09-05T04:00:00Z"],
    ["Chaminda Wickramasinghe", "chaminda.w@mail.lk", "071 100 2005", 2, "accepted", "2026-09-06T04:00:00Z"],
    ["Sanduni Rajapaksa", "sanduni.r@mail.lk", "076 100 2006", 3, "rejected", "2026-09-07T04:00:00Z"],
    ["Tharindu Bandara", "tharindu.b@mail.lk", "077 100 2007", 1, "disabled", "2026-09-08T04:00:00Z"],
    ["Anjali Gunawardena", "anjali.g@mail.lk", "071 100 2008", 2, "disabled", "2026-09-09T04:00:00Z"],
    ["Prasad Weerasinghe", "prasad.w@mail.lk", "076 100 2009", 3, "blocked", "2026-09-10T04:00:00Z"],
  ];
  const customers = people.map(([full_name, email, phone, area_id, customer_status, created_at], i) => ({
    id: `u${String(i + 1).padStart(7, "0")}-0000-0000-0000-000000000000`,
    full_name, email, phone,
    address: `${i + 10}/2, Galle Road, Colombo 0${(i % 3) + 3}`,
    area_id,
    approved: customer_status === "accepted",
    customer_status,
    rejection_reason: customer_status === "rejected" ? "Address is outside the delivery areas" : null,
    blocked_reason: customer_status === "blocked" ? "3 unpaid orders" : null,
    created_at,
  }));
  const profile = (c) => ({
    ...c,
    order_history: [
      { id: "ORD-20261016-0302", status: "delivered", payment_status: "unpaid", total_price: "595.00", meal_time: "lunch", created_at: "2026-10-16T05:30:00Z" },
      { id: "ORD-20261014-0211", status: "delivered", payment_status: "unpaid", total_price: "555.00", meal_time: "lunch", created_at: "2026-10-14T05:30:00Z" },
      { id: "ORD-20261012-0188", status: "completed", payment_status: "paid", total_price: "485.00", meal_time: "dinner", created_at: "2026-10-12T12:30:00Z" },
      { id: "ORD-20261010-0150", status: "cancelled", payment_status: "ignored", total_price: "320.00", meal_time: "breakfast", created_at: "2026-10-10T02:30:00Z" },
    ],
    status_log: [
      { id: 1, previous_status: null, new_status: "pending", reason: "Registered from the app", performed_by: null, created_at: c.created_at },
      ...(c.customer_status === "pending" ? [] : [{ id: 2, previous_status: "pending", new_status: c.customer_status, reason: c.rejection_reason ?? c.blocked_reason, performed_by: "admin", created_at: "2026-10-18T05:00:00Z" }]),
    ],
  });

  await page.route(/localhost:400\d\/api/, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    const json = (body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (url.pathname.endsWith("/analytics/dashboard")) {
      const q = url.searchParams;
      const from = q.get("from");
      const to = q.get("to");
      const session = q.get("session");
      const days = [];
      for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86400000) days.push(new Date(t).toISOString().slice(0, 10));
      const series = (base) =>
        days.map((date, i) => {
          const orderCount = base + ((i * 7) % 5) * 12;
          return { date, orderCount, totalRevenue: orderCount * 520 };
        });
      const all = { breakfast: series(40), lunch: series(80), dinner: series(25) };
      const sessions = Object.fromEntries(Object.entries(all).map(([m, rows]) => [m, !session || session === m ? rows : null]));
      const total = Object.values(sessions).flat().filter(Boolean).reduce((n, r) => n + r.orderCount, 0);
      return json({
        generatedAt: new Date().toISOString(),
        range: { from, to, prevFrom: from, prevTo: to, areaId: q.get("area_id"), session },
        stats: {
          sales: { value: Math.round(total * 520 * 0.9), prev: Math.round(total * 520 * 0.8), change: 12.4 },
          orders: { total, completed: Math.round(total * 0.96), prevTotal: Math.round(total * 0.9), change: 6.1 },
          blockedUsers: 2,
          unpaidOrders: 5,
        },
        sessions,
        topItems: [
          { food_name: "Chicken fried rice", total_quantity: 412, total_revenue: 247200, image_url: null },
          { food_name: "Vegetable kottu", total_quantity: 356, total_revenue: 160200, image_url: null },
          { food_name: "Rice and curry (veg)", total_quantity: 301, total_revenue: 150500, image_url: null },
          { food_name: "Egg hoppers (3)", total_quantity: 244, total_revenue: 73200, image_url: null },
          { food_name: "Fish ambul thiyal", total_quantity: 198, total_revenue: 138600, image_url: null },
        ],
        areas: [
          { area_id: 1, area_name: "Colombo 03", orderCount: 512, totalRevenue: 612300, completedCount: 497 },
          { area_id: 2, area_name: "Nugegoda", orderCount: 388, totalRevenue: 441800, completedCount: 365 },
          { area_id: 3, area_name: "Dehiwala", orderCount: 242, totalRevenue: 230400, completedCount: 220 },
        ],
        errors: [],
      });
    }
    if (url.pathname.endsWith("/areas")) return json([1, 2, 3].map((n) => ({ area_id: n, area_name: ["Colombo 03", "Nugegoda", "Dehiwala"][n - 1], status: "active" })));
    if (url.pathname.endsWith("/users/customers")) return json(customers);
    const m = url.pathname.match(/\/users\/customers\/([^/]+)\/profile$/);
    if (m) {
      const c = customers.find((x) => x.id === m[1]);
      return json(c ? profile(c) : {});
    }
    return route.fallback();
  });
  return "dashboard and customer fixtures";
}
