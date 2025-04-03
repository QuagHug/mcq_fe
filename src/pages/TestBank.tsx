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

    // Modify the courses fetch useEffect to use mock data
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

        const loadTests = async () => {
            try {
                setLoading(true);
                const courseTests = await fetchCourseTests(courseId);
                setTests(courseTests);
                const course = courses.find(c => c.id === courseId);
                if (course) {
                    setSelectedCourseName(course.name);
                }
            } catch (err) {
                setError('Failed to load tests');
            } finally {
                setLoading(false);
            }
        };

        loadTests();
    }, [courseId, courses]);

    const handleDeleteClick = (test: Test) => {
        setTestToDelete(test);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!testToDelete || !courseId) return;

        try {
            await deleteTest(courseId, testToDelete.id);
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
                                        <th className="min-w-[70px] py-4 px-8 font-medium text-black dark:text-white">
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
                                            <td className="border-b border-[#eee] py-5 px-8 dark:border-strokedark">
                                                {index + 1}
                                            </td>
                                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                {course.course_id}
                                            </td>
                                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                <Link
                                                    to={`/test-bank/${course.id}`}
                                                    className="text-black hover:text-primary dark:text-white"
                                                >
                                                    {course.name}
                                                </Link>
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
                            </div>
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                        <th className="min-w-[70px] py-4 px-8 font-medium text-black dark:text-white">
                                            No.
                                        </th>
                                        <th className="min-w-[250px] py-4 px-4 font-medium text-black dark:text-white">
                                            Title
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
                                            <td colSpan={4} className="text-center py-4">
                                                Loading tests...
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4 text-danger">
                                                {error}
                                            </td>
                                        </tr>
                                    ) : tests.length > 0 ? (
                                        tests.map((test, index) => (
                                            <tr key={test.id}>
                                                <td className="border-b border-[#eee] py-5 px-8 dark:border-strokedark">
                                                    {index + 1}
                                                </td>
                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                    <Link
                                                        to={`/test-bank/${courseId}/tests/${test.id}`}
                                                        className="text-black hover:text-primary dark:text-white"
                                                    >
                                                        {test.title}
                                                    </Link>
                                                </td>
                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                    <span className="text-meta-3">
                                                        {test.question_count}
                                                    </span>
                                                </td>
                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                    <div className="flex items-center space-x-3.5">
                                                        <button
                                                            onClick={() => navigate(`/test-bank/${courseId}/tests/${test.id}/edit`)}
                                                            className="hover:text-success"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(test)}
                                                            className="hover:text-danger"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">
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