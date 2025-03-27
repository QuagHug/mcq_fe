import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';

interface Question {
    id: string;
    text: string;
    options: {
        id: string;
        text: string;
        isCorrect: boolean;
    }[];
    explanation?: string;
    taxonomyLevel?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

interface TestDetail {
    id: string;
    title: string;
    subject: string;
    description: string;
    question_count: number;
    created_at: string;
    questions: Question[];
}

// Mock data for test details
const mockTestDetail: Record<string, TestDetail> = {
    '1': {
        id: '1',
        title: 'DSA Midterm Exam',
        subject: 'Data Structures and Algorithms',
        description: 'Midterm examination covering Data Structures and Algorithms',
        question_count: 30,
        created_at: '2024-03-15',
        questions: [
            {
                id: '1',
                text: 'What is the time complexity of QuickSort in the average case?',
                options: [
                    { id: 'A', text: 'O(n)', isCorrect: false },
                    { id: 'B', text: 'O(n log n)', isCorrect: true },
                    { id: 'C', text: 'O(n²)', isCorrect: false },
                    { id: 'D', text: 'O(log n)', isCorrect: false }
                ],
                explanation: 'QuickSort has an average time complexity of O(n log n) due to its divide-and-conquer approach.',
                taxonomyLevel: 'understand',
                difficulty: 'medium'
            },
            {
                id: '2',
                text: 'What data structure would you use to implement a priority queue?',
                options: [
                    { id: 'A', text: 'Array', isCorrect: false },
                    { id: 'B', text: 'Linked List', isCorrect: false },
                    { id: 'C', text: 'Heap', isCorrect: true },
                    { id: 'D', text: 'Stack', isCorrect: false }
                ],
                explanation: 'A Heap is the most efficient data structure for implementing a priority queue as it provides O(log n) time complexity for both insertion and deletion operations.',
                taxonomyLevel: 'apply',
                difficulty: 'hard'
            },
            {
                id: '3',
                text: 'Which of the following is NOT a characteristic of a Binary Search Tree?',
                options: [
                    { id: 'A', text: 'Left subtree contains smaller elements', isCorrect: false },
                    { id: 'B', text: 'Right subtree contains larger elements', isCorrect: false },
                    { id: 'C', text: 'All nodes must have exactly two children', isCorrect: true },
                    { id: 'D', text: 'Inorder traversal gives sorted output', isCorrect: false }
                ],
                explanation: 'In a Binary Search Tree, nodes can have 0, 1, or 2 children. It is not required for all nodes to have exactly two children.',
                taxonomyLevel: 'remember',
                difficulty: 'easy'
            }
            // Add more sample questions as needed
        ]
    }
};

const TestDetails = () => {
    const { courseId, testId } = useParams();
    const [test, setTest] = useState<TestDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Simulate API call with mock data
        setLoading(true);
        setTimeout(() => {
            if (testId && mockTestDetail[testId]) {
                setTest(mockTestDetail[testId]);
                setError(null);
            } else {
                setError('Test not found');
            }
            setLoading(false);
        }, 500);
    }, [testId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error || !test) {
        return <div className="text-danger">{error}</div>;
    }

    return (
        <div className="mx-auto max-w-270">
            <Breadcrumb
                pageName={test.title}
                currentName={test.title}
                breadcrumbItems={[
                    { name: "Home Page", path: "/" },
                    { name: "Test Bank", path: "/test-bank" },
                    { name: test.subject, path: `/test-bank/${courseId}` },
                    { name: test.title, path: "#" }
                ]}
            />

            <div className="grid grid-cols-1 gap-4">
                {/* Test Overview */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">
                            Test Overview
                        </h3>
                    </div>
                    <div className="p-6.5">
                        <div className="mb-4.5">
                            <h4 className="mb-2.5 text-lg font-semibold text-black dark:text-white">
                                {test.title}
                            </h4>
                        </div>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex items-center">
                                <span className="mr-2.5 text-sm font-medium text-black dark:text-white">Subject:</span>
                                <span className="text-sm text-body-color dark:text-gray-400">{test.subject}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="mr-2.5 text-sm font-medium text-black dark:text-white">Questions:</span>
                                <span className="text-sm text-meta-3">{test.question_count}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="mr-2.5 text-sm font-medium text-black dark:text-white">Created:</span>
                                <span className="text-sm text-body-color dark:text-gray-400">
                                    {new Date(test.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">
                            Questions
                        </h3>
                    </div>
                    <div className="p-6.5">
                        {test.questions.map((question, index) => (
                            <div key={question.id} className="mb-8 last:mb-0">
                                <div className="mb-4">
                                    <h4 className="text-lg font-medium text-black dark:text-white">
                                        Question {index + 1}
                                    </h4>
                                    <p className="mt-2.5 text-body-color dark:text-gray-400">
                                        {question.text}
                                    </p>
                                </div>

                                <div className="mb-4">
                                    {question.options.map((option) => (
                                        <div
                                            key={option.id}
                                            className={`mb-2.5 flex items-center rounded-md border p-4 ${option.isCorrect
                                                ? 'border-meta-3 bg-meta-3/10'
                                                : 'border-stroke dark:border-strokedark'
                                                }`}
                                        >
                                            <span className="mr-2.5 text-black dark:text-white">
                                                {option.id}.
                                            </span>
                                            <span className={`text-sm ${option.isCorrect
                                                ? 'text-meta-3'
                                                : 'text-body-color dark:text-gray-400'
                                                }`}>
                                                {option.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {question.explanation && (
                                    <div className="rounded-md bg-gray-1 p-4 dark:bg-meta-4">
                                        <p className="text-sm text-body-color dark:text-gray-400">
                                            <span className="font-medium text-black dark:text-white">Explanation: </span>
                                            {question.explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary Section */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">
                            Summary
                        </h3>
                    </div>

                    <div className="p-6.5">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Distribution Table */}
                            <div className="bg-gray-50 dark:bg-meta-4 p-4 rounded-sm overflow-x-auto">
                                <h5 className="font-medium text-black dark:text-white mb-3">
                                    Question Distribution
                                </h5>
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-2 dark:bg-meta-4">
                                            <th className="py-4 px-4 font-medium text-black dark:text-white border-b border-[#eee] dark:border-strokedark">
                                                Taxonomy Level
                                            </th>
                                            <th className="py-4 px-4 font-medium text-black dark:text-white border-b border-[#eee] dark:border-strokedark">
                                                Easy
                                            </th>
                                            <th className="py-4 px-4 font-medium text-black dark:text-white border-b border-[#eee] dark:border-strokedark">
                                                Medium
                                            </th>
                                            <th className="py-4 px-4 font-medium text-black dark:text-white border-b border-[#eee] dark:border-strokedark">
                                                Hard
                                            </th>
                                            <th className="py-4 px-4 font-medium text-black dark:text-white border-b border-[#eee] dark:border-strokedark">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(taxonomy => {
                                            // Calculate totals for each taxonomy level
                                            const questions = test.questions.filter(q =>
                                                q.taxonomyLevel === taxonomy.toLowerCase()
                                            );
                                            const easy = questions.filter(q => q.difficulty === 'easy').length;
                                            const medium = questions.filter(q => q.difficulty === 'medium').length;
                                            const hard = questions.filter(q => q.difficulty === 'hard').length;
                                            const total = easy + medium + hard;

                                            return (
                                                <tr key={taxonomy}>
                                                    <td className="py-3 px-4 border-b border-[#eee] dark:border-strokedark">
                                                        {taxonomy}
                                                    </td>
                                                    <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                        {easy}
                                                    </td>
                                                    <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                        {medium}
                                                    </td>
                                                    <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                        {hard}
                                                    </td>
                                                    <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark font-medium">
                                                        {total}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Total Row */}
                                        <tr className="bg-gray-2 dark:bg-meta-4">
                                            <td className="py-3 px-4 font-medium">Total</td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                {test.questions.filter(q => q.difficulty === 'easy').length}
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                {test.questions.filter(q => q.difficulty === 'medium').length}
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                {test.questions.filter(q => q.difficulty === 'hard').length}
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                {test.questions.length}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestDetails; 