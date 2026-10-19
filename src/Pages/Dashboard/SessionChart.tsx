import { MEALS, barLabel, heightPct } from "./dashboard.logic";
import type { DayBucket } from "./dashboard.logic";

const LABEL = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" } as const;
const STACK_ORDER = ["dinner", "lunch", "breakfast"] as const; // top to bottom

/** Orders per day, stacked by session. The chart is drawn for sighted users; a hidden table carries the same numbers. */
export default function SessionChart({ days }: { days: DayBucket[] }) {
  const max = Math.max(0, ...days.map((d) => d.total));
  return (
    <section className="dash-panel" aria-label="Orders by session">
      <h2 className="dash-panel__title">Orders by session</h2>
      {max === 0 ? (
        <p className="ui-hint">No orders in this range</p>
      ) : (
        <>
          <div className="dash-bars" aria-hidden="true">
            {days.map((d, i) => (
              <div key={d.date} className="dash-col" title={`${d.date}: ${MEALS.map((m) => `${d.orders[m]} ${m}`).join(", ")}`}>
                <div className="dash-col__plot">
                  <div className="dash-stack" style={{ height: `${heightPct(d.total, max)}%` }}>
                    {STACK_ORDER.filter((m) => d.orders[m] > 0).map((m) => (
                      <i key={m} className={`dash-seg--${m}`} style={{ flexGrow: d.orders[m] }} />
                    ))}
                  </div>
                </div>
                <span className="dash-col__label">{barLabel(d.date, days.length, i)}</span>
              </div>
            ))}
          </div>
          <ul className="dash-legend">
            {MEALS.map((m) => (
              <li key={m}>
                <i className={`dash-seg--${m}`} />
                {LABEL[m]}
              </li>
            ))}
          </ul>
          <table className="ui-sr-only">
            <caption>Orders per day by session</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                {MEALS.map((m) => (
                  <th key={m} scope="col">{LABEL[m]}</th>
                ))}
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date}>
                  <th scope="row">{d.date}</th>
                  {MEALS.map((m) => (
                    <td key={m}>{d.orders[m]}</td>
                  ))}
                  <td>{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
