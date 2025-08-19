import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo circular com cidade */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
        >
          {/* Círculo de fundo */}
          <circle cx="50" cy="50" r="48" fill="white" stroke="#1e40af" strokeWidth="3"/>
          
          {/* Edifícios da cidade */}
          {/* Edifício 1 (mais baixo) */}
          <rect x="25" y="35" width="8" height="25" fill="#1e40af"/>
          
          {/* Edifício 2 (médio) */}
          <rect x="35" y="30" width="8" height="30" fill="#1e40af"/>
          
          {/* Edifício 3 (mais alto) */}
          <rect x="45" y="25" width="8" height="35" fill="#1e40af"/>
          
          {/* Edifício 4 (médio) */}
          <rect x="55" y="30" width="8" height="30" fill="#1e40af"/>
          
          {/* Edifício 5 (baixo) */}
          <rect x="65" y="35" width="8" height="25" fill="#1e40af"/>
          
          {/* Estrela */}
          <path
            d="M70 20 L72 25 L77 25 L73 28 L75 33 L70 30 L65 33 L67 28 L63 25 L68 25 Z"
            fill="#1e40af"
          />
          
          {/* Linha horizontal branca abaixo do círculo */}
          <line x1="45" y1="85" x2="65" y2="85" stroke="white" strokeWidth="3"/>
        </svg>
      </div>
      
      {/* Texto da empresa */}
      <div className="flex flex-col text-white font-sans">
        <span className="text-sm font-semibold leading-tight tracking-wide">MANUTENÇÃO</span>
        <span className="text-lg font-bold leading-tight tracking-wide">PREDIAL</span>
      </div>
    </div>
  );
};
