import { useCallback, useEffect, useState } from "react";
import "./notices.css";
import { createNotice, deleteNotice, listAreas, listNotices } from "./notices.service";
import type { Area, Notice } from "./notices.service";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [areaId, setAreaId] = useState(""); // "" = everyone
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const load = useCallback(async () => {
    try {
      const [n, a] = await Promise.all([listNotices(), listAreas()]);
      setNotices(n);
      setAreas(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load notices");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const areaName = (id: Notice["area_id"]) =>
    id === null ? "Everyone" : (areas.find((a) => a.area_id === Number(id))?.area_name ?? `Area ${id}`);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = areaId ? areaName(Number(areaId)) : "ALL customers";
    // A push can't be recalled once sent, so make the admin confirm the audience
    if (!window.confirm(`Send "${title.trim()}" to ${target}?`)) return;

    setSending(true);
    setError("");
    setResult("");
    try {
      const { push } = await createNotice({ title: title.trim(), body: body.trim(), area_id: areaId ? Number(areaId) : null });
      setResult(`Sent to ${push.sent} device${push.sent === 1 ? "" : "s"}${push.failed ? `, ${push.failed} failed` : ""}.`);
      setTitle("");
      setBody("");
      setAreaId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the notice");
    } finally {
      setSending(false);
    }
  };

  const remove = async (n: Notice) => {
    if (!window.confirm(`Delete "${n.title}"? Customers will no longer see it in the app.`)) return;
    try {
      await deleteNotice(n.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the notice");
    }
  };

  return (
    <div className="nt-page">
      <h1 className="nt-title">Notices</h1>
      <p className="nt-subtitle">Announcements are pushed to customers' phones and listed in the app.</p>

      <form className="nt-form" onSubmit={send}>
        <input
          className="nt-input"
          placeholder="Title"
          maxLength={150}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="nt-input nt-textarea"
          placeholder="Message"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <div className="nt-row">
          <select className="nt-input" value={areaId} onChange={(e) => setAreaId(e.target.value)} aria-label="Audience">
            <option value="">Everyone</option>
            {areas.map((a) => (
              <option key={a.area_id} value={a.area_id}>
                {a.area_name}
              </option>
            ))}
          </select>
          <button className="nt-send" type="submit" disabled={sending || !title.trim() || !body.trim()}>
            {sending ? "Sending..." : "Send notice"}
          </button>
        </div>
        {error && <div className="nt-error">{error}</div>}
        {result && <div className="nt-result">{result}</div>}
      </form>

      <h2 className="nt-h2">Sent notices</h2>
      {notices.length === 0 ? (
        <p className="nt-empty">No notices yet.</p>
      ) : (
        <ul className="nt-list">
          {notices.map((n) => (
            <li className="nt-item" key={n.id}>
              <div>
                <div className="nt-itemTitle">{n.title}</div>
                <div className="nt-itemBody">{n.body}</div>
                <div className="nt-meta">
                  {areaName(n.area_id)} · {fmt(n.createdAt)}
                </div>
              </div>
              <button className="nt-delete" onClick={() => remove(n)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
