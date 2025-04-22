import React from 'react';

// Define a type for selected tags
type SelectedTags = {
    taxonomy?: string;
    difficulty?: string;
};

interface AddTagQuestionProps {
    expandedSections: {
        [key: string]: boolean;
    };
    selectedTags: SelectedTags;
    onToggleSection: (section: string) => void;
    onTagChange: (category: keyof SelectedTags, value: string) => void;
}

const AddTagQuestion: React.FC<AddTagQuestionProps> = ({
    expandedSections,
    selectedTags,
    onToggleSection,
    onTagChange,
}) => {
    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
                <h3 className="text-2xl font-semibold text-black dark:text-white">Tags</h3>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={`w-5 h-5 transition-transform duration-200 cursor-pointer ${expandedSections.tags ? 'rotate-180' : ''}`}
                    onClick={() => onToggleSection('tags')}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </div>
            {expandedSections.tags && (
                <div className="px-6.5 py-4 space-y-4">
                    {/* Taxonomy Selection */}
                    <div>
                        <label className="mb-2.5 block font-medium text-black dark:text-white">Taxonomy</label>
                        <select
                            value={selectedTags.taxonomy || ''}
                            onChange={(e) => onTagChange('taxonomy', e.target.value)}
                            className="w-full rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        >
                            <option value="">None</option>
                            <option value="Remember">Remember</option>
                            <option value="Understand">Understand</option>
                            <option value="Apply">Apply</option>
                            <option value="Analyze">Analyze</option>
                            <option value="Evaluate">Evaluate</option>
                            <option value="Create">Create</option>
                        </select>
                    </div>

                    {/* Difficulty Selection */}
                    <div>
                        <label className="mb-2.5 block font-medium text-black dark:text-white">Difficulty</label>
                        <select
                            value={selectedTags.difficulty || ''}
                            onChange={(e) => onTagChange('difficulty', e.target.value)}
                            className="w-full rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        >
                            <option value="">None</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    {/* Selected Tags Display */}
                    <div className="mt-4">
                        {Object.entries(selectedTags).map(([category, tag]) => (
                            tag && (
                                <div key={category} className="relative inline-block mr-2 mb-2">
                                    <span className="inline-block border border-gray-400 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded dark:border-gray-600 dark:text-gray-300">
                                        {`${category}: ${tag}`}
                                    </span>
                                    <span
                                        className="absolute right-0 top-0 transform translate-x-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-red-500"
                                        onClick={() => onTagChange(category as keyof SelectedTags, '')}
                                    >
                                        &times;
                                    </span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddTagQuestion; 