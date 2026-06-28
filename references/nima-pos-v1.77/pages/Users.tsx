
import React, { useState, useMemo, useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { User, Order } from '../types';
import { ShieldCheck, Package, ShoppingBag } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import UsersHeader from '../components/users/UsersHeader';
import UsersGrid from '../components/users/UsersGrid';
import UsersList from '../components/users/UsersList';
import UserDetailSidebar from '../components/users/UserDetailSidebar';
import UserModal from '../components/users/UserModal';
import { hashPin } from '../utils/crypto';
import { LicenseContext } from '../components/ActivationGuard';

const UsersPage: React.FC = () => {
  const license = useContext(LicenseContext);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);

  // Detail View State
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'activity'>('overview');

  const users = useLiveQuery(() => db.users.toArray(), []);
  const orders = useLiveQuery(() => db.orders.toArray(), []);
  // Fetch logs for activity timeline
  const logs = useLiveQuery(async () => {
      if (!selectedUserForDetail) return [];
      return await db.logs
        .where('user').equals(selectedUserForDetail.name)
        .reverse()
        .limit(50)
        .toArray();
  }, [selectedUserForDetail]);

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = settings?.currencyCode || 'IQD';

  // --- Logic & Stats ---

  const userPerformanceMap = useMemo(() => {
      const map = new Map<string, { 
          totalSales: number, 
          orderCount: number, 
          refundCount: number,
          refundValue: number,
          lastActive: Date | null, 
          recentOrders: Order[], 
          dailySales: {date: string, amount: number}[] 
      }>();
      
      orders?.forEach(order => {
          if (!order.cashierName) return;
          
          const current = map.get(order.cashierName) || { 
              totalSales: 0, orderCount: 0, refundCount: 0, refundValue: 0,
              lastActive: null, recentOrders: [], dailySales: [] 
          };
          
          const orderDate = new Date(order.date);
          if (!current.lastActive || orderDate > current.lastActive) {
              current.lastActive = orderDate;
          }

          if (order.status === 'refunded') {
              current.refundCount += 1;
              current.refundValue += order.totalAmount;
          } else {
              current.totalSales += order.totalAmount;
              current.orderCount += 1;
              current.recentOrders.push(order);
          }
          
          map.set(order.cashierName, current);
      });

      // Process Daily Sales for Charts
      map.forEach(val => {
          val.recentOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          const dailyMap = new Map<string, number>();
          val.recentOrders.forEach(o => {
              const day = new Date(o.date).toLocaleDateString('en-US', { weekday: 'short' });
              dailyMap.set(day, (dailyMap.get(day) || 0) + o.totalAmount);
          });
          val.dailySales = Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount })).slice(0, 7).reverse();
      });

      return map;
  }, [orders]);

  const topPerformer = useMemo(() => {
      let maxSales = 0;
      let topUser = '';
      userPerformanceMap.forEach((val, key) => {
          if (val.totalSales > maxSales) {
              maxSales = val.totalSales;
              topUser = key;
          }
      });
      return topUser;
  }, [userPerformanceMap]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [users, searchTerm]);

  // --- Helpers ---

  const getContractStatus = (endDate?: Date) => {
      if (!endDate) return { label: 'دائم', color: 'text-gray-400 bg-gray-50', days: null };
      const today = new Date();
      const end = new Date(endDate);
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { label: `انتهى منذ ${Math.abs(diffDays)} يوم`, color: 'text-red-700 bg-red-50 font-bold', days: diffDays };
      if (diffDays < 30) return { label: `باقي ${diffDays} يوم`, color: 'text-orange-700 bg-orange-50 font-bold', days: diffDays };
      return { label: `ساري (${diffDays} يوم)`, color: 'text-emerald-700 bg-emerald-50', days: diffDays };
  };

  const getRoleBadge = (role: string) => {
      switch(role) {
          case 'admin': return { label: 'مدير النظام', bg: 'bg-purple-100 text-purple-700', icon: ShieldCheck };
          case 'warehouse': return { label: 'أمين مخزن', bg: 'bg-orange-100 text-orange-700', icon: Package };
          default: return { label: 'كاشير / مبيعات', bg: 'bg-blue-100 text-blue-700', icon: ShoppingBag };
      }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);
  const formatDate = (date: Date) => new Intl.DateTimeFormat('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));

  // --- Handlers ---

  const handleToggleStatus = async (user: User) => {
      try {
          const currentUserData = localStorage.getItem('nima_user');
          const currentUser = currentUserData ? JSON.parse(currentUserData) : { id: 1 };
          
          if (user.id === currentUser.id) {
              toast.error('لا يمكنك حظر حسابك الخاص.');
              return;
          }
          
          const newStatus = !user.isActive;
          await db.users.update(user.id!, { isActive: newStatus });
          toast.success(`تم ${newStatus ? 'تفعيل' : 'حظر'} حساب المستخدم بنجاح.`);
          
          // Notifications logic
          import('../utils/notifications').then(({ notificationService }) => {
              notificationService.addNotification(
                  "تحديث حالة موظف", 
                  `تم ${newStatus ? 'تفعيل' : 'حظر'} حساب الموظف ${user.name} بواسطة ${currentUser.name || 'المدير'}.`,
                  newStatus ? "success" : "error"
              );
          });
      } catch (error) {
          console.error("Error toggling user status", error);
          toast.error('حدث خطأ أثناء تبديل حالة الحساب.');
      }
  };

  const handleModalSubmit = async (userData: Partial<User>) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');
      if (editingUser?.id === currentUser?.id && userData.role !== editingUser.role) {
         toast.error('لأسباب أمنية (منع تصعيد الصلاحيات أو الإغلاق الذاتي)، لا يمكنك تغيير صلاحيات حسابك الخاص.');
         return;
      }

      if (userData.pin) {
          userData.pin = await hashPin(userData.pin);
      }

      const dataToSave = {
          ...userData,
          startDate: userData.startDate ? new Date(userData.startDate) : undefined,
          contractEndDate: userData.contractEndDate ? new Date(userData.contractEndDate) : undefined,
      };

      if (editingUser?.id) {
        await db.users.update(editingUser.id, dataToSave);
        toast.success('تم تحديث بيانات المستخدم بنجاح.');
        if (selectedUserForDetail?.id === editingUser.id) setSelectedUserForDetail({...editingUser, ...dataToSave} as User);
      } else {
        if ((users?.length || 0) >= license.maxUsers) {
             toast.error(`عذراً، لقد وصلت للحد الأقصى لعدد المستخدمين المسموح به في باقتك (${license.maxUsers}). يرجى ترقية الباقة لزيادة العدد.`);
             return;
        }
        await db.users.add(dataToSave as User);
        toast.success('تم إضافة المستخدم بنجاح.');
      }
      closeModal();
    } catch (error) {
      console.error("Error saving user", error);
      toast.error('فشل في حفظ بيانات المستخدم.');
    }
  };

  const deleteUser = (id: number) => {
    const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');
    if (id === currentUser.id) {
        toast.error('لا يمكنك حذف الحساب الخاص بك.');
        return;
    }
    setUserToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteUser = async () => {
    if (!userToDeleteId) return;
    try {
      const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');
      // Soft Delete
      await db.users.update(userToDeleteId, { isActive: false });
      
      const user = await db.users.get(userToDeleteId);
      if (user) {
          await db.recycleBin.add({
              originalTable: 'users',
              originalId: userToDeleteId,
              deletedAt: Date.now(),
              summary: user.name,
              data: {
                  ...user,
                  _deletedBy: currentUser.name || 'System',
                  _reason: 'أرشفة الموظف بناء على سياسة الحذف الآمن'
              }
          });
      }

      toast.success('تم أرشفة الموظف بنجاح وتعطيل استخدامه للنظام.');
      if (selectedUserForDetail?.id === userToDeleteId) setSelectedUserForDetail(null);
    } catch (error) {
      console.error('Error archiving user:', error);
      toast.error('فشل في أرشفة الموظف.');
    } finally {
      setIsDeleteConfirmOpen(false);
      setUserToDeleteId(null);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
    } else {
      setEditingUser(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUserForDetail(user);
    setActiveTab('overview');
  };

  return (
    <div className="flex h-full bg-slate-50/50 overflow-hidden font-['Tajawal']">
      
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 transition-all duration-300">
          <UsersHeader 
            viewMode={viewMode}
            setViewMode={setViewMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddUser={() => openModal()}
          />

          {/* Content View */}
          {viewMode === 'grid' ? (
              <UsersGrid 
                users={filteredUsers}
                selectedUserId={selectedUserForDetail?.id}
                onSelectUser={handleSelectUser}
                userPerformanceMap={userPerformanceMap}
                topPerformer={topPerformer}
                getRoleBadge={getRoleBadge}
                formatCurrency={formatCurrency}
              />
          ) : (
              <UsersList 
                users={filteredUsers}
                selectedUserId={selectedUserForDetail?.id}
                onSelectUser={handleSelectUser}
                getContractStatus={getContractStatus}
              />
          )}
      </div>

      <UserDetailSidebar 
        user={selectedUserForDetail}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={() => setSelectedUserForDetail(null)}
        userPerformanceMap={userPerformanceMap}
        topPerformer={topPerformer}
        getContractStatus={getContractStatus}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onEdit={openModal}
        onDelete={deleteUser}
        onToggleStatus={handleToggleStatus}
        logs={logs || []}
      />

      <UserModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        user={editingUser}
        onSubmit={handleModalSubmit}
        users={users || []}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="تأكيد أرشفة الموظف"
        message="هل أنت متأكد من أرشفة هذا الموظف؟ لن يتمكن من تسجيل الدخول إلى النظام بعد الآن ولا يمكن التراجع عن هذا الإجراء."
        onConfirm={executeDeleteUser}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setUserToDeleteId(null);
        }}
        confirmText="نعم، أرشفة وتعطيل"
        cancelText="تراجع"
      />

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default UsersPage;
