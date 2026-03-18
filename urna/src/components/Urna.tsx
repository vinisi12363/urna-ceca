import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import OrientationPrompt from './OrientationPrompt';

interface UrnaProps {
  classId: string;
  onReset: () => void;
}

const ROLES = [
  { id: 'CLASS_LEADER', title: 'Líder de Classe', digits: 2 },
  { id: 'FIELD_LEADER', title: 'Líder de Campo', digits: 2 },
];

export default function Urna({ classId, onReset }: UrnaProps) {
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [inputNumber, setInputNumber] = useState('');
  const [candidate, setCandidate] = useState<any>(null);
  const [voteType, setVoteType] = useState<'VALID' | 'BLANK' | 'NULL' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const audioConfirmaRef = useRef<HTMLAudioElement | null>(null);
  const audioCancelaRef = useRef<HTMLAudioElement | null>(null);

  const currentRole = ROLES[currentRoleIndex];

  useEffect(() => {
    // Preload audio
    audioConfirmaRef.current = new Audio('/sounds/urna_2.mp3');
    audioCancelaRef.current = new Audio('/sounds/fah_cancela.mp3');
  }, []);

  useEffect(() => {
    if (inputNumber.length === currentRole.digits) {
      searchCandidate(inputNumber);
    } else {
      setCandidate(null);
      if (voteType === 'NULL') setVoteType(null); // Clear Nulo state if typing
    }
  }, [inputNumber]);

  async function searchCandidate(num: string) {
    setIsVoting(true);
    const { data } = await supabase
      .from('candidates')
      .select('*')
      .eq('class_id', classId)
      .eq('role', currentRole.id)
      .eq('number', num)
      .single();

    if (data) {
      setCandidate(data);
      setVoteType('VALID');
    } else {
      setCandidate(null);
      setVoteType('NULL');
    }
    setIsVoting(false);
  }

  const handleKeyPress = (digit: string) => {
    if (voteType === 'BLANK' || isFinished) return;
    if (inputNumber.length < currentRole.digits) {
      setInputNumber((prev) => prev + digit);
    }
  };

  const playCancelaSound = () => {
    if (audioCancelaRef.current) {
      audioCancelaRef.current.currentTime = 0;
      audioCancelaRef.current.play().catch(console.error);
    }
  };

  const handleCorrige = () => {
    playCancelaSound();
    setInputNumber('');
    setCandidate(null);
    setVoteType(null);
  };

  const handleBranco = () => {
    setInputNumber('');
    setCandidate(null);
    setVoteType('BLANK');
  };

  const playConfirmaSound = () => {
    if (audioConfirmaRef.current) {
      audioConfirmaRef.current.currentTime = 0;
      audioConfirmaRef.current.play().catch(console.error);
    }
  };

  const handleConfirma = async () => {
    if (voteType === null && inputNumber.length < currentRole.digits) return; // Cannot confirm incomplete unless Branco

    // Register vote
    const actualVoteType = voteType || 'NULL';

    try {
      await supabase.from('votes').insert([{
        class_id: classId,
        candidate_id: candidate?.id || null,
        role: currentRole.id,
        vote_type: actualVoteType,
      }]);

      // Proceed to next or finish
      if (currentRoleIndex < ROLES.length - 1) {
        setTimeout(() => {
          setCurrentRoleIndex((prev) => prev + 1);
          setInputNumber('');
          setCandidate(null);
          setVoteType(null);
        }, 500);
      } else {
        // Play sound only on the final vote
        playConfirmaSound();
        setIsFinished(true);
        setTimeout(() => {
           // Reset the entire urna for the next voter after 5 seconds
           setIsFinished(false);
           setCurrentRoleIndex(0);
           setInputNumber('');
           setCandidate(null);
           setVoteType(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to vote', error);
      alert('Erro ao registrar voto. Tente novamente.');
    }
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8 landscape:flex-row flex-col">
        <OrientationPrompt />
        <div className="w-full max-w-[800px] h-auto aspect-video bg-white border-2 border-gray-300 shadow-2xl flex items-center justify-center">
            <h1 className="text-4xl md:text-7xl font-black text-gray-800 tracking-widest uppercase">FIM</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-0 md:p-4">
      <OrientationPrompt />
      {/* Container Urna, flex row layout mimicking real UI */}
      <div className="w-full max-w-[1000px] md:aspect-[16/9] h-screen md:h-[600px] bg-white md:border-4 border-gray-300 shadow-2xl flex flex-col md:flex-row overflow-hidden md:rounded-xl">
        
        {/* Left Screen */}
        <div className="flex-1 bg-white p-4 md:p-8 border-b-4 md:border-b-0 md:border-r-4 border-gray-800 relative flex flex-col justify-between overflow-hidden">
            {/* Top Info */}
            <div>
              <div className="text-lg md:text-xl font-bold uppercase tracking-wide mb-2 md:mb-6">Seu voto para</div>
              <div className="text-center font-bold text-3xl md:text-5xl mb-4 md:mb-12 capitalize">{currentRole.title}</div>
            </div>

            {/* Middle Input / Candidate Info */}
            <div className="flex-1">
              {voteType === 'BLANK' ? (
                 <div className="h-full flex items-center justify-center pb-20">
                     <div className="text-4xl md:text-6xl font-bold uppercase animate-pulse text-gray-800">Voto em Branco</div>
                 </div>
              ) : (
                <div className="flex flex-col md:flex-row justify-between h-full gap-4">
                  <div className="flex flex-col gap-4 md:gap-6">
                      <div className="flex items-center gap-4">
                        <span className="text-xl md:text-2xl font-bold w-20 md:w-24">Número:</span>
                        <div className="flex gap-2">
                            {Array.from({ length: currentRole.digits }).map((_, i) => (
                              <div key={i} className={`w-10 h-14 md:w-12 md:h-16 border-2 flex items-center justify-center text-3xl md:text-4xl font-bold ${inputNumber[i] ? 'border-gray-800' : 'border-gray-300'} bg-white shadow-inner`}>
                                {inputNumber[i] || ''}
                              </div>
                            ))}
                        </div>
                      </div>

                      {candidate && (
                        <>
                          <div className="flex items-center gap-4 text-xl md:text-2xl font-bold">
                            <span className="w-20 md:w-24">Nome:</span>
                            <span className="text-2xl md:text-3xl uppercase">{candidate.name}</span>
                          </div>
                        </>
                      )}

                      {voteType === 'NULL' && inputNumber.length === currentRole.digits && (
                        <div className="mt-4 md:mt-8 text-2xl md:text-4xl font-bold uppercase animate-pulse">Voto Nulo</div>
                      )}
                  </div>
                  
                  {candidate?.photo_url && (
                    <div className="flex flex-row md:flex-col items-center gap-4 md:gap-0 self-start md:self-auto">
                       <img src={candidate.photo_url} alt="Candidato" className="w-24 h-32 md:w-40 md:h-56 object-cover border-4 border-white shadow-lg mb-2" />
                       <span className="text-xs md:text-sm font-bold uppercase border-t border-b border-black w-full text-center py-1">{currentRole.title}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Instructions */}
            <div className="border-t border-black pt-2 sticky bottom-0 bg-white left-0 w-full mb-0 mt-auto">
              <p className="font-bold mb-1">Aperte a tecla:</p>
              <p className="font-bold">VERDE para CONFIRMAR este voto</p>
              <p className="font-bold">VERMELHO para REINICIAR este voto</p>
              {voteType !== 'BLANK' && <p className="font-bold">BRANCO para VOTAR EM BRANCO</p>}
            </div>
            
            <button onClick={onReset} className="absolute top-2 right-2 text-xs text-gray-300 hover:text-red-500 transition-colors">Sair / Trocar Turma</button>
        </div>

        {/* Right Keypad */}
        <div className="w-full md:w-[350px] bg-[#222] p-4 md:p-8 flex flex-col gap-4 shadow-inner">
           {/* Numpad Grid */}
           <div className="grid grid-cols-3 gap-2 md:gap-4 flex-1 md:flex-none">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button 
                  key={num} 
                  onClick={() => handleKeyPress(num.toString())}
                  className="bg-[#1a1a1a] hover:bg-[#333] text-white text-2xl md:text-3xl font-bold rounded-lg shadow-[inset_0_-4px_0_rgba(0,0,0,0.6)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] active:translate-y-1 transition-all h-14 md:h-20 flex items-center justify-center font-mono border border-[#333]"
                >
                  {num}
                </button>
             ))}
             <div className="col-start-2">
                <button 
                  onClick={() => handleKeyPress('0')}
                  className="w-full bg-[#1a1a1a] hover:bg-[#333] text-white text-2xl md:text-3xl font-bold rounded-lg shadow-[inset_0_-4px_0_rgba(0,0,0,0.6)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] active:translate-y-1 transition-all h-14 md:h-20 flex items-center justify-center font-mono border border-[#333]"
                >
                  0
                </button>
             </div>
           </div>

           {/* Action Buttons */}
           <div className="grid grid-cols-3 gap-2 md:gap-3 h-16 md:h-20 mt-2 md:mt-4">
             <button 
               onClick={handleBranco}
                className="bg-white hover:bg-gray-200 text-black font-bold uppercase text-xs md:text-sm rounded shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-1 transition-all"
             >
               Branco
             </button>
             <button 
               onClick={handleCorrige}
                className="bg-[#cd3333] hover:bg-[#b02a2a] text-white font-bold uppercase text-xs md:text-sm rounded shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-1 transition-all"
             >
               Corrige
             </button>
             <button 
                onClick={handleConfirma}
                disabled={isVoting || (voteType === null && inputNumber.length < currentRole.digits)}
                className="bg-[#32a852] hover:bg-[#288a42] text-white font-bold uppercase text-xs md:text-sm rounded shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-1 transition-all disabled:opacity-50"
             >
               Confirma
             </button>
           </div>
        </div>
        
      </div>
    </div>
  );
}
