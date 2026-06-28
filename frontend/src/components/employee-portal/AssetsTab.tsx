import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';
import { Laptop } from 'lucide-react';

interface AssetsTabProps {
  user: User;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({ user }) => {
  const myAssets = useLiveQuery(() => {
    if (!user?.id) return [];
    return db.assetCustody.where('employeeId').equals(user.id).toArray();
  }, [user?.id]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800">العهد العينية (الأصول)</h2>
        <p className="text-sm text-gray-500">الأصول والمعدات المسلمة في عهدتك</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myAssets?.map(asset => (
          <div key={asset.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-800">{asset.assetName}</h3>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                asset.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {asset.status === 'active' ? 'في العهدة' : 'تم الإرجاع'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-500">الرقم التسلسلي:</span>
                <span className="font-medium">{asset.serialNumber || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">تاريخ الاستلام:</span>
                <span>{new Date(asset.issueDate).toLocaleDateString('ar-EG')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الحالة:</span>
                <span>{asset.condition}</span>
              </div>
              {asset.returnDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">تاريخ الإرجاع:</span>
                  <span>{new Date(asset.returnDate).toLocaleDateString('ar-EG')}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {myAssets?.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Laptop className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p>لا توجد عهد عينية مسجلة باسمك</p>
          </div>
        )}
      </div>
    </div>
  );
};
