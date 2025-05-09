import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Editor } from '@tinymce/tinymce-react';
import { fetchQuestionDetail, editQuestion, addQuestion } from '../services/api';
import Paraphraser from '../components/Paraphraser';

const QuestionEdit = () => {
    const [questionContent, setQuestionContent] = useState('');
    const [answers, setAnswers] = useState<Array<{
        id: string;
        text: string;
        explanation: string;
        grade: string;
    }>>([]);
    const [expandedAnswers, setExpandedAnswers] = useState<string[]>([]);
    const { courseId, chapterId, questionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const courseName = location.state?.courseName || "Computer Network";
    const chapterName = location.state?.chapterName || `Chapter ${chapterId}`;
    const returnPath = location.state?.returnPath;
    const returnState = location.state?.returnState;
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
        if (expandedAnswers.length === answers.length) {
            setExpandedAnswers([]);
        } else {
            setExpandedAnswers(answers.map(answer => answer.id));
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

    const handleParaphraseComplete = async (paraphrasedText: string) => {
        if (!courseId || !chapterId || !questionId) return;
        
        try {
            setQuestionContent(`<p>${paraphrasedText}</p>`);
            
            // Prepare the question data
            const questionData = {
                question_text: `<p>${paraphrasedText}</p>`,
                answers: answers.map(answer => ({
                    answer_text: answer.text,
                    explanation: answer.explanation,
                    is_correct: answer.grade === '100',
                    ...(answer.id ? { id: answer.id } : {})
                }))
            };
            
            // Call the API to update the question
            await editQuestion(courseId, chapterId, questionId, questionData);
            return true;
        } catch (error) {
            console.error('Error updating question:', error);
            throw error;
        }
    };

    const handleCreateNewQuestion = async (paraphrasedText: string) => {
        if (!courseId || !chapterId) return;

        try {
            // Create a new question with the paraphrased text
            const questionData = {
                question_bank: chapterId,
                question_text: `<p>${paraphrasedText}</p>`,
                answers: answers.map(answer => ({
                    answer_text: answer.text,
                    explanation: answer.explanation,
                    is_correct: answer.grade === '100'
                }))
            };

            // Use the addQuestion API function to create a new question
            const newQuestion = await addQuestion(courseId, chapterId, questionData);
            
            // Navigate to the new question
            navigate(`/courses/${courseId}/question-banks/${chapterId}/questions/${newQuestion.id}/edit`, {
                state: { courseName, chapterName }
            });
        } catch (error) {
            console.error('Error creating new question:', error);
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
                        apiKey="it0vzbrjmv1qzhgge99xqz12j84evhl7q00gf4b0v3ylwlfx"
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
                    <div className="flex gap-4 mt-4">
                        <div className="w-1/2">
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                                Difficulty
                            </label>
                            <select
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div className="w-1/2">
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                                Taxonomy
                            </label>
                            <select
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            >
                                <option value="remember">Remember</option>
                                <option value="understand">Understand</option>
                                <option value="apply">Apply</option>
                                <option value="analyze">Analyze</option>
                                <option value="evaluate">Evaluate</option>
                                <option value="create">Create</option>
                            </select>
                        </div>
                    </div>
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
                                        apiKey="it0vzbrjmv1qzhgge99xqz12j84evhl7q00gf4b0v3ylwlfx"
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
                                        apiKey="it0vzbrjmv1qzhgge99xqz12j84evhl7q00gf4b0v3ylwlfx"
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

            {/* Paraphraser Section */}
            <Paraphraser 
                questionText={questionContent} 
                onParaphraseComplete={handleParaphraseComplete}
                onCreateNewQuestion={handleCreateNewQuestion}
            />

            {/* Save and Paraphrase Button Section */}
            <div className="flex justify-end gap-4">
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