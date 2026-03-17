import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Classes from './pages/Classes';
import Candidates from './pages/Candidates';
import Results from './pages/Results';
import Login from './pages/Login';

function Navigation({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Resultados', icon: LayoutDashboard },
    { path: '/classes', label: 'Turmas', icon: Users },
    { path: '/candidates', label: 'Candidatos', icon: UserPlus },
  ];

  return (
    <nav className="w-64 bg-gray-900 text-white h-screen sticky top-0 p-4 flex flex-col gap-2">
      <div className="text-xl font-bold mb-8 px-2">Admin Urna</div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
            }`}
          >
            <Icon size={20} />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto pt-4 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </nav>
  );
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return <Login onLogin={() => {}} />; // The onAuthStateChange will handle the session update
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Navigation onLogout={handleLogout} />
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Results />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/candidates" element={<Candidates />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
