import { useState } from 'react';
import type { Subject } from '../types';
import { SubjectService } from '../services/subjectService';

interface SubjectFormProps {
  subject?: Subject;
  onSave: () => void;
  onCancel: () => void;
}

export default function SubjectForm({ subject, onSave, onCancel }: SubjectFormProps) {
  const [formData, setFormData] = useState<Partial<Subject>>({
    code: subject?.code || '',
    name: subject?.name || '',
    description: subject?.description || '',
    isActive: subject?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (subject) {
        await SubjectService.update(subject.id, { ...subject, ...formData } as Subject);
      } else {
        await SubjectService.create(formData as Omit<Subject, 'id'>);
      }
      onSave();
    } catch (error) {
      console.error('Error saving subject:', error);
    }
  };

  return (
    <div className="form-card animate-scale-in">
      <h2 className="text-xl font-bold mb-5 font-[family-name:var(--font-display)] text-slate-800">
        {subject ? 'Edit Subject' : 'Add New Subject'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="form-label">Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div className="mb-4">
          <label className="form-label">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div className="mb-4">
          <label className="form-label">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field"
            rows={3}
          />
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
