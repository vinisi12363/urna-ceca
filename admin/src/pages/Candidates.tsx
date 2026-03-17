import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Edit2, Upload } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface CandidateItem {
  id: string;
  name: string;
  number: string;
  role: string;
  class_id?: string;
  photo_url?: string;
  classes: {
    name: string;
  };
}

interface ClassItem {
  id: string;
  name: string;
}

export default function Candidates() {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    name: '',
    number: '',
    role: 'CLASS_LEADER',
    class_id: '',
    photo_url: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [candidatesData, classesData] = await Promise.all([
        supabase
          .from('candidates')
          .select(`
            *,
            classes (name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('classes').select('id, name').order('name'),
      ]);

      if (candidatesData.error) throw candidatesData.error;
      if (classesData.error) throw classesData.error;

      setCandidates(candidatesData.data || []);
      setClasses(classesData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  async function saveCandidate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.number || !formData.class_id) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('candidates').update({
          name: formData.name,
          number: formData.number,
          role: formData.role,
          class_id: formData.class_id,
          photo_url: formData.photo_url || null,
        }).eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase.from('candidates').insert([{
          name: formData.name,
          number: formData.number,
          role: formData.role,
          class_id: formData.class_id,
          photo_url: formData.photo_url || null,
        }]);

        if (error) throw error;
      }
      
      setFormData({ name: '', number: '', role: 'CLASS_LEADER', class_id: '', photo_url: '' });
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData();
    } catch (error: any) {
      console.error('Error saving candidate:', error);
      if (error.code === '23505') {
        alert('Já existe um candidato nesta turma com este número e cargo!');
      } else {
        alert('Erro ao salvar candidato');
      }
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(candidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCandidates = candidates.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  function handleEditCandidate(cand: CandidateItem) {
    setEditingId(cand.id);
    setFormData({
      name: cand.name,
      number: cand.number,
      role: cand.role,
      class_id: cand.class_id || '',
      photo_url: cand.photo_url || '',
    });
    setPreviewUrl(cand.photo_url || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setFormData({ name: '', number: '', role: 'CLASS_LEADER', class_id: '', photo_url: '' });
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return; // Don't throw error if user just cancels the dialog
      }

      setUploading(true);
      const file = e.target.files[0];
      
      // Update local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Compress options
      const options = {
        maxSizeMB: 1, // Max 1MB
        maxWidthOrHeight: 800, // Reasonable size for Urna display
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const fileExt = file.name.split('.').pop();
      // Ensure unique filename to prevent cache issues
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Public_images')
        .upload(filePath, compressedFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('Public_images').getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, photo_url: data.publicUrl }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Erro ao fazer upload da imagem. Certifique-se de que o bucket "Public_images" existe e tem políticas RLS configuradas.');
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  }

  async function deleteCandidate(id: string) {
    if (!confirm('Tem certeza? Isso apagará este candidato e os votos dele.')) return;
    try {
      const { error } = await supabase.from('candidates').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      alert('Erro ao deletar candidato');
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Gerenciar Candidatos</h1>

      <form onSubmit={saveCandidate} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
          <input
            type="number"
            required
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
          <select
            required
            value={formData.class_id}
            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Selecione uma turma</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
          <select
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="CLASS_LEADER">Líder de Classe</option>
            <option value="FIELD_LEADER">Líder de Campo</option>
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Candidato</label>
          <div className="flex items-center gap-4">
            {previewUrl ? (
               <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-lg object-cover border-2 border-blue-200 shadow-sm" />
            ) : (
               <div className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                 Sem foto
               </div>
            )}
            <div className="flex-1">
              <input
                type="url"
                value={formData.photo_url}
                onChange={(e) => {
                  setFormData({ ...formData, photo_url: e.target.value });
                  setPreviewUrl(e.target.value);
                }}
                placeholder="URL da foto ou faça upload"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none mb-2 text-sm text-gray-500 bg-gray-50 bg-opacity-50"
                readOnly
              />
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadImage}
                  disabled={uploading}
                  ref={fileInputRef}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button
                  type="button"
                  disabled={uploading}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-700 p-2 rounded flex items-center justify-center gap-2 hover:bg-gray-200 font-medium transition-colors"
                >
                  <Upload size={18} />
                  {uploading ? 'Comprimindo e enviando...' : 'Selecionar e Enviar Imagem'}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 flex justify-end gap-2">
          {editingId && (
             <button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-8 py-2 rounded hover:bg-gray-600 font-medium">
               Cancelar
             </button>
          )}
          <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 font-medium">
            {editingId ? 'Salvar Alterações' : 'Cadastrar Candidato'}
          </button>
        </div>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-4 font-semibold text-gray-600">Turma</th>
                <th className="p-4 font-semibold text-gray-600">Cargo</th>
                <th className="p-4 font-semibold text-gray-600">Número</th>
                <th className="p-4 font-semibold text-gray-600">Nome</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">Nenhum candidato cadastrado.</td>
                </tr>
              ) : (
                currentCandidates.map((cand) => (
                   <tr key={cand.id} className="border-b last:border-0 hover:bg-gray-50">
                     <td className="p-4 text-gray-600">{cand.classes?.name}</td>
                     <td className="p-4 font-medium text-sm">
                       {cand.role === 'CLASS_LEADER' ? <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">Líder de Classe</span> : <span className="text-green-600 bg-green-50 px-2 py-1 rounded">Líder de Campo</span>}
                     </td>
                     <td className="p-4 font-mono font-bold text-lg">{cand.number}</td>
                     <td className="p-4 font-medium flex items-center gap-3">
                        {cand.photo_url ? (
                          <img src={cand.photo_url} alt={cand.name} className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">Sem</div>
                        )}
                        {cand.name}
                     </td>
                     <td className="p-4 text-right flex justify-end gap-2">
                       <button onClick={() => handleEditCandidate(cand)} className="text-blue-500 hover:bg-blue-50 p-2 rounded" title="Editar">
                         <Edit2 size={18} />
                       </button>
                       <button onClick={() => deleteCandidate(cand.id)} className="text-red-500 hover:bg-red-50 p-2 rounded" title="Excluir">
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
                Mostrando {startIndex + 1} até {Math.min(startIndex + itemsPerPage, candidates.length)} de {candidates.length} resultados
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
