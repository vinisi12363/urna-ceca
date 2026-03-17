import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Urna from './components/Urna';

function App() {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      const { data, error } = await supabase.from('classes').select('id, name').order('name');
      if (!error && data) {
        setClasses(data);
      }
      setLoading(false);
    }
    loadClasses();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Carregando...</div>;
  }

  if (!selectedClass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Inicializar Urna</h1>
          <p className="text-gray-600 mb-4 text-center">Selecione a turma desta Urna para começar a votação.</p>
          <select
            className="w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">-- Selecione a Turma --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return <Urna classId={selectedClass} onReset={() => setSelectedClass('')} />;
}

export default App;
