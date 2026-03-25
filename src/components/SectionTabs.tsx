import { Hammer, Eye } from 'lucide-react';

type SectionType = 'implantacao' | 'supervisao';

interface SectionTabsProps {
  currentSection: SectionType;
  onSectionChange: (section: SectionType) => void;
}

export function SectionTabs({ currentSection, onSectionChange }: SectionTabsProps) {
  const tabs = [
    { id: 'implantacao' as SectionType, label: 'IMPLANTAÇÃO', icon: Hammer },
    { id: 'supervisao' as SectionType, label: 'SUPERVISÃO', icon: Eye },
  ];

  return (
    <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentSection === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSectionChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold
              transition-all duration-200 text-sm sm:text-base
              border-b-4 -mb-[2px]
              ${isActive
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
