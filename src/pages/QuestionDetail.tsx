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
}

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
            <Breadcrumb pageName="Question Detail" />
            
            <div className="flex flex-col gap-5">
                <Link
                    to={`/courses/${courseId}/question-banks/${chapterId}`}
                    state={{ courseName, chapterName }}
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                    ← Back to Questions
                </Link>

                {/* Question Section */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                        <h3 className="text-2xl font-semibold text-black dark:text-white">
                            Question
                        </h3>
                    </div>
                    <div className="px-6.5 py-4">
                        <div dangerouslySetInnerHTML={{ __html: questionData.question_text }} />
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
                    <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                        <h3 className="text-2xl font-semibold text-black dark:text-white">
                            Answers
                        </h3>
                    </div>
                    <div className="px-6.5 py-4">
                        {questionData?.answers?.map((answer, index) => (
                            <div 
                                key={answer.id}
                                className={`p-4 mb-3 rounded-lg ${
                                    answer.is_correct 
                                        ? 'bg-success/10 border border-success'
                                        : 'bg-danger/10 border border-danger'
                                }`}
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-2">
                                            <span className={`font-medium ${
                                                answer.is_correct ? 'text-success' : 'text-danger'
                                            }`}>
                                                {String.fromCharCode(65 + index)}.
                                            </span>
                                            <div 
                                                className={`${
                                                    answer.is_correct ? 'text-success' : 'text-danger'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: answer.answer_text }} 
                                            />
                                        </div>
                                        {answer.explanation && (
                                            <button
                                                onClick={() => toggleExplanation(answer.id)}
                                                className={`flex items-center gap-2 text-sm hover:text-primary ${
                                                    answer.is_correct ? 'text-success' : 'text-danger'
                                                }`}
                                            >
                                                {expandedAnswers.includes(answer.id) ? (
                                                    <>
                                                        <span>Hide Explanation</span>
                                                        <svg
                                                            className="fill-current"
                                                            width="20"
                                                            height="20"
                                                            viewBox="0 0 20 20"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                clipRule="evenodd"
                                                                d="M14.7071 7.29289C14.3166 6.90237 13.6834 6.90237 13.2929 7.29289L10 10.5858L6.70711 7.29289C6.31658 6.90237 5.68342 6.90237 5.29289 7.29289C4.90237 7.68342 4.90237 8.31658 5.29289 8.70711L9.29289 12.7071C9.68342 13.0976 10.3166 13.0976 10.7071 12.7071L14.7071 8.70711C15.0976 8.31658 15.0976 7.68342 14.7071 7.29289Z"
                                                                fill=""
                                                            ></path>
                                                        </svg>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Show Explanation</span>
                                                        <svg
                                                            className="fill-current"
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
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    {answer.explanation && expandedAnswers.includes(answer.id) && (
                                        <div className={`mt-2 pl-6 text-sm ${
                                            answer.is_correct ? 'text-success' : 'text-danger'
                                        }`}>
                                            <span className="font-medium">Explanation: </span>
                                            <div dangerouslySetInnerHTML={{ __html: answer.explanation }} />
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