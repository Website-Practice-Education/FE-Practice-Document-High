import { useEffect, useState } from 'react';
import type { Question, Subject } from '../types';
import { QuestionService } from '../services/questionService';
import { SubjectService } from '../services/subjectService';
import Breadcrumb from '../components/Breadcrumb';
import QuestionForm from '../components/QuestionForm';
import Loading from '../components/Loading';

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
    if (window.confirm('Are you sure you want to delete this question?')) {
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

  const getDifficultyLabel = (difficulty?: number) => {
    if (!difficulty) return '-';
    const labels = ['', 'Easy', 'Medium', 'Hard', 'Very Hard', 'Expert'];
    return labels[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return 'gray';
    const colors = ['', 'green', 'yellow', 'orange', 'red', 'purple'];
    return colors[difficulty] || 'gray';
  };

  const getFileTypeIcon = (fileType?: string) => {
    switch (fileType) {
      case 'google_drive': return '📁';
      case 'google_docs': return '📄';
      case 'dropbox': return '📦';
      case 'pdf': return '📕';
      case 'word': return '📘';
      case 'excel': return '📗';
      case 'image': return '🖼️';
      default: return '🔗';
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Questions' }]} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Questions Management</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Question
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Subject
        </label>
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
      </div>

      {showForm ? (
        <div className="mb-6">
          <QuestionForm
            question={editingQuestion}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingQuestion(undefined);
            }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No questions found
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((question) => (
                  <tr key={question.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {question.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subjects.find((s) => s.id === question.subjectId)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {question.questionType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {question.content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {question.fileUrl ? (
                        <button
                          onClick={() => setPreviewQuestion(question)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          title="View file / reference"
                        >
                          <span>{getFileTypeIcon(question.fileType)}</span>
                          <span className="underline">View</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getDifficultyColor(question.difficulty)}-100 text-${getDifficultyColor(question.difficulty)}-800`}
                      >
                        {getDifficultyLabel(question.difficulty)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {question.year || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(question)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-semibold">Question Preview</h2>
                <p className="text-sm text-gray-500">
                  {subjects.find((s) => s.id === previewQuestion.subjectId)?.name} - {previewQuestion.questionType}
                </p>
              </div>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Question Content:</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{previewQuestion.content}</p>
              </div>

              {previewQuestion.explanation && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Explanation:</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{previewQuestion.explanation}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="text-sm font-semibold text-gray-600">Difficulty:</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full bg-${getDifficultyColor(previewQuestion.difficulty)}-100 text-${getDifficultyColor(previewQuestion.difficulty)}-800`}>
                    {getDifficultyLabel(previewQuestion.difficulty)}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Year:</span>
                  <span className="ml-2 text-gray-800">{previewQuestion.year || '-'}</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Source:</span>
                  <span className="ml-2 text-gray-800">{previewQuestion.source || '-'}</span>
                </div>
              </div>

              {previewQuestion.fileUrl && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <span>{getFileTypeIcon(previewQuestion.fileType)}</span>
                    Attached File / Reference
                  </h3>
                  <div className="bg-white rounded p-3 mb-3">
                    <p className="text-sm text-gray-600 mb-2">Link:</p>
                    <p className="text-sm text-blue-600 break-all">{previewQuestion.fileUrl}</p>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={previewQuestion.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
                    >
                      Open File / Reference
                    </a>
                    {previewQuestion.fileType === 'google_drive' && (
                      <a
                        href={`https://drive.google.com/file/d/${previewQuestion.fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]}/preview`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center"
                      >
                        Preview in Drive
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
