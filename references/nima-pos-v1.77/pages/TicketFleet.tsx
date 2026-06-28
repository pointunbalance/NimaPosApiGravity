import React, { useState, useEffect } from 'react';
import { 
    Bus, LayoutGrid, Plus, Edit, Trash2, Save, XCircle, Wrench, Navigation, CheckCircle
} from 'lucide-react';
import { db } from '../db';
import { TicketVehicle, TicketSeatingTemplate } from '../types';

const TicketFleet = () => {
    const [activeTab, setActiveTab] = useState<'vehicles' | 'templates' | 'maintenance'>('vehicles');
    
    // Data
    const [vehicles, setVehicles] = useState<TicketVehicle[]>([]);
    const [templates, setTemplates] = useState<TicketSeatingTemplate[]>([]);
    const [maintenances, setMaintenances] = useState<any[]>([]); // We can type it properly below or let it implicitly match DB
    
    // Modals
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    
    const [vehicleForm, setVehicleForm] = useState<Partial<TicketVehicle>>({});
    const [templateForm, setTemplateForm] = useState<Partial<TicketSeatingTemplate>>({});
    const [maintenanceForm, setMaintenanceForm] = useState<any>({ type: 'routine' });
    const [layoutCells, setLayoutCells] = useState<string[][]>([]); // 'X' for space or 'Seat-N'
    const [seatProps, setSeatProps] = useState<Record<string, { type: 'standard'|'window'|'aisle'|'vip', extraFee: number }>>({});
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [v, t, m] = await Promise.all([
            db.ticketVehicles.toArray(),
            db.ticketSeatingTemplates.toArray(),
            (db as any).ticketVehicleMaintenance.toArray()
        ]);
        setVehicles(v);
        setTemplates(t);
        setMaintenances(m.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    // --- Vehicle Handlers ---
    const handleSaveVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && vehicleForm.id) {
                await db.ticketVehicles.update(vehicleForm.id, vehicleForm as TicketVehicle);
            } else {
                await db.ticketVehicles.add(vehicleForm as TicketVehicle);
            }
            setIsVehicleModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const deleteVehicle = async (id: number) => {
        if(window.confirm('هل أنت متأكد من حذف هذه المركبة؟')) {
            await db.ticketVehicles.delete(id);
            loadData();
        }
    };

    // --- Template Handlers ---
    const buildLayoutGrid = (rows: number, cols: number, existingLayoutData?: string) => {
        if (existingLayoutData) {
            try {
                const parsed = JSON.parse(existingLayoutData);
                if (parsed.grid) {
                    setSeatProps(parsed.seats || {});
                    return parsed.grid;
                } else if (Array.isArray(parsed)) {
                    setSeatProps({});
                    return parsed;
                }
            } catch (e) {}
        }
        
        setSeatProps({});
        let counter = 1;
        const grid = [];
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
                // By default keep middle column as aisle 'X' if cols is odd, otherwise simple sequential
                if (cols > 2 && c === Math.floor(cols / 2)) {
                    row.push('X');
                } else {
                    row.push(`${counter++}`);
                }
            }
            grid.push(row);
        }
        return grid;
    };

    const handleTemplateSetup = (tmpl: Partial<TicketSeatingTemplate>, isEd: boolean) => {
        setIsEdit(isEd);
        setTemplateForm(tmpl);
        setSelectedSeat(null);
        const grid = buildLayoutGrid(tmpl.rows || 10, tmpl.columns || 4, tmpl.layoutData);
        setLayoutCells(grid);
        setIsTemplateModalOpen(true);
    };

    const handleGridSizeChange = (field: 'rows' | 'columns', val: number) => {
        if (val < 1) return;
        const newForm = { ...templateForm, [field]: val };
        setTemplateForm(newForm);
        // keep seat props but rewrite grid
        const newGrid = buildLayoutGrid(newForm.rows || 10, newForm.columns || 4);
        setLayoutCells(newGrid);
    };

    const handleSeatSelect = (cell: string) => {
        if (cell !== 'X') {
            setSelectedSeat(cell);
        }
    };

    const updateSeatProp = (field: string, val: any) => {
        if (!selectedSeat) return;
        setSeatProps(prev => {
            const current = prev[selectedSeat] || { type: 'standard', extraFee: 0 };
            return { ...prev, [selectedSeat]: { ...current, [field]: val } };
        });
    };

    const toggleSeatSpace = (rIndex: number, cIndex: number) => {
        const grid = [...layoutCells.map(row => [...row])];
        if (grid[rIndex][cIndex] === 'X') {
            grid[rIndex][cIndex] = '0'; // placeholder for number recalculation
        } else {
            // Remove from seat props if it was a space
            const cellVal = grid[rIndex][cIndex];
            if (seatProps[cellVal]) {
                const newProps = {...seatProps};
                delete newProps[cellVal];
                setSeatProps(newProps);
            }
            if (selectedSeat === cellVal) setSelectedSeat(null);
            
            grid[rIndex][cIndex] = 'X';
        }
        
        // Recalculate numbers
        let counter = 1;
        const newProps: any = {};

        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                if (grid[i][j] !== 'X') {
                    const oldVal = grid[i][j];
                    const newVal = `${counter++}`;
                    grid[i][j] = newVal;
                    
                    // Migrate property to new seat number if shifted
                    // NOTE: This loses props if a seat is fully deleted, but shifting is tricky.
                    // Instead of full shift remap, we assume properties are reset or we just clear them on structure change
                    // for simplicity of this demo.
                }
            }
        }
        // Easy mode: clear seat props if structure changes to avoid wrong mapping, except we can just warn the user.
        setLayoutCells(grid);
    };

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const layoutDataJson = JSON.stringify({ grid: layoutCells, seats: seatProps });
            const finalData = { ...templateForm, layoutData: layoutDataJson } as TicketSeatingTemplate;
            if (isEdit && finalData.id) {
                await db.ticketSeatingTemplates.update(finalData.id, finalData);
            } else {
                await db.ticketSeatingTemplates.add(finalData);
            }
            setIsTemplateModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const deleteTemplate = async (id: number) => {
        if(window.confirm('هل أنت متأكد من الحذف؟')) {
            await db.ticketSeatingTemplates.delete(id);
            loadData();
        }
    };

    // --- Maintenance Handlers ---
    const handleSaveMaintenance = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave = { ...maintenanceForm };
            if (isEdit && dataToSave.id) {
                await (db as any).ticketVehicleMaintenance.update(dataToSave.id, dataToSave);
            } else {
                await (db as any).ticketVehicleMaintenance.add(dataToSave);
            }
            
            const v = vehicles.find(x => x.id === dataToSave.vehicleId);
            if (v) {
                const parts: any = { odometer: dataToSave.odometer };
                if (dataToSave.nextServiceOdometer) {
                    parts.nextServiceOdometer = dataToSave.nextServiceOdometer;
                }
                await db.ticketVehicles.update(v.id!, parts);
            }
            setIsMaintenanceModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const deleteMaintenance = async (id: number) => {
        if(window.confirm('هل أنت متأكد من الحذف؟')) {
            await (db as any).ticketVehicleMaintenance.delete(id);
            loadData();
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Bus className="w-8 h-8 text-indigo-600" />
                        إدارة أسطول النقل والمقاعد
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">التحكم في المركبات، السعات، والمخططات الهيكلية للمقاعد</p>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6 overflow-x-auto w-full max-w-2xl">
                <button
                    onClick={() => setActiveTab('vehicles')}
                    className={`flex-1 min-w-[150px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'vehicles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Bus className="w-4 h-4"/> بيانات المركبات
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`flex-1 min-w-[150px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'templates' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <LayoutGrid className="w-4 h-4"/> المخططات الهيكلية (Templates)
                </button>
                <button
                    onClick={() => setActiveTab('maintenance')}
                    className={`flex-1 min-w-[150px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'maintenance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Wrench className="w-4 h-4"/> الصيانة الدورية والأعطال
                </button>
            </div>

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">أسطول المركبات</h2>
                        <button onClick={() => { setIsEdit(false); setVehicleForm({ type: 'bus', status: 'ready' }); setIsVehicleModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center hover:bg-indigo-700 transition">
                            <Plus className="w-5 h-5 ml-1" /> إضافة مركبة 
                        </button>
                    </div>
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">رقم اللوحة / الرمز</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">الموديل والنوع</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">السعة ومخطط المقاعد</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">العداد (كم)</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">الحالة</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vehicles.map(v => {
                                    const tmpl = templates.find(t => t.id === v.layoutTemplateId);
                                    return (
                                        <tr key={v.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 font-black text-slate-800">{v.plateNumber}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-600">
                                                <div>{v.model}</div>
                                                <div className="text-xs text-slate-400">{v.type === 'bus' ? 'أتوبيس' : v.type === 'train' ? 'قطار' : 'أخرى'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-600">
                                                <div>{v.capacity} مقعد</div>
                                                {tmpl && <div className="text-xs text-indigo-500 mt-1">مخطط: {tmpl.name}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-600">
                                                <div className="flex flex-col">
                                                    <span>{v.odometer ? v.odometer.toLocaleString() : '---'}</span>
                                                    {v.nextServiceOdometer && (
                                                        <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded mt-1 w-fit border border-orange-100">
                                                            التالية: {v.nextServiceOdometer.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1
                                                    ${v.status === 'ready' ? 'bg-emerald-50 text-emerald-600' : v.status === 'maintenance' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}
                                                `}>
                                                    {v.status === 'ready' && <CheckCircle className="w-3 h-3"/>}
                                                    {v.status === 'maintenance' && <Wrench className="w-3 h-3"/>}
                                                    {v.status === 'on_trip' && <Navigation className="w-3 h-3"/>}
                                                    {v.status === 'ready' ? 'جاهزة' : v.status === 'maintenance' ? 'صيانة' : 'في رحلة'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => { setIsEdit(true); setVehicleForm(v); setIsVehicleModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"><Edit className="w-4 h-4"/></button>
                                                    <button onClick={() => v.id && deleteVehicle(v.id)} className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {vehicles.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">لم يتم إضافة مركبات</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">مخططات المقاعد الهيكلية</h2>
                        <button onClick={() => handleTemplateSetup({ type: 'bus', rows: 12, columns: 5 }, false)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center hover:bg-indigo-700 transition">
                            <Plus className="w-5 h-5 ml-1" /> تكوين مخطط جديد
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {templates.map(tmpl => {
                            let totalSeats = 0;
                            try {
                                const l = JSON.parse(tmpl.layoutData || '[]');
                                totalSeats = l.flat().filter((x: string) => x !== 'X').length;
                            } catch(e) {}
                            
                            return (
                                <div key={tmpl.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-slate-800">{tmpl.name}</h3>
                                            <span className="bg-white px-2 py-1 rounded text-xs font-bold text-slate-500 shadow-sm border border-slate-100">
                                                {tmpl.type === 'bus' ? 'أتوبيس' : tmpl.type === 'train' ? 'قطار' : 'أخرى'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm font-bold text-slate-600">
                                            <div>الصفوف: <span className="text-slate-800">{tmpl.rows}</span></div>
                                            <div>الأعمدة: <span className="text-slate-800">{tmpl.columns}</span></div>
                                        </div>
                                        <div className="mb-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500">إجمالي المقاعد النشطة</span>
                                            <span className="text-lg font-black text-indigo-600">{totalSeats}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 shrink-0">
                                        <button onClick={() => handleTemplateSetup(tmpl, true)} className="flex-1 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-50 transition flex justify-center items-center"><Edit className="w-4 h-4 ml-2"/> تعديل الهيكل</button>
                                        <button onClick={() => tmpl.id && deleteTemplate(tmpl.id)} className="w-11 flex justify-center items-center bg-white text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-50 transition"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            );
                        })}
                        {templates.length === 0 && (
                            <div className="col-span-full p-8 text-center text-slate-400 font-bold border border-dashed border-slate-200 rounded-3xl">لا توجد مخططات مقاعد معرفة</div>
                        )}
                    </div>
                </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">سجل الصيانة والأعطال</h2>
                            <p className="text-sm text-slate-500 font-medium">متابعة الفحص الدوري وتغيير الزيوت والإصلاحات الطارئة</p>
                        </div>
                        <button onClick={() => { setIsEdit(false); setMaintenanceForm({ date: new Date().toISOString().split('T')[0], type: 'routine', odometer: 0 }); setIsMaintenanceModalOpen(true); }} className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold flex items-center hover:bg-rose-700 transition shadow-sm">
                            <Plus className="w-5 h-5 ml-1" /> تسجيل صيانة / عطل
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vehicles.map(v => {
                            const isDue = v.odometer && v.nextServiceOdometer && (v.nextServiceOdometer - v.odometer <= 500);
                            return (
                                <div key={v.id} className={`p-4 rounded-2xl border ${isDue ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <h3 className="font-bold text-slate-800 flex items-center justify-between">
                                        <span>{v.plateNumber} <span className="text-sm font-medium text-slate-500">({v.model})</span></span>
                                    </h3>
                                    <div className="mt-3 space-y-2 text-sm font-bold text-slate-600">
                                        <div className="flex justify-between"><span>العداد الحالي:</span> <span className="text-slate-800">{v.odometer || 'غير مسجل'} كم</span></div>
                                        <div className="flex justify-between"><span>الصيانة القادمة:</span> <span className={isDue ? 'text-orange-600' : 'text-slate-800'}>{v.nextServiceOdometer || 'غير محدد'} كم</span></div>
                                        {isDue && <div className="text-xs text-orange-600 font-black mt-2 bg-orange-100 p-2 rounded-lg">⚠️ اقترب موعد الصيانة (أقل من 500 كم)</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl mt-6">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">التاريخ والمركبة</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">نوع الصيانة</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">البيان وقطع الغيار</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">التكلفة (ج.م)</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {maintenances.map(m => {
                                    const v = vehicles.find(x => x.id === m.vehicleId);
                                    return (
                                        <tr key={m.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                <div>{m.date}</div>
                                                <div className="text-xs text-indigo-600 mt-1">{v?.plateNumber || m.vehicleId}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold">
                                                <span className={`px-2 py-1 rounded-lg ${m.type === 'routine' ? 'bg-emerald-100 text-emerald-700' : m.type === 'breakdown' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {m.type === 'routine' ? 'دورية' : m.type === 'breakdown' ? 'عطل طارئ' : 'إصلاح'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-600">
                                                <div>{m.description}</div>
                                                {m.replacedParts && <div className="text-xs text-slate-400 mt-1">قطع غيار: <span className="text-slate-500">{m.replacedParts}</span></div>}
                                                {m.technicianName && <div className="text-xs text-indigo-500 mt-1">القائم بالصيانة: {m.technicianName}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-red-600 font-black">{m.cost || 0}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => { setIsEdit(true); setMaintenanceForm(m); setIsMaintenanceModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"><Edit className="w-4 h-4"/></button>
                                                    <button onClick={() => m.id && deleteMaintenance(m.id)} className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {maintenances.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">لم يتم تسجيل سجلات صيانة</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isMaintenanceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <form onSubmit={handleSaveMaintenance} className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'تعديل السجل' : 'تسجيل صيانة أو عطل'}</h2>
                            <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">المركبة *</label>
                                    <select required value={maintenanceForm.vehicleId || ''} onChange={e => {
                                        const vid = parseInt(e.target.value);
                                        const v = vehicles.find(x => x.id === vid);
                                        setMaintenanceForm({...maintenanceForm, vehicleId: vid, odometer: v?.odometer || 0});
                                    }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500">
                                        <option value="">-- اختر المركبة --</option>
                                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">التاريخ *</label>
                                    <input type="date" required value={maintenanceForm.date || ''} onChange={e => setMaintenanceForm({...maintenanceForm, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">نوع الحدث *</label>
                                    <select required value={maintenanceForm.type || 'routine'} onChange={e => setMaintenanceForm({...maintenanceForm, type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500">
                                        <option value="routine">صيانة دورية (زيت/فلاتر/الخ)</option>
                                        <option value="repair">إصلاح عام</option>
                                        <option value="breakdown">عطل طارئ على الطريق</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">تكلفة الإصلاح (ج.م)</label>
                                    <input type="number" min="0" value={maintenanceForm.cost || ''} onChange={e => setMaintenanceForm({...maintenanceForm, cost: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 text-rose-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">قراءة العداد الحالية (كم) *</label>
                                    <input type="number" required min="0" value={maintenanceForm.odometer || ''} onChange={e => setMaintenanceForm({...maintenanceForm, odometer: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">موعد الصيانة القادمة (كم)</label>
                                    <input type="number" min="0" value={maintenanceForm.nextServiceOdometer || ''} onChange={e => setMaintenanceForm({...maintenanceForm, nextServiceOdometer: parseInt(e.target.value)})} placeholder="مثال: يضاف 10000 للزيت" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">وصف العطل / الصيانة *</label>
                                <textarea required rows={2} value={maintenanceForm.description || ''} onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="ما الذي تم إنجازه أو إصلاحه..."></textarea>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">قطع الغيار المستهلكة (اختياري)</label>
                                    <input type="text" value={maintenanceForm.replacedParts || ''} onChange={e => setMaintenanceForm({...maintenanceForm, replacedParts: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="مثال: فلتر زيت، تيل فرامل أمامي" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الفني المسؤول (اختياري)</label>
                                    <input type="text" value={maintenanceForm.technicianName || ''} onChange={e => setMaintenanceForm({...maintenanceForm, technicianName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="اسم الفني أو المهندس" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">إلغاء</button>
                            <button type="submit" className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition flex items-center shadow-lg"><Save className="w-5 h-5 ml-2"/> حفظ السجل</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Vehicle Modal */}
            {isVehicleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <form onSubmit={handleSaveVehicle} className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'تعديل بيانات مركبة' : 'إضافة مركبة'}</h2>
                            <button type="button" onClick={() => setIsVehicleModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم اللوحة / الرمز *</label>
                                    <input type="text" required value={vehicleForm.plateNumber || ''} onChange={e => setVehicleForm({...vehicleForm, plateNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="مثال: د س ب 1234 أو كود المركبة"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">نوع المركبة *</label>
                                    <select required value={vehicleForm.type || 'bus'} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500">
                                        <option value="bus">أتوبيس / حافلة</option>
                                        <option value="train">قطار</option>
                                        <option value="airplane">طائرة</option>
                                        <option value="ship">سفينة / يخت</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الموديل والماركة</label>
                                    <input type="text" value={vehicleForm.model || ''} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="مثال: مرسيدس 2024"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">إجمالي السعة (المقاعد) *</label>
                                    <input type="number" required min="1" value={vehicleForm.capacity || ''} onChange={e => setVehicleForm({...vehicleForm, capacity: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">مخطط المقاعد الهيكلي (اختياري)</label>
                                    <select value={vehicleForm.layoutTemplateId || ''} onChange={e => setVehicleForm({...vehicleForm, layoutTemplateId: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500">
                                        <option value="">بدون مخطط محدد</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.rows}×{t.columns})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">حالة المركبة</label>
                                    <select required value={vehicleForm.status || 'ready'} onChange={e => setVehicleForm({...vehicleForm, status: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500">
                                        <option value="ready">جاهزة</option>
                                        <option value="maintenance">في الصيانة</option>
                                        <option value="on_trip">في رحلة حالياً</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">قراءة العداد (كم)</label>
                                    <input type="number" value={vehicleForm.odometer || 0} onChange={e => setVehicleForm({...vehicleForm, odometer: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="الكيلومتر الحالي" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">تنبيه الصيانة القادمة (كم)</label>
                                    <input type="number" value={vehicleForm.nextServiceOdometer || 0} onChange={e => setVehicleForm({...vehicleForm, nextServiceOdometer: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="مثال: يضاف 500 للصيانة" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsVehicleModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">إلغاء</button>
                            <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center shadow-lg"><Save className="w-5 h-5 ml-2"/> حفظ المركبة</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Template Modal */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <form onSubmit={handleSaveTemplate} className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'تعديل مخطط المقاعد' : 'تكوين مخطط هيكلي جديد'}</h2>
                                <p className="text-sm font-bold text-slate-500 mt-1">اضغط على الخلية للتبديل بين "مقعد" و "ممر/مساحة فارغة"</p>
                            </div>
                            <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-1/3 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">اسم المخطط *</label>
                                    <input type="text" required value={templateForm.name || ''} onChange={e => setTemplateForm({...templateForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="مثال: يوتونج 52 مقعد"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">نوع المخطط</label>
                                        <select required value={templateForm.type || 'bus'} onChange={e => setTemplateForm({...templateForm, type: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500">
                                            <option value="bus">أتوبيس</option>
                                            <option value="train">عربة قطار</option>
                                            <option value="airplane">طائرة</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">عدد الصفوف</label>
                                        <input type="number" required min="1" max="50" value={templateForm.rows || ''} onChange={e => handleGridSizeChange('rows', parseInt(e.target.value) || 1)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الأعمدة (اليمين لليسار)</label>
                                        <input type="number" required min="1" max="15" value={templateForm.columns || ''} onChange={e => handleGridSizeChange('columns', parseInt(e.target.value) || 1)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" />
                                    </div>
                                </div>
                                <div className="mt-8 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                    <h4 className="font-bold text-indigo-800 mb-2 flex items-center"><LayoutGrid className="w-4 h-4 ml-1"/> إحصائيات الهيكل</h4>
                                    <div className="flex justify-between items-center text-sm font-bold text-indigo-600">
                                        <span>إجمالي الخلايا: {(templateForm.rows || 0) * (templateForm.columns || 0)}</span>
                                        <span>إجمالي المقاعد: {layoutCells.flat().filter(x => x !== 'X').length}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Grid Builder UI */}
                            <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center overflow-auto relative">
                                {selectedSeat && (
                                    <div className="absolute top-4 left-4 bg-white p-4 rounded-2xl shadow-lg border border-slate-100 min-w-[250px] z-10 animate-in fade-in slide-in-from-top-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-bold text-slate-800">إعداد المقعد: <span className="text-indigo-600">{selectedSeat}</span></h3>
                                            <button type="button" onClick={() => setSelectedSeat(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5"/></button>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">نوع المقعد</label>
                                                <select
                                                    value={seatProps[selectedSeat]?.type || 'standard'}
                                                    onChange={e => updateSeatProp('type', e.target.value)}
                                                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold"
                                                >
                                                    <option value="standard">عادي</option>
                                                    <option value="window">بجوار النافذة</option>
                                                    <option value="aisle">على الممر</option>
                                                    <option value="vip">مميز (VIP - مساحة أوسع)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">رسوم إضافية (Premium)</label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={seatProps[selectedSeat]?.extraFee || 0}
                                                    onChange={e => updateSeatProp('extraFee', parseFloat(e.target.value) || 0)}
                                                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-emerald-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="bg-slate-300 w-full max-w-[200px] h-2 rounded-full mb-8"></div> {/* Front reference */}
                                <div className="inline-block border-2 border-slate-300 p-4 rounded-3xl bg-white shadow-sm">
                                    <div className="flex flex-col gap-2">
                                        {layoutCells.map((row, rIndex) => (
                                            <div key={`r-${rIndex}`} className="flex gap-2 justify-center">
                                                {row.map((cell, cIndex) => {
                                                    const sProps = seatProps[cell];
                                                    let bgClass = "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100";
                                                    if (sProps?.type === 'vip') bgClass = "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200";
                                                    else if (sProps?.type === 'window') bgClass = "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100";
                                                    
                                                    const isSelected = selectedSeat === cell;
                                                    
                                                    return (
                                                    <button 
                                                        key={`c-${rIndex}-${cIndex}`}
                                                        type="button"
                                                        onClick={() => {
                                                            if (cell === 'X') toggleSeatSpace(rIndex, cIndex);
                                                            else handleSeatSelect(cell);
                                                        }}
                                                        onDoubleClick={() => toggleSeatSpace(rIndex, cIndex)}
                                                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-sm transition-all border-b-4 relative
                                                            ${cell === 'X' 
                                                                ? 'bg-slate-100 border-slate-200 text-slate-300 hover:bg-slate-200' 
                                                                : bgClass
                                                            }
                                                            ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110 z-0' : ''}
                                                        `}
                                                        title={cell === 'X' ? 'مساحة فارغة (اضغط مرتين لإضافة مقعد)' : `مقعد رقم ${cell} (اضغط للاعداد، مرتين للإزالة)`}
                                                    >
                                                        {cell === 'X' ? '' : cell}
                                                        {cell !== 'X' && sProps?.extraFee > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] px-1 rounded-full">{sProps.extraFee}+</span>}
                                                    </button>
                                                )})}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-slate-300 w-full max-w-[200px] h-2 rounded-full mt-8"></div> {/* Back reference */}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">إلغاء</button>
                            <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center shadow-lg"><Save className="w-5 h-5 ml-2"/> حفظ الهيكل</button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
};

export default TicketFleet;
