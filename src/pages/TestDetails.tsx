import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { fetchTestDetail } from '../services/api';
import TestConfiguration from '../components/TestConfiguration';
import QuestionDisplay from '../components/QuestionDisplay';
import { 
    Chart as ChartJS, 
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale,
    Filler,
    ScatterController
} from 'chart.js';
import { Bar, Pie, Scatter } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale,
    Filler,
    ScatterController
);

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
    const [difficultyDistribution, setDifficultyDistribution] = useState<{labels: string[], data: number[]}>({
        labels: ['Very Easy (0-2)', 'Easy (2-4)', 'Moderate (4-6)', 'Hard (6-8)', 'Very Hard (8-10)'],
        data: [0, 0, 0, 0, 0]
    });
    const [discriminationQuality, setDiscriminationQuality] = useState<{labels: string[], data: number[]}>({
        labels: ['Poor (0-2)', 'Fair (2-4)', 'Good (4-6)', 'Excellent (6-8+)'],
        data: [0, 0, 0, 0]
    });
    const [scatterData, setScatterData] = useState<{id: number, x: number, y: number, question: string}[]>([]);
    const [responseRates, setResponseRates] = useState<{labels: string[], data: number[]}>({
        labels: [],
        data: []
    });
    const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(false);

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

    useEffect(() => {
        if (test?.questions) {
            // Process difficulty distribution
            const diffDist = [0, 0, 0, 0, 0];
            
            // Process discrimination quality
            const discrQuality = [0, 0, 0, 0];
            
            // Process scatter data
            const scatter: {id: number, x: number, y: number, question: string}[] = [];
            
            // Process response rates
            const labels: string[] = [];
            const rates: number[] = [];
            
            // Calculate analytics
            test.questions.forEach((q, index) => {
                const stats = q.question_data?.statistics;
                if (stats) {
                    // Difficulty distribution
                    if (stats.scaled_difficulty !== undefined) {
                        const diffVal = stats.scaled_difficulty;
                        if (diffVal < 2) diffDist[0]++;
                        else if (diffVal < 4) diffDist[1]++;
                        else if (diffVal < 6) diffDist[2]++;
                        else if (diffVal < 8) diffDist[3]++;
                        else diffDist[4]++;
                    }
                    
                    // Discrimination quality
                    if (stats.scaled_discrimination !== undefined) {
                        const discrVal = stats.scaled_discrimination;
                        if (discrVal < 2) discrQuality[0]++;
                        else if (discrVal < 4) discrQuality[1]++;
                        else if (discrVal < 6) discrQuality[2]++;
                        else discrQuality[3]++;
                    }
                    
                    // Scatter data
                    if (stats.scaled_difficulty !== undefined && stats.scaled_discrimination !== undefined) {
                        scatter.push({
                            id: parseInt(q.question_data.id.toString()),
                            x: stats.scaled_difficulty,
                            y: stats.scaled_discrimination,
                            question: q.question_data.question_text.replace(/<[^>]*>/g, '').substring(0, 30) + '...'
                        });
                    }
                    
                    // Response rates
                    if (stats.classical_parameters?.p_value !== undefined) {
                        labels.push(`Q${index + 1}`);
                        rates.push(stats.classical_parameters.p_value * 100);
                    }
                }
            });
            
            setDifficultyDistribution({
                labels: difficultyDistribution.labels,
                data: diffDist
            });
            
            setDiscriminationQuality({
                labels: discriminationQuality.labels,
                data: discrQuality
            });
            
            setScatterData(scatter);
            
            setResponseRates({
                labels,
                data: rates
            });
        }
    }, [test]);

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
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">{test.title}</h3>
                        
                        {/* Expandable Analytics Section */}
                        <div className="border rounded-sm overflow-hidden mb-6">
                            <button 
                                onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
                                className="w-full bg-gray-100 dark:bg-gray-800 p-3 text-left flex justify-between items-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <span className="font-medium">Test Analytics Dashboard</span>
                                <svg 
                                    className={`w-5 h-5 transition-transform ${isAnalyticsExpanded ? 'rotate-180' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                            
                            {isAnalyticsExpanded && (
                                <div className="p-4 border-t">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <h4 className="text-lg font-medium mb-2">Difficulty Distribution</h4>
                                            <div className="h-64">
                                                <Bar 
                                                    data={{
                                                        labels: difficultyDistribution.labels,
                                                        datasets: [{
                                                            label: 'Number of Questions',
                                                            data: difficultyDistribution.data,
                                                            backgroundColor: [
                                                                'rgba(54, 162, 235, 0.6)',
                                                                'rgba(75, 192, 192, 0.6)',
                                                                'rgba(255, 206, 86, 0.6)',
                                                                'rgba(255, 159, 64, 0.6)',
                                                                'rgba(255, 99, 132, 0.6)'
                                                            ],
                                                            borderWidth: 1
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            title: {
                                                                display: true,
                                                                text: 'Distribution of Question Difficulty'
                                                            },
                                                            tooltip: {
                                                                callbacks: {
                                                                    label: (context) => {
                                                                        return `Questions: ${context.raw}`;
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                title: {
                                                                    display: true,
                                                                    text: 'Number of Questions'
                                                                },
                                                                ticks: {
                                                                    stepSize: 1
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                                <p><strong>Note:</strong> Ideal questions have moderate difficulty (4-6) and high discrimination (&gt;6).</p>
                                                <p>Questions with very low discrimination (&lt;2) should be reviewed as they may not differentiate between high and low performers.</p>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-lg font-medium mb-2">Discrimination Quality</h4>
                                            <div className="h-64">
                                                <Pie 
                                                    data={{
                                                        labels: discriminationQuality.labels,
                                                        datasets: [{
                                                            label: 'Number of Questions',
                                                            data: discriminationQuality.data,
                                                            backgroundColor: [
                                                                'rgba(255, 99, 132, 0.6)',
                                                                'rgba(255, 159, 64, 0.6)',
                                                                'rgba(75, 192, 192, 0.6)',
                                                                'rgba(54, 162, 235, 0.6)'
                                                            ],
                                                            borderWidth: 1
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            title: {
                                                                display: true,
                                                                text: 'Question Discrimination Quality'
                                                            },
                                                            tooltip: {
                                                                callbacks: {
                                                                    label: (context) => {
                                                                        const dataset = context.dataset;
                                                                        const total = dataset.data.reduce((acc: number, data: number) => acc + data, 0);
                                                                        const value = dataset.data[context.dataIndex] as number;
                                                                        const percentage = ((value / total) * 100).toFixed(1);
                                                                        return `${context.label}: ${value} questions (${percentage}%)`;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-6">
                                        <h4 className="text-lg font-medium mb-2">Question Quality Matrix</h4>
                                        <div className="h-80">
                                            <Scatter 
                                                data={{
                                                    datasets: [{
                                                        label: 'Questions',
                                                        data: scatterData.map(item => ({x: item.x, y: item.y})),
                                                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                                                        pointRadius: 8,
                                                        pointHoverRadius: 10
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        tooltip: {
                                                            callbacks: {
                                                                label: (context) => {
                                                                    const point = scatterData[context.dataIndex];
                                                                    return [
                                                                        `ID: ${point.id}`,
                                                                        `Difficulty: ${point.x.toFixed(1)}`,
                                                                        `Discrimination: ${point.y.toFixed(1)}`,
                                                                        `Question: ${point.question}`
                                                                    ];
                                                                }
                                                            }
                                                        }
                                                    },
                                                    scales: {
                                                        x: {
                                                            title: {
                                                                display: true,
                                                                text: 'Difficulty (Higher = More Difficult)'
                                                            },
                                                            min: 0,
                                                            max: 10
                                                        },
                                                        y: {
                                                            title: {
                                                                display: true,
                                                                text: 'Discrimination (Higher = Better)'
                                                            },
                                                            min: 0,
                                                            max: 10
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="mb-6">
                                        <h4 className="text-lg font-medium mb-2">Question Success Rates</h4>
                                        <div className="h-80">
                                            <Bar 
                                                data={{
                                                    labels: responseRates.labels,
                                                    datasets: [{
                                                        label: 'Correct Response Rate (%)',
                                                        data: responseRates.data,
                                                        backgroundColor: responseRates.data.map(rate => {
                                                            if (rate < 30) return 'rgba(255, 99, 132, 0.6)'; // Very hard
                                                            if (rate < 50) return 'rgba(255, 159, 64, 0.6)'; // Hard
                                                            if (rate < 70) return 'rgba(255, 206, 86, 0.6)'; // Moderate
                                                            if (rate < 85) return 'rgba(75, 192, 192, 0.6)'; // Easy
                                                            return 'rgba(54, 162, 235, 0.6)'; // Very easy
                                                        }),
                                                        borderWidth: 1
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        title: {
                                                            display: true,
                                                            text: 'Percentage of Correct Responses by Question'
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            max: 100,
                                                            title: {
                                                                display: true,
                                                                text: 'Percentage Correct (%)'
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div style={{background: 'linear-gradient(to right, #1d4ed8, #2563eb)'}} className="text-white p-4 rounded-sm">
                                            <h4 className="font-semibold text-lg">Average Difficulty</h4>
                                            <p className="text-3xl font-bold">
                                                {(test.questions
                                                    .filter(q => q.question_data?.statistics?.scaled_difficulty !== undefined)
                                                    .reduce((acc, q) => acc + (q.question_data?.statistics?.scaled_difficulty || 0), 0) / 
                                                test.questions.filter(q => q.question_data?.statistics?.scaled_difficulty !== undefined).length)
                                                    .toFixed(2)}
                                            </p>
                                            <p className="text-sm mt-2">
                                                {test.questions.filter(q => q.question_data?.statistics?.scaled_difficulty !== undefined).length} questions with valid data
                                            </p>
                                        </div>
                                        <div style={{background: 'linear-gradient(to right, #7e22ce, #9333ea)'}} className="text-white p-4 rounded-sm">
                                            <h4 className="font-semibold text-lg">Average Discrimination</h4>
                                            <p className="text-3xl font-bold">
                                                {(test.questions
                                                    .filter(q => q.question_data?.statistics?.scaled_discrimination !== undefined)
                                                    .reduce((acc, q) => acc + (q.question_data?.statistics?.scaled_discrimination || 0), 0) / 
                                                test.questions.filter(q => q.question_data?.statistics?.scaled_discrimination !== undefined).length)
                                                    .toFixed(2)}
                                            </p>
                                            <p className="text-sm mt-2">
                                                {test.questions.filter(q => q.question_data?.statistics?.scaled_discrimination !== undefined).length} questions with valid data
                                            </p>
                                        </div>
                                        <div style={{background: 'linear-gradient(to right, #8A7BC8, rgba(138, 123, 200, 0.8))'}} className="text-white p-4 rounded-sm">
                                            <h4 className="font-semibold text-lg">Average Success Rate</h4>
                                            <p className="text-3xl font-bold">
                                                {(test.questions
                                                    .filter(q => q.question_data?.statistics?.classical_parameters?.p_value !== undefined)
                                                    .reduce((acc, q) => acc + ((q.question_data?.statistics?.classical_parameters?.p_value || 0) * 100), 0) / 
                                                test.questions.filter(q => q.question_data?.statistics?.classical_parameters?.p_value !== undefined).length)
                                                    .toFixed(2)}%
                                            </p>
                                            <p className="text-sm mt-2">
                                                {test.questions.filter(q => q.question_data?.statistics?.classical_parameters?.p_value !== undefined).length} questions analyzed
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="font-semibold mb-2">Test Quality Insights</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            <li>
                                                {test.questions.filter(q => 
                                                    q.question_data?.statistics?.scaled_difficulty >= 4 && 
                                                    q.question_data?.statistics?.scaled_difficulty <= 6 && 
                                                    q.question_data?.statistics?.scaled_discrimination > 5
                                                ).length} questions are in the optimal range (moderate difficulty with good discrimination)
                                            </li>
                                            <li>
                                                {test.questions.filter(q => 
                                                    q.question_data?.statistics?.scaled_discrimination < 2
                                                ).length} questions have poor discrimination and may need review
                                            </li>
                                            <li>
                                                {test.questions.filter(q => 
                                                    q.question_data?.statistics?.scaled_difficulty > 8
                                                ).length} questions are very difficult (may be too challenging)
                                            </li>
                                            <li>
                                                {test.questions.filter(q => 
                                                    q.question_data?.statistics?.scaled_difficulty < 2
                                                ).length} questions are very easy (may be too simple)
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
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