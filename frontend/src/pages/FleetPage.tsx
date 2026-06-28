import { FormEvent, useState } from "react";

import { assignFleetDriver, createFleetVehicle, getFleetVehicleHistory, getFleetVehicles, logFleetFuel } from "../app/api/fleet";
import { getUsers } from "../app/api/users";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const initialVehicleForm = {
  plateNumber: "",
  model: "",
  vehicleType: "Truck",
  payloadCapacityKg: "",
  status: "available",
  odometerReading: ""
};
const initialAssignForm = {
  vehicleId: "",
  driverId: "",
  notes: ""
};
const initialFuelForm = {
  vehicleId: "",
  date: today,
  liters: "",
  cost: "",
  odometerReading: ""
};

export function FleetPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm);
  const [assignForm, setAssignForm] = useState(initialAssignForm);
  const [fuelForm, setFuelForm] = useState(initialFuelForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: vehicles, loading, error } = useAsyncValue(session ? () => getFleetVehicles(session.token) : null, [session?.token, refreshKey]);
  const { data: users } = useAsyncValue(session ? () => getUsers(session.token) : null, [session?.token]);
  const { data: history } = useAsyncValue(
    session && selectedVehicleId ? () => getFleetVehicleHistory(session.token, Number(selectedVehicleId)) : null,
    [session?.token, selectedVehicleId, refreshKey]
  );

  const handleCreateVehicle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await createFleetVehicle(session.token, {
        plate_number: vehicleForm.plateNumber,
        model: vehicleForm.model,
        vehicle_type: vehicleForm.vehicleType,
        payload_capacity_kg: Number(vehicleForm.payloadCapacityKg) || 0,
        status: vehicleForm.status,
        odometer_reading: Number(vehicleForm.odometerReading) || 0
      });
      setVehicleForm(initialVehicleForm);
      setRefreshKey((value) => value + 1);
      setMessage(result.message);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await assignFleetDriver(session.token, {
        vehicle_id: Number(assignForm.vehicleId),
        driver_id: Number(assignForm.driverId),
        notes: assignForm.notes
      });
      setAssignForm(initialAssignForm);
      setRefreshKey((value) => value + 1);
      setSelectedVehicleId(assignForm.vehicleId);
      setMessage(result.message);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleFuelLog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await logFleetFuel(session.token, {
        vehicle_id: Number(fuelForm.vehicleId),
        date: fuelForm.date,
        liters: Number(fuelForm.liters) || 0,
        cost: Number(fuelForm.cost) || 0,
        odometer_reading: Number(fuelForm.odometerReading) || 0
      });
      setFuelForm(initialFuelForm);
      setRefreshKey((value) => value + 1);
      setSelectedVehicleId(fuelForm.vehicleId);
      setMessage(result.message);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الأسطول" subtitle="تسجيل المركبات، ربط السائقين بها، ومتابعة سجل التعيينات والوقود." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Vehicles</span><strong>{(vehicles?.length ?? 0).toLocaleString("ar-EG")}</strong><p>عدد المركبات النشطة في الأسطول.</p></article>
        <article className="stat-card"><span className="eyebrow">Assignments</span><strong>{(history?.assignments.length ?? 0).toLocaleString("ar-EG")}</strong><p>عدد التعيينات للمركبة المفتوحة.</p></article>
        <article className="stat-card"><span className="eyebrow">Fuel Logs</span><strong>{(history?.fuel_logs.length ?? 0).toLocaleString("ar-EG")}</strong><p>عدد سجلات الوقود للمركبة المفتوحة.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Vehicle Registry</span>
          <h3>إضافة مركبة</h3>
          <form className="auth-form" onSubmit={handleCreateVehicle}>
            <div className="form-grid">
              <label><span>لوحة المركبة</span><input value={vehicleForm.plateNumber} onChange={(event) => setVehicleForm((value) => ({ ...value, plateNumber: event.target.value }))} /></label>
              <label><span>الموديل</span><input value={vehicleForm.model} onChange={(event) => setVehicleForm((value) => ({ ...value, model: event.target.value }))} /></label>
              <label><span>النوع</span><input value={vehicleForm.vehicleType} onChange={(event) => setVehicleForm((value) => ({ ...value, vehicleType: event.target.value }))} /></label>
              <label><span>حمولة كجم</span><input inputMode="decimal" value={vehicleForm.payloadCapacityKg} onChange={(event) => setVehicleForm((value) => ({ ...value, payloadCapacityKg: event.target.value }))} /></label>
              <label><span>الحالة</span><select value={vehicleForm.status} onChange={(event) => setVehicleForm((value) => ({ ...value, status: event.target.value }))}><option value="available">available</option><option value="in_transit">in_transit</option><option value="maintenance">maintenance</option></select></label>
              <label><span>العداد</span><input inputMode="decimal" value={vehicleForm.odometerReading} onChange={(event) => setVehicleForm((value) => ({ ...value, odometerReading: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!vehicleForm.plateNumber || !vehicleForm.model}>تسجيل المركبة</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Assignments</span>
          <h3>إسناد سائق</h3>
          <form className="auth-form" onSubmit={handleAssign}>
            <div className="form-grid">
              <label>
                <span>المركبة</span>
                <select value={assignForm.vehicleId} onChange={(event) => setAssignForm((value) => ({ ...value, vehicleId: event.target.value }))}>
                  <option value="">اختر المركبة</option>
                  {(vehicles ?? []).map((item) => <option key={item.id} value={item.id}>{item.plate_number} - {item.model}</option>)}
                </select>
              </label>
              <label>
                <span>السائق</span>
                <select value={assignForm.driverId} onChange={(event) => setAssignForm((value) => ({ ...value, driverId: event.target.value }))}>
                  <option value="">اختر المستخدم</option>
                  {(users?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.username}</option>)}
                </select>
              </label>
              <label className="form-field-span-2"><span>ملاحظات</span><input value={assignForm.notes} onChange={(event) => setAssignForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="secondary-button compact-pill" type="submit" disabled={!assignForm.vehicleId || !assignForm.driverId}>إسناد السائق</button>
          </form>
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Fuel</span>
          <h3>تسجيل وقود</h3>
          <form className="auth-form" onSubmit={handleFuelLog}>
            <div className="form-grid">
              <label>
                <span>المركبة</span>
                <select value={fuelForm.vehicleId} onChange={(event) => setFuelForm((value) => ({ ...value, vehicleId: event.target.value }))}>
                  <option value="">اختر المركبة</option>
                  {(vehicles ?? []).map((item) => <option key={item.id} value={item.id}>{item.plate_number}</option>)}
                </select>
              </label>
              <label><span>التاريخ</span><input type="date" value={fuelForm.date} onChange={(event) => setFuelForm((value) => ({ ...value, date: event.target.value }))} /></label>
              <label><span>اللترات</span><input inputMode="decimal" value={fuelForm.liters} onChange={(event) => setFuelForm((value) => ({ ...value, liters: event.target.value }))} /></label>
              <label><span>التكلفة</span><input inputMode="decimal" value={fuelForm.cost} onChange={(event) => setFuelForm((value) => ({ ...value, cost: event.target.value }))} /></label>
              <label><span>العداد</span><input inputMode="decimal" value={fuelForm.odometerReading} onChange={(event) => setFuelForm((value) => ({ ...value, odometerReading: event.target.value }))} /></label>
            </div>
            <button className="secondary-button compact-pill" type="submit" disabled={!fuelForm.vehicleId || !fuelForm.liters || !fuelForm.cost}>حفظ السجل</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Vehicle History</span>
          <div className="form-grid">
            <label>
              <span>المركبة المفتوحة</span>
              <select value={selectedVehicleId} onChange={(event) => setSelectedVehicleId(event.target.value)}>
                <option value="">اختر مركبة</option>
                {(vehicles ?? []).map((item) => <option key={item.id} value={item.id}>{item.plate_number} - {item.model}</option>)}
              </select>
            </label>
          </div>
          <div className="detail-grid">
            <div className="feedback-panel"><strong>آخر التعيينات</strong><p>{history?.assignments.length ?? 0}</p></div>
            <div className="feedback-panel"><strong>سجلات الوقود</strong><p>{history?.fuel_logs.length ?? 0}</p></div>
          </div>
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          {loading ? (
            <QueryFeedback title="جارٍ تحميل المركبات" message="نقرأ المركبات النشطة في الأسطول." />
          ) : error ? (
            <QueryFeedback title="فشل تحميل المركبات" message={error} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>#</th><th>اللوحة</th><th>الموديل</th><th>النوع</th><th>الحالة</th><th>العداد</th></tr></thead>
                <tbody>
                  {(vehicles ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.plate_number}</td>
                      <td>{item.model}</td>
                      <td>{item.vehicle_type || "-"}</td>
                      <td>{item.status || "-"}</td>
                      <td>{(item.odometer_reading ?? 0).toLocaleString("ar-EG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Logs</span>
          <div className="table-shell">
            <table>
              <thead><tr><th>السائق</th><th>ملاحظات</th><th>تاريخ الإسناد</th></tr></thead>
              <tbody>
                {(history?.assignments ?? []).map((item, index) => (
                  <tr key={`assignment-${index}`}>
                    <td>{item.driver_name || item.driver_id || "-"}</td>
                    <td>{item.notes || "-"}</td>
                    <td>{item.assigned_at || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-shell">
            <table>
              <thead><tr><th>التاريخ</th><th>اللترات</th><th>التكلفة</th><th>العداد</th></tr></thead>
              <tbody>
                {(history?.fuel_logs ?? []).map((item, index) => (
                  <tr key={`fuel-${index}`}>
                    <td>{item.date || "-"}</td>
                    <td>{(item.liters ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{(item.cost ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    <td>{(item.odometer_reading ?? 0).toLocaleString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
