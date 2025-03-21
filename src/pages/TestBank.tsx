import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { fetchCourses, fetchCourseTests, deleteTest } from '../services/api';
import { Dialog } from '@headlessui/react';

interface Test {
    id: string;
    title: string;
    created_at: string;
    question_count: number;
    description?: string;
}

interface Course {
    id: string;
    name: string;
    course_id: string;
    owner: string;
}

// Mock data for tests
const mockTests: Test[] = [
    {
        id: '1',
        title: 'Midterm Exam',
        created_at: '2024-03-15',
        question_count: 30,
        description: 'Midterm examination covering chapters 1-5'
    },
    {
        id: '2',
        title: 'Final Exam',
        created_at: '2024-03-16',
        question_count: 50,
        description: 'Final examination covering all chapters'
    },
    {
        id: '3',
        title: 'Quiz 1',
        created_at: '2024-03-17',
        question_count: 15,
        description: 'Quick quiz on chapter 1'
    },
    {
        id: '4',
        title: 'Practice Test',
        created_at: '2024-03-18',
        question_count: 25,
        description: 'Practice test for midterm preparation'
    }
];

const TestBank = () => {
    const { courseId } = useParams();
    const [courses, setCourses] = useState<Course[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [testToDelete, setTestToDelete] = useState<Test | null>(null);
    const [selectedCourseName, setSelectedCourseName] = useState<string>('');
    const navigate = useNavigate();

    // Fetch courses on component mount
    useEffect(() => {
        const loadCourses = async () => {
            try {
                const coursesData = await fetchCourses();
                setCourses(coursesData);
            } catch (err) {
                setError('Failed to load courses');
            }
        };
        loadCourses();
    }, []);

    // Load mock tests when a course is selected
    useEffect(() => {
        if (!courseId) {
            setTests([]);
            return;
        }

        // Simulate API call with mock data
        setLoading(true);
        setTimeout(() => {
            setTests(mockTests);
            const course = courses.find(c => c.id === courseId);
            if (course) {
                setSelectedCourseName(course.name);
            }
            setLoading(false);
        }, 500); // Simulate loading delay
    }, [courseId, courses]);

    const handleDeleteClick = (test: Test) => {
        setTestToDelete(test);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!testToDelete || !courseId) return;

        try {
            // For mock data, just remove from state
            setTests(tests.filter(t => t.id !== testToDelete.id));
            setIsDeleteDialogOpen(false);
            setTestToDelete(null);
        } catch (err) {
            setError('Failed to delete test');
        }
    };

    return (
        <>
            <div className="mx-auto max-w-270">
                <Breadcrumb
                    pageName={courseId ? selectedCourseName : "Test Bank"}
                    currentName={courseId ? selectedCourseName : "Test Bank"}
                    breadcrumbItems={
                        courseId ? [
                            { name: "Home Page", path: "/" },
                            { name: "Test Bank", path: "/test-bank" },
                            { name: selectedCourseName, path: "#" }
                        ] : [
                            { name: "Home Page", path: "/" },
                            { name: "Test Bank", path: "/test-bank" }
                        ]
                    }
                />

                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    {!courseId ? (
                        // Courses List View
                        <div className="max-w-full overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                        <th className="min-w-[70px] py-4 px-4 font-medium text-black dark:text-white">
                                            No.
                                        </th>
                                        <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                            Course ID
                                        </th>
                                        <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                                            Name
                                        </th>
                                        <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                            Owner
                                        </th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map((course, index) => (
                                        <tr key={course.id}>
                                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                {index + 1}
                                            </td>
                                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                {course.course_id}
                                            </td>
                                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                <p className="text-black dark:text-white">
                                                    {course.name}
                                                </p>
                                            </td>
                                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                {course.owner}
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
                    ) : (
                        // Tests List View
                        <div className="max-w-full overflow-x-auto">
                            <div className="flex items-center justify-between py-5 px-6.5">
                                <h4 className="text-xl font-semibold text-black dark:text-white">
                                    Tests List
                                </h4>
                                <Link
                                    to={`/courses/${courseId}/create-test`}
                                    className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
                                >
                                    Create Test
                                </Link>
                            </div>
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                        <th className="min-w-[70px] py-4 px-4 font-medium text-black dark:text-white">
                                            No.
                                        </th>
                                        <th className="min-w-[250px] py-4 px-4 font-medium text-black dark:text-white">
                                            Title
                                        </th>
                                        <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                            Created At
                                        </th>
                                        <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
                                            Questions
                                        </th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4">
                                                Loading tests...
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4 text-danger">
                                                {error}
                                            </td>
                                        </tr>
                                    ) : tests.length > 0 ? (
                                        tests.map((test, index) => (
                                            <tr key={test.id}>
                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                    {index + 1}
                                                </td>
                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                    <Link
                                                        to={`/courses/${courseId}/tests/${test.id}`}
                                                        className="text-black hover:text-primary dark:text-white"
                                                    >
                                                        {test.title}
                                                    </Link>
                                                </td>
                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                    {new Date(test.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                    <span className="text-meta-3">
                                                        {test.question_count}
                                                    </span>
                                                </td>
                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                    <div className="flex items-center space-x-3.5">
                                                        <button
                                                            onClick={() => navigate(`/courses/${courseId}/tests/${test.id}/edit`)}
                                                            className="hover:text-primary"
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
                                                                    d="M16.4999 2.25L15.7499 1.5C15.3374 1.0875 14.6624 1.0875 14.2499 1.5L13.4999 2.25L15.7499 4.5L16.4999 3.75C16.9124 3.3375 16.9124 2.6625 16.4999 2.25ZM12.7499 3L10.4999 5.25L13.4999 8.25L15.7499 6L12.7499 3ZM8.24994 7.5L1.49994 14.25V17.25H4.49994L11.2499 10.5L8.24994 7.5Z"
                                                                    fill=""
                                                                />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(test)}
                                                            className="hover:text-primary"
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
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                                No tests found for this course. Create one to get started!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md rounded-lg bg-white dark:bg-boxdark p-6">
                        <Dialog.Title className="text-lg font-medium text-black dark:text-white mb-4">
                            Delete Test
                        </Dialog.Title>

                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Are you sure you want to delete "{testToDelete?.title}"? This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setIsDeleteDialogOpen(false)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/80"
                            >
                                Delete
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
    );
};

export default TestBank; 