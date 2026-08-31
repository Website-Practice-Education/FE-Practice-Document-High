import { useEffect, useState } from 'react';
import type { User } from '../types';
import { UserService } from '../services/userService';
import Breadcrumb from '../components/Breadcrumb';
import UserForm from '../components/UserForm';
import Loading from '../components/Loading';

const roleConfig: Record<string, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-semibold' },
  teacher: { label: 'Giáo viên', className: 'badge-info' },
  student: { label: 'Học sinh', className: 'badge-success' },
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [roleChangeModal, setRoleChangeModal] = useState<{ user: User; selectedRole: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const ROLES = [
    { value: 'admin', label: 'Admin' },
    { value: 'teacher', label: 'Giáo viên' },
    { value: 'student', label: 'Học sinh' },
  ];

  const loadUsers = async () => {
    try {
      const data = await UserService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const data = await UserService.search(searchKeyword || undefined, filterRole || undefined);
      setUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      try {
        await UserService.delete(id);
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingUser(undefined);
    loadUsers();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingUser(undefined);
    setShowForm(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await UserService.updateStatus(user.id, !user.isActive);
      loadUsers();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleToggleRole = (user: User) => {
    setRoleChangeModal({ user, selectedRole: user.role || 'student' });
  };

  const handleRoleChange = async () => {
    if (!roleChangeModal) return;
    try {
      await UserService.updateRole(roleChangeModal.user.id, roleChangeModal.selectedRole);
      setRoleChangeModal(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedUsers(e.target.checked ? users.map((u) => u.id) : []);
  };

  const handleSelectUser = (id: number) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedUsers.length} người dùng?`)) {
      try {
        await UserService.deleteMultiple(selectedUsers);
        setSelectedUsers([]);
        loadUsers();
      } catch (error) {
        console.error('Error deleting users:', error);
      }
    }
  };

  const getRole = (role?: string) => roleConfig[role || 'student'] || roleConfig.student;

  if (loading && users.length === 0) return <Loading message="Đang tải người dùng..." />;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Người dùng' }]} />

      <div className="flex justify-between items-center mb-8 animate-fade-in-down">
        <div className="page-header !mb-0">
          <h1 className="page-title">Quản lý Người dùng</h1>
          <p className="page-subtitle">Quản lý tài khoản học sinh, giáo viên và admin</p>
        </div>
        <button onClick={handleAdd} className="btn-primary">+ Thêm người dùng</button>
      </div>

      <div className="filter-bar">
        <div className="flex-1 min-w-[200px]">
          <label className="form-label">Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tên hoặc email..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="input-field"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="form-label">Vai trò</label>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="input-field">
            <option value="">Tất cả</option>
            <option value="admin">Admin</option>
            <option value="teacher">Giáo viên</option>
            <option value="student">Học sinh</option>
          </select>
        </div>
        <button onClick={handleSearch} className="btn-primary self-end">Tìm</button>
        <button onClick={() => { setSearchKeyword(''); setFilterRole(''); loadUsers(); }} className="btn-secondary self-end">
          Xóa bộ lọc
        </button>
      </div>

      {selectedUsers.length > 0 && (
        <div className="batch-bar">
          <span className="font-semibold text-amber-800">Đã chọn {selectedUsers.length} người dùng</span>
          <button onClick={handleDeleteSelected} className="btn-danger bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors">
            Xóa đã chọn
          </button>
        </div>
      )}

      {showForm ? (
        <div className="mb-6">
          <UserForm user={editingUser} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingUser(undefined); }} />
        </div>
      ) : (
        <div className="data-table-wrapper animate-fade-in-up">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedUsers.length === users.length && users.length > 0}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                </th>
                <th>ID</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Đăng nhập cuối</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <div className="empty-symbol">U</div>
                    Không tìm thấy người dùng
                  </td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const role = getRole(user.role);
                  const isSelected = selectedUsers.includes(user.id);
                  return (
                    <tr
                      key={user.id}
                      className={`animate-fade-in-up ${isSelected ? '!bg-indigo-50/60' : ''}`}
                      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'forwards', opacity: 0 }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectUser(user.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                        />
                      </td>
                      <td className="font-semibold text-slate-800">#{user.id}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar !w-8 !h-8 !text-xs">
                            {(user.fullName || user.email).charAt(0).toUpperCase()}
                          </div>
                          {user.fullName || '-'}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td><span className={role.className}>{role.label}</span></td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`badge cursor-pointer transition-all hover:scale-105 ${user.isActive ? 'badge-success' : 'badge-danger'}`}
                        >
                          {user.isActive ? 'Hoạt động' : 'Ngừng'}
                        </button>
                      </td>
                      <td>
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN') : 'Chưa đăng nhập'}
                      </td>
                      <td className="text-right">
                        <button onClick={() => handleEdit(user)} className="btn-ghost text-indigo-600">Sửa</button>
                        <button onClick={() => handleToggleRole(user)} className="btn-ghost text-purple-600">Đổi vai trò</button>
                        <button onClick={() => handleDelete(user.id)} className="btn-danger">Xóa</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      {roleChangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-xl font-bold mb-4 text-slate-800">Đổi vai trò người dùng</h3>
            <p className="text-slate-600 mb-4">
              Chọn vai trò mới cho <strong>{roleChangeModal.user.fullName || roleChangeModal.user.email}</strong>:
            </p>
            <div className="mb-6">
              <label className="form-label">Vai trò</label>
              <select
                value={roleChangeModal.selectedRole}
                onChange={(e) => setRoleChangeModal({ ...roleChangeModal, selectedRole: e.target.value })}
                className="input-field"
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRoleChangeModal(null)}
                className="btn-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleRoleChange}
                className="btn-primary"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
