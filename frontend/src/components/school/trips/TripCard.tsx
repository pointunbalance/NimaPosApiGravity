import React from 'react';
import { MapPin, Calendar, Users, DollarSign, Wallet, Info, FileText, Send, Edit2, Trash2 } from 'lucide-react';

interface TripCardProps {
  trip: any;
  stats: any;
  onEdit: () => void;
  onDelete: () => void;
  onOpenReport: () => void;
  onSendMessage: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  stats,
  onEdit,
  onDelete,
  onOpenReport,
  onSendMessage,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group relative">
      <div className="p-6 border-b border-slate-100 bg-slate-50 relative">
        <div className="absolute left-6 top-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-1 pr-8">{trip.name}</h3>
        <p className="text-emerald-600 font-bold flex items-center gap-1.5 text-sm">
          <MapPin className="w-4 h-4" /> {trip.destination}
        </p>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> التاريخ
            </p>
            <p className="font-bold text-slate-800 font-mono text-xs">{trip.date}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> المشتركين
            </p>
            <p className="font-bold text-slate-800 text-xs">
              {trip.participants?.length || 0} / {trip.capacity || 30} طفل
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> تكلفة الفرد
            </p>
            <p className="font-bold text-slate-800 text-xs">{trip.childCost} ج.م</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-700 font-bold mb-1 flex items-center gap-1">
              <Wallet className="w-3 h-3" /> الأرباح
            </p>
            <p
              className={`font-black text-xs ${stats.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
              dir="ltr"
            >
              {stats.profit} ج.م
            </p>
          </div>
        </div>

        {trip.notes && (
          <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="line-clamp-2">{trip.notes}</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 flex gap-2">
        <button
          onClick={onOpenReport}
          className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <FileText className="w-4 h-4 text-indigo-600" /> التقرير المالي والحضور
        </button>
        <button
          onClick={onSendMessage}
          className={`px-4 bg-white border text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            trip.isMessageSent
              ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
              : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
          }`}
          title="إرسال إشعار للأهالي"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TripCard;
