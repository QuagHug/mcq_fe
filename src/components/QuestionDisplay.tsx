import React from 'react';

interface Answer {
    id: string;
    answer_text: string;
    is_correct: boolean;
    explanation?: string;
}

interface Question {
    id: string | number;
    question_text: string;
    answers: Answer[];
    difficulty?: 'easy' | 'medium' | 'hard';
    taxonomyLevel?: string;
    statistics?: {
        scaled_difficulty: number;
        scaled_discrimination: number;
    };
}

interface QuestionDisplayProps {
    question: Question;
    index: number;
    showAnswers?: boolean;
    showStats?: boolean;
    configuration?: {
        letterCase: 'uppercase' | 'lowercase';
        separator: string;
        includeAnswerKey: boolean;
    };
    onQuestionClick?: (question: Question) => void;
    actionButton?: React.ReactNode;
    className?: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
    question,
    index,
    showAnswers = false,
    showStats = true,
    configuration,
    onQuestionClick,
    actionButton,
    className = ''
}) => {
    const truncateText = (text: string, maxLength: number = 100) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        if (textContent.length <= maxLength) return textContent;
        return textContent.slice(0, maxLength) + '...';
    };

    return (
        <div className={`p-4 border rounded-sm dark:border-strokedark ${className}`}>
            <div className="flex justify-between items-center">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">{index + 1}.</span>
                        <div
                            className="cursor-pointer hover:text-primary"
                            onClick={() => onQuestionClick?.(question)}
                        >
                            <span dangerouslySetInnerHTML={{ __html: truncateText(question.question_text) }} />
                            {showStats && question.statistics && (
                                <span className="text-xs text-gray-500 ml-2">
                                    (D: {question.statistics.scaled_difficulty.toFixed(2)},
                                    Disc: {question.statistics.scaled_discrimination.toFixed(2)})
                                </span>
                            )}
                        </div>
                    </div>

                    {showAnswers && question.answers && (
                        <div className="mt-4 space-y-2">
                            {question.answers.map((answer, ansIndex) => (
                                <div
                                    key={answer.id}
                                    className={`flex items-start p-3 rounded-sm ${answer.is_correct && configuration?.includeAnswerKey
                                            ? 'bg-success/10 border-success'
                                            : 'bg-gray-50 dark:bg-meta-4'
                                        }`}
                                >
                                    <span className="mr-2 min-w-[24px] flex-shrink-0">
                                        {configuration?.letterCase === 'uppercase'
                                            ? String.fromCharCode(65 + ansIndex)
                                            : String.fromCharCode(97 + ansIndex)}
                                        {configuration?.separator}
                                    </span>
                                    <div
                                        className="flex-1"
                                        dangerouslySetInnerHTML={{ __html: answer.answer_text }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-8">
                    {question.difficulty && (
                        <span className={`text-xs px-2 py-1 rounded w-24 text-center ${question.difficulty === 'easy' ? 'bg-success/10 text-success' :
                                question.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                                    'bg-danger/10 text-danger'
                            }`}>
                            {question.difficulty}
                        </span>
                    )}
                    {question.taxonomyLevel && (
                        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary w-24 text-center">
                            {question.taxonomyLevel}
                        </span>
                    )}
                    {actionButton}
                </div>
            </div>
        </div>
    );
};

export default QuestionDisplay; 