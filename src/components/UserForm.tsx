import { useState } from 'react';
import type { User } from '../types';
import { UserService } from '../services/userService';

interface UserFormProps {
  user?: User;
  onSave: () => void;
  onCancel: () => void;
}

export default function UserForm({ user, onSave, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<Partial<User>>({
    email: user?.email || '',
    fullName: user?.fullName || '',
    role: user?.role || 'student',
    grade: user?.grade || 1,
    isActive: user?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user) {
        await UserService.update(user.id, { ...user, ...formData } as User);
      } else {
        await UserService.create(formData as Omit<User, 'id'>);
      }
      onSave();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  return (
    <div className="form-card animate-scale-in">
      <h2 className="text-xl font-bold mb-5 font-[family-name:var(--font-display)] text-slate-800">
        {user ? 'Edit User' : 'Add New User'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="form-label">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input-field"
            required
            disabled={!!user}
          />
        </div>
        <div className="mb-4">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="input-field"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input-field"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="form-label">Grade</label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
              className="input-field"
            />
          </div>
        </div>
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Active</label>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" className="btn-primary">Lưu</button>
          <button type="button" onClick={onCancel} className="btn-secondary">Hủy</button>
        </div>
      </form>
    </div>
  );
}
