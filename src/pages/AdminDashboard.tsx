import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Trash2, LayoutList, ShieldAlert } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  discountBalance: number;
  referredUsers: number;
  isAdmin: boolean;
  createdAt: string;
}

interface Design {
  id: number;
  name: string;
  imageUrl: string;
  user: { name: string };
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'designs'>('users');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem('wearurway_token');

      if (!token) {
        navigate('/auth');
        return;
      }

      const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

      try {
        // Fetch users - API will return 403 if not admin
        const usersRes = await fetch(`${API_BASE}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (usersRes.status === 403) {
          setError('ليس لديك صلاحيات للوصول لهذه الصفحة. تواصل مع المطور لترقية حسابك.');
          setLoading(false);
          return;
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users);
        }

        // Fetch designs
        const designsRes = await fetch(`${API_BASE}/api/designs`);
        if (designsRes.ok) {
          const designsData = await designsRes.json();
          setDesigns(designsData.designs);
        }
      } catch (e) {
        console.error(e);
        setError('حدث خطأ في الاتصال بالسيرفر.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleDeleteDesign = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من مسح هذا التصميم؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    const token = localStorage.getItem('wearurway_token');
    const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/designs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        setDesigns(prev => prev.filter(d => d.id !== id));
        alert('تم مسح التصميم بنجاح.');
      } else {
        alert(data.error || 'فشل المسح');
      }
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">جاري التحميل...</div>;

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-6" dir="rtl">
      <ShieldAlert className="text-red-500" size={64} />
      <h1 className="text-2xl font-black text-red-400">وصول مرفوض</h1>
      <p className="text-gray-400 max-w-md text-center">{error}</p>
      <button onClick={() => navigate('/dashboard')} className="bg-[#f5c842] text-black font-bold px-8 py-3 rounded-xl">العودة للوحة التحكم</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Inter']" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-[#1a1a1a] sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-red-500" size={28} />
          <h1 className="text-2xl font-black text-white">لوحة الإدارة <span className="text-red-500">(Admin)</span></h1>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm font-bold bg-[#111] border border-[#333] hover:border-[#f5c842] text-white px-6 py-2 rounded-full transition-colors"
        >
          العودة للوحة التحكم
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'users' ? 'bg-[#f5c842] text-black' : 'bg-[#111] text-gray-400 hover:bg-[#222]'}`}
          >
            <Users size={18} /> المستخدمين
          </button>
          <button 
            onClick={() => setActiveTab('designs')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'designs' ? 'bg-[#f5c842] text-black' : 'bg-[#111] text-gray-400 hover:bg-[#222]'}`}
          >
            <LayoutList size={18} /> التصاميم المنشورة
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-[#050505] text-gray-400 text-sm">
                  <tr>
                    <th className="p-4 font-semibold">الاسم</th>
                    <th className="p-4 font-semibold">البريد الإلكتروني</th>
                    <th className="p-4 font-semibold">الرصيد</th>
                    <th className="p-4 font-semibold">الإحالات</th>
                    <th className="p-4 font-semibold">تاريخ التسجيل</th>
                    <th className="p-4 font-semibold">صلاحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4 font-medium text-white">{u.name}</td>
                      <td className="p-4 text-gray-400">{u.email}</td>
                      <td className="p-4 text-[#f5c842] font-bold">{u.discountBalance} ج.م</td>
                      <td className="p-4 text-white">{u.referredUsers}</td>
                      <td className="p-4 text-gray-500 text-sm">{new Date(u.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td className="p-4">
                        {u.isAdmin ? <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-bold">Admin</span> : <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs">User</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Designs Tab */}
        {activeTab === 'designs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {designs.map(design => (
              <div key={design.id} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden group flex flex-col">
                <div className="relative aspect-square bg-[#050505] p-4 flex justify-center items-center">
                   {design.imageUrl ? <img src={design.imageUrl} alt={design.name} className="w-full h-full object-contain" /> : <span className="text-gray-600">لا صورة</span>}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-white mb-1 truncate">{design.name}</h3>
                  <p className="text-xs text-gray-400 mb-4 truncate">الناشر: {design.user.name || 'مجهول'}</p>
                  <button
                    onClick={() => handleDeleteDesign(design.id)}
                    className="mt-auto w-full py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> مسح التصميم
                  </button>
                </div>
              </div>
            ))}
            {designs.length === 0 && <p className="text-gray-500 col-span-full">لا توجد تصاميم منشورة حالياً.</p>}
          </div>
        )}
        
      </main>
    </div>
  );
}
