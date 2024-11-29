import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const QuestionBanks = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const courseName = location.state?.courseName || "Computer Network";

    const handleChapterClick = (chapterId: string, chapterName: string) => {
        navigate(`/courses/${courseId}/question-banks/${chapterId}`, {
            state: {
                courseName: courseName,
                chapterName: chapterName
            }
        });
    };

    const questionBanks = [
        {
            id: 'QB_001',
            name: 'Chapter 1: Introduction',
            questionCount: 25,
            lastModified: '2024-03-15'
        },
        {
            id: 'QB_002',
            name: 'Chapter 2: Basic Concepts',
            questionCount: 30,
            lastModified: '2024-03-16'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-8">
                    <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                        {courseName}
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
                        <li className="text-primary">
                            {courseName}
                        </li>
                    </ol>
                </nav>
            </div>

            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[70px] py-4 px-4 font-medium text-black dark:text-white">
                                    No.
                                </th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                                    Question Bank
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    Questions
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
                            {questionBanks.map((bank, index) => (
                                <tr key={bank.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {index + 1}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <Link
                                            to={`/courses/${courseId}/question-banks/${bank.id}`}
                                            state={{
                                                courseName: courseName,
                                                chapterName: bank.name
                                            }}
                                            className="text-[#64748B] hover:text-primary"
                                        >
                                            {bank.name}
                                        </Link>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {bank.questionCount}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {bank.lastModified}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button className="hover:text-success">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
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
        </div>
    );
};

export default QuestionBanks; 