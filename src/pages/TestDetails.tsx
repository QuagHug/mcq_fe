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
    statistics?: {
        scaled_difficulty: number;
        scaled_discrimination: number;
        scaled_guessing: number;
        quality_score: number;
        quality_formula: string;
    };
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
    const [isQuestionsDialogOpen, setIsQuestionsDialogOpen] = useState(false);
    const [selectedCategoryQuestions, setSelectedCategoryQuestions] = useState<Question[]>([]);
    const [dialogTitle, setDialogTitle] = useState('');

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

    const handleViewQuestions = (questions: Question[], title: string) => {
        setSelectedCategoryQuestions(questions);
        setDialogTitle(title);
        setIsQuestionsDialogOpen(true);
    };

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
                                                                        const value = context.raw as number;
                                                                        return `${value} questions`;
                                                                    },
                                                                    afterLabel: (context) => {
                                                                        const rangeIndex = context.dataIndex;
                                                                        let questions;
                                                                        
                                                                        switch(rangeIndex) {
                                                                            case 0:
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_difficulty < 2);
                                                                                break;
                                                                            case 1:
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_difficulty >= 2 && q.question_data.statistics?.scaled_difficulty < 4);
                                                                                break;
                                                                            case 2:
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_difficulty >= 4 && q.question_data.statistics?.scaled_difficulty < 6);
                                                                                break;
                                                                            case 3:
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_difficulty >= 6 && q.question_data.statistics?.scaled_difficulty < 8);
                                                                                break;
                                                                            case 4:
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_difficulty >= 8);
                                                                                break;
                                                                            default:
                                                                                questions = [];
                                                                        }
                                                                        
                                                                        const tooltipLines = questions.slice(0, 5).map(q => {
                                                                            const questionIndex = test.questions.findIndex(tq => tq.id === q.id);
                                                                            const orderNumber = questionIndex + 1;
                                                                            const text = q.question_data.question_text.replace(/<[^>]*>/g, '');
                                                                            const truncatedText = text.length > 40 ? text.substring(0, 40) + '...' : text;
                                                                            return `• Q${orderNumber}: ${truncatedText} (D: ${q.question_data.statistics?.scaled_difficulty.toFixed(2)})`;
                                                                        });
                                                                        
                                                                        // Add a line indicating more questions can be viewed
                                                                        if (questions.length > 5) {
                                                                            tooltipLines.push(`\n[Click to view all ${questions.length} questions]`);
                                                                        }
                                                                        
                                                                        return tooltipLines;
                                                                    }
                                                                },
                                                                onClick: (event, elements) => {
                                                                    if (elements.length > 0) {
                                                                        const index = elements[0].index;
                                                                        let questions;
                                                                        let title;
                                                                        
                                                                        switch(index) {
                                                                            case 0:
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_difficulty < 2);
                                                                                title = 'Very Easy Questions (0-2)';
                                                                                break;
                                                                            case 1:
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_difficulty >= 2 && q.question_data.statistics?.scaled_difficulty < 4);
                                                                                title = 'Easy Questions (2-4)';
                                                                                break;
                                                                            case 2:
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_difficulty >= 4 && q.question_data.statistics?.scaled_difficulty < 6);
                                                                                title = 'Moderate Questions (4-6)';
                                                                                break;
                                                                            case 3:
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_difficulty >= 6 && q.question_data.statistics?.scaled_difficulty < 8);
                                                                                title = 'Hard Questions (6-8)';
                                                                                break;
                                                                            case 4:
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_difficulty >= 8);
                                                                                title = 'Very Hard Questions (8-10)';
                                                                                break;
                                                                            default:
                                                                                questions = [];
                                                                                title = '';
                                                                        }
                                                                        
                                                                        handleViewQuestions(questions, title);
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
                                                                    },
                                                                    afterLabel: (context) => {
                                                                        const rangeIndex = context.dataIndex;
                                                                        let questions;
                                                                        
                                                                        switch(rangeIndex) {
                                                                            case 0: // Poor
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_discrimination < 2);
                                                                                break;
                                                                            case 1: // Fair
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_discrimination >= 2 && q.question_data.statistics?.scaled_discrimination < 4);
                                                                                break;
                                                                            case 2: // Good
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_discrimination >= 4 && q.question_data.statistics?.scaled_discrimination < 6);
                                                                                break;
                                                                            case 3: // Very Good
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_discrimination >= 6 && q.question_data.statistics?.scaled_discrimination < 8);
                                                                                break;
                                                                            case 4: // Excellent
                                                                                questions = test.questions.filter(q => q.question_data.statistics?.scaled_discrimination >= 8);
                                                                                break;
                                                                            default:
                                                                                questions = [];
                                                                        }
                                                                        
                                                                        return questions.slice(0, 5).map(q => {
                                                                            const questionIndex = test.questions.findIndex(tq => tq.id === q.id);
                                                                            const orderNumber = questionIndex + 1;
                                                                            const text = q.question_data.question_text.replace(/<[^>]*>/g, '');
                                                                            const truncatedText = text.length > 40 ? text.substring(0, 40) + '...' : text;
                                                                            return `• Q${orderNumber}: ${truncatedText} (Disc: ${q.question_data.statistics?.scaled_discrimination.toFixed(2)})`;
                                                                        });
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
                                        <h4 className="text-lg font-medium mb-2">Guessing Parameter Distribution</h4>
                                        <div className="h-64">
                                            <Bar 
                                                data={{
                                                    labels: ['0-2', '2-4', '4-6', '6-8', '8-10'],
                                                    datasets: [{
                                                        label: 'Number of Questions',
                                                        data: [
                                                            test.questions.filter(q => q.question_data.statistics?.scaled_guessing < 2).length,
                                                            test.questions.filter(q => q.question_data.statistics?.scaled_guessing >= 2 && q.question_data.statistics?.scaled_guessing < 4).length,
                                                            test.questions.filter(q => q.question_data.statistics?.scaled_guessing >= 4 && q.question_data.statistics?.scaled_guessing < 6).length,
                                                            test.questions.filter(q => q.question_data.statistics?.scaled_guessing >= 6 && q.question_data.statistics?.scaled_guessing < 8).length,
                                                            test.questions.filter(q => q.question_data.statistics?.scaled_guessing >= 8).length,
                                                        ],
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
                                                            text: 'Distribution of Question Guessing Parameter'
                                                        },
                                                        tooltip: {
                                                            callbacks: {
                                                                label: (context) => {
                                                                    const value = context.raw as number;
                                                                    return `${value} questions`;
                                                                },
                                                                afterLabel: (context) => {
                                                                    const rangeIndex = context.dataIndex;
                                                                    let questions;
                                                                    
                                                                    switch(rangeIndex) {
                                                                        case 0:
                                                                            questions = test.questions.filter(q => q.question_data.statistics?.scaled_guessing < 2);
                                                                            break;
                                                                        case 1:
                                                                            questions = test.questions.filter(q => q.question_data.statistics?.scaled_guessing >= 2 && q.question_data.statistics?.scaled_guessing < 4);
                                                                            break;
                                                                        case 2:
                                                                            questions = test.questions.filter(q => q.question_data.statistics?.scaled_guessing >= 4 && q.question_data.statistics?.scaled_guessing < 6);
                                                                            break;
                                                                        case 3:
                                                                            questions = test.questions.filter(q => q.question_data.statistics?.scaled_guessing >= 6 && q.question_data.statistics?.scaled_guessing < 8);
                                                                            break;
                                                                        case 4:
                                                                            questions = test.questions.filter(q => q.question_data.statistics?.scaled_guessing >= 8);
                                                                            break;
                                                                        default:
                                                                            questions = [];
                                                                    }
                                                                    
                                                                    return questions.slice(0, 5).map(q => {
                                                                        const questionIndex = test.questions.findIndex(tq => tq.id === q.id);
                                                                        const orderNumber = questionIndex + 1;
                                                                        const text = q.question_data.question_text.replace(/<[^>]*>/g, '');
                                                                        const truncatedText = text.length > 40 ? text.substring(0, 40) + '...' : text;
                                                                        return `• Q${orderNumber}: ${truncatedText} (G: ${q.question_data.statistics?.scaled_guessing.toFixed(2)})`;
                                                                    });
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
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-lg font-medium mb-2">Question Quality Distribution</h4>
                                        <div className="h-64">
                                            <Bar 
                                                data={{
                                                    labels: ['Poor (0-2)', 'Fair (2-4)', 'Good (4-6)', 'Very Good (6-8)', 'Excellent (8-10)'],
                                                    datasets: [{
                                                        label: 'Number of Questions',
                                                        data: [
                                                            test.questions.filter(q => q.question_data.statistics?.quality_score < 2).length,
                                                            test.questions.filter(q => q.question_data.statistics?.quality_score >= 2 && q.question_data.statistics?.quality_score < 4).length,
                                                            test.questions.filter(q => q.question_data.statistics?.quality_score >= 4 && q.question_data.statistics?.quality_score < 6).length,
                                                            test.questions.filter(q => q.question_data.statistics?.quality_score >= 6 && q.question_data.statistics?.quality_score < 8).length,
                                                            test.questions.filter(q => q.question_data.statistics?.quality_score >= 8).length,
                                                        ],
                                                        backgroundColor: [
                                                            'rgba(255, 99, 132, 0.6)',
                                                            'rgba(255, 159, 64, 0.6)',
                                                            'rgba(255, 206, 86, 0.6)',
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
                                                            text: 'Distribution of Question Quality Scores'
                                                        },
                                                        tooltip: {
                                                            callbacks: {
                                                                label: (context) => {
                                                                    const value = context.raw as number;
                                                                    return `${value} questions`;
                                                                },
                                                                afterLabel: (context) => {
                                                                    const rangeIndex = context.dataIndex;
                                                                    let questions;
                                                                    
                                                                    switch(rangeIndex) {
                                                                        case 0:
                                                                            questions = test.questions.filter(q => q.question_data.statistics?.quality_score < 2);
                                                                            break;
                                                                        case 1:
                                                                            questions = test.questions.filter(q => q.question_data.statistics?.quality_score >= 2 && q.question_data.statistics?.quality_score < 4);
                                                                            break;
                                                                        case 2:
                                                                            questions = test.questions.filter(q => q.question_data.statistics?.quality_score >= 4 && q.question_data.statistics?.quality_score < 6);
                                                                            break;
                                                                        case 3:
                                                                            questions = test.questions.filter(q => q.question_data.statistics?.quality_score >= 6 && q.question_data.statistics?.quality_score < 8);
                                                                            break;
                                                                        case 4:
                                                                            questions = test.questions.filter(q => q.question_data.statistics?.quality_score >= 8);
                                                                            break;
                                                                        default:
                                                                            questions = [];
                                                                    }
                                                                    
                                                                    return questions.slice(0, 5).map(q => {
                                                                        const questionIndex = test.questions.findIndex(tq => tq.id === q.id);
                                                                        const orderNumber = questionIndex + 1;
                                                                        const text = q.question_data.question_text.replace(/<[^>]*>/g, '');
                                                                        const truncatedText = text.length > 40 ? text.substring(0, 40) + '...' : text;
                                                                        return `• Q${orderNumber}: ${truncatedText} (Q: ${q.question_data.statistics?.quality_score.toFixed(2)})`;
                                                                    });
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
                                            <p><strong>Note:</strong> Quality score is calculated using the formula: {test.questions[0]?.question_data.statistics?.quality_formula}</p>
                                            <p>Higher quality scores indicate better questions with good discrimination and moderate difficulty.</p>
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
                                                        },
                                                        tooltip: {
                                                            callbacks: {
                                                                label: (context) => {
                                                                    const value = context.raw as number;
                                                                    return `Success rate: ${value.toFixed(1)}%`;
                                                                },
                                                                afterLabel: (context) => {
                                                                    const index = context.dataIndex;
                                                                    const questionIndex = index; // Assuming the order matches
                                                                    
                                                                    if (questionIndex < test.questions.length) {
                                                                        const q = test.questions[questionIndex];
                                                                        const text = q.question_data.question_text.replace(/<[^>]*>/g, '');
                                                                        const truncatedText = text.length > 60 ? text.substring(0, 60) + '...' : text;
                                                                        
                                                                        const stats = q.question_data.statistics;
                                                                        const responses = stats?.classical_parameters?.total_responses || 'N/A';
                                                                        const correct = stats?.classical_parameters?.correct_responses || 'N/A';
                                                                        
                                                                        return [
                                                                            `Question ${questionIndex + 1}: ${truncatedText}`,
                                                                            `Total responses: ${responses}`,
                                                                            `Correct responses: ${correct}`,
                                                                            `Difficulty: ${stats?.scaled_difficulty?.toFixed(2) || 'N/A'}`,
                                                                            `Discrimination: ${stats?.scaled_discrimination?.toFixed(2) || 'N/A'}`,
                                                                            `Guessing: ${stats?.scaled_guessing?.toFixed(2) || 'N/A'}`,
                                                                            `Quality: ${stats?.quality_score?.toFixed(2) || 'N/A'}`
                                                                        ];
                                                                    }
                                                                    
                                                                    return [];
                                                                }
                                                            }
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
                                    <div className="mt-6">
                                        <h4 className="text-lg font-medium mb-3">Test Quality Insights</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-center justify-between">
                                                <span>{test.questions.filter(q => 
                                                    q.question_data.statistics?.scaled_difficulty >= 4 && 
                                                    q.question_data.statistics?.scaled_difficulty < 6 && 
                                                    q.question_data.statistics?.scaled_discrimination >= 4
                                                ).length} questions are in the optimal range (moderate difficulty with good discrimination)</span>
                                                <button
                                                    onClick={() => handleViewQuestions(
                                                        test.questions.filter(q => 
                                                            q.question_data.statistics?.scaled_difficulty >= 4 && 
                                                            q.question_data.statistics?.scaled_difficulty < 6 && 
                                                            q.question_data.statistics?.scaled_discrimination >= 4
                                                        ),
                                                        'Optimal Questions'
                                                    )}
                                                    className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-opacity-90"
                                                >
                                                    View
                                                </button>
                                            </li>
                                            <li className="flex items-center justify-between">
                                                <span>{test.questions.filter(q => 
                                                    q.question_data.statistics?.scaled_discrimination < 3
                                                ).length} questions have poor discrimination and may need review</span>
                                                <button
                                                    onClick={() => handleViewQuestions(
                                                        test.questions.filter(q => q.question_data.statistics?.scaled_discrimination < 3),
                                                        'Poor Discrimination Questions'
                                                    )}
                                                    className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-opacity-90"
                                                >
                                                    View
                                                </button>
                                            </li>
                                            <li className="flex items-center justify-between">
                                                <span>{test.questions.filter(q => 
                                                    q.question_data.statistics?.scaled_difficulty >= 7
                                                ).length} questions are very difficult (may be too challenging)</span>
                                                <button
                                                    onClick={() => handleViewQuestions(
                                                        test.questions.filter(q => q.question_data.statistics?.scaled_difficulty >= 7),
                                                        'Very Difficult Questions'
                                                    )}
                                                    className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-opacity-90"
                                                >
                                                    View
                                                </button>
                                            </li>
                                            <li className="flex items-center justify-between">
                                                <span>{test.questions.filter(q => 
                                                    q.question_data.statistics?.scaled_difficulty < 3
                                                ).length} questions are very easy (may be too simple)</span>
                                                <button
                                                    onClick={() => handleViewQuestions(
                                                        test.questions.filter(q => q.question_data.statistics?.scaled_difficulty < 3),
                                                        'Very Easy Questions'
                                                    )}
                                                    className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-opacity-90"
                                                >
                                                    View
                                                </button>
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

            {/* Questions Dialog with answers */}
            {isQuestionsDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-black dark:text-white">
                                {dialogTitle} ({selectedCategoryQuestions.length} questions)
                            </h3>
                            <button
                                onClick={() => setIsQuestionsDialogOpen(false)}
                                className="text-black dark:text-white hover:text-opacity-70"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto flex-grow">
                            {selectedCategoryQuestions.map((question, index) => (
                                <div key={question.id} className="mb-6 p-4 border rounded dark:border-strokedark">
                                    <div className="font-medium mb-2 text-lg">Question {index + 1}</div>
                                    <div dangerouslySetInnerHTML={{ __html: question.question_data.question_text }} className="mb-4" />
                                    
                                    {/* Display answers */}
                                    <div className="mb-2 font-medium">Answers:</div>
                                    <ul className="space-y-2 mb-4">
                                        {question.question_data.answers.map((answer, ansIdx) => (
                                            <li 
                                                key={ansIdx} 
                                                className={`p-2 rounded flex items-start ${answer.is_correct ? 'bg-success bg-opacity-10 border-l-4 border-success' : ''}`}
                                            >
                                                <div className="flex items-center">
                                                    <div className={`h-5 w-5 flex-shrink-0 rounded-full border mr-2 ${answer.is_correct ? 'bg-success border-success' : 'border-gray-300'}`}>
                                                        {answer.is_correct && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <span dangerouslySetInnerHTML={{ __html: answer.answer_text }} />
                                                    {answer.explanation && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Explanation: {answer.explanation.replace(/<\/?[^>]+(>|$)/g, '')}
                                                        </p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <div className="text-sm text-body-color dark:text-body-color-dark">
                                            <span className="font-medium">Difficulty:</span> {question.question_data.statistics?.scaled_difficulty.toFixed(2)}
                                        </div>
                                        {question.question_data.statistics?.scaled_discrimination !== undefined && (
                                            <div className="text-sm text-body-color dark:text-body-color-dark">
                                                <span className="font-medium">Discrimination:</span> {question.question_data.statistics.scaled_discrimination.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setIsQuestionsDialogOpen(false)}
                                className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestDetails; 