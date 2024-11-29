import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Breadcrumb from '../components/Breadcrumb';

const MOCK_QUESTION_DATA = {
    question: "What is the primary function of TCP/IP in computer networking?",
    answers: [
        {
            id: "A",
            text: "Transmission Control Protocol/Internet Protocol is responsible for data delivery between applications across diverse networks",
            explanation: "TCP/IP is indeed the fundamental communication protocol of the Internet, handling how data is packaged, addressed, transmitted, routed, and received.",
            isCorrect: true
        },
        {
            id: "B",
            text: "It's only used for web browsing",
            explanation: "This is incorrect. TCP/IP is used for much more than just web browsing, including email, file transfer, and remote administration.",
            isCorrect: false
        },
        {
            id: "C",
            text: "It's a programming language for network applications",
            explanation: "This is incorrect. TCP/IP is a protocol suite, not a programming language.",
            isCorrect: false
        },
        {
            id: "D",
            text: "It's a type of network cable",
            explanation: "This is incorrect. TCP/IP is a protocol suite, not a physical component like a network cable.",
            isCorrect: false
        }
    ]
};

const QuestionDetail = () => {
    const [questionData] = useState(MOCK_QUESTION_DATA);
    const [expandedAnswers, setExpandedAnswers] = useState<string[]>([]);
    const { courseId, chapterId, questionId } = useParams();
    const location = useLocation();
    const courseName = location.state?.courseName || "Computer Network";
    const chapterName = location.state?.chapterName || `Chapter ${chapterId}`;

    const toggleExplanation = (answerId: string) => {
        setExpandedAnswers(prev =>
            prev.includes(answerId)
                ? prev.filter(id => id !== answerId)
                : [...prev, answerId]
        );
    };

    const handleExpandCollapseAll = () => {
        if (expandedAnswers.length === questionData.answers.length) {
            setExpandedAnswers([]);
        } else {
            setExpandedAnswers(questionData.answers.map(answer => answer.id));
        }
    };

    return (
        <div className="space-y-6">
            <Breadcrumb
                pageName=""
                parentPath="/"
                parentName="Home Page"
                parentPath2="/courses"
                parentName2="Courses"
                parentPath3={`/courses/${courseId}/question-banks`}
                parentName3={courseName}
                parentPath4={`/courses/${courseId}/question-banks/${chapterId}`}
                parentName4={chapterName}
                currentName={`Question ${questionId}`}
            />

            <Link
                to={`/courses/${courseId}/question-banks/${chapterId}`}
                state={{
                    courseName: courseName,
                    chapterName: chapterName
                }}
            >
                {/* ... */}
            </Link>

            {/* Question Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="text-2xl font-semibold text-black dark:text-white">
                        Question
                    </h3>
                </div>
                <div className="px-6.5 py-4">
                    <p>{questionData.question}</p>
                </div>
            </div>

            {/* Answer Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
                    <h3 className="text-2xl font-semibold text-black dark:text-white">
                        Answers
                    </h3>
                    <button
                        onClick={handleExpandCollapseAll}
                        className="flex items-center gap-2 text-sm font-medium text-black hover:text-primary dark:text-white"
                    >
                        {expandedAnswers.length === questionData.answers.length ? (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                                </svg>
                                Collapse All
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                                Expand All
                            </>
                        )}
                    </button>
                </div>
                <div className="p-6.5">
                    <div className="space-y-4">
                        {questionData.answers.map((answer) => (
                            <div
                                key={answer.id}
                                className={`border rounded-md p-4 transition-all duration-200 ${answer.isCorrect
                                    ? 'bg-success/10 border-success'
                                    : 'bg-danger/10 border-danger'
                                    }`}
                            >
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => toggleExplanation(answer.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`font-semibold ${answer.isCorrect ? 'text-success' : 'text-danger'
                                            }`}>
                                            {answer.id}.
                                        </span>
                                        <p className={`font-medium ${answer.isCorrect ? 'text-success' : 'text-danger'
                                            }`}>
                                            {answer.text}
                                        </p>
                                    </div>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className={`w-5 h-5 transition-transform duration-200 ${expandedAnswers.includes(answer.id) ? 'rotate-180' : ''
                                            } ${answer.isCorrect ? 'text-success' : 'text-danger'
                                            }`}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m19.5 8.25-7.5 7.5-7.5-7.5"
                                        />
                                    </svg>
                                </div>

                                {expandedAnswers.includes(answer.id) && (
                                    <div className={`mt-4 pl-8 text-sm border-t pt-4 ${answer.isCorrect ? 'text-success border-success' : 'text-danger border-danger'
                                        }`}>
                                        {answer.explanation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <p className="text-body">
                    <span className="text-danger font-medium">NOTE:</span> There are questions in the bank that has 60% similarity
                </p>
                <button className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90">
                    View similarity
                </button>
            </div>
        </div>
    );
};

export default QuestionDetail; 