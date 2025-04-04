import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { fetchTestDetail } from '../services/api';
import TestConfiguration from '../components/TestConfiguration';
import QuestionDisplay from '../components/QuestionDisplay';

interface Question {
    id: string;
    question_text: string;
    answers: {
        id: string;
        answer_text: string;
        is_correct: boolean;
        explanation?: string;
    }[];
    taxonomyLevel?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

interface TestDetail {
    id: string;
    title: string;
    course_name: string;
    description: string;
    question_count: number;
    created_at: string;
    questions: Question[];
    configuration: {
        letterCase: 'uppercase' | 'lowercase';
        separator: string;
        includeAnswerKey: boolean;
    };
}

const TestDetails = () => {
    const navigate = useNavigate();
    const { courseId, testId } = useParams();
    const [test, setTest] = useState<TestDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTest = async () => {
            if (!courseId || !testId) return;
            try {
                const data = await fetchTestDetail(courseId, testId);
                setTest(data);
            } catch (err) {
                setError('Failed to load test');
            } finally {
                setLoading(false);
            }
        };

        loadTest();
    }, [courseId, testId]);

    return (
        <div className="mx-auto max-w-270">
            <div className="flex justify-between items-center mb-6">
                <Breadcrumb
                    pageName="Test Details"
                    currentName={test?.title || "Test Details"}
                    breadcrumbItems={[
                        { name: "Home Page", path: "/" },
                        { name: "Test Bank", path: "/test-bank" },
                        { name: test?.title || "Test Details", path: "#" }
                    ]}
                />
                <button
                    onClick={() => navigate(`/test-bank/${courseId}/tests/${testId}/edit`)}
                    className="inline-flex items-center gap-2.5 rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-opacity-90"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="currentColor" 
                        className="w-5 h-5"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" 
                        />
                    </svg>
                    <span>Edit Test</span>
                </button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : error ? (
                <div className="text-danger">{error}</div>
            ) : test && (
                <>
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
                                        <span className="text-sm text-body-color dark:text-gray-400">{test.course_name}</span>
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

                        {/* Test Configuration */}
                        <TestConfiguration configuration={test.configuration} />

                        {/* Questions List */}
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
                            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
                                <h3 className="font-medium text-black dark:text-white">
                                    Questions ({test.questions?.length || 0})
                                </h3>
                            </div>
                            <div className="p-6.5">
                                {test.questions?.map((questionWrapper, index) => (
                                    <QuestionDisplay
                                        key={questionWrapper.id}
                                        question={questionWrapper.question_data}
                                        index={index}
                                        showAnswers={true}
                                        configuration={test.configuration}
                                        className="mb-8 last:mb-0"
                                    />
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
                </>
            )}
        </div>
    );
};

export default TestDetails; 