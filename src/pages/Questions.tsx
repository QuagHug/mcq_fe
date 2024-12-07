import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Questions = () => {
    const { courseId, chapterId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const courseName = location.state?.courseName || "Computer Network";
    const chapterName = location.state?.chapterName || "Chapter 1";


    const truncateText = (text: string, maxLength: number = 50) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    const questions = [
        {
            id: 'Q001',
            question: 'What is the OSI model and how does it function in computer networking? Explain the different layers and their purposes in detail.',
            type: 'One question',
            difficulty: 'Understand',
            lastModified: '2024-03-20',
        },
        {
            id: 'Q002',
            question: 'Explain the difference between TCP and UDP protocols in terms of connection, reliability, and use cases.',
            type: 'Multiple questions',
            difficulty: 'Apply',
            lastModified: '2024-03-19',
        },
    ];

    const handleQuestionClick = (questionId: string) => {
        navigate(`/courses/${courseId}/question-banks/${chapterId}/questions/${questionId}`, {
            state: {
                courseName: courseName,
                chapterName: chapterName
            }
        });
    };


    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 3;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="space-y-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-8">
                    <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                        {chapterName}
                    </h2>

                    <button className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90">
                        Pagination
                    </button>
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
                                    Type
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
                                            {truncateText(question.question)}
                                        </Link>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {question.type}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {question.difficulty}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {question.lastModified}
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
                                            <button className="hover:text-danger">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
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

            {/* Pagination Component */}
            <div className="flex justify-center items-center space-x-2 mt-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="hover:text-primary"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>
                {[...Array(totalPages)].map((_, index) => (
                    <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-2 py-1 ${currentPage === index + 1 ? 'text-primary' : 'hover:text-primary'}`}
                    >
                        {index + 1}
                    </button>
                ))}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="hover:text-primary"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Questions; 