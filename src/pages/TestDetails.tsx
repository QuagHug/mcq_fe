import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { fetchTestDetail } from '../services/api';

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
    const { courseId, testId } = useParams();
    const [test, setTest] = useState<TestDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTestDetails = async () => {
            if (!courseId || !testId) return;
            
            try {
                setLoading(true);
                const testData = await fetchTestDetail(courseId, testId);
                setTest(testData);
                setError(null);
            } catch (err) {
                setError('Failed to load test details');
            } finally {
                setLoading(false);
            }
        };

        loadTestDetails();
    }, [courseId, testId]);

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
                    { name: test.course_name, path: `/test-bank/${courseId}` },
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
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">
                            Test Configuration
                        </h3>
                    </div>
                    <div className="p-6.5">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center">
                                <span className="mr-2.5 text-sm font-medium text-black dark:text-white">Letter Case:</span>
                                <span className="text-sm text-body-color dark:text-gray-400">
                                    {test.configuration?.letterCase === 'uppercase' ? 'ABC' : 'abc'}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <span className="mr-2.5 text-sm font-medium text-black dark:text-white">Separator:</span>
                                <span className="text-sm text-body-color dark:text-gray-400">
                                    A{test.configuration?.separator}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <span className="mr-2.5 text-sm font-medium text-black dark:text-white">Answer Key:</span>
                                <span className="text-sm text-body-color dark:text-gray-400">
                                    {test.configuration?.includeAnswerKey ? 'Included' : 'Not Included'}
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
                        {test.questions?.map((questionWrapper, index) => {
                            const question = questionWrapper.question_data;
                            return (
                                <div key={questionWrapper.id} className="mb-8 last:mb-0">
                                    <div className="mb-4">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-lg font-medium text-black dark:text-white">
                                                Question {index + 1}
                                            </h4>
                                            {question.statistics && (
                                                <div className="text-xs text-gray-500">
                                                    Difficulty: {question.statistics.scaled_difficulty.toFixed(2)} | 
                                                    Discrimination: {question.statistics.scaled_discrimination.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                        <div 
                                            className="mt-2.5 text-body-color dark:text-gray-400"
                                            dangerouslySetInnerHTML={{ __html: question.question_text }}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        {question.answers?.map((answer, ansIndex) => (
                                            <div
                                                key={answer.id}
                                                className={`mb-2.5 rounded-md border p-4 ${
                                                    answer.is_correct && test.configuration?.includeAnswerKey
                                                        ? 'border-meta-3 bg-meta-3/10'
                                                        : 'border-stroke dark:border-strokedark'
                                                }`}
                                            >
                                                <div className="flex items-start">
                                                    <span className="mr-2.5 text-black dark:text-white">
                                                        {test.configuration?.letterCase === 'uppercase'
                                                            ? String.fromCharCode(65 + ansIndex)
                                                            : String.fromCharCode(97 + ansIndex)}
                                                        {test.configuration?.separator}
                                                    </span>
                                                    <div className="flex-1">
                                                        <span 
                                                            className={`text-sm ${
                                                                answer.is_correct && test.configuration?.includeAnswerKey
                                                                    ? 'text-meta-3'
                                                                    : 'text-body-color dark:text-gray-400'
                                                            }`}
                                                            dangerouslySetInnerHTML={{ __html: answer.answer_text }}
                                                        />
                                                        {answer.explanation && test.configuration?.includeAnswerKey && (
                                                            <>
                                                                <div className="my-2 border-b border-stroke dark:border-strokedark"></div>
                                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                                    <span dangerouslySetInnerHTML={{ __html: answer.explanation }} />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
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