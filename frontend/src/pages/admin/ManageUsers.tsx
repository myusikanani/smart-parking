import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUserPlus,
  HiOutlinePencilSquare,
  HiOutlineStop,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import { adminApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user' | 'security';
  status: 'active' | 'suspended' | 'inactive';
  joinedDate: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const roleBadge = (role: string) => {
  const map: Record<string, { className: string; label: string }> = {
    admin: { className: 'badge-neon', label: 'Admin' },
    user: { className: 'badge-gray', label: 'User' },
    security: { className: 'badge-orange', label: 'Security' },
  };
  const r = map[role] || { className: 'badge-gray', label: role };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.className}`}>{r.label}</span>;
};

const statusBadge = (status: string) => {
  const map: Record<string, { className: string; label: string }> = {
    active: { className: 'badge-green', label: 'Active' },
    suspended: { className: 'badge-red', label: 'Suspended' },
    inactive: { className: 'badge-gray', label: 'Inactive' },
  };
  const s = map[status] || { className: 'badge-gray', label: status };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>{s.label}</span>;
};

const ManageUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = { page: String(page), limit: '10' };
    if (roleFilter !== 'all') params.role = roleFilter;
    if (searchTerm) params.search = searchTerm;
    adminApi.getUsers(params)
      .then((res) => {
        const mapped = (res.users || []).map((u: Record<string, unknown>) => ({
          id: String(u._id || u.id),
          name: String(u.name || ''),
          email: String(u.email || ''),
          phone: String(u.phone || ''),
          role: (u.role || 'user') as AdminUser['role'],
          status: (u.status || 'active') as AdminUser['status'],
          joinedDate: String(u.joinedDate || u.createdAt || ''),
        }));
        setUsers(mapped);
        setTotalCount(res.count ?? mapped.length);
      })
      .catch((err) => setError(err?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [roleFilter, searchTerm, page]);

  const handleSuspend = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    adminApi.updateUser(id, { status: newStatus } as Record<string, unknown>)
      .then(() => fetchUsers())
      .catch((err) => setError(err?.message || 'Failed to update user'));
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    adminApi.deleteUser(id)
      .then(() => fetchUsers())
      .catch((err) => setError(err?.message || 'Failed to delete user'));
  };

  const handleEditSave = () => {
    if (!editUser) return;
    setSaving(true);
    adminApi.updateUser(editUser.id, {
      name: editUser.name,
      email: editUser.email,
      phone: editUser.phone,
      role: editUser.role,
      status: editUser.status,
    } as Record<string, unknown>)
      .then(() => { setEditUser(null); fetchUsers(); })
      .catch((err) => setError(err?.message || 'Failed to save user'))
      .finally(() => setSaving(false));
  };

  const filteredUsers = useMemo(() => users, [users]);

  const totalPages = Math.max(1, Math.ceil(totalCount / 10));

  return (
    <div className="min-h-screen grid-bg" style={{ backgroundColor: 'var(--bg)' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative">
            <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                <CarSedan className="w-20 h-auto" color="#06b6d4" />
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold neon-text">Users</h1>
            <p className="text-gray-400 mt-1">View and manage all registered users</p>
          </div>
          <button className="btn-neon-pink flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm">
            <HiOutlineUserPlus className="w-4 h-4" />
            Add User
          </button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="glass p-4 rounded-xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-400">Role:</span>
              {['all', 'user', 'admin', 'security'].map((r) => (
                <button
                  key={r}
                  onClick={() => { setRoleFilter(r); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    roleFilter === r
                      ? 'btn-neon'
                      : 'text-gray-400 hover:text-white border border-white/10 hover:border-cyan-500/30 bg-white/[0.03] hover:bg-cyan-500/5'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
              <div className="ml-auto relative">
                <HiOutlineMagnifyingGlass className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  placeholder="Search users..."
                  className="input-neon pl-9 pr-3 py-1.5 w-48 text-sm"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {error}
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No users found</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-white">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{user.phone}</td>
                        <td className="px-4 py-3">{roleBadge(user.role)}</td>
                        <td className="px-4 py-3">{statusBadge(user.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{user.joinedDate}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditUser(user)}
                              className="btn-outline p-1.5 rounded-lg text-xs"
                              title="Edit"
                            >
                              <HiOutlinePencilSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSuspend(user.id, user.status)}
                              className="btn-outline p-1.5 rounded-lg text-xs"
                              title={user.status === 'suspended' ? 'Activate' : 'Suspend'}
                            >
                              <HiOutlineStop className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="btn-danger p-1.5 rounded-lg text-xs"
                              title="Delete"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-outline p-1.5 rounded-lg disabled:opacity-30"
                  >
                    <HiOutlineChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                          page === p ? 'btn-neon' : 'text-gray-400 hover:text-white border border-white/10 hover:border-cyan-500/30'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-outline p-1.5 rounded-lg disabled:opacity-30"
                  >
                    <HiOutlineChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-glow p-6 w-full max-w-md max-h-[85vh] overflow-y-auto mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Edit User</h3>
                <button onClick={() => setEditUser(null)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                  <input type="text" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                    className="input-neon w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                  <input type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    className="input-neon w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                  <input type="text" value={editUser.phone} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                    className="input-neon w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                  <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value as AdminUser['role'] })}
                    className="input-neon w-full text-sm">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="security">Security</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                  <select value={editUser.status} onChange={(e) => setEditUser({ ...editUser, status: e.target.value as AdminUser['status'] })}
                    className="input-neon w-full text-sm">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setEditUser(null)} className="btn-outline px-4 py-2 rounded-xl text-sm font-semibold">Cancel</button>
                <button onClick={handleEditSave} disabled={saving} className="btn-neon px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ManageUsers;
