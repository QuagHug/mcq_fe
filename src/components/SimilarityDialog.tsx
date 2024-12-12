import React from 'react';

interface SimilarQuestion {
    id: string;
    question: string;
    similarity: number;
    questionBank: string;
}

interface SimilarityDialogProps {
    isOpen: boolean;
    onClose: () => void;
    similarQuestions: SimilarQuestion[];
}

const SimilarityDialog: React.FC<SimilarityDialogProps> = ({ isOpen, onClose, similarQuestions }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

            {/* Dialog */}
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="relative bg-white dark:bg-boxdark rounded-lg shadow-xl max-w-2xl w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark">
                        <h3 className="text-xl font-semibold text-black dark:text-white">
                            Similar Questions
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="space-y-4">
                            {similarQuestions.map((question) => (
                                <div
                                    key={question.id}
                                    className="border border-stroke dark:border-strokedark rounded-lg p-4"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <p className="text-black dark:text-white">{question.question}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Question Bank: {question.questionBank}
                                            </p>
                                        </div>
                                        <span className="ml-4 px-2 py-1 bg-primary/10 text-primary rounded">
                                            {question.similarity}% similar
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-4 p-4 border-t border-stroke dark:border-strokedark">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-primary hover:text-white dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-primary dark:hover:text-white transition-all duration-200 hover:shadow-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimilarityDialog; 