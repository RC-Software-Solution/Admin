async (page) => {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
  const ago = (h) => new Date(Date.now() - h * 3600e3).toISOString();

  const AREAS = [
    { area_id: 1, area_name: "Colombo 03", code: "COL-03", status: "active", notes: "Lunch cut-off 10:30", assigned_users: 118 },
    { area_id: 2, area_name: "Nugegoda", code: "NUG", status: "active", notes: "Deliveries by 1:00 PM", assigned_users: 41 },
    { area_id: 3, area_name: "Dehiwala", code: "DEH", status: "active", notes: null, assigned_users: 36 },
    { area_id: 4, area_name: "Mount Lavinia", code: "MTL", status: "inactive", notes: "Not serving yet", assigned_users: 0 },
  ];
  const METRICS = [[1, 512, 612300], [2, 388, 441800], [3, 242, 230400], [4, 0, 0]].map(([area_id, orderCount, totalRevenue]) => ({ area_id, orderCount, totalRevenue }));

  const NOTICES = [
    { id: 3, title: "Lunch delayed in Nugegoda", body: "Heavy rain is slowing deliveries. Expect lunch about 30 minutes late.", area_id: 2, createdAt: ago(2) },
    { id: 2, title: "Poya day schedule", body: "No deliveries on Monday. Orders reopen on Tuesday at 6:00 AM.", area_id: null, createdAt: ago(120) },
    { id: 1, title: "New: egg hoppers at breakfast", body: "Order three hoppers with sambol from 6:00 AM, Colombo 03 and Dehiwala.", area_id: 1, createdAt: ago(240) },
  ];

  const food = (id, name, description, price, meal_type, category, dietary_tags, is_active = true) => ({
    id, name, description, price: price.toFixed(2), meal_type, image_url: null, is_active, category, dietary_tags,
  });
  const FOOD = [
    food(1, "Chicken fried rice", "Wok-fried rice with egg and leeks", 450, "non-veg", "Rice", null),
    food(2, "Vegetable kottu", "Chopped roti with seasonal vegetables", 450, "veg", "Kottu", "vegan option"),
    food(3, "Egg hoppers (3)", "Three hoppers with seeni sambol", 300, "veg", "Breakfast", null),
    food(4, "Fish ambul thiyal", "Sour fish curry with rice", 700, "non-veg", "Rice", "gluten-free", false),
    food(5, "Rice and curry (veg)", "Rice with three vegetable curries", 500, "veg", "Rice", null),
  ];
  const sItem = (id, f, available_quantity) => ({ id, food_item_id: f.id, available_quantity, foodItem: f });
  const SESSIONS = [
    { id: 11, date: today, meal_time: "lunch", start_time: "00:00:00", end_time: "23:59:00", notes: "Use the side gate on Galle Road.", sessionItems: [sItem(101, FOOD[0], null), sItem(102, FOOD[1], 60), sItem(103, FOOD[4], 40)] },
    { id: 12, date: today, meal_time: "dinner", start_time: "18:00:00", end_time: "21:00:00", notes: null, sessionItems: [sItem(104, FOOD[0], null), sItem(105, FOOD[3], 12)] },
  ];
  const PRICE_HISTORY = [
    { id: 2, old_price: "450.00", new_price: "480.00", changed_at: ago(72) },
    { id: 1, old_price: null, new_price: "450.00", changed_at: ago(900) },
  ];

  const PERSONS = [
    { id: "d0000001-0000-0000-0000-000000000000", full_name: "Sampath Kumara", email: "sampath.k@rc.lk", phone: "077 650 1180", nic: "881234567V", vehicle_type: "Motorbike", status: "active", created_at: ago(900) },
    { id: "d0000002-0000-0000-0000-000000000000", full_name: "Rohan Dias", email: "rohan.d@rc.lk", phone: "071 340 7722", nic: "902345678V", vehicle_type: "Three-wheeler", status: "active", created_at: ago(800) },
    { id: "d0000003-0000-0000-0000-000000000000", full_name: "Mahesh Wijesekara", email: "mahesh.w@rc.lk", phone: "076 118 4409", nic: null, vehicle_type: "Motorbike", status: "inactive", created_at: ago(700) },
  ];
  const ADMINS = [
    { id: "a0000001-0000-0000-0000-000000000000", full_name: "Buddhi Gayan", email: "buddhi.gayan@ifs.com", phone: null, role: "super_admin", status: "active", created_at: "2026-09-02T04:00:00Z" },
    { id: "a0000002-0000-0000-0000-000000000000", full_name: "Nadeesha Perera", email: "nadeesha.p@rc.lk", phone: null, role: "admin", status: "active", created_at: "2026-09-14T04:00:00Z" },
    { id: "a0000003-0000-0000-0000-000000000000", full_name: "Lakmal Jayawardena", email: "lakmal.j@rc.lk", phone: null, role: "admin", status: "inactive", created_at: "2026-09-20T04:00:00Z" },
  ];

  const AUDIT = [
    ["Buddhi Gayan", "super_admin", "order.payment", "order", "ORD-20261018-0034", { payment_status: "paid" }, 1],
    ["Nadeesha Perera", "admin", "order.status", "order", "ORD-20261018-0038", { status: "delivery_failed", reason: "customer not at address" }, 2],
    ["Buddhi Gayan", "super_admin", "settings.update", "settings", null, { auto_block_unpaid_threshold: 3 }, 20],
    ["Buddhi Gayan", "super_admin", "admin.suspend", "admin", "Lakmal Jayawardena", null, 24],
    ["Nadeesha Perera", "admin", "notice.create", "notice", "Poya day schedule", { area: "everyone" }, 48],
  ].map(([actor_name, actor_role, action, target_type, target_id, details, h], i) => ({ id: i + 1, actor_id: null, actor_name, actor_role, action, target_type, target_id, details, created_at: ago(h) }));

  const days = (from, to) => {
    const out = [];
    for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86400000) out.push(new Date(t).toISOString().slice(0, 10));
    return out;
  };

  await page.route(/localhost:400\d\/api/, (route) => {
    const req = route.request();
    if (req.method() !== "GET") return route.fallback();
    const url = new URL(req.url());
    const p = url.pathname;
    const json = (body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (p.endsWith("/analytics/area-metrics")) return json({ data: METRICS });
    const report = p.match(/\/analytics\/reports\/(sales|items|areas)$/);
    if (report) {
      const from = url.searchParams.get("from") ?? today;
      const to = url.searchParams.get("to") ?? today;
      const range = { from, to, areaId: null, session: null };
      if (report[1] === "sales") {
        return json({ range, data: days(from, to).map((date, i) => { const orderCount = 110 + ((i * 37) % 80); return { date, orderCount, totalRevenue: orderCount * 1100 }; }) });
      }
      if (report[1] === "items") {
        return json({ range, data: FOOD.map((f, i) => ({ food_name: f.name, total_quantity: 420 - i * 70, total_revenue: (420 - i * 70) * Number(f.price) })) });
      }
      return json({ range, data: AREAS.map((a, i) => ({ area_id: a.area_id, area_name: a.area_name, orderCount: METRICS[i].orderCount, totalRevenue: METRICS[i].totalRevenue, completedCount: Math.round(METRICS[i].orderCount * 0.9) })) });
    }
    if (p.endsWith("/areas")) return json(AREAS);
    if (p.endsWith("/users/notices")) return json({ notices: NOTICES });
    if (/\/meal-sessions\/\d+\/delivery$/.test(p)) return json({ data: { assignments: [{ area_id: 1, user_id: PERSONS[0].id }] } });
    if (p.endsWith("/meal-sessions")) return json({ data: { mealSessions: url.searchParams.get("date") === today ? SESSIONS : [] } });
    if (/\/food-items\/\d+\/price-history$/.test(p)) return json({ data: PRICE_HISTORY });
    if (p.endsWith("/food-items")) return json({ data: { foodItems: FOOD } });
    if (p.endsWith("/users/delivery-persons")) return json({ deliveryPersons: PERSONS });
    if (p.endsWith("/users/admins")) return json({ admins: ADMINS });
    if (p.endsWith("/users/audit-logs")) return json({ rows: AUDIT, total: 86, page_size: 25 });
    return route.fallback();
  });
  return "stubbed remaining pages";
}
