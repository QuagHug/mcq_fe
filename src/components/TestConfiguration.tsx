import React from 'react';

interface TestConfigProps {
    configuration: {
        letterCase: 'uppercase' | 'lowercase';
        separator: string;
        includeAnswerKey: boolean;
    };
    isEditing?: boolean;
    onConfigChange?: (config: any) => void;
}

export const TestConfiguration: React.FC<TestConfigProps> = ({ 
    configuration, 
    isEditing = false, 
    onConfigChange 
}) => {
    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    Test Configuration
                </h3>
            </div>
            <div className="p-6.5">
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center">
                        <span className="mr-2.5 text-sm font-medium text-black dark:text-white">Letter Case:</span>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onConfigChange?.({ ...configuration, letterCase: 'uppercase' })}
                                    className={`px-4 py-2 rounded ${configuration.letterCase === 'uppercase'
                                        ? 'bg-primary text-white'
                                        : 'bg-white dark:bg-meta-4 border border-stroke'}`}
                                >
                                    ABC
                                </button>
                                <button
                                    onClick={() => onConfigChange?.({ ...configuration, letterCase: 'lowercase' })}
                                    className={`px-4 py-2 rounded ${configuration.letterCase === 'lowercase'
                                        ? 'bg-primary text-white'
                                        : 'bg-white dark:bg-meta-4 border border-stroke'}`}
                                >
                                    abc
                                </button>
                            </div>
                        ) : (
                            <span className="text-sm text-body-color dark:text-gray-400">
                                {configuration.letterCase === 'uppercase' ? 'ABC' : 'abc'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center">
                        <span className="mr-2.5 text-sm font-medium text-black dark:text-white">Separator:</span>
                        {isEditing ? (
                            <select
                                value={configuration.separator}
                                onChange={(e) => onConfigChange?.({ ...configuration, separator: e.target.value })}
                                className="rounded border-[1.5px] border-stroke bg-transparent py-1.5 px-3 outline-none"
                            >
                                <option value=".">.</option>
                                <option value=")">)</option>
                                <option value="-">-</option>
                            </select>
                        ) : (
                            <span className="text-sm text-body-color dark:text-gray-400">
                                A{configuration.separator}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center">
                        <span className="mr-2.5 text-sm font-medium text-black dark:text-white">Answer Key:</span>
                        {isEditing ? (
                            <button
                                onClick={() => onConfigChange?.({ ...configuration, includeAnswerKey: !configuration.includeAnswerKey })}
                                className={`px-4 py-2 rounded border transition-all duration-200 group relative
                                    ${configuration.includeAnswerKey 
                                        ? 'bg-primary text-white border-primary' 
                                        : 'bg-white dark:bg-meta-4 border-stroke hover:bg-primary hover:text-white hover:border-primary'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        {configuration.includeAnswerKey ? (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M5 13l4 4L19 7"
                                            />
                                        ) : (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        )}
                                    </svg>
                                    <span>Include Key</span>
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                                    {configuration.includeAnswerKey ? 'Hide Answer Key' : 'Show Answer Key'}
                                </div>
                            </button>
                        ) : (
                            <span className="text-sm text-body-color dark:text-gray-400">
                                {configuration.includeAnswerKey ? 'Included' : 'Not Included'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestConfiguration;