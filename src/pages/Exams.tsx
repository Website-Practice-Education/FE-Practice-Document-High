import { useEffect, useState } from 'react';
import type { Exam, Subject } from '../types';
import { ExamService } from '../services/examService';
import { SubjectService } from '../services/subjectService';
import Breadcrumb from '../components/Breadcrumb';
import ExamForm from '../components/ExamForm';
import Loading from '../components/Loading';

const examTypeConfig: Record<string, { label: string; className: string; symbol: string }> = {
  final: { label: 'Cuối kỳ', className: 'badge-danger', symbol: 'F' },
  midterm: { label: 'Giữa kỳ', className: 'bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold', symbol: 'M' },
  quiz: { label: 'Kiểm tra', className: 'badge-info', symbol: 'Q' },
  practice: { label: 'Luyện tập', className: 'badge-success', symbol: 'P' },
};

export default function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | undefined>();
  const [filterSubject, setFilterSubject] = useState<number | ''>('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [examsData, subjectsData] = await Promise.all([
        ExamService.getAll(),
        SubjectService.getAll(),
      ]);
      setExams(examsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa đề thi này?')) {
      try {
        await ExamService.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingExam(undefined);
    loadData();
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingExam(undefined);
    setShowForm(true);
  };

  const filteredExams = exams.filter((exam) => {
    if (filterSubject && exam.subjectId !== filterSubject) return false;
    if (filterType && exam.examType !== filterType) return false;
    return true;
  });

  const getExamType = (type?: string) => {
    return examTypeConfig[type || 'practice'] || examTypeConfig.practice;
  };

  if (loading) return <Loading message="Đang tải đề thi..." />;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Đề thi' }]} />

      <div className="flex justify-between items-center mb-8 animate-fade-in-down">
        <div className="page-header !mb-0">
          <h1 className="page-title">Quản lý Đề thi</h1>
          <p className="page-subtitle">Tạo và quản lý các đề thi, bài kiểm tra</p>
        </div>
        <button onClick={handleAdd} className="btn-primary">+ Tạo đề thi</button>
      </div>

      <div className="filter-bar">
        <div className="min-w-[180px]">
          <label className="form-label">Môn học</label>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value ? Number(e.target.value) : '')} className="input-field">
            <option value="">Tất cả</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="form-label">Loại đề</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field">
            <option value="">Tất cả</option>
            <option value="practice">Luyện tập</option>
            <option value="quiz">Kiểm tra</option>
            <option value="midterm">Giữa kỳ</option>
            <option value="final">Cuối kỳ</option>
          </select>
        </div>
        <button onClick={() => { setFilterSubject(''); setFilterType(''); }} className="btn-secondary self-end">
          Xóa bộ lọc
        </button>
      </div>

      {showForm ? (
        <div className="mb-6">
          <ExamForm exam={editingExam} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingExam(undefined); }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.length === 0 ? (
            <div className="col-span-full glass-card rounded-2xl p-12 text-center animate-scale-in">
              <div className="empty-symbol">E</div>
              <p className="text-lg font-semibold text-slate-700 mb-2">Chưa có đề thi nào</p>
              <p className="text-slate-500">Tạo đề thi đầu tiên để bắt đầu</p>
            </div>
          ) : (
            filteredExams.map((exam, index) => {
              const typeInfo = getExamType(exam.examType);
              return (
                <div
                  key={exam.id}
                  className={`exam-card animate-fade-in-up stagger-${(index % 6) + 1}`}
                  style={{ animationFillMode: 'forwards', opacity: 0 }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-slate-800 font-[family-name:var(--font-display)] leading-tight">
                        {exam.title}
                      </h3>
                      <span className={typeInfo.className}>
                        <span className="font-bold mr-1">{typeInfo.symbol}</span>
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm mb-5 line-clamp-2">
                      {exam.description || 'Chưa có mô tả'}
                    </p>
                    <div className="space-y-2.5 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Môn học</span>
                        <span className="font-medium">{subjects.find((s) => s.id === exam.subjectId)?.name || 'Chưa chọn'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Thời gian</span>
                        <span className="font-medium">{exam.durationMinutes || 60} phút</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Câu hỏi</span>
                        <span className="font-medium">{exam.totalQuestions || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Năm</span>
                        <span className="font-medium">{exam.year || new Date().getFullYear()}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      <span className={`badge ${exam.isTimed ? 'badge-success' : ''}`}>
                        {exam.isTimed ? 'Có giới hạn' : 'Không giới hạn'}
                      </span>
                      <span className={`badge ${exam.isPublic ? 'badge-info' : ''}`}>
                        {exam.isPublic ? 'Công khai' : 'Riêng tư'}
                      </span>
                    </div>
                  </div>
                  <div className="px-6 py-3 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
                    <button onClick={() => handleEdit(exam)} className="btn-primary !px-3 !py-1.5 !text-xs">Sửa</button>
                    <button onClick={() => handleDelete(exam.id)} className="btn-danger !px-3 !py-1.5 !text-xs bg-red-50 rounded-lg">Xóa</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
