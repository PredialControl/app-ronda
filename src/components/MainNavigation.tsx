import { Building2, Calendar, PhoneCall, LayoutDashboard } from 'lucide-react';

type MainSection = 'contratos' | 'agenda' | 'chamados' | 'dashboard';

interface MainNavigationProps {
  currentSection: MainSection;
  onSectionChange: (section: MainSection) => void;
}

export function MainNavigation({ currentSection, onSectionChange }: MainNavigationProps) {
  const sections = [
    { id: 'contratos' as MainSection, label: 'CONTRATOS', icon: Building2 },
    { id: 'agenda' as MainSection, label: 'AGENDA', icon: Calendar },
    { id: 'chamados' as MainSection, label: 'CHAMADOS', icon: PhoneCall },
    { id: 'dashboard' as MainSection, label: 'DASHBOARD', icon: LayoutDashboard },
  ];

  return (
    <div className="flex gap-2 sm:gap-4 mb-6 overflow-x-auto pb-2">
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = currentSection === section.id;

        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`
              flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold
              transition-all duration-200 whitespace-nowrap text-sm sm:text-base
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }
            `}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{section.label}</span>
            <span className="sm:hidden">{section.label.slice(0, 3)}</span>
          </button>
        );
      })}
    </div>
  );
}
