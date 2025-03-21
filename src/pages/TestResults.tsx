import { useState } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { useParams } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface TestData {
    questions: string[];
    responses: {
        studentId: string;
        answers: string[];
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

        try {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const data = e.target?.result;
                if (!data) return;

                // Handle XLSX file
                const workbook = XLSX.read(data, { type: 'binary' });
                
                // Get the first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to array of arrays and remove empty rows
                const csvData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
                
                // Process the CSV data
                const results = processCSVData(csvData);
                
                setTestData({
                    results,
                    totalQuestions: 50  // Since we know there are 50 questions
                });
            };

            reader.readAsBinaryString(file);
        } catch (error) {
            console.error('Error processing file:', error);
        }
    };

    const processCSVContent = (csvContent: string) => {
        const lines = csvContent.split('\n').filter(line => line.trim());
        const csvData = lines.map(line => line.split(','));
        
        // Process the CSV data
        const results = processCSVData(csvData);
        
        setTestData({
            results,
            totalQuestions: 50  // Since we know there are 50 questions
        });
    };

    const processCSVData = (csvData: string[][]) => {
        // Skip header row
        const dataRows = csvData.slice(1);
        
        const processedData = dataRows.map(row => {
            // First column is student ID
            const studentId = row[0];
            
            // Process answers from column 1 to 50 (indices 1 to 50)
            const answers = row.slice(1, 51);
            
            // Count correct answers (ending with '1')
            const correctCount = answers.filter(answer => answer.endsWith('1')).length;
            
            // Count incorrect answers (ending with 'S')
            const incorrectCount = answers.filter(answer => answer.endsWith('S')).length;
            
            // Calculate score as percentage
            const totalAnswered = correctCount + incorrectCount;
            const scorePercentage = totalAnswered > 0 
                ? (correctCount / totalAnswered) * 100 
                : 0;

            return {
                studentId,
                correctCount,
                incorrectCount,
                scorePercentage: Math.round(scorePercentage * 100) / 100
            };
        });

        return processedData;
    };

    const calculateItemDifficulty = (questionIndex: number): number => {
        if (!testData?.results) return 0;
        
        const totalResponses = testData.results.length;
        if (totalResponses === 0) return 0;

        // Count correct answers for this question
        const correctCount = testData.results.reduce((acc, student) => {
            return acc + (student.correctCount > 0 ? 1 : 0);
        }, 0);

        return (correctCount / totalResponses) * 100;
    };

    const calculateStudentScore = (studentIndex: number): number => {
        if (!testData?.results) return 0;
        
        const student = testData.results[studentIndex];
        if (!student) return 0;
        
        return student.scorePercentage;
    };

    const scoreDistributionData = {
        labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
        datasets: [{
            label: 'Number of Students',
            data: testData ? [
                testData.results.filter(r => r.scorePercentage <= 20).length,
                testData.results.filter(r => r.scorePercentage > 20 && r.scorePercentage <= 40).length,
                testData.results.filter(r => r.scorePercentage > 40 && r.scorePercentage <= 60).length,
                testData.results.filter(r => r.scorePercentage > 60 && r.scorePercentage <= 80).length,
                testData.results.filter(r => r.scorePercentage > 80).length,
            ] : [],
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(255, 159, 64, 0.8)',
                'rgba(255, 205, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(54, 162, 235, 0.8)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)'
            ],
            borderWidth: 1
        }]
    };

    const itemDifficultyData = {
        labels: Array.from({ length: 50 }, (_, idx) => `Question ${idx + 1}`),
        datasets: [{
            label: 'Item Difficulty (%)',
            data: Array.from({ length: 50 }, (_, idx) => calculateItemDifficulty(idx)),
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
                position: 'right' as const,
                labels: {
                    padding: 20,
                    font: {
                        size: 12
                    },
                    generateLabels: (chart: any) => {
                        const datasets = chart.data.datasets;
                        return chart.data.labels.map((label: string, i: number) => ({
                            text: `${label} (${datasets[0].data[i]} students)`,
                            fillStyle: datasets[0].backgroundColor[i],
                            hidden: false,
                            lineCap: 'butt',
                            lineDash: [],
                            lineDashOffset: 0,
                            lineJoin: 'miter',
                            lineWidth: 1,
                            strokeStyle: datasets[0].borderColor[i],
                            pointStyle: 'circle',
                            rotation: 0
                        }));
                    }
                }
            },
            title: {
                display: true,
                text: 'Score Distribution',
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    top: 10,
                    bottom: 30
                }
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
                            Upload Results File (CSV or TXT)
                        </label>
                        <input
                            type="file"
                            accept=".csv,.txt,.xlsx,.xls"
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
                        <div className="h-96">
                            <Pie 
                                data={scoreDistributionData} 
                                options={options}
                            />
                        </div>
                        <div className="mt-4 text-center text-sm text-gray-500">
                            Total Students: {testData.results.length}
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
                                    {(testData.results.reduce((acc, r) => acc + calculateStudentScore(testData.results.indexOf(r)), 0) / testData.results.length).toFixed(1)}%
                                </h3>
                            </div>
                            <div className="rounded-sm border border-stroke bg-gray p-4 dark:border-strokedark dark:bg-meta-4">
                                <p className="text-sm text-black dark:text-white">Highest Score</p>
                                <h3 className="mt-1 text-2xl font-bold text-black dark:text-white">
                                    {Math.max(...testData.results.map(r => calculateStudentScore(testData.results.indexOf(r))))}%
                                </h3>
                            </div>
                            <div className="rounded-sm border border-stroke bg-gray p-4 dark:border-strokedark dark:bg-meta-4">
                                <p className="text-sm text-black dark:text-white">Lowest Score</p>
                                <h3 className="mt-1 text-2xl font-bold text-black dark:text-white">
                                    {Math.min(...testData.results.map(r => calculateStudentScore(testData.results.indexOf(r))))}%
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