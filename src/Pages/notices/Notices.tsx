import { useCallback, useEffect, useState } from "react";
import "./notices.css";
import { createNotice, deleteNotice, listAreas, listNotices } from "./notices.service";
import type { Area, Notice } from "./notices.service";
import { Alert, Badge, Button, Card, EmptyState, Field, PageHeader, useToast } from "../../components/ui";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDateTime } from "../../utils/formatDate";

export default function NoticesPage() {
  const toast = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [areaId, setAreaId] = useState(""); // "" = everyone
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmSend, setConfirmSend] = useState(false);
  const [toDelete, setToDelete] = useState<Notice | null>(null);

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

  const send = async () => {
    setConfirmSend(false);
    setSending(true);
    setError("");
    try {
      const { push } = await createNotice({ title: title.trim(), body: body.trim(), area_id: areaId ? Number(areaId) : null });
      toast.show(`Sent to ${push.sent} device${push.sent === 1 ? "" : "s"}${push.failed ? `, ${push.failed} failed` : ""}`);
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

  const remove = async () => {
    const n = toDelete;
    setError("");
    setToDelete(null);
    if (!n) return;
    try {
      await deleteNotice(n.id);
      toast.show("Notice deleted");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the notice");
    }
  };

  return (
    <div>
      <PageHeader title="Notices" subtitle="Announcements go to customers' phones and appear in the app." />
      {error && <Alert>{error}</Alert>}

      <div className="nt-layout">
        <Card title="New notice">
          <form
            className="nt-form"
            onSubmit={(e) => {
              e.preventDefault();
              // A push can't be recalled once sent, so the admin confirms the audience first
              setConfirmSend(true);
            }}
          >
            <Field label="Title" hint="Up to 150 characters">
              <input maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Message">
              <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
            </Field>
            <Field label="Send to">
              <select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                <option value="">Everyone</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" variant="primary" className="nt-form__send" loading={sending} disabled={!title.trim() || !body.trim()}>
              Send notice
            </Button>
          </form>
        </Card>

        <section aria-labelledby="nt-sent">
          <h2 id="nt-sent" className="ui-section ui-section--first">
            Sent notices
          </h2>
          {notices.length === 0 ? (
            <EmptyState title="No notices yet" hint="Notices you send show up here." />
          ) : (
            <ul className="nt-list">
              {notices.map((n) => (
                <li className="nt-item" key={n.id}>
                  <div>
                    <b className="nt-item__title">{n.title}</b>
                    <p className="nt-item__body">{n.body}</p>
                    <div className="nt-item__meta">
                      <Badge tone="outline">{areaName(n.area_id)}</Badge>
                      <span>{formatDateTime(n.createdAt)}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="danger-ghost" aria-label={`Delete ${n.title}`} onClick={() => setToDelete(n)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmSend}
        title="Send this notice?"
        message={`Send "${title.trim()}" to ${areaId ? areaName(Number(areaId)) : "all customers"}? A push can't be recalled once it is sent.`}
        confirmLabel="Send"
        tone="primary"
        onCancel={() => setConfirmSend(false)}
        onConfirm={send}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete notice"
        message={`Delete "${toDelete?.title}"? Customers will no longer see it in the app.`}
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
