import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Questions from './pages/Questions';
import Exams from './pages/Exams';
import Users from './pages/Users';
import StudySpaces from './pages/StudySpaces';
import StudySpaceRoom from './pages/StudySpaceRoom';
import SelfStudyRoom from './pages/SelfStudyRoom';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/users" element={<Users />} />
            <Route path="/study-spaces" element={<StudySpaces />} />
            <Route path="/study-spaces/:id" element={<StudySpaceRoom />} />
            <Route path="/self-study/:id" element={<SelfStudyRoom />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
