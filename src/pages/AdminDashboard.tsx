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

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>جاري التحميل...</div>;

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} dir="rtl">
      <ShieldAlert className="text-red-500" size={64} />
      <h1 className="text-2xl font-black text-red-400">وصول مرفوض</h1>
      <p className="max-w-md text-center" style={{ color: 'var(--text-muted)' }}>{error}</p>
      <button onClick={() => navigate('/dashboard')} className="font-bold px-8 py-3 rounded-xl transition-all" style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}>العودة للوحة التحكم</button>
    </div>
  );

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('هل أنت متأكد من مسح هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.')) return;

    try {
      const token = localStorage.getItem('wearurway_token');
      const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert('فشل مسح المستخدم');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ');
    }
  };

  return (
    <div className="min-h-screen font-['Inter']" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-12 py-6 border-b sticky top-0 backdrop-blur-md z-50" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-red-500" size={28} />
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>لوحة الإدارة <span className="text-red-500">(Admin)</span></h1>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm font-bold px-6 py-2 rounded-full transition-colors"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          العودة للوحة التحكم
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('users')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors"
            style={{ backgroundColor: activeTab === 'users' ? 'var(--accent-primary)' : 'var(--bg-card)', color: activeTab === 'users' ? '#000' : 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          >
            <Users size={18} /> المستخدمين
          </button>
          <button 
            onClick={() => setActiveTab('designs')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors"
            style={{ backgroundColor: activeTab === 'designs' ? 'var(--accent-primary)' : 'var(--bg-card)', color: activeTab === 'designs' ? '#000' : 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          >
            <LayoutList size={18} /> التصاميم المنشورة
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: 14 }}>
                  <tr>
                    <th className="p-4 font-semibold">الاسم</th>
                    <th className="p-4 font-semibold">البريد الإلكتروني</th>
                    <th className="p-4 font-semibold">الرصيد</th>
                    <th className="p-4 font-semibold">الإحالات</th>
                    <th className="p-4 font-semibold">تاريخ التسجيل</th>
                    <th className="p-4 font-semibold">صلاحية</th>
                    <th className="p-4 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="p-4 font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</td>
                      <td className="p-4" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td className="p-4 font-bold" style={{ color: 'var(--accent-primary)' }}>{u.discountBalance} ج.م</td>
                      <td className="p-4" style={{ color: 'var(--text-primary)' }}>{u.referredUsers}</td>
                      <td className="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td className="p-4">
                        {u.isAdmin ? <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-bold">Admin</span> : <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>User</span>}
                      </td>
                      <td className="p-4">
                        {!u.isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 bg-red-600/10 text-red-500 rounded hover:bg-red-600/20 transition-colors"
                            title="حظر / مسح المستخدم"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
              <div key={design.id} className="rounded-xl overflow-hidden group flex flex-col" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="relative aspect-square p-4 flex justify-center items-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                   {design.imageUrl ? <img src={design.imageUrl} alt={design.name} className="w-full h-full object-contain" /> : <span style={{ color: 'var(--text-muted)' }}>لا صورة</span>}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{design.name}</h3>
                  <p className="text-xs mb-4 truncate" style={{ color: 'var(--text-muted)' }}>الناشر: {design.user.name || 'مجهول'}</p>
                  <button
                    onClick={() => handleDeleteDesign(design.id)}
                    className="mt-auto w-full py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> مسح التصميم
                  </button>
                </div>
              </div>
            ))}
            {designs.length === 0 && <p className="col-span-full" style={{ color: 'var(--text-muted)' }}>لا توجد تصاميم منشورة حالياً.</p>}
          </div>
        )}
        
      </main>
    </div>
  );
}
