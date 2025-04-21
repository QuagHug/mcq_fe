import React from 'react';
import Pagination from './Pagination';
import { Question, Taxonomy } from '../types';

interface AnswerBlockProps {
    title: string;
    questions: Question[];
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
    onQuestionClick: (question: Question) => void;
    onToggleQuestion: (question: Question) => void;
    isQuestionSelected: (questionId: number) => boolean;
    showWarning?: boolean;
    warningMessage?: string;
    showRemoveAll?: boolean;
    onRemoveAll?: () => void;
    editedQuestions?: { [key: number]: Question };
}

const AnswerBlock: React.FC<AnswerBlockProps> = ({
    title,
    questions,
    currentPage,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange,
    onQuestionClick,
    onToggleQuestion,
    isQuestionSelected,
    showWarning = false,
    warningMessage = '',
    showRemoveAll = false,
    onRemoveAll,
    editedQuestions = {}
}) => {
    return (
        <div className="p-6.5">
            <h4 className="font-medium text-black dark:text-white mb-4">
                {title} ({questions.length})
            </h4>
            {showWarning && (
                <div className="mt-1 text-danger text-sm">
                    {warningMessage}
                </div>
            )}
            <div className="space-y-4">
                {/* Column Headers */}
                <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-meta-4 rounded-sm">
                    <div className="flex-1">
                        <span className="font-medium text-black dark:text-white">Question</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <span className="w-24 text-center font-medium text-black dark:text-white">Difficulty</span>
                        <span className="w-24 text-center font-medium text-black dark:text-white">Taxonomy</span>
                        <span className="w-20 text-center font-medium cursor-pointer" onClick={onRemoveAll}>
                            {showRemoveAll ? (
                                <span className="text-danger hover:text-meta-1 whitespace-nowrap">Remove All</span>
                            ) : (
                                <span className="text-success hover:text-meta-3 whitespace-nowrap">Add All</span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Questions List */}
                {questions
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((question, index) => {
                        const questionNumber = ((currentPage - 1) * itemsPerPage) + index + 1;
                        const editedQuestion = editedQuestions[question.id];
                        return (
                            <div
                                key={question.id}
                                className="p-4 border rounded-sm dark:border-strokedark"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4 flex-1">
                                        <span className="text-gray-500">{questionNumber}.</span>
                                        <div className="flex-1">
                                            <div
                                                className="cursor-pointer hover:text-primary"
                                                onClick={() => onQuestionClick(question)}
                                            >
                                                {question.question_text.replace(/<\/?[^>]+(>|$)/g, '')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <span className={`w-24 text-center px-3 py-1 rounded-full text-sm font-medium
                                            ${(editedQuestion?.difficulty || question.difficulty || 'N/A').toLowerCase() === 'easy'
                                                ? 'bg-success/10 text-success'
                                                : (editedQuestion?.difficulty || question.difficulty || 'N/A').toLowerCase() === 'medium'
                                                    ? 'bg-warning/10 text-warning'
                                                    : (editedQuestion?.difficulty || question.difficulty || 'N/A').toLowerCase() === 'hard'
                                                        ? 'bg-danger/10 text-danger'
                                                        : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {capitalizeFirstLetter(editedQuestion?.difficulty || question.difficulty || 'N/A')}
                                        </span>
                                        <span className={`w-24 text-center px-3 py-1 rounded-full text-sm font-medium
                                            ${(() => {
                                                const level = (editedQuestion?.taxonomies?.find((tax: Taxonomy) => tax.taxonomy.name === "Bloom's Taxonomy")?.level ||
                                                    question.taxonomies?.find((tax: Taxonomy) => tax.taxonomy.name === "Bloom's Taxonomy")?.level || 'N/A').toLowerCase();
                                                switch (level) {
                                                    case 'remember':
                                                        return 'bg-[#D41010]/10 text-[#D41010]';
                                                    case 'understand':
                                                        return 'bg-[#F3543A]/10 text-[#F3543A]';
                                                    case 'apply':
                                                        return 'bg-[#F7EB2E]/10 text-[#F7EB2E]';
                                                    case 'analyze':
                                                        return 'bg-[#168E3A]/10 text-[#168E3A]';
                                                    case 'evaluate':
                                                        return 'bg-[#2CB3C7]/10 text-[#2CB3C7]';
                                                    case 'create':
                                                        return 'bg-[#7272D8]/10 text-[#7272D8]';
                                                    default:
                                                        return 'bg-gray-100 text-gray-500';
                                                }
                                            })()}`}>
                                            {editedQuestion?.taxonomies?.find((tax: Taxonomy) => tax.taxonomy.name === "Bloom's Taxonomy")?.level ||
                                                question.taxonomies?.find((tax: Taxonomy) => tax.taxonomy.name === "Bloom's Taxonomy")?.level || 'N/A'}
                                        </span>
                                        <div className="w-20 flex justify-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isQuestionSelected(question.id)}
                                                    onChange={() => onToggleQuestion(question)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-5 h-5 border-2 border-stroke dark:border-strokedark rounded 
                                                    peer-checked:bg-primary peer-checked:border-primary
                                                    after:content-[''] after:absolute after:top-[2px] after:left-[7px]
                                                    after:w-[6px] after:h-[12px] after:border-white after:border-r-2 after:border-b-2
                                                    after:hidden peer-checked:after:block after:rotate-45
                                                    transition-all duration-200 ease-in-out">
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

            <Pagination
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={onPageChange}
                onItemsPerPageChange={onItemsPerPageChange}
            />
        </div>
    );
};

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export default AnswerBlock; 