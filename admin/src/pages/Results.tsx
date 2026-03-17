import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ClassItem {
  id: string;
  name: string;
}

export default function Results() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchResults(selectedClass);
    } else {
      setResults([]);
    }
  }, [selectedClass]);

  // Subscribe to real-time vote updates
  useEffect(() => {
    if (!selectedClass) return;

    const channel = supabase.channel(`public:votes:class_id=eq.${selectedClass}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `class_id=eq.${selectedClass}` }, () => {
         fetchResults(selectedClass);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClass]);

  async function fetchClasses() {
    try {
      const { data, error } = await supabase.from('classes').select('id, name').order('name');
      if (error) throw error;
      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }

  async function fetchResults(classId: string) {
    setLoading(true);
    try {
      // Fetch all votes for the class
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('class_id', classId);

      if (votesError) throw votesError;

      // Fetch all candidates for the class
      const { data: candidates, error: candsError } = await supabase
        .from('candidates')
        .select('*')
        .eq('class_id', classId);

      if (candsError) throw candsError;

      // Aggregate results
      const aggregation: any = {
        CLASS_LEADER: { title: 'Líder de Classe', total: 0, candidates: {}, null: 0, blank: 0 },
        FIELD_LEADER: { title: 'Líder de Campo', total: 0, candidates: {}, null: 0, blank: 0 }
      };

      // Initialize candidate scores
      candidates?.forEach((cand: any) => {
        if (!aggregation[cand.role].candidates[cand.id]) {
          aggregation[cand.role].candidates[cand.id] = { ...cand, voteCount: 0 };
        }
      });

      // Count votes
      votes?.forEach((vote: any) => {
        aggregation[vote.role].total++;
        if (vote.vote_type === 'NULL') {
          aggregation[vote.role].null++;
        } else if (vote.vote_type === 'BLANK') {
          aggregation[vote.role].blank++;
        } else if (vote.candidate_id && aggregation[vote.role].candidates[vote.candidate_id]) {
          aggregation[vote.role].candidates[vote.candidate_id].voteCount++;
        }
      });

      // Format for rendering
      const formattedResults = Object.values(aggregation).map((roleData: any) => {
        // Sort candidates by vote count descending
        const candsArray = Object.values(roleData.candidates).sort((a: any, b: any) => b.voteCount - a.voteCount);
        return {
          ...roleData,
          candidates: candsArray
        };
      });

      setResults(formattedResults);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Resultados Ao Vivo 📊</h1>
        
        <select
          className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Selecione a Turma</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!selectedClass ? (
        <div className="text-center text-gray-500 mt-20">Selecione uma turma para ver os resultados.</div>
      ) : loading && results.length === 0 ? (
        <p>Carregando resultados...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {results.map((roleResult, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-800">{roleResult.title}</h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                  Total Votos: {roleResult.total}
                </span>
              </div>

              <div className="space-y-4">
                {roleResult.candidates.map((cand: any) => {
                  const percentage = roleResult.total > 0 ? ((cand.voteCount / roleResult.total) * 100).toFixed(1) : 0;
                  return (
                    <div key={cand.id} className="relative">
                      <div className="flex justify-between items-end mb-1">
                        <span className="font-semibold text-gray-800 flex items-center gap-2">
                          {cand.photo_url && <img src={cand.photo_url} className="w-6 h-6 rounded-full object-cover border" alt="" />}
                          {cand.name} <span className="text-gray-400 text-sm font-normal">({cand.number})</span>
                        </span>
                        <span className="font-bold text-gray-700">{cand.voteCount} votos ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
                        <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}

                <div className="grid grid-cols-2 gap-4 pt-4 mt-6 border-t border-gray-50">
                   <div className="bg-gray-50 rounded p-3 text-center">
                     <div className="text-sm text-gray-500 font-medium">Votos Brancos</div>
                     <div className="text-xl font-bold text-gray-700">{roleResult.blank}</div>
                   </div>
                   <div className="bg-gray-50 rounded p-3 text-center">
                     <div className="text-sm text-gray-500 font-medium">Votos Nulos</div>
                     <div className="text-xl font-bold text-gray-700">{roleResult.null}</div>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
