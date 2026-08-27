import { useEffect, useState } from 'react';
import { SubjectService } from '../services/subjectService';
import { QuestionService } from '../services/questionService';
import { ExamService } from '../services/examService';
import { UserService } from '../services/userService';
import Card from '../components/Card';

interface Stats {
  subjects: number;
  questions: number;
  exams: number;
  users: number;
}

interface RecentUser {
  id: number;
  fullName?: string;
  email: string;
  lastLoginAt?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    subjects: 0,
    questions: 0,
    exams: 0,
    users: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [subjects, questions, exams, users, recentActive] = await Promise.all([
        SubjectService.getAll(),
        QuestionService.getAll(),
        ExamService.getAll(),
        UserService.getCount(),
        UserService.getRecentlyActive(5),
      ]);
      setStats({
        subjects: subjects.length,
        questions: questions.length,
        exams: exams.length,
        users: users,
      });
      setRecentUsers(recentActive);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Total Subjects" className="">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">{stats.subjects}</p>
            <p className="text-gray-500 mt-2">Subjects</p>
          </div>
        </Card>
        <Card title="Total Questions" className="">
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">{stats.questions}</p>
            <p className="text-gray-500 mt-2">Questions</p>
          </div>
        </Card>
        <Card title="Total Exams" className="">
          <div className="text-center">
            <p className="text-4xl font-bold text-purple-600">{stats.exams}</p>
            <p className="text-gray-500 mt-2">Exams</p>
          </div>
        </Card>
        <Card title="Total Users" className="">
          <div className="text-center">
            <p className="text-4xl font-bold text-orange-600">{stats.users}</p>
            <p className="text-gray-500 mt-2">Users</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card title="Quick Actions" className="">
          <div className="flex flex-wrap gap-3">
            <a
              href="/subjects"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Add Subject
            </a>
            <a
              href="/questions"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              + Add Question
            </a>
            <a
              href="/exams"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              + Create Exam
            </a>
            <a
              href="/users"
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              + Add User
            </a>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recently Active Users" className="">
          {recentUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{user.fullName || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="System Overview" className="">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Questions per Subject</span>
              <span className="font-semibold">
                {stats.subjects > 0
                  ? Math.round(stats.questions / stats.subjects)
                  : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Questions per Exam</span>
              <span className="font-semibold">
                {stats.exams > 0 ? Math.round(stats.questions / stats.exams) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Users</span>
              <span className="font-semibold">{stats.users}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
