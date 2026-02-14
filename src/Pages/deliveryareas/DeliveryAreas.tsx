
import "./deliveryareas.css";
import { useDeliveryAreas } from "../../hooks/useDeliveryAreas";
import { PlusIcon, PinIcon, EditIcon, UsersIcon, OrdersIcon } from "../../components/common/Icons";

const SummaryIcon = ({
  className = "",
  variant,
}: {
  className?: string;
  variant: "areas" | "users" | "orders" | "active";
}) => {
  if (variant === "orders") {
    return <OrdersIcon className={className} />;
  }

  if (variant === "users") return <UsersIcon className={className} />;
  if (variant === "active") return <PinIcon className={className} />;

  // areas - same as pin for now but maybe different if desired, reusing pin as generic area icon
  return <PinIcon className={className} />;
};

export default function DeliveryAreasPage() {
  const { areas, stats, onAddArea, onEdit, onUsers } = useDeliveryAreas();
  const { totalAreas, totalUsers, totalOrdersToday, activeAreas } = stats;

  return (
    <div className="da-page">
      <div className="da-topbar">
        <div>
          <h1 className="da-title">Delivery Areas</h1>
          <p className="da-subtitle">Manage service areas</p>
        </div>

        <button className="da-addBtn" onClick={onAddArea}>
          <span className="da-addBtnIcon">
            <PlusIcon />
          </span>
          Add Area
        </button>
      </div>

      <div className="da-grid">
        {areas.map((a) => (
          <div className="da-card" key={a.id}>
            <div className="da-cardTop">
              <div className="da-cardLeft">
                <span className="da-pin">
                  <PinIcon />
                </span>

                <div className="da-nameBlock">
                  <div className="da-nameRow">
                    <span className="da-name">{a.name}</span>
                    <span className={`da-status ${a.status}`}>{a.status}</span>
                  </div>
                  <div className="da-code">{a.code}</div>
                </div>
              </div>
            </div>

            <div className="da-metrics">
              <div className="da-metricRow">
                <span className="da-metricLabel">Orders Today</span>
                <span className="da-metricValue">{a.ordersToday}</span>
              </div>
              <div className="da-metricRow">
                <span className="da-metricLabel">Assigned Users</span>
                <span className="da-metricValue">{a.assignedUsers}</span>
              </div>
              <div className="da-metricRow">
                <span className="da-metricLabel">Delivery Fee</span>
                <span className="da-metricValue">${a.deliveryFee.toFixed(2)}</span>
              </div>
            </div>

            <div className="da-actions">
              <button className="da-actionBtn da-actionBtnGhost" onClick={() => onEdit(a)}>
                <EditIcon className="da-actionIcon" />
                Edit
              </button>

              <button className="da-actionBtn da-actionBtnPrimary" onClick={() => onUsers(a)}>
                <UsersIcon className="da-actionIcon" />
                Users
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="da-summary">
        <div className="da-summaryItem">
          <span className="da-summaryIcon areas">
            <SummaryIcon variant="areas" />
          </span>
          <div>
            <div className="da-summaryLabel">Total Areas</div>
            <div className="da-summaryValue">{totalAreas}</div>
          </div>
        </div>

        <div className="da-summaryItem">
          <span className="da-summaryIcon users">
            <SummaryIcon variant="users" />
          </span>
          <div>
            <div className="da-summaryLabel">Total Users</div>
            <div className="da-summaryValue">{totalUsers}</div>
          </div>
        </div>

        <div className="da-summaryItem">
          <span className="da-summaryIcon orders">
            <SummaryIcon variant="orders" />
          </span>
          <div>
            <div className="da-summaryLabel">Orders Today</div>
            <div className="da-summaryValue">{totalOrdersToday}</div>
          </div>
        </div>

        <div className="da-summaryItem">
          <span className="da-summaryIcon active">
            <SummaryIcon variant="active" />
          </span>
          <div>
            <div className="da-summaryLabel">Active Areas</div>
            <div className="da-summaryValue">{activeAreas}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
