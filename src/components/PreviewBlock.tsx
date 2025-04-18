import React from 'react';
import { Dialog } from '@headlessui/react';

interface Question {
    id: number;
    question_text: string;
    answers?: { answer_text: string; is_correct: boolean }[];
}

interface EditedQuestion extends Question {
    hiddenAnswers?: boolean[];
}

interface AnswerFormat {
    case: 'uppercase' | 'lowercase';
    separator: string;
}

interface PreviewBlockProps {
    testData: {
        title: string;
    };
    selectedQuestions: Question[];
    shuffledQuestions: Question[];
    editedQuestions: { [key: number]: EditedQuestion };
    answerFormat: AnswerFormat;
    previewDialogOpen: boolean;
    setPreviewDialogOpen: (open: boolean) => void;
    previewShowAll: boolean;
    setPreviewShowAll: (show: boolean) => void;
    previewPage: number;
    setPreviewPage: (page: number) => void;
    handleShuffleQuestions: () => void;
    includeKey: boolean;
    setIncludeKey: (include: boolean) => void;
    setAnswerFormat: React.Dispatch<React.SetStateAction<AnswerFormat>>;
}

const sanitizeHtml = (html: string) => {
    if (!html) return '';
    const withoutTags = html.replace(/<\/?[^>]+(>|$)/g, '');
    const textarea = document.createElement('textarea');
    textarea.innerHTML = withoutTags;
    return textarea.value.trim();
};

const PreviewBlock: React.FC<PreviewBlockProps> = ({
    testData,
    selectedQuestions,
    shuffledQuestions,
    editedQuestions,
    answerFormat,
    previewDialogOpen,
    setPreviewDialogOpen,
    previewShowAll,
    setPreviewShowAll,
    previewPage,
    setPreviewPage,
    handleShuffleQuestions,
    includeKey,
    setIncludeKey,
    setAnswerFormat,
}) => {
    const handleShowAllQuestions = () => {
        setPreviewShowAll(true);
        setPreviewDialogOpen(true);
    };

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    Preview
                </h3>
            </div>

            <div className="p-6.5">
                {/* Test Configuration */}
                <div className="mb-6 bg-gray-50 dark:bg-meta-4 p-4 rounded-sm">
                    <h4 className="text-lg font-medium text-black dark:text-white mb-4">
                        Test Configuration
                    </h4>
                    <div className="flex gap-6 flex-wrap items-end">
                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">
                                Letter Case
                            </label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setAnswerFormat((prev: AnswerFormat): AnswerFormat => ({ ...prev, case: 'uppercase' }))}
                                    className={`px-4 py-2 rounded ${answerFormat.case === 'uppercase'
                                        ? 'bg-primary text-white'
                                        : 'bg-white dark:bg-meta-4 border border-stroke'
                                        }`}
                                >
                                    ABC
                                </button>
                                <button
                                    onClick={() => setAnswerFormat((prev: AnswerFormat): AnswerFormat => ({ ...prev, case: 'lowercase' }))}
                                    className={`px-4 py-2 rounded ${answerFormat.case === 'lowercase'
                                        ? 'bg-primary text-white'
                                        : 'bg-white dark:bg-meta-4 border border-stroke'
                                        }`}
                                >
                                    abc
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">
                                Separator
                            </label>
                            <div className="flex gap-3">
                                {[')', '.', '/'].map(separator => (
                                    <button
                                        key={separator}
                                        onClick={() => setAnswerFormat((prev: AnswerFormat): AnswerFormat => ({ ...prev, separator }))}
                                        className={`px-4 py-2 rounded ${answerFormat.separator === separator
                                            ? 'bg-primary text-white'
                                            : 'bg-white dark:bg-meta-4 border border-stroke'
                                            }`}
                                    >
                                        A{separator}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">
                                Question Order
                            </label>
                            <button
                                onClick={handleShuffleQuestions}
                                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2 px-4 text-white hover:bg-opacity-90"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Shuffle Questions
                            </button>
                        </div>

                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">
                                Correct Answers
                            </label>
                            <div className="flex items-center gap-2 h-[38px]">
                                <button
                                    onClick={() => setIncludeKey(!includeKey)}
                                    className="relative w-[46px] h-[24px] rounded-full transition-colors duration-300 ease-in-out focus:outline-none"
                                    style={{
                                        backgroundColor: includeKey ? '#4318FF' : '#E2E8F0'
                                    }}
                                >
                                    <div
                                        className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out
                                            ${includeKey ? 'translate-x-[22px]' : 'translate-x-0'}`}
                                    />
                                </button>
                                <span className="text-sm text-black dark:text-white">
                                    {includeKey ? 'Show' : 'Hide'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Preview */}
                <div className="border border-stroke dark:border-strokedark rounded-sm p-6 relative">
                    <div className="mb-4 flex justify-between items-center">
                        <h4 className="text-lg font-medium text-black dark:text-white">
                            Test Preview
                        </h4>
                    </div>

                    {/* Preview Sample */}
                    <div className="space-y-4">
                        {(shuffledQuestions.length > 0 ? shuffledQuestions : selectedQuestions)
                            .slice(0, 2).map((question, index) => {
                                const editedQuestion = editedQuestions[question.id];
                                const questionToShow = editedQuestion || question;
                                const visibleAnswers = questionToShow.answers?.filter((_, idx) =>
                                    !editedQuestion?.hiddenAnswers?.[idx]
                                );

                                return (
                                    <div key={index} className="space-y-2">
                                        <div className="font-medium">
                                            Question {index + 1}: {sanitizeHtml(questionToShow.question_text)}
                                        </div>
                                        <div className="pl-4 space-y-1">
                                            {visibleAnswers?.map((answer, ansIndex) => (
                                                <div key={ansIndex}>
                                                    {answerFormat.case === 'uppercase'
                                                        ? String.fromCharCode(65 + ansIndex)
                                                        : String.fromCharCode(97 + ansIndex)}
                                                    {answerFormat.separator} {sanitizeHtml(answer.answer_text)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {/* Show more questions button */}
                    {(shuffledQuestions.length > 0 ? shuffledQuestions : selectedQuestions).length > 2 && (
                        <div className="mt-4 text-sm text-gray-500">
                            {(shuffledQuestions.length > 0 ? shuffledQuestions.length : selectedQuestions.length) - 2} more question{(shuffledQuestions.length > 0 ? shuffledQuestions.length : selectedQuestions.length) - 2 !== 1 ? 's' : ''} not shown.
                            <button
                                onClick={handleShowAllQuestions}
                                className="ml-2 px-3 py-1 bg-primary text-white rounded-md text-xs hover:bg-opacity-90"
                            >
                                Preview All
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog
                open={previewDialogOpen}
                onClose={() => {
                    setPreviewDialogOpen(false);
                    setPreviewShowAll(false);
                    setPreviewPage(1);
                }}
                className="relative z-[100]"
            >
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-end pr-[300px]">
                    <div
                        className="w-[90%] max-w-2xl bg-white dark:bg-boxdark rounded-lg shadow-lg p-8 max-h-[80vh] overflow-y-auto"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-semibold text-black dark:text-white">
                                {testData.title || 'Untitled Test'}
                            </h2>
                            <button
                                onClick={() => setPreviewDialogOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {(shuffledQuestions.length > 0 ? shuffledQuestions : selectedQuestions)
                                .map((question, index) => {
                                    const editedQuestion = editedQuestions[question.id];
                                    const questionToUse = editedQuestion || question;
                                    const visibleAnswers = questionToUse.answers?.filter((_, idx) =>
                                        !editedQuestion?.hiddenAnswers?.[idx]
                                    );

                                    return (
                                        <div key={index} className="space-y-3">
                                            <div className="font-medium text-black dark:text-white">
                                                Question {index + 1}: {sanitizeHtml(questionToUse.question_text)}
                                            </div>
                                            <div className="pl-6 space-y-2">
                                                {visibleAnswers?.map((answer, ansIndex) => (
                                                    <div
                                                        key={ansIndex}
                                                        className="text-black dark:text-white"
                                                    >
                                                        {answerFormat.case === 'uppercase'
                                                            ? String.fromCharCode(65 + ansIndex)
                                                            : String.fromCharCode(97 + ansIndex)}
                                                        {answerFormat.separator} {sanitizeHtml(answer.answer_text)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default PreviewBlock; 