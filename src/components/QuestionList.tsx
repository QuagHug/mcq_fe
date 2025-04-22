import React from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import Pagination from './Pagination';
import { Question, Taxonomy } from '../types';
import { Tag } from '../pages/CreateTest';

interface QuestionListProps {
    questions?: Question[];
    selectedQuestions: Question[];
    filteredQuestions: Question[];
    questionGroupsMap: Record<number, any>;
    expandedGroups: number[];
    groupBankMap: Record<number, string>;
    loadingGroups: Record<string, boolean>;
    editedQuestions: Record<number, Question>;
    itemsPerPage: number;
    availableQuestionsPage: number;
    selectedQuestionsPage: number;
    searchQuery: string;
    showBloomsLevels: boolean;
    selectedLevels: string[];
    selectedBankId: string;
    showQuestionBank: boolean;
    bloomsLevels: string[];
    questionBanks: any[];
    onSearchChange: (value: string) => void;
    onToggleBloomsLevels: () => void;
    onToggleLevel: (level: string) => void;
    onBankChange: (value: string) => void;
    onToggleQuestionBank: () => void;
    onQuestionClick: (question: Question) => void;
    onToggleQuestionSelection: (question: Question) => void;
    onToggleGroupExpansion: (groupId: number) => void;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
    renderBankOptions: (banks: any[]) => React.ReactNode;
    getQuestionsByGroup: () => { grouped: Record<number, Question[]> };
    getGroupById: (id: number) => any;
    sanitizeHtml: (html: string) => string;
    capitalizeFirstLetter: (string: string) => string;
}

const QuestionList: React.FC<QuestionListProps> = ({
    questions,
    selectedQuestions,
    filteredQuestions,
    questionGroupsMap,
    expandedGroups,
    groupBankMap,
    loadingGroups,
    editedQuestions,
    itemsPerPage,
    availableQuestionsPage,
    selectedQuestionsPage,
    searchQuery,
    showBloomsLevels,
    selectedLevels,
    selectedBankId,
    showQuestionBank,
    bloomsLevels,
    questionBanks,
    onSearchChange,
    onToggleBloomsLevels,
    onToggleLevel,
    onBankChange,
    onToggleQuestionBank,
    onQuestionClick,
    onToggleQuestionSelection,
    onToggleGroupExpansion,
    onPageChange,
    onItemsPerPageChange,
    renderBankOptions,
    getQuestionsByGroup,
    getGroupById,
    sanitizeHtml,
    capitalizeFirstLetter
}) => {
    return (
        <div className="rounded-sm bg-white shadow-default dark:bg-boxdark mb-6">
            {/* Available Questions List */}
            <div className="p-6.5 border-b border-stroke dark:border-strokedark">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-black dark:text-white">
                        Available Questions
                    </h4>
                    <div className="flex gap-4 items-center">
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="rounded-md border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                        />
                        <div className="relative">
                            <button
                                onClick={onToggleBloomsLevels}
                                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2 px-6 text-white hover:bg-opacity-90"
                            >
                                <span>Bloom's Levels</span>
                                <svg
                                    className={`w-4 h-4 transform transition-transform duration-200 ${showBloomsLevels ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {showBloomsLevels && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-[#C0C0C0] dark:bg-boxdark rounded-sm shadow-lg z-50 p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {bloomsLevels.map(level => (
                                            <button
                                                key={level}
                                                onClick={() => onToggleLevel(level)}
                                                className={`px-3 py-1 rounded-full text-sm ${selectedLevels.includes(level)
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white dark:bg-meta-4 hover:bg-gray-100 dark:hover:bg-meta-3'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <select
                                value={selectedBankId}
                                onChange={(e) => onBankChange(e.target.value)}
                                className="rounded-md border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none"
                            >
                                <option value="">All Banks</option>
                                {renderBankOptions(questionBanks)}
                            </select>
                        </div>
                        <svg
                            className={`w-4 h-4 transform transition-transform duration-200 cursor-pointer ${showQuestionBank ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            onClick={onToggleQuestionBank}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Column Headers */}
                    <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-meta-4 rounded-sm">
                        <div className="flex-1">
                            <span className="font-medium text-black dark:text-white">Question</span>
                        </div>
                        <div className="flex items-center gap-8">
                            <span className="font-medium text-black dark:text-white w-24 text-center">Difficulty</span>
                            <span className="font-medium text-black dark:text-white w-24 text-center">Taxonomy</span>
                            <button
                                onClick={() => {
                                    filteredQuestions
                                        .filter(q => !selectedQuestions.some(sq => sq.id === q.id))
                                        .forEach(q => onToggleQuestionSelection(q));
                                }}
                                className="text-success hover:text-meta-3 text-sm w-12 text-center"
                            >
                                Add all
                            </button>
                        </div>
                    </div>

                    {/* Grouped Questions */}
                    {Object.entries(getQuestionsByGroup().grouped).map(([groupIdStr, groupQuestions]) => {
                        const groupId = parseInt(groupIdStr);
                        const group = getGroupById(groupId);
                        const isExpanded = expandedGroups.includes(groupId);
                        const bankId = groupBankMap[groupId];
                        const isLoading = loadingGroups[bankId];

                        return (
                            <React.Fragment key={groupId}>
                                <div
                                    onClick={() => onToggleGroupExpansion(groupId)}
                                    className="flex items-center justify-between cursor-pointer p-2 bg-gray-100 dark:bg-meta-4 rounded-sm mb-1"
                                >
                                    <div className="flex items-center">
                                        {isExpanded ? (
                                            <FiChevronDown className="mr-2" />
                                        ) : (
                                            <FiChevronRight className="mr-2" />
                                        )}
                                        <span className="font-medium">
                                            {questionGroupsMap[groupId]?.name || `Group ${groupId}`}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-500">
                                            ({questionGroupsMap[groupId]?.question_count || 0} questions)
                                        </span>
                                    </div>
                                </div>

                                {isLoading && (
                                    <div className="p-4 text-center border-l-2 border-r-2 border-primary border-opacity-30">
                                        <span>Loading group details...</span>
                                    </div>
                                )}

                                {isExpanded && groupQuestions
                                    .filter(q => !selectedQuestions.some(sq => sq.id === q.id))
                                    .map((question) => (
                                        <div
                                            key={question.id}
                                            className="p-4 border-l-2 border-r-2 border-primary border-opacity-30 hover:bg-gray-50 dark:hover:bg-meta-4/30"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-4 flex-1">
                                                    <div className="flex-1">
                                                        <div
                                                            className="cursor-pointer hover:text-primary"
                                                            onClick={() => onQuestionClick(question)}
                                                        >
                                                            {sanitizeHtml(question.question_text)}
                                                            {question.statistics && (
                                                                <span className="text-xs text-gray-500 ml-2">
                                                                    (D: {question.statistics.scaled_difficulty.toFixed(2)},
                                                                    Disc: {question.statistics.scaled_discrimination.toFixed(2)})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <Tag
                                                        value={capitalizeFirstLetter(
                                                            editedQuestions[question.id]?.difficulty ||
                                                            selectedQuestions.find(q => q.id === question.id)?.difficulty ||
                                                            question.difficulty ||
                                                            'N/A'
                                                        )}
                                                        type="difficulty"
                                                    />
                                                    <Tag
                                                        value={editedQuestions[question.id]?.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level ||
                                                            selectedQuestions.find(q => q.id === question.id)?.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level ||
                                                            question.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level ||
                                                            'N/A'}
                                                        type="taxonomy"
                                                    />
                                                    <div className="w-12 flex justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedQuestions.some(sq => sq.id === question.id)}
                                                            onChange={() => onToggleQuestionSelection(question)}
                                                            className="w-5 h-5 cursor-pointer text-primary border-stroke"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {isExpanded && (
                                    <div className="p-2 mb-2 bg-gray-50 dark:bg-boxdark rounded-sm">
                                        <div className="text-sm font-medium mb-1">Context:</div>
                                        <div className="text-sm" dangerouslySetInnerHTML={{
                                            __html: questionGroupsMap[groupId]?.context || 'No context available'
                                        }} />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* Standalone Questions */}
                    {filteredQuestions
                        .filter(q => !selectedQuestions.some(sq => sq.id === q.id))
                        .slice((availableQuestionsPage - 1) * itemsPerPage, availableQuestionsPage * itemsPerPage)
                        .map((question, index) => {
                            const questionNumber = ((availableQuestionsPage - 1) * itemsPerPage) + index + 1;

                            return (
                                <div
                                    key={question.id}
                                    className="p-4 border rounded-sm dark:border-strokedark"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-4 flex-1">
                                            <span className="text-gray-500">{questionNumber}.</span>
                                            <div className="flex-1">
                                                <div
                                                    className="cursor-pointer hover:text-primary"
                                                    onClick={() => onQuestionClick(question)}
                                                >
                                                    {sanitizeHtml(question.question_text)}
                                                </div>
                                                {question.statistics && (
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        (D: {question.statistics.scaled_difficulty.toFixed(2)},
                                                        Disc: {question.statistics.scaled_discrimination.toFixed(2)})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <Tag
                                                value={capitalizeFirstLetter(
                                                    editedQuestions[question.id]?.difficulty ||
                                                    question.difficulty ||
                                                    'N/A'
                                                )}
                                                type="difficulty"
                                            />
                                            <Tag
                                                value={editedQuestions[question.id]?.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level ||
                                                    question.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level ||
                                                    'N/A'}
                                                type="taxonomy"
                                            />
                                            <div className="w-12 flex justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedQuestions.some(sq => sq.id === question.id)}
                                                    onChange={() => onToggleQuestionSelection(question)}
                                                    className="w-5 h-5 cursor-pointer text-primary border-stroke"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                <Pagination
                    totalItems={filteredQuestions.filter(q => !selectedQuestions.some(sq => sq.id === q.id)).length}
                    itemsPerPage={itemsPerPage}
                    currentPage={availableQuestionsPage}
                    onPageChange={onPageChange}
                    onItemsPerPageChange={onItemsPerPageChange}
                />
            </div>

            {/* Selected Questions Section */}
            {selectedQuestions.length > 0 && (
                <div className="p-6.5">
                    <h4 className="font-medium text-black dark:text-white mb-4">
                        Selected Questions ({selectedQuestions.length})
                    </h4>
                    <div className="space-y-4">
                        {/* Column Headers for Selected Questions */}
                        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-meta-4 rounded-sm">
                            <div className="flex-1">
                                <span className="font-medium text-black dark:text-white">Question</span>
                            </div>
                            <div className="flex items-center gap-8">
                                <span className="font-medium text-black dark:text-white w-24 text-center">Difficulty</span>
                                <span className="font-medium text-black dark:text-white w-24 text-center">Taxonomy</span>
                                <button
                                    onClick={() => {
                                        selectedQuestions.forEach(q => onToggleQuestionSelection(q));
                                    }}
                                    className="text-danger hover:text-meta-1 text-sm w-12 text-center"
                                >
                                    Remove all
                                </button>
                            </div>
                        </div>

                        {selectedQuestions
                            .slice((selectedQuestionsPage - 1) * itemsPerPage, selectedQuestionsPage * itemsPerPage)
                            .map((question, index) => {
                                const questionNumber = ((selectedQuestionsPage - 1) * itemsPerPage) + index + 1;
                                return (
                                    <div
                                        key={question.id}
                                        className="p-4 border rounded-sm dark:border-strokedark"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-4 flex-1">
                                                <span className="text-gray-500">{questionNumber}.</span>
                                                <div className="flex-1">
                                                    <div
                                                        className="cursor-pointer hover:text-primary"
                                                        onClick={() => onQuestionClick(question)}
                                                    >
                                                        {sanitizeHtml(question.question_text)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <Tag
                                                    value={capitalizeFirstLetter(
                                                        editedQuestions[question.id]?.difficulty ||
                                                        question.difficulty ||
                                                        'N/A'
                                                    )}
                                                    type="difficulty"
                                                />
                                                <Tag
                                                    value={editedQuestions[question.id]?.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level ||
                                                        question.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level ||
                                                        'N/A'}
                                                    type="taxonomy"
                                                />
                                                <div className="w-12 flex justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={true}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            onToggleQuestionSelection(question);
                                                        }}
                                                        className="w-5 h-5 cursor-pointer text-primary border-stroke"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    <Pagination
                        totalItems={selectedQuestions.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={selectedQuestionsPage}
                        onPageChange={onPageChange}
                        onItemsPerPageChange={onItemsPerPageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default QuestionList; 