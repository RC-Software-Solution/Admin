
import "./deliveryareas.css";
import { useDeliveryAreas } from "../../hooks/useDeliveryAreas";
import { PlusIcon, PinIcon, EditIcon } from "../../components/common/Icons";

export default function DeliveryAreasPage() {
  const { areas, error, onAddArea, onEdit, onDelete } = useDeliveryAreas();

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

      {error && <p role="alert">{error}</p>}

      <div className="da-grid">
        {areas.map((a) => (
          <div className="da-card" key={a.area_id}>
            <div className="da-cardTop">
              <div className="da-cardLeft">
                <span className="da-pin">
                  <PinIcon />
                </span>

                <div className="da-nameBlock">
                  <div className="da-nameRow">
                    <span className="da-name">{a.area_name}</span>
                  </div>
                  <div className="da-code">#{a.area_id}</div>
                </div>
              </div>
            </div>

            <div className="da-actions">
              <button className="da-actionBtn da-actionBtnGhost" onClick={() => onEdit(a)}>
                <EditIcon className="da-actionIcon" />
                Rename
              </button>

              <button className="da-actionBtn da-actionBtnPrimary" onClick={() => onDelete(a)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
