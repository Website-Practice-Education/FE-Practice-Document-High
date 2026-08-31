import { useState, useEffect } from 'react';
import type { Question, Subject } from '../types';
import { QuestionService } from '../services/questionService';
import { SubjectService } from '../services/subjectService';

interface QuestionFormProps {
  question?: Question;
  onSave: () => void;
  onCancel: () => void;
}

export default function QuestionForm({ question, onSave, onCancel }: QuestionFormProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState<Partial<Question>>({
    subjectId: question?.subjectId || 0,
    questionType: question?.questionType || 'multiple_choice',
    content: question?.content || '',
    explanation: question?.explanation || '',
    difficulty: question?.difficulty || 1,
    year: question?.year || new Date().getFullYear(),
    source: question?.source || '',
    fileUrl: question?.fileUrl || '',
    fileType: question?.fileType || '',
    isActive: question?.isActive ?? true,
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
      if (question) {
        await QuestionService.update(question.id, { ...question, ...formData } as Question);
      } else {
        await QuestionService.create(formData as Omit<Question, 'id'>);
      }
      onSave();
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const getFileTypeFromUrl = (url: string): string => {
    if (!url) return '';
    const driveMatch = url.match(/drive\.google\.com/);
    if (driveMatch) return 'google_drive';
    if (url.includes('docs.google.com')) return 'google_docs';
    if (url.includes('dropbox.com')) return 'dropbox';
    if (url.match(/\.(pdf|PDF)$/)) return 'pdf';
    if (url.match(/\.(doc|docx|DOC|DOCX)$/)) return 'word';
    if (url.match(/\.(xls|xlsx|XLS|XLSX)$/)) return 'excel';
    if (url.match(/\.(png|jpg|jpeg|gif|PNG|JPG|JPEG|GIF)$/)) return 'image';
    return 'link';
  };

  return (
    <div className="form-card animate-scale-in">
      <h2 className="text-xl font-bold mb-5 font-[family-name:var(--font-display)] text-slate-800">
        {question ? 'Edit Question' : 'Add New Question'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="form-label">Subject</label>
          <select
            value={formData.subjectId}
            onChange={(e) => setFormData({ ...formData, subjectId: Number(e.target.value) })}
            className="input-field"
            required
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
          <label className="form-label">Question Type</label>
          <select
            value={formData.questionType}
            onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
            className="input-field"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="form-label">Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="input-field"
            rows={4}
            required
          />
        </div>
        <div className="mb-4">
          <label className="form-label">Explanation</label>
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            className="input-field"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label">Difficulty (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: Number(e.target.value) })}
              className="input-field"
            />
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
        <div className="mb-4">
          <label className="form-label">Source</label>
          <input
            type="text"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="input-field"
            placeholder="e.g., Oxford English Dictionary"
          />
        </div>
        <div className="form-section">
          <h3 className="text-sm font-bold text-indigo-700 mb-3">File / Liên kết tham khảo</h3>
          <div className="mb-4">
            <label className="form-label">Link (Drive, Dropbox, or any reference URL)</label>
            <input
              type="url"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ 
                ...formData, 
                fileUrl: e.target.value,
                fileType: getFileTypeFromUrl(e.target.value)
              })}
              className="input-field"
              placeholder="https://drive.google.com/... or https://..."
            />
          </div>
          {formData.fileUrl && (
            <div className="mt-3 p-3 bg-white rounded border border-blue-100">
              <p className="text-xs text-gray-500 mb-1">Preview:</p>
              <a
                href={formData.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline text-sm flex items-center gap-2"
              >
                <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase">
                  {formData.fileType || 'link'}
                </span>
                Xem file / tham khảo
              </a>
            </div>
          )}
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
