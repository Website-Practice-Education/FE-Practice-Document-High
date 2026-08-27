import { useEffect, useState } from 'react';
import type { Exam, Subject } from '../types';
import { ExamService } from '../services/examService';
import { SubjectService } from '../services/subjectService';
import Breadcrumb from '../components/Breadcrumb';
import ExamForm from '../components/ExamForm';
import Loading from '../components/Loading';

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
    if (window.confirm('Are you sure you want to delete this exam?')) {
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

  const getExamTypeColor = (type?: string) => {
    switch (type) {
      case 'final':
        return 'bg-red-100 text-red-800';
      case 'midterm':
        return 'bg-yellow-100 text-yellow-800';
      case 'quiz':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Exams' }]} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exams Management</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Exam
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="practice">Practice</option>
            <option value="quiz">Quiz</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
          </select>
          <button
            onClick={() => {
              setFilterSubject('');
              setFilterType('');
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Clear
          </button>
        </div>
      </div>

      {showForm ? (
        <div className="mb-6">
          <ExamForm
            exam={editingExam}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingExam(undefined);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No exams found. Create your first exam to get started.
            </div>
          ) : (
            filteredExams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{exam.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getExamTypeColor(exam.examType)}`}
                    >
                      {exam.examType || 'practice'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    {exam.description || 'No description'}
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="mr-2">📚</span>
                      {subjects.find((s) => s.id === exam.subjectId)?.name || 'No subject'}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">⏱️</span>
                      {exam.durationMinutes || 60} minutes
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">❓</span>
                      {exam.totalQuestions || 0} questions
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">📅</span>
                      {exam.year || new Date().getFullYear()}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        exam.isTimed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {exam.isTimed ? '⏱️ Timed' : '⏸️ Untimed'}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        exam.isPublic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {exam.isPublic ? '🌐 Public' : '🔒 Private'}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(exam)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
