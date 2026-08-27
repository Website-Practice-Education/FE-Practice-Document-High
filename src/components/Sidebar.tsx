import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/subjects', label: 'Subjects', icon: '📚' },
    { path: '/questions', label: 'Questions', icon: '❓' },
    { path: '/exams', label: 'Exams', icon: '📝' },
    { path: '/users', label: 'Users', icon: '👥' },
    { path: '/study-spaces', label: 'Study Spaces', icon: '💬' },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="px-6 py-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Website Docs</h1>
        <p className="text-sm text-gray-400">Admin Panel</p>
      </div>
      <nav className="mt-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-700 text-white border-l-4 border-blue-500'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
