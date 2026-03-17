import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2 } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
}

export default function Classes() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('classes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      alert('Erro ao carregar turmas');
    } finally {
      setLoading(false);
    }
  }

  async function addClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      const { error } = await supabase.from('classes').insert([{ name: newClassName.trim() }]);
      if (error) throw error;
      setNewClassName('');
      fetchClasses();
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Erro ao adicionar turma');
    }
  }

  async function deleteClass(id: string) {
    if (!confirm('Tem certeza? Isso apagará todos os candidatos e votos dessa turma.')) return;
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Erro ao deletar turma');
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(classes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentClasses = classes.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Gerenciar Turmas</h1>

      <form onSubmit={addClass} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8 flex gap-4">
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="Nome da Turma (Ex: 1º Ano A)"
          className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium">
          Adicionar
        </button>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-4 font-semibold text-gray-600">ID</th>
                <th className="p-4 font-semibold text-gray-600">Nome</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">Nenhuma turma cadastrada.</td>
                </tr>
              ) : (
                currentClasses.map((cls) => (
                   <tr key={cls.id} className="border-b last:border-0 hover:bg-gray-50">
                     <td className="p-4 text-gray-500 text-sm font-mono truncate max-w-[150px]">{cls.id}</td>
                     <td className="p-4 font-medium">{cls.name}</td>
                     <td className="p-4 text-right">
                       <button onClick={() => deleteClass(cls.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                         <Trash2 size={18} />
                       </button>
                     </td>
                   </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between text-sm text-gray-600">
              <div>
                Mostrando {startIndex + 1} até {Math.min(startIndex + itemsPerPage, classes.length)} de {classes.length} resultados
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <div className="px-3 py-1 font-medium">
                  {currentPage} de {totalPages}
                </div>
                <button 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
