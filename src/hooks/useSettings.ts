import { useEffect, useState } from "react";
import type { Settings } from "../types/settings";
import { getSettings, saveSettings } from "../Pages/settings/settings.service";

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getSettings().then(setSettings, (e: Error) => setError(e.message));
    }, []);

    /** Resolves true when saved; failures show in `error` and the form keeps what was typed. */
    const save = async (threshold: number) => {
        setSaving(true);
        setNotice("");
        try {
            const r = await saveSettings(threshold);
            setSettings((s) => s && { ...s, auto_block_unpaid_threshold: r.auto_block_unpaid_threshold });
            setError("");
            setNotice(r.blocked_now > 0 ? `Saved. ${r.blocked_now} customer${r.blocked_now === 1 ? " was" : "s were"} blocked right away.` : "Saved.");
            return true;
        } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't save");
            return false;
        } finally {
            setSaving(false);
        }
    };

    return { settings, error, notice, saving, save };
};
