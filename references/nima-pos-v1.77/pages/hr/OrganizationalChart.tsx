import React, { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Users, UserCircle, ChevronDown, ChevronLeft, Search, Printer, Download } from 'lucide-react';
import { User } from '../../types';

interface TreeNode {
  user: User;
  children: TreeNode[];
}

const roleTranslations: Record<string, string> = {
  admin: 'مدير النظام',
  manager: 'مدير',
  cashier: 'كاشير',
  waiter: 'نادل',
  kitchen: 'مطبخ',
  delivery: 'توصيل',
  warehouse: 'مستودع',
  unassigned: 'غير معين'
};

const OrgNode: React.FC<{ node: TreeNode, level: number, searchTerm: string }> = ({ node, level, searchTerm }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  const matchesSearch = (n: TreeNode): boolean => {
    if (!searchTerm) return true;
    if (n.user.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    if (n.user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    return n.children.some(matchesSearch);
  };

  if (!matchesSearch(node)) return null;

  const isMatch = searchTerm && (
    node.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    node.user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 py-2">
        {Array.from({ length: level }).map((_, i) => (
          <div key={i} className="w-8 h-px bg-slate-200 print:bg-slate-400"></div>
        ))}
        
        <div 
          className={`flex items-center gap-3 p-3 rounded-xl border ${isMatch ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'} min-w-[250px] shadow-sm cursor-pointer hover:border-indigo-300 transition-colors print:border-slate-400 print:shadow-none`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {hasChildren ? (
            <button className="p-1 hover:bg-slate-100 rounded-full print:hidden">
              {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronLeft className="w-4 h-4 text-slate-500" />}
            </button>
          ) : (
            <div className="w-6 print:hidden"></div>
          )}
          
          {node.user.idCardImage ? (
            <img src={node.user.idCardImage} alt={node.user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
          ) : (
            <UserCircle className="w-10 h-10 text-slate-400" />
          )}
          <div>
            <p className="font-bold text-slate-800">{node.user.name}</p>
            <p className="text-xs text-slate-500">{node.user.jobTitle || roleTranslations[node.user.role] || node.user.role}</p>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col mr-8 border-r-2 border-slate-200 print:border-slate-400 pr-4">
          {node.children.map(child => (
            <OrgNode key={child.user.id} node={child} level={level + 1} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
};

export const OrganizationalChart: React.FC = () => {
  const users = useLiveQuery(() => db.users.toArray(), []) || [];
  const [searchTerm, setSearchTerm] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => {
    const nodeMap = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    users.forEach(user => {
      nodeMap.set(user.id!, { user, children: [] });
    });

    users.forEach(user => {
      const node = nodeMap.get(user.id!);
      if (node) {
        if (user.managerId && nodeMap.has(user.managerId)) {
          nodeMap.get(user.managerId)!.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  }, [users]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['الرقم', 'الاسم', 'المسمى الوظيفي', 'الدور', 'المدير المباشر', 'رقم الهاتف', 'البريد الإلكتروني'];
    const csvContent = [
      headers.join(','),
      ...users.map(u => {
        const manager = users.find(m => m.id === u.managerId);
        return [
          u.id,
          `"${u.name}"`,
          `"${u.jobTitle || ''}"`,
          `"${roleTranslations[u.role] || u.role}"`,
          `"${manager?.name || ''}"`,
          `"${u.phone || ''}"`,
          `"${u.email || ''}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `الهيكل_التنظيمي_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" />
          الهيكل التنظيمي
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-x-auto print:border-none print:shadow-none print:p-0">
        <div className="mb-8 relative max-w-md print:hidden">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="بحث عن موظف أو قسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="hidden print:block mb-6 text-center">
            <h2 className="text-2xl font-bold text-slate-800">الهيكل التنظيمي</h2>
            <p className="text-slate-500 mt-2">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
        </div>

        <div className="min-w-max pb-8" ref={printRef}>
          {tree.length > 0 ? (
            tree.map(rootNode => (
              <OrgNode key={rootNode.user.id} node={rootNode} level={0} searchTerm={searchTerm} />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500 print:hidden">
              لا يوجد موظفين لعرض الهيكل التنظيمي
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationalChart;
