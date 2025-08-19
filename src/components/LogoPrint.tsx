import React from 'react';

interface LogoPrintProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LogoPrint: React.FC<LogoPrintProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo circular com cidade - exatamente como na imagem */}
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Círculo branco de fundo */}
          <circle cx="50" cy="50" r="48" fill="white" stroke="#1e40af" strokeWidth="2"/>
          
          {/* Edifícios da cidade em azul escuro */}
          {/* Edifício 1 (mais baixo) */}
          <rect x="25" y="40" width="8" height="20" fill="#1e40af"/>
          
          {/* Edifício 2 (médio) */}
          <rect x="35" y="35" width="8" height="25" fill="#1e40af"/>
          
          {/* Edifício 3 (mais alto) */}
          <rect x="45" y="30" width="8" height="30" fill="#1e40af"/>
          
          {/* Edifício 4 (médio) */}
          <rect x="55" y="35" width="8" height="25" fill="#1e40af"/>
          
          {/* Edifício 5 (baixo) */}
          <rect x="65" y="40" width="8" height="20" fill="#1e40af"/>
          
          {/* Estrela de 5 pontas */}
          <path
            d="M70 20 L72 25 L77 25 L73 28 L75 33 L70 30 L65 33 L67 28 L63 25 L68 25 Z"
            fill="#1e40af"
          />
          
          {/* Linha horizontal branca abaixo do círculo */}
          <line x1="45" y1="85" x2="65" y2="85" stroke="white" strokeWidth="2"/>
        </svg>
      </div>
      
      {/* Texto da empresa em branco */}
      <div className={`flex flex-col text-white font-sans ${textSizes[size]}`}>
        <span className="font-semibold leading-tight tracking-wide">MANUTENÇÃO</span>
        <span className="font-bold leading-tight tracking-wide">PREDIAL</span>
      </div>
    </div>
  );
};
