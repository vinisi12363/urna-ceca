import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

export default function OrientationPrompt() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if it's a mobile device and in portrait mode
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobile && isPortraitMode);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col items-center justify-center p-8 text-center text-white">
      <div className="animate-bounce mb-8">
        <RotateCw size={64} className="text-blue-500" />
      </div>
      <h2 className="text-3xl font-bold mb-4">Gire seu dispositivo</h2>
      <p className="text-xl text-gray-400 max-w-md">
        A urna eletrônica funciona melhor no modo paisagem (horizontal). 
        Por favor, gire seu celular para continuar.
      </p>
    </div>
  );
}
