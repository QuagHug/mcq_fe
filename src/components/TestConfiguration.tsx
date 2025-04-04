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
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={configuration.includeAnswerKey}
                                    onChange={(e) => onConfigChange?.({ ...configuration, includeAnswerKey: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
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