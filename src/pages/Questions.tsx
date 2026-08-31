import { useEffect, useState } from 'react';
import type { Question, Subject } from '../types';
import { QuestionService } from '../services/questionService';
import { SubjectService } from '../services/subjectService';
import Breadcrumb from '../components/Breadcrumb';
import QuestionForm from '../components/QuestionForm';
import Loading from '../components/Loading';

const difficultyMap: Record<number, { label: string; className: string }> = {
  1: { label: 'Dễ', className: 'badge-success' },
  2: { label: 'Trung bình', className: 'badge-info' },
  3: { label: 'Khó', className: 'bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold' },
  4: { label: 'Rất khó', className: 'badge-danger' },
  5: { label: 'Chuyên gia', className: 'bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-semibold' },
};

export default function Questions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>();
  const [filterSubject, setFilterSubject] = useState<number | ''>('');
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [questionsData, subjectsData] = await Promise.all([
        QuestionService.getAll(),
        SubjectService.getAll(),
      ]);
      setQuestions(questionsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      try {
        await QuestionService.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingQuestion(undefined);
    loadData();
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingQuestion(undefined);
    setShowForm(true);
  };

  const filteredQuestions = filterSubject
    ? questions.filter((q) => q.subjectId === filterSubject)
    : questions;

  const getDifficulty = (difficulty?: number) => {
    if (!difficulty) return { label: '-', className: 'badge' };
    return difficultyMap[difficulty] || { label: String(difficulty), className: 'badge' };
  };

  const getFileTypeLabel = (fileType?: string) => {
    switch (fileType) {
      case 'google_drive': return 'Drive';
      case 'google_docs': return 'Docs';
      case 'dropbox': return 'Dropbox';
      case 'pdf': return 'PDF';
      case 'word': return 'Word';
      case 'excel': return 'Excel';
      case 'image': return 'IMG';
      default: return 'Link';
    }
  };

  if (loading) return <Loading message="Đang tải câu hỏi..." />;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Câu hỏi' }]} />

      <div className="flex justify-between items-center mb-8 animate-fade-in-down">
        <div className="page-header !mb-0">
          <h1 className="page-title">Quản lý Câu hỏi</h1>
          <p className="page-subtitle">Tạo và quản lý ngân hàng câu hỏi</p>
        </div>
        <button onClick={handleAdd} className="btn-primary">+ Thêm câu hỏi</button>
      </div>

      <div className="filter-bar">
        <div className="flex-1 min-w-[200px]">
          <label className="form-label">Lọc theo môn học</label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value ? Number(e.target.value) : '')}
            className="input-field"
          >
            <option value="">Tất cả môn học</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-slate-500 self-end pb-2.5">
          {filteredQuestions.length} câu hỏi
        </div>
      </div>

      {showForm ? (
        <div className="mb-6">
          <QuestionForm
            question={editingQuestion}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingQuestion(undefined); }}
          />
        </div>
      ) : (
        <div className="data-table-wrapper animate-fade-in-up">
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Môn học</th>
                  <th>Loại</th>
                  <th>Nội dung</th>
                  <th>File</th>
                  <th>Độ khó</th>
                  <th>Năm</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <div className="empty-symbol">Q</div>
                      Chưa có câu hỏi nào
                    </td>
                  </tr>
                ) : (
                  filteredQuestions.map((question, index) => {
                    const diff = getDifficulty(question.difficulty);
                    return (
                      <tr
                        key={question.id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'forwards', opacity: 0 }}
                      >
                        <td className="font-semibold text-slate-800">#{question.id}</td>
                        <td>{subjects.find((s) => s.id === question.subjectId)?.name || '-'}</td>
                        <td><span className="badge badge-info">{question.questionType}</span></td>
                        <td className="max-w-xs truncate">{question.content}</td>
                        <td>
                          {question.fileUrl ? (
                            <button
                              onClick={() => setPreviewQuestion(question)}
                              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium transition-colors"
                            >
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {getFileTypeLabel(question.fileType)}
                              </span>
                              Xem
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td>
                          <span className={diff.className}>{diff.label}</span>
                        </td>
                        <td>{question.year || '-'}</td>
                        <td className="text-right">
                          <button onClick={() => handleEdit(question)} className="btn-ghost text-indigo-600">Sửa</button>
                          <button onClick={() => handleDelete(question.id)} className="btn-danger">Xóa</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewQuestion && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="modal-content rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">Xem trước câu hỏi</h2>
                <p className="text-sm text-slate-500">
                  {subjects.find((s) => s.id === previewQuestion.subjectId)?.name} — {previewQuestion.questionType}
                </p>
              </div>
              <button onClick={() => setPreviewQuestion(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 text-xl transition-colors">×</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <h3 className="form-label">Nội dung câu hỏi</h3>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{previewQuestion.content}</p>
              </div>
              {previewQuestion.explanation && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <h3 className="form-label text-emerald-700">Giải thích</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{previewQuestion.explanation}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="form-label">Độ khó</span>
                  <span className={`ml-2 ${getDifficulty(previewQuestion.difficulty).className}`}>
                    {getDifficulty(previewQuestion.difficulty).label}
                  </span>
                </div>
                <div>
                  <span className="form-label">Năm</span>
                  <span className="ml-2 text-slate-800">{previewQuestion.year || '-'}</span>
                </div>
                <div>
                  <span className="form-label">Nguồn</span>
                  <span className="ml-2 text-slate-800">{previewQuestion.source || '-'}</span>
                </div>
              </div>
              {previewQuestion.fileUrl && (
                <div className="form-section">
                  <h3 className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-2">
                    <span>{getFileTypeLabel(previewQuestion.fileType)}</span>
                    File đính kèm
                  </h3>
                  <p className="text-sm text-indigo-600 break-all mb-4">{previewQuestion.fileUrl}</p>
                  <div className="flex gap-3">
                    <a href={previewQuestion.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 text-center">
                      Mở file
                    </a>
                    {previewQuestion.fileType === 'google_drive' && (
                      <a
                        href={`https://drive.google.com/file/d/${previewQuestion.fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]}/preview`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex-1 text-center"
                      >
                        Xem trên Drive
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setPreviewQuestion(null)} className="btn-secondary">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
