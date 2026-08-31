import { useState, useEffect } from 'react';
import type { Exam, Subject } from '../types';
import { ExamService } from '../services/examService';
import { SubjectService } from '../services/subjectService';

interface ExamFormProps {
  exam?: Exam;
  onSave: () => void;
  onCancel: () => void;
}

export default function ExamForm({ exam, onSave, onCancel }: ExamFormProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState<Partial<Exam>>({
    title: exam?.title || '',
    subjectId: exam?.subjectId,
    description: exam?.description || '',
    durationMinutes: exam?.durationMinutes || 60,
    totalQuestions: exam?.totalQuestions || 10,
    year: exam?.year || new Date().getFullYear(),
    examType: exam?.examType || 'practice',
    isTimed: exam?.isTimed ?? true,
    allowPause: exam?.allowPause ?? false,
    showTimer: exam?.showTimer ?? true,
    isPublic: exam?.isPublic ?? true,
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await SubjectService.getAll();
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (exam) {
        await ExamService.update(exam.id, { ...exam, ...formData } as Exam);
      } else {
        await ExamService.create(formData as Omit<Exam, 'id'>);
      }
      onSave();
    } catch (error) {
      console.error('Error saving exam:', error);
    }
  };

  return (
    <div className="form-card animate-scale-in">
      <h2 className="text-xl font-bold mb-5 font-[family-name:var(--font-display)] text-slate-800">
        {exam ? 'Edit Exam' : 'Create New Exam'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="form-label">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div className="mb-4">
          <label className="form-label">Subject</label>
          <select
            value={formData.subjectId || ''}
            onChange={(e) => setFormData({ ...formData, subjectId: Number(e.target.value) || undefined })}
            className="input-field"
          >
            <option value="">Select a subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
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
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Total Questions</label>
            <input
              type="number"
              min="1"
              value={formData.totalQuestions}
              onChange={(e) => setFormData({ ...formData, totalQuestions: Number(e.target.value) })}
              className="input-field"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label">Exam Type</label>
            <select
              value={formData.examType}
              onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
              className="input-field"
            >
              <option value="practice">Practice</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
          <div>
            <label className="form-label">Year</label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              className="input-field"
            />
          </div>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isTimed"
              checked={formData.isTimed}
              onChange={(e) => setFormData({ ...formData, isTimed: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isTimed" className="ml-2 text-sm text-gray-700">Timed Exam</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showTimer"
              checked={formData.showTimer}
              onChange={(e) => setFormData({ ...formData, showTimer: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showTimer" className="ml-2 text-sm text-gray-700">Show Timer</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowPause"
              checked={formData.allowPause}
              onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="allowPause" className="ml-2 text-sm text-gray-700">Allow Pause</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">Public Exam</label>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" className="btn-primary">Lưu</button>
          <button type="button" onClick={onCancel} className="btn-secondary">Hủy</button>
        </div>
      </form>
    </div>
  );
}
