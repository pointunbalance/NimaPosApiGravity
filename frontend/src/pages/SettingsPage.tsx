import { FormEvent, useEffect, useMemo, useState } from "react";

import { getHealth } from "../app/api/auth";
import { createBackup, getBackups, runBackupMaintenance } from "../app/api/backup";
import { getApiBaseUrl } from "../app/api/client";
import { getAllSettings, updateSetting } from "../app/api/settings";
import { appMode, modeMeta } from "../app/config/appMode";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const visibleSettingKeys = ["costing_method", "auto_backup_on_close", "low_stock_threshold", "currency", "currency_code", "language", "tax_rate", "prevent_negative_stock", "max_edit_days"] as const;
const identitySettingKeys = ["store_name", "vat_number", "store_address", "store_phone", "business_type"] as const;
const invoiceSettingKeys = ["receipt_header", "receipt_footer", "invoice_footer", "printer_width", "auto_print", "enable_qr"] as const;

type SettingKey = (typeof visibleSettingKeys)[number] | (typeof identitySettingKeys)[number] | (typeof invoiceSettingKeys)[number];

function normalizeSettingValue(key: string, value?: string) {
  if (key === "currency_code") return (value ?? "").trim().toUpperCase();
  return (value ?? "").trim();
}

function buildSettingsForm(settingsMap: Map<string, string>) {
  return Object.fromEntries([...visibleSettingKeys, ...identitySettingKeys, ...invoiceSettingKeys].map((key) => [key, settingsMap.get(key) ?? ""]));
}

export function SettingsPage() {
  const { session, activationRequired } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.settings;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  const { data: health, loading: healthLoading, error: healthError } = useAsyncValue(getHealth, [refreshKey]);
  const { data: settings, loading: settingsLoading, error: settingsError } = useAsyncValue(session ? () => getAllSettings(session.token) : null, [session?.token, refreshKey]);
  const { data: backups, loading: backupsLoading, error: backupsError } = useAsyncValue(session ? () => getBackups(session.token) : null, [session?.token, refreshKey]);

  const settingsMap = useMemo(() => new Map((settings ?? []).map((item) => [item.key, item.value])), [settings]);

  useEffect(() => {
    if (!settings?.length) return;
    setSettingsForm(buildSettingsForm(settingsMap));
  }, [settings, settingsMap]);

  const formatSettingValue = (key: string, value?: string) => {
    if (!value) return copy.unset;
    if (["auto_backup_on_close", "prevent_negative_stock", "auto_print", "enable_qr"].includes(key)) {
      return value === "1" ? copy.enabled : copy.disabled;
    }
    return value;
  };

  const labelFor = (key: SettingKey) => copy.labels[key];

  const highlightedSettings = useMemo(
    () =>
      visibleSettingKeys
        .map((key) => ({ key, label: labelFor(key), value: formatSettingValue(key, settingsMap.get(key)) }))
        .filter((item) => item.value !== copy.unset),
    [settingsMap]
  );

  const identitySummary = useMemo(
    () =>
      identitySettingKeys
        .map((key) => ({ key, label: labelFor(key), value: settingsMap.get(key)?.trim() || copy.unset }))
        .filter((item) => item.value !== copy.unset),
    [settingsMap]
  );

  const invoiceSummary = useMemo(
    () =>
      invoiceSettingKeys
        .map((key) => ({ key, label: labelFor(key), value: formatSettingValue(key, settingsMap.get(key)) }))
        .filter((item) => item.value !== copy.unset),
    [settingsMap]
  );

  const changedSettings = useMemo(() => {
    return [...visibleSettingKeys, ...identitySettingKeys, ...invoiceSettingKeys].reduce<Array<{ key: SettingKey; label: string; currentValue: string }>>(
      (acc, key) => {
        const originalValue = normalizeSettingValue(key, settingsMap.get(key));
        const currentValue = normalizeSettingValue(key, settingsForm[key]);
        if (originalValue !== currentValue) {
          acc.push({ key, label: labelFor(key), currentValue });
        }
        return acc;
      },
      []
    );
  }, [settingsForm, settingsMap]);

  const receiptPreview = useMemo(
    () => ({
      storeName: settingsForm.store_name?.trim() || copy.labels.store_name,
      storePhone: settingsForm.store_phone?.trim() || copy.labels.store_phone,
      vatNumber: settingsForm.vat_number?.trim() || copy.labels.vat_number,
      receiptHeader: settingsForm.receipt_header?.trim() || copy.labels.receipt_header,
      receiptFooter: settingsForm.receipt_footer?.trim() || copy.labels.receipt_footer,
      invoiceFooter: settingsForm.invoice_footer?.trim() || copy.labels.invoice_footer,
      printerWidth: settingsForm.printer_width?.trim() || "80mm",
      autoPrintEnabled: settingsForm.auto_print === "1",
      qrEnabled: settingsForm.enable_qr === "1",
      currencyCode: (settingsForm.currency_code?.trim() || "SAR").toUpperCase(),
      taxRate: settingsForm.tax_rate?.trim() || "15"
    }),
    [settingsForm]
  );

  const canManageSettings = session?.user.role ? ["owner", "admin"].includes(session.user.role) : false;
  const latestBackup = backups?.[0] ?? null;

  const handleSaveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !changedSettings.length) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await Promise.all(changedSettings.map((item) => updateSetting(session.token, item.key, item.currentValue)));
      setRefreshKey((value) => value + 1);
      setMessage(copy.savedMessage);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleCreateBackup = async () => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createBackup(session.token);
      setRefreshKey((value) => value + 1);
      setMessage(copy.createdBackupMessage);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleMaintenance = async () => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await runBackupMaintenance(session.token);
      setRefreshKey((value) => value + 1);
      setMessage(copy.maintenanceMessagePrefix);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="stats-grid">
        <article className="stat-card">
          <span className="eyebrow">{copy.cards.currentMode}</span>
          <strong>{modeMeta[appMode].label}</strong>
          <p>{modeMeta[appMode].description}</p>
        </article>
        <article className="stat-card">
          <span className="eyebrow">{copy.cards.activation}</span>
          <strong>{activationRequired ? copy.activationOff : copy.activationOn}</strong>
          <p>{copy.activationHint}</p>
        </article>
        <article className="stat-card">
          <span className="eyebrow">{copy.cards.health}</span>
          <strong>{health?.status || (healthLoading ? copy.healthChecking : copy.healthUnavailable)}</strong>
          <p>{health?.database ? `${copy.cards.health}: ${health.database}` : copy.healthHint}</p>
        </article>
        <article className="stat-card">
          <span className="eyebrow">{copy.cards.backups}</span>
          <strong>{(backups?.length ?? 0).toLocaleString(numberLocale)}</strong>
          <p>{copy.backupsHint}</p>
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.runtimeEyebrow}</span>
          <h3>{copy.runtimeTitle}</h3>
          <ul className="mini-list">
            <li><strong>{copy.runtimeLabels.apiBaseUrl}</strong><span>{getApiBaseUrl()}</span></li>
            <li><strong>{copy.runtimeLabels.currentUser}</strong><span>{session?.user.username || copy.unknown}</span></li>
            <li><strong>{copy.runtimeLabels.role}</strong><span>{session?.user.role || copy.unknown}</span></li>
            <li><strong>{copy.runtimeLabels.serviceHealth}</strong><span>{healthLoading ? copy.healthChecking : health?.status || copy.healthUnavailable}</span></li>
          </ul>
          {healthError ? <QueryFeedback title={copy.actionErrorTitle} message={healthError} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.operationalEyebrow}</span>
          <h3>{copy.operationalTitle}</h3>
          {settingsLoading ? (
            <QueryFeedback title={copy.loadingSettingsTitle} message={copy.loadingSettingsMessage} />
          ) : settingsError ? (
            <QueryFeedback title={copy.settingsReadErrorTitle} message={settingsError} tone="error" />
          ) : (
            <ul className="mini-list">
              {highlightedSettings.length ? highlightedSettings.map((item) => <li key={item.key}><strong>{item.label}</strong><span>{item.value}</span></li>) : <li><strong>{copy.noValuesTitle}</strong><span>{copy.noValuesMessage}</span></li>}
            </ul>
          )}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.identityEyebrow}</span>
          <h3>{copy.identityTitle}</h3>
          <ul className="mini-list">
            {identitySummary.length ? identitySummary.map((item) => <li key={item.key}><strong>{item.label}</strong><span>{item.value}</span></li>) : <li><strong>{copy.noIdentityTitle}</strong><span>{copy.noIdentityMessage}</span></li>}
          </ul>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.invoiceEyebrow}</span>
          <h3>{copy.invoiceTitle}</h3>
          <ul className="mini-list">
            {invoiceSummary.length ? invoiceSummary.map((item) => <li key={item.key}><strong>{item.label}</strong><span>{item.value}</span></li>) : <li><strong>{copy.noInvoiceTitle}</strong><span>{copy.noInvoiceMessage}</span></li>}
          </ul>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.previewEyebrow}</span>
          <h3>{copy.previewTitle}</h3>
          <div style={{ border: "1px dashed rgba(15, 23, 42, 0.18)", borderRadius: "1rem", padding: "1rem", background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))", fontFamily: '"Courier New", monospace', whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
            {[
              receiptPreview.receiptHeader,
              "------------------------------",
              receiptPreview.storeName,
              `VAT: ${receiptPreview.vatNumber}`,
              `TEL: ${receiptPreview.storePhone}`,
              `WIDTH: ${receiptPreview.printerWidth}`,
              "------------------------------",
              `${copy.sampleProduct}         1 x 100.00`,
              `${copy.taxLine} (${receiptPreview.taxRate}%)        15.00 ${receiptPreview.currencyCode}`,
              `${copy.totalLine}            115.00 ${receiptPreview.currencyCode}`,
              receiptPreview.qrEnabled ? copy.qrOn : copy.qrOff,
              receiptPreview.autoPrintEnabled ? copy.autoPrintOn : copy.autoPrintOff,
              "------------------------------",
              receiptPreview.invoiceFooter,
              receiptPreview.receiptFooter
            ].join("\n")}
          </div>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.editEyebrow}</span>
          <h3>{copy.editTitle}</h3>
          {canManageSettings ? (
            <form className="auth-form" onSubmit={handleSaveSettings}>
              <div className="inline-actions"><div className="status-chip"><span className="status-dot" />{copy.dirtyLabel}: {changedSettings.length.toLocaleString(numberLocale)}</div></div>
              <div className="form-grid">
                <label><span>{copy.labels.store_name}</span><input value={settingsForm.store_name ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, store_name: event.target.value }))} placeholder={copy.placeholders.storeName} /></label>
                <label><span>{copy.labels.vat_number}</span><input value={settingsForm.vat_number ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, vat_number: event.target.value }))} placeholder={copy.placeholders.vatNumber} /></label>
                <label><span>{copy.labels.store_phone}</span><input value={settingsForm.store_phone ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, store_phone: event.target.value }))} placeholder={copy.placeholders.storePhone} /></label>
                <label><span>{copy.labels.business_type}</span><select value={settingsForm.business_type ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, business_type: event.target.value }))}><option value="">{copy.businessTypeUnknown}</option><option value="retail">retail</option><option value="restaurant">restaurant</option><option value="service">service</option><option value="wholesale">wholesale</option></select></label>
                <label className="form-field-span-2"><span>{copy.labels.store_address}</span><input value={settingsForm.store_address ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, store_address: event.target.value }))} placeholder={copy.placeholders.storeAddress} /></label>
                <label className="form-field-span-2"><span>{copy.labels.receipt_header}</span><input value={settingsForm.receipt_header ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, receipt_header: event.target.value }))} placeholder={copy.placeholders.receiptHeader} /></label>
                <label className="form-field-span-2"><span>{copy.labels.receipt_footer}</span><input value={settingsForm.receipt_footer ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, receipt_footer: event.target.value }))} placeholder={copy.placeholders.receiptFooter} /></label>
                <label className="form-field-span-2"><span>{copy.labels.invoice_footer}</span><input value={settingsForm.invoice_footer ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, invoice_footer: event.target.value }))} placeholder={copy.placeholders.invoiceFooter} /></label>
                <label><span>{copy.labels.printer_width}</span><select value={settingsForm.printer_width ?? "80mm"} onChange={(event) => setSettingsForm((value) => ({ ...value, printer_width: event.target.value }))}><option value="80mm">80mm</option><option value="58mm">58mm</option><option value="A4">A4</option></select></label>
                <label><span>{copy.labels.auto_print}</span><select value={settingsForm.auto_print ?? "0"} onChange={(event) => setSettingsForm((value) => ({ ...value, auto_print: event.target.value }))}><option value="1">{copy.enabled}</option><option value="0">{copy.disabled}</option></select></label>
                <label><span>{copy.labels.enable_qr}</span><select value={settingsForm.enable_qr ?? "0"} onChange={(event) => setSettingsForm((value) => ({ ...value, enable_qr: event.target.value }))}><option value="1">{copy.enabled}</option><option value="0">{copy.disabled}</option></select></label>
                <label><span>{copy.labels.costing_method}</span><select value={settingsForm.costing_method ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, costing_method: event.target.value }))}><option value="weighted_average">weighted_average</option><option value="fifo">fifo</option><option value="lifo">lifo</option></select></label>
                <label><span>{copy.labels.low_stock_threshold}</span><input type="number" min="0" value={settingsForm.low_stock_threshold ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, low_stock_threshold: event.target.value }))} /></label>
                <label><span>{copy.labels.currency}</span><input value={settingsForm.currency ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, currency: event.target.value }))} /></label>
                <label><span>{copy.labels.currency_code}</span><input value={settingsForm.currency_code ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, currency_code: event.target.value.toUpperCase() }))} /></label>
                <label><span>{copy.labels.language}</span><select value={settingsForm.language ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, language: event.target.value }))}><option value="ar">ar</option><option value="en">en</option></select></label>
                <label><span>{copy.labels.tax_rate}</span><input type="number" step="0.01" min="0" value={settingsForm.tax_rate ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, tax_rate: event.target.value }))} /></label>
                <label><span>{copy.labels.max_edit_days}</span><input type="number" min="0" value={settingsForm.max_edit_days ?? ""} onChange={(event) => setSettingsForm((value) => ({ ...value, max_edit_days: event.target.value }))} /></label>
                <label><span>{copy.labels.auto_backup_on_close}</span><select value={settingsForm.auto_backup_on_close ?? "0"} onChange={(event) => setSettingsForm((value) => ({ ...value, auto_backup_on_close: event.target.value }))}><option value="1">{copy.enabled}</option><option value="0">{copy.disabled}</option></select></label>
                <label><span>{copy.labels.prevent_negative_stock}</span><select value={settingsForm.prevent_negative_stock ?? "0"} onChange={(event) => setSettingsForm((value) => ({ ...value, prevent_negative_stock: event.target.value }))}><option value="1">{copy.enabled}</option><option value="0">{copy.disabled}</option></select></label>
              </div>
              {changedSettings.length ? <p className="muted-text">{copy.changedFieldsPrefix}: {changedSettings.map((item) => item.label).join(", ")}.</p> : <p className="muted-text">{copy.noChangesMessage}</p>}
              <div className="inline-actions">
                <button className="primary-button" type="submit" disabled={settingsLoading || !changedSettings.length}>{copy.saveButton}</button>
                <button className="secondary-button compact-pill" type="button" onClick={() => setSettingsForm(buildSettingsForm(settingsMap))} disabled={!changedSettings.length}>{copy.resetButton}</button>
              </div>
            </form>
          ) : (
            <QueryFeedback title={copy.readOnlyTitle} message={copy.readOnlyMessage} />
          )}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.backupEyebrow}</span>
          <h3>{copy.backupTitle}</h3>
          <div className="inline-actions">
            <button className="primary-button" type="button" onClick={handleCreateBackup} disabled={!session}>{copy.createBackup}</button>
            <button className="secondary-button compact-pill" type="button" onClick={handleMaintenance} disabled={!session}>{copy.maintenance}</button>
          </div>
          {message ? <QueryFeedback title={copy.successTitle} message={message} /> : null}
          {errorMessage ? <QueryFeedback title={copy.actionErrorTitle} message={errorMessage} tone="error" /> : null}
          {backupsLoading ? (
            <QueryFeedback title={copy.backupsLoadingTitle} message={copy.backupsLoadingMessage} />
          ) : backupsError ? (
            <QueryFeedback title={copy.backupsErrorTitle} message={backupsError} tone="error" />
          ) : latestBackup ? (
            <ul className="mini-list">
              <li><strong>{copy.latestBackup}</strong><span>{latestBackup.filename}</span></li>
              <li><strong>{copy.createdAt}</strong><span>{latestBackup.created_at || "-"}</span></li>
              <li><strong>{copy.size}</strong><span>{latestBackup.size_bytes.toLocaleString(numberLocale)}</span></li>
            </ul>
          ) : (
            <QueryFeedback title={copy.noBackupTitle} message={copy.noBackupMessage} />
          )}
        </article>
      </section>
    </div>
  );
}
