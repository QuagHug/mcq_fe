import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchQuestions, deleteQuestion, bulkCreateQuestions } from '../services/api';
import { saveAs } from 'file-saver';

interface Question {
    id: number;
    question_text: string;
    image_url: string | null;
    type: string;
    updated_at: string;
    taxonomies: Array<{
        id: number;
        taxonomy: {
        id: number;
            name: string;
            description: string;
            category: string;
            levels: string[];
        };
        level: string;
        difficulty: string;
    }>;
    answers: Array<{
        id: number;
        answer_text: string;
        is_correct: boolean;
        explanation: string;
    }>;
}

const Questions = () => {
    const { courseId, chapterId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const courseName = location.state?.courseName || "Computer Network";
    const chapterName = location.state?.chapterName || "Chapter 1";

    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState<{ id: number; text: string } | null>(null);

    useEffect(() => {
        const loadQuestions = async () => {
            if (!courseId || !chapterId) return;
            try {
                const data = await fetchQuestions(courseId, chapterId);
                setQuestions(data);
            } catch (err) {
                setError('Failed to load questions');
            } finally {
                setLoading(false);
            }
        };
        
        loadQuestions();
    }, [courseId, chapterId]);

    // Helper function to truncate text and strip HTML tags
    const truncateText = (text: string, maxLength: number = 50) => {
        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        if (textContent.length <= maxLength) return textContent;
        return textContent.slice(0, maxLength) + '...';
    };

    const handleQuestionClick = (questionId: string) => {
        navigate(`/courses/${courseId}/question-banks/${chapterId}/questions/${questionId}`, {
            state: {
                courseName: courseName,
                chapterName: chapterName
            }
        });
    };

    const handleDeleteClick = (questionId: number, questionText: string) => {
        setQuestionToDelete({ id: questionId, text: questionText });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!questionToDelete || !courseId || !chapterId) return;

        try {
            await deleteQuestion(courseId, chapterId, String(questionToDelete.id));
            setQuestions(prev => prev.filter(question => question.id !== questionToDelete.id));
            setShowDeleteModal(false);
            setQuestionToDelete(null);
        } catch (err) {
            setError('Failed to delete question');
        }
    };

    const handleExport = () => {
        const exportData = questions.map(q => ({
            question_text: q.question_text,
            image_url: q.image_url,
            answers: q.answers.map(a => ({
                answer_text: a.answer_text,
                is_correct: a.is_correct,
                explanation: a.explanation
            })),
            taxonomies: q.taxonomies.map(t => ({
                taxonomy_id: t.taxonomy.id,
                level: t.level,
                difficulty: t.difficulty
            }))
        }));
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sanitizedBankName = chapterName.replace(/[^a-zA-Z0-9-_]/g, '_');
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        saveAs(blob, `${sanitizedBankName}-${timestamp}.json`);
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !courseId || !chapterId) return;

        try {
            const text = await file.text();
            const importedQuestions = JSON.parse(text);
            
            await bulkCreateQuestions(courseId, chapterId, importedQuestions);
            
            // Refresh questions list
            const data = await fetchQuestions(courseId, chapterId);
            setQuestions(data);
            
            event.target.value = '';
        } catch (err) {
            setError('Failed to import questions');
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-8">
                    <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                        {chapterName}
                    </h2>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-white hover:bg-opacity-90"
                        >
                            Export Questions
                        </button>
                        <label className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-white hover:bg-opacity-90 cursor-pointer">
                            Import Questions
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                <nav>
                    <ol className="flex items-center gap-2">
                        <li>
                            <Link to="/" className="text-[#64748B] hover:text-primary">
                                Home Page
                            </Link>
                        </li>
                        <span className="text-[#64748B]">/</span>
                        <li>
                            <Link to="/courses" className="text-[#64748B] hover:text-primary">
                                Courses
                            </Link>
                        </li>
                        <span className="text-[#64748B]">/</span>
                        <li>
                            <Link
                                to={`/courses/${courseId}/question-banks`}
                                state={{ courseName }}
                                className="text-[#64748B] hover:text-primary"
                            >
                                {courseName}
                            </Link>
                        </li>
                        <span className="text-[#64748B]">/</span>
                        <li className="text-primary">
                            {chapterName}
                        </li>
                    </ol>
                </nav>
            </div>

            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[50px] py-4 px-4 font-medium text-black dark:text-white">
                                    No.
                                </th>
                                <th className="min-w-[350px] py-4 px-4 font-medium text-black dark:text-white">
                                    Question
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    Bloom's Level
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    Last Modified
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map((question, index) => (
                                <tr key={question.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {index + 1}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <Link
                                            to={`/courses/${courseId}/question-banks/${chapterId}/questions/${question.id}`}
                                            state={{
                                                courseName,
                                                chapterName,
                                                questionData: question,
                                                returnPath: location.pathname,
                                                returnState: { courseName, chapterName }
                                            }}
                                            className="text-black dark:text-white hover:text-primary"
                                        >
                                            {truncateText(question.question_text)}
                                        </Link>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {question.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level || 'N/A'}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {new Date(question.updated_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <Link
                                                to={`/courses/${courseId}/question-banks/${chapterId}/questions/${question.id}/edit`}
                                                state={{
                                                    courseName,
                                                    chapterName,
                                                    questionData: question,
                                                    returnPath: location.pathname,
                                                    returnState: { courseName, chapterName }
                                                }}
                                                className="hover:text-success"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </Link>
                                            <button 
                                                className="hover:text-danger"
                                                onClick={() => handleDeleteClick(question.id, question.question_text)}
                                            >
                                                <svg
                                                    className="fill-current"
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2719H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z"
                                                        fill=""
                                                    />
                                                    <path
                                                        d="M9.00039 9.11255C8.66289 9.11255 8.35352 9.3938 8.35352 9.75942V13.3313C8.35352 13.6688 8.63477 13.9782 9.00039 13.9782C9.33789 13.9782 9.64727 13.6969 9.64727 13.3313V9.75942C9.64727 9.3938 9.33789 9.11255 9.00039 9.11255Z"
                                                        fill=""
                                                    />
                                                    <path
                                                        d="M11.2502 9.67504C10.8846 9.64692 10.6033 9.90004 10.5752 10.2657L10.4064 12.7407C10.3783 13.0782 10.6314 13.3875 10.9971 13.4157C11.0252 13.4157 11.0252 13.4157 11.0533 13.4157C11.3908 13.4157 11.6721 13.1625 11.6721 12.825L11.8408 10.35C11.8408 9.98442 11.5877 9.70317 11.2502 9.67504Z"
                                                        fill=""
                                                    />
                                                    <path
                                                        d="M6.72245 9.67504C6.38495 9.70317 6.1037 10.0125 6.13182 10.35L6.3287 12.825C6.35683 13.1625 6.63808 13.4157 6.94745 13.4157C6.97558 13.4157 6.97558 13.4157 7.0037 13.4157C7.3412 13.3875 7.62245 13.0782 7.59433 12.7407L7.39745 10.2657C7.39745 9.90004 7.08808 9.64692 6.72245 9.67504Z"
                                                        fill=""
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-999 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="w-full max-w-md rounded-sm border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
                        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                            Delete Question
                        </h3>
                        <p className="mb-6 text-body">
                            Are you sure you want to delete this question? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-4">
                            <button
                                className="inline-flex items-center justify-center rounded-md border border-stroke py-2 px-6 text-center font-medium hover:bg-opacity-90 dark:border-strokedark"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="inline-flex items-center justify-center rounded-md bg-danger py-2 px-6 text-center font-medium text-white hover:bg-opacity-90"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Questions; 