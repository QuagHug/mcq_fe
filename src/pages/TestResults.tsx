import { useState } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { useParams } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface TestResult {
    studentId: string;
    responses: number[];
    score: number;
}

interface TestData {
    testId: string;
    testName: string;
    results: TestResult[];
    questions: {
        id: number;
        difficulty: number;
    }[];
}

const TestResults = () => {
    const params = useParams();
    const [testData, setTestData] = useState<TestData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            setTestData(data);
        } catch (err) {
            setError('Failed to parse results file');
        } finally {
            setLoading(false);
        }
    };

    const calculateItemDifficulty = (questionIndex: number): number => {
        if (!testData) return 0;
        const correctCount = testData.results.reduce((acc, result) => 
            acc + result.responses[questionIndex], 0);
        return (correctCount / testData.results.length) * 100;
    };

    const scoreDistributionData = {
        labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
        datasets: [{
            label: 'Number of Students',
            data: testData ? [
                testData.results.filter(r => r.score <= 20).length,
                testData.results.filter(r => r.score > 20 && r.score <= 40).length,
                testData.results.filter(r => r.score > 40 && r.score <= 60).length,
                testData.results.filter(r => r.score > 60 && r.score <= 80).length,
                testData.results.filter(r => r.score > 80).length,
            ] : [],
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
        }]
    };

    const itemDifficultyData = {
        labels: testData?.questions.map((_, idx) => `Question ${idx + 1}`) || [],
        datasets: [{
            label: 'Item Difficulty (%)',
            data: testData?.questions.map((_, idx) => calculateItemDifficulty(idx)) || [],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 20,
                    font: {
                        size: 12
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100
            }
        }
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <Breadcrumb
                pageName="Test Results"
                currentName="Results"
                breadcrumbItems={[
                    { name: "Home", path: "/" },
                    { name: "Tests", path: "/tests" }
                ]}
            />

            {/* Upload Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Upload Test Results
                    </h3>
                </div>
                <div className="p-6.5">
                    <div className="mb-4.5">
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                            Upload Results File (JSON)
                        </label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center p-6">
                    <div className="text-primary">Loading...</div>
                </div>
            )}
            
            {error && (
                <div className="mt-4 rounded-sm border border-danger bg-danger bg-opacity-10 px-6 py-4">
                    <p className="text-danger">{error}</p>
                </div>
            )}

            {/* Analytics Section */}
            {testData && (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Score Distribution Chart */}
                    <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
                            Score Distribution
                        </h2>
                        <div className="h-80">
                            <Pie data={scoreDistributionData} options={options} />
                        </div>
                    </div>

                    {/* Item Difficulty Chart */}
                    <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
                            Item Difficulty Analysis
                        </h2>
                        <div className="h-80">
                            <Bar data={itemDifficultyData} options={options} />
                        </div>
                    </div>

                    {/* Summary Statistics */}
                    <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark md:col-span-2">
                        <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
                            Summary Statistics
                        </h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-sm border border-stroke bg-gray p-4 dark:border-strokedark dark:bg-meta-4">
                                <p className="text-sm text-black dark:text-white">Total Students</p>
                                <h3 className="mt-1 text-2xl font-bold text-black dark:text-white">
                                    {testData.results.length}
                                </h3>
                            </div>
                            <div className="rounded-sm border border-stroke bg-gray p-4 dark:border-strokedark dark:bg-meta-4">
                                <p className="text-sm text-black dark:text-white">Average Score</p>
                                <h3 className="mt-1 text-2xl font-bold text-black dark:text-white">
                                    {(testData.results.reduce((acc, r) => acc + r.score, 0) / testData.results.length).toFixed(1)}%
                                </h3>
                            </div>
                            <div className="rounded-sm border border-stroke bg-gray p-4 dark:border-strokedark dark:bg-meta-4">
                                <p className="text-sm text-black dark:text-white">Highest Score</p>
                                <h3 className="mt-1 text-2xl font-bold text-black dark:text-white">
                                    {Math.max(...testData.results.map(r => r.score))}%
                                </h3>
                            </div>
                            <div className="rounded-sm border border-stroke bg-gray p-4 dark:border-strokedark dark:bg-meta-4">
                                <p className="text-sm text-black dark:text-white">Lowest Score</p>
                                <h3 className="mt-1 text-2xl font-bold text-black dark:text-white">
                                    {Math.min(...testData.results.map(r => r.score))}%
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestResults; 