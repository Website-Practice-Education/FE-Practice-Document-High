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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {exam ? 'Edit Exam' : 'Create New Exam'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            value={formData.subjectId || ''}
            onChange={(e) => setFormData({ ...formData, subjectId: Number(e.target.value) || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Questions</label>
            <input
              type="number"
              min="1"
              value={formData.totalQuestions}
              onChange={(e) => setFormData({ ...formData, totalQuestions: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
            <select
              value={formData.examType}
              onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="practice">Practice</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
