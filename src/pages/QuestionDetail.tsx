import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { fetchQuestionDetail } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';

interface Answer {
    id: number;
    answer_text: string;
    is_correct: boolean;
    explanation: string;
}

interface QuestionData {
    id: number;
    question_text: string;
    image_url: string | null;
    answers: Answer[];
    taxonomies?: { taxonomy: { name: string }; level: string }[];
    difficulty?: 'easy' | 'medium' | 'hard';
}

const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const QuestionDetail = () => {
    const { courseId, chapterId, questionId } = useParams();
    const location = useLocation();
    const [questionData, setQuestionData] = useState<QuestionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedAnswers, setExpandedAnswers] = useState<number[]>([]);

    const courseName = location.state?.courseName;
    const chapterName = location.state?.chapterName;

    useEffect(() => {
        const loadQuestionDetail = async () => {
            if (!courseId || !chapterId || !questionId) return;
            try {
                const data = await fetchQuestionDetail(courseId, chapterId, questionId);
                console.log('Fetched question data:', data);
                setQuestionData(data);
            } catch (err) {
                console.error('Error loading question:', err);
                setError('Failed to load question details');
            } finally {
                setLoading(false);
            }
        };

        loadQuestionDetail();
    }, [courseId, chapterId, questionId]);

    const toggleExplanation = (answerId: number) => {
        setExpandedAnswers(prev =>
            prev.includes(answerId)
                ? prev.filter(id => id !== answerId)
                : [...prev, answerId]
        );
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;
    if (!questionData) return <div>Question not found</div>;

    return (
        <>
            <Breadcrumb
                pageName="Question Detail"
                currentName="Question"
                breadcrumbItems={[
                    { name: "Home Page", path: "/courses" },
                    { name: courseName || "DSA", path: `/courses/${courseId}`, state: { courseName } },
                    {
                        name: `${chapterName || "Chapter"}`,
                        path: `/courses/${courseId}/question-banks/${chapterId}`,
                        state: { courseName, chapterName }
                    },
                    { name: "Question", path: "#" }
                ]}
            />

            <div className="flex flex-col gap-5">
                {/* Question Section */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                        <h3 className="text-2xl font-semibold text-black dark:text-white">
                            Question
                        </h3>
                    </div>
                    <div className="px-6.5 py-4">
                        <div dangerouslySetInnerHTML={{ __html: questionData.question_text }} />
                        <div className="flex gap-3 mt-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                (() => {
                                    const difficulty = questionData.difficulty || 'medium';
                                    switch (difficulty.toLowerCase()) {
                                        case 'easy':
                                            return 'bg-success/10 text-success';
                                        case 'hard':
                                            return 'bg-danger/10 text-danger';
                                        default: // medium
                                            return 'bg-primary/10 text-primary';
                                    }
                                })()
                            }`}>
                                {capitalizeFirstLetter(questionData.difficulty || 'Medium')}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                (() => {
                                    const level = questionData.taxonomies?.find(tax => 
                                        tax.taxonomy.name === "Bloom's Taxonomy")?.level?.toLowerCase() || 'remember';
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
                                })()
                            }`}>
                                {questionData.taxonomies?.find(tax => 
                                    tax.taxonomy.name === "Bloom's Taxonomy")?.level || 'Remember'}
                            </span>
                        </div>
                        {questionData.image_url && (
                            <img
                                src={questionData.image_url}
                                alt="Question"
                                className="mt-4 max-w-full h-auto"
                            />
                        )}
                    </div>
                </div>

                {/* Answers Section */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
                        <h3 className="text-2xl font-semibold text-black dark:text-white">
                            Answers
                        </h3>
                        <button
                            onClick={() => setExpandedAnswers(prev =>
                                prev.length === questionData.answers.length ? [] : questionData.answers.map(a => a.id)
                            )}
                            className="text-sm text-black dark:text-white font-medium hover:text-opacity-80 flex items-center gap-2"
                        >
                            <span>{expandedAnswers.length === questionData.answers.length ? 'Collapse All' : 'Expand All'}</span>
                            <svg
                                className={`fill-current transform transition-transform duration-300 ${expandedAnswers.length === questionData.answers.length ? 'rotate-180' : ''
                                    }`}
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M5.29289 7.29289C5.68342 6.90237 6.31658 6.90237 6.70711 7.29289L10 10.5858L13.2929 7.29289C13.6834 6.90237 14.3166 6.90237 14.7071 7.29289C15.0976 7.68342 15.0976 8.31658 14.7071 8.70711L10.7071 12.7071C10.3166 13.0976 9.68342 13.0976 9.29289 12.7071L5.29289 8.70711C4.90237 8.31658 4.90237 7.68342 5.29289 7.29289Z"
                                    fill=""
                                ></path>
                            </svg>
                        </button>
                    </div>
                    <div className="px-6.5 py-4">
                        {questionData?.answers?.map((answer, index) => (
                            <div
                                key={answer.id}
                                className={`mb-3 rounded-lg border ${answer.is_correct
                                    ? 'bg-success/10 border-success'
                                    : 'bg-danger/10 border-danger'
                                    }`}
                            >
                                <div
                                    className="p-4 cursor-pointer"
                                    onClick={() => toggleExplanation(answer.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-2">
                                            <span className={`font-medium ${answer.is_correct ? 'text-success' : 'text-danger'
                                                }`}>
                                                {String.fromCharCode(65 + index)}.
                                            </span>
                                            <div className={
                                                answer.is_correct ? 'text-success' : 'text-danger'
                                            }>
                                                <div className={`font-medium ${answer.is_correct ? 'text-success' : 'text-danger'
                                                    }`}>
                                                    {answer.answer_text.replace(/<\/?p>/g, '')}
                                                </div>
                                            </div>
                                        </div>
                                        <svg
                                            className={`fill-current transform transition-transform duration-300 ${expandedAnswers.includes(answer.id) ? 'rotate-180' : ''
                                                } ${answer.is_correct ? 'text-success' : 'text-danger'
                                                }`}
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M5.29289 7.29289C5.68342 6.90237 6.31658 6.90237 6.70711 7.29289L10 10.5858L13.2929 7.29289C13.6834 6.90237 14.3166 6.90237 14.7071 7.29289C15.0976 7.68342 15.0976 8.31658 14.7071 8.70711L10.7071 12.7071C10.3166 13.0976 9.68342 13.0976 9.29289 12.7071L5.29289 8.70711C4.90237 8.31658 4.90237 7.68342 5.29289 7.29289Z"
                                                fill=""
                                            ></path>
                                        </svg>
                                    </div>
                                    {expandedAnswers.includes(answer.id) && answer.explanation && (
                                        <div className="transition-all duration-300 ease-in-out">
                                            <div className={`my-3 border-t-2 ${answer.is_correct ? 'border-success' : 'border-danger'
                                                }`}></div>
                                            <div className={`pl-6 text-sm font-normal ${answer.is_correct ? 'text-success' : 'text-danger'
                                                }`}>
                                                {answer.explanation.replace(/<\/?p>/g, '')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default QuestionDetail;