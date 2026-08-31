import { useEffect, useState } from 'react';
import type { Subject } from '../types';
import { SubjectService } from '../services/subjectService';
import Breadcrumb from '../components/Breadcrumb';
import SubjectForm from '../components/SubjectForm';
import Loading from '../components/Loading';

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>();

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await SubjectService.getAll();
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa môn học này?')) {
      try {
        await SubjectService.delete(id);
        loadSubjects();
      } catch (error) {
        console.error('Error deleting subject:', error);
      }
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingSubject(undefined);
    loadSubjects();
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingSubject(undefined);
    setShowForm(true);
  };

  if (loading) return <Loading message="Đang tải môn học..." />;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Môn học' }]} />

      <div className="flex justify-between items-center mb-8 animate-fade-in-down">
        <div className="page-header !mb-0">
          <h1 className="page-title">Quản lý Môn học</h1>
          <p className="page-subtitle">Thêm, sửa và quản lý các môn học</p>
        </div>
        <button onClick={handleAdd} className="btn-primary">
          + Thêm môn học
        </button>
      </div>

      {showForm ? (
        <div className="mb-6 animate-scale-in">
          <SubjectForm
            subject={editingSubject}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingSubject(undefined);
            }}
          />
        </div>
      ) : (
        <div className="data-table-wrapper animate-fade-in-up">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    <span className="text-4xl block mb-2">📚</span>
                    Chưa có môn học nào
                  </td>
                </tr>
              ) : (
                subjects.map((subject, index) => (
                  <tr
                    key={subject.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards', opacity: 0 }}
                  >
                    <td className="font-semibold text-slate-800">{subject.code}</td>
                    <td>{subject.name}</td>
                    <td>{subject.description || '-'}</td>
                    <td>
                      <span className={`badge ${subject.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {subject.isActive ? 'Hoạt động' : 'Ngừng'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button onClick={() => handleEdit(subject)} className="btn-ghost text-indigo-600">
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(subject.id)} className="btn-danger">
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
