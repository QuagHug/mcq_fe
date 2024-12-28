import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Editor } from '@tinymce/tinymce-react';
import { fetchQuestionDetail, editQuestion } from '../services/api';

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

const QuestionEdit = () => {
    const [questionData] = useState(MOCK_QUESTION_DATA);
    const [expandedAnswers, setExpandedAnswers] = useState<string[]>([]);
    const { courseId, chapterId, questionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const courseName = location.state?.courseName || "Computer Network";
    const chapterName = location.state?.chapterName || `Chapter ${chapterId}`;
    const returnPath = location.state?.returnPath;
    const returnState = location.state?.returnState;
    const [questionContent, setQuestionContent] = useState(questionData.question);
    const [answers, setAnswers] = useState(questionData.answers.map(answer => ({
        ...answer,
        text: answer.text,
        explanation: answer.explanation,
        grade: answer.isCorrect ? '100' : '0'
    })));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadQuestion = async () => {
            if (!courseId || !chapterId || !questionId) return;
            try {
                const data = await fetchQuestionDetail(courseId, chapterId, questionId);
                setQuestionContent(data.question_text);
                setAnswers(data.answers.map((answer: any) => ({
                    id: answer.id,
                    text: answer.answer_text,
                    explanation: answer.explanation,
                    grade: answer.is_correct ? '100' : '0'
                })));
            } catch (error) {
                console.error('Error loading question:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadQuestion();
    }, [courseId, chapterId, questionId]);

    const handleGoBack = () => {
        if (returnPath) {
            navigate(returnPath, { state: returnState });
        } else {
            navigate(`/courses/${courseId}/question-banks/${chapterId}`, {
                state: { courseName, chapterName }
            });
        }
    };

    const handleExpandCollapseAll = () => {
        if (expandedAnswers.length === questionData.answers.length) {
            setExpandedAnswers([]);
        } else {
            setExpandedAnswers(questionData.answers.map(answer => answer.id));
        }
    };

    const toggleExplanation = (answerId: string) => {
        setExpandedAnswers(prev =>
            prev.includes(answerId)
                ? prev.filter(id => id !== answerId)
                : [...prev, answerId]
        );
    };

    const handleEditorChange = (content: string) => {
        setQuestionContent(content);
    };

    const handleAnswerChange = (answerId: string, content: string) => {
        setAnswers(prev => prev.map(answer =>
            answer.id === answerId ? { ...answer, text: content } : answer
        ));
    };

    const handleExplanationChange = (answerId: string, content: string) => {
        setAnswers(prev => prev.map(answer =>
            answer.id === answerId ? { ...answer, explanation: content } : answer
        ));
    };

    const handleGradeChange = (answerId: string, grade: string) => {
        setAnswers(prev => prev.map(answer =>
            answer.id === answerId ? { ...answer, grade } : answer
        ));
    };

    const handleSave = async () => {
        if (!courseId || !chapterId || !questionId) return;

        try {
            // Create a temporary div to parse HTML
            const sanitizeHtml = (html: string) => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                return tempDiv.innerHTML;
            };

            const questionData = {
                question_text: sanitizeHtml(questionContent),
                answers: answers.map(answer => ({
                    answer_text: sanitizeHtml(answer.text),
                    explanation: sanitizeHtml(answer.explanation),
                    is_correct: answer.grade === '100',
                    ...(answer.id ? { id: answer.id } : {})
                }))
            };

            console.log('Sending data:', questionData); // Debug log
            await editQuestion(courseId, chapterId, questionId, questionData);
            handleGoBack();
        } catch (error) {
            console.error('Error saving question:', error);
        }
    };

    return (
        <div className="space-y-6">
            <Breadcrumb
                pageName=""
                currentName={`Question ${questionId}`}
                breadcrumbItems={[
                    { name: "Home Page", path: "/" },
                    { name: "Courses", path: "/courses" },
                    { name: courseName, path: `/courses/${courseId}/question-banks`, state: { courseName } },
                    { name: chapterName, path: `/courses/${courseId}/question-banks/${chapterId}`, state: { courseName, chapterName } }
                ]}
            />

            {/* Question Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="text-2xl font-semibold text-black dark:text-white">
                        Question
                    </h3>
                </div>
                <div className="px-6.5 py-4">
                    <Editor
                        apiKey="gwxmqxpn8j1388tusd75evl4dpgvbwiqy6c4me5acrwqplum"
                        value={questionContent}
                        init={{
                            height: 250,
                            menubar: true,
                            plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                                'equation'
                            ],
                            toolbar: 'undo redo | blocks | ' +
                                'bold italic forecolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'removeformat | table | equation | help',
                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                        }}
                        onEditorChange={handleEditorChange}
                    />
                </div>
            </div>

            {/* Answer Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="text-2xl font-semibold text-black dark:text-white">
                        Answers
                    </h3>
                </div>
                <div className="p-6.5">
                    <div className="space-y-4">
                        {answers.map((answer, index) => (
                            <div
                                key={answer.id}
                                className="border rounded-md p-4 transition-all duration-200 bg-white dark:bg-boxdark"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="font-semibold text-black dark:text-white">
                                        {String.fromCharCode(65 + index)}.
                                    </span>
                                </div>

                                {/* Answer Text Editor */}
                                <div className="mb-4">
                                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                                        Answer Text
                                    </label>
                                    <Editor
                                        apiKey="gwxmqxpn8j1388tusd75evl4dpgvbwiqy6c4me5acrwqplum"
                                        value={answer.text}
                                        init={{
                                            height: 250,
                                            menubar: false,
                                            plugins: [
                                                'advlist', 'autolink', 'lists', 'link', 'image',
                                                'charmap', 'preview', 'anchor', 'searchreplace',
                                                'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                                                'media', 'table', 'code', 'help', 'wordcount', 'equation'
                                            ],
                                            toolbar: 'undo redo | formatselect | ' +
                                                'bold italic forecolor | alignleft aligncenter ' +
                                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                                'removeformat | equation | help',
                                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                                        }}
                                        onEditorChange={(content) => handleAnswerChange(answer.id, content)}
                                    />
                                </div>

                                {/* Grade Dropdown */}
                                <div className="mb-4 flex items-center gap-4">
                                    <label className="font-medium text-black dark:text-white min-w-[60px]">
                                        Grade
                                    </label>
                                    <select
                                        value={answer.grade}
                                        onChange={(e) => handleGradeChange(answer.id, e.target.value)}
                                        className="w-[200px] rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="100">100%</option>
                                        <option value="50">50%</option>
                                        <option value="10">10%</option>
                                        <option value="5">5%</option>
                                        <option value="0">0%</option>
                                    </select>
                                </div>

                                {/* Explanation Editor */}
                                <div>
                                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                                        Explanation
                                    </label>
                                    <Editor
                                        apiKey="gwxmqxpn8j1388tusd75evl4dpgvbwiqy6c4me5acrwqplum"
                                        value={answer.explanation}
                                        init={{
                                            height: 250,
                                            menubar: false,
                                            plugins: [
                                                'advlist', 'autolink', 'lists', 'link', 'image',
                                                'charmap', 'preview', 'anchor', 'searchreplace',
                                                'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                                                'media', 'table', 'code', 'help', 'wordcount', 'equation'
                                            ],
                                            toolbar: 'undo redo | formatselect | ' +
                                                'bold italic forecolor | alignleft aligncenter ' +
                                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                                'removeformat | equation | help',
                                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                                        }}
                                        onEditorChange={(content) => handleExplanationChange(answer.id, content)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Save and Paraphrase Button Section */}
            <div className="flex justify-end gap-4">
                <button className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90">
                    Paraphrase
                </button>

                <button
                    onClick={handleSave}
                    className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90"
                >
                    Save edits
                </button>
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

export default QuestionEdit; 