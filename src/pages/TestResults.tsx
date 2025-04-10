import { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { useParams } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { uploadTestResults, fetchCourseTests, fetchCourses } from '../services/api';

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
    const { courseId } = useParams();
    const [testData, setTestData] = useState<TestData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTest, setSelectedTest] = useState<string>('');
    const [tests, setTests] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingTests, setIsLoadingTests] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log('File selected:', file.name);
            setSelectedFile(file);
        }
    };

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

    const handleTestChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTest(event.target.value);
        setSelectedFile(null);
        setUploadError(null);
    };

    const handleUpload = async () => {
        if (!selectedFile || !selectedCourse || !selectedTest) {
            setUploadError('Please select a test and choose a file');
            return;
        }

        try {
            setIsUploading(true);
            setUploadError(null);
            const response = await uploadTestResults(
                selectedCourse, 
                selectedTest, 
                selectedFile
            );
            console.log('Upload response:', response);
            
            // Clear form after successful upload
            setSelectedFile(null);
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
        } catch (error: any) {
            console.error('Upload failed:', error);
            
            if (error.response?.status === 400) {
                const errorData = error.response.data;
                setUploadError(errorData.error || 'Invalid request. Please check your file format.');
            } else {
                setUploadError('Failed to upload file. Please try again.');
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleCourseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCourse(event.target.value);
        setSelectedTest('');
        setSelectedFile(null);
        setUploadError(null);
    };

    useEffect(() => {
        const loadCourses = async () => {
            try {
                setIsLoadingCourses(true);
                const coursesData = await fetchCourses();
                console.log('Fetched courses:', coursesData);
                setCourses(coursesData);
            } catch (error) {
                console.error('Failed to load courses:', error);
                setError('Failed to load courses');
            } finally {
                setIsLoadingCourses(false);
            }
        };

        loadCourses();
    }, []);

    useEffect(() => {
        const loadTests = async () => {
            if (!selectedCourse) return;
            try {
                setIsLoadingTests(true);
                const testsData = await fetchCourseTests(selectedCourse);
                console.log('Fetched tests:', testsData);
                setTests(testsData);
            } catch (error) {
                console.error('Failed to load tests:', error);
                setUploadError('Failed to load tests');
            } finally {
                setIsLoadingTests(false);
            }
        };

        loadTests();
    }, [selectedCourse]);

    // Add this useEffect to monitor state changes
    useEffect(() => {
        console.log('Debug button state:', {
            selectedFile,
            fileName: selectedFile?.name,
            isUploading,
            selectedTest,
            disabledCondition: !selectedFile || isUploading
        });
    }, [selectedFile, isUploading, selectedTest]);

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
            <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                <h4 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    Upload Test Results
                </h4>
                <div className="flex flex-col gap-4">
                    {/* Course Selection Dropdown */}
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Select Course
                        </label>
                        <div className="relative z-20 bg-transparent dark:bg-form-input">
                            <select
                                value={selectedCourse}
                                onChange={handleCourseChange}
                                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                disabled={isLoadingCourses}
                            >
                                <option value="">Select a course</option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.name}
                                    </option>
                                ))}
                            </select>
                            {isLoadingCourses && (
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Test Selection (only shown when course is selected) */}
                    {selectedCourse && (
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Select Test
                            </label>
                            <div className="relative z-20 bg-transparent dark:bg-form-input">
                                <select
                                    value={selectedTest}
                                    onChange={handleTestChange}
                                    className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    disabled={isLoadingTests}
                                >
                                    <option value="">Select a test</option>
                                    {tests.map((test) => (
                                        <option key={test.id} value={test.id}>
                                            {test.title}
                                        </option>
                                    ))}
                                </select>
                                {isLoadingTests && (
                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* File Input - Only shown when test is selected */}
                    {selectedTest && (
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Upload Results File
                            </label>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary mb-4"
                            />

                            {uploadError && (
                                <p className="text-danger mb-4">{uploadError}</p>
                            )}
                            
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || isUploading}
                                className={`inline-flex items-center justify-center rounded-md ${
                                    !selectedFile || isUploading ? 'bg-gray-400' : 'bg-primary hover:bg-opacity-90'
                                } py-4 px-10 text-center font-medium text-white transition`}
                            >
                                {isUploading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload Results'
                                )}
                            </button>
                        </div>
                    )}
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