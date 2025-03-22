import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { fetchQuestionBanks } from '../services/api';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

interface QuestionBank {
    id: number;
    name: string;
    bank_id: string;
    parent: number | null;
    children: QuestionBank[];
    questions: any[];
}

interface TestCombination {
    numberOfQuestions: number;
    taxonomyLevel: string;
    difficulty: string;
    learningOutcome: string;
}

interface TestData {
    title: string;
    description: string;
    combinations: TestCombination[];
    topics?: string[];
}

interface Chapter {
    id: number;
    name: string;
}

interface AnswerFormat {
    case: 'uppercase' | 'lowercase';
    separator: string;
}

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const CreateTestAuto: React.FC = (): JSX.Element => {
    const [testData, setTestData] = useState<TestData>({
        title: '',
        description: '',
        combinations: [{
            numberOfQuestions: 1,
            taxonomyLevel: 'remember',
            difficulty: 'easy',
            learningOutcome: 'lo1'
        }],
        topics: []
    });

    const [courses, setCourses] = useState<Array<{ id: string, name: string }>>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [isTestDetailsExpanded, setIsTestDetailsExpanded] = useState(true);
    const [showTopics, setShowTopics] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<Array<{ id: string, name: string }>>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<string>('');
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [answerFormat, setAnswerFormat] = useState<AnswerFormat>({
        case: 'uppercase',
        separator: ')',
    });

    const topics = [
        'PPL', 'DSA', 'Discrete Math', 'Dynamic Programming', 'Math'
    ];

    // Mock data for subjects and chapters
    const mockSubjects = [
        { id: "1", name: "Mathematics" },
        { id: "2", name: "Physics" },
        { id: "3", name: "Computer Science" },
        { id: "4", name: "Chemistry" }
    ];

    const mockChaptersMap: Record<string, Chapter[]> = {
        "1": [ // Mathematics chapters
            { id: 1, name: "Algebra" },
            { id: 2, name: "Calculus" },
            { id: 3, name: "Geometry" },
            { id: 4, name: "Statistics" }
        ],
        "2": [ // Physics chapters
            { id: 5, name: "Mechanics" },
            { id: 6, name: "Thermodynamics" },
            { id: 7, name: "Electromagnetism" }
        ],
        "3": [ // Computer Science chapters
            { id: 8, name: "Programming Basics" },
            { id: 9, name: "Data Structures & Algorithms" },
            { id: 10, name: "PPL" }
        ],
        "4": [ // Chemistry chapters
            { id: 11, name: "Organic Chemistry" },
            { id: 12, name: "Inorganic Chemistry" },
            { id: 13, name: "Physical Chemistry" }
        ]
    };

    const toggleTopic = (topic: string) => {
        setTestData(prev => ({
            ...prev,
            topics: prev.topics?.includes(topic)
                ? prev.topics.filter(t => t !== topic)
                : [...(prev.topics || []), topic]
        }));
    };

    const handleDescriptionChange = (content: string) => {
        setTestData(prev => ({
            ...prev,
            description: content
        }));
    };

    const addNewCombination = () => {
        setTestData(prev => ({
            ...prev,
            combinations: [...prev.combinations, {
                numberOfQuestions: 1,
                taxonomyLevel: 'remember',
                difficulty: 'easy',
                learningOutcome: 'lo1'
            }]
        }));
    };

    const removeCombination = (index: number) => {
        if (testData.combinations.length > 1) {
            setTestData(prev => ({
                ...prev,
                combinations: prev.combinations.filter((_, i) => i !== index)
            }));
        }
    };

    const updateCombination = (index: number, field: keyof TestCombination, value: string | number) => {
        setTestData(prev => ({
            ...prev,
            combinations: prev.combinations.map((comb, i) =>
                i === index ? { ...comb, [field]: value } : comb
            )
        }));
    };

    const handleSubmit = async () => {
        try {
            // Add your submission logic here
            console.log('Submitting test data:', testData);
        } catch (error) {
            console.error('Error submitting test:', error);
        }
    };

    // Fetch courses on component mount
    useEffect(() => {
        const loadCourses = async () => {
            try {
                const mockCoursesData = [
                    { id: "1", name: "Introduction to Programming" },
                    { id: "2", name: "Data Structures and Algorithms" },
                    { id: "3", name: "Web Development" },
                    { id: "4", name: "Machine Learning" },
                    { id: "5", name: "Database Systems" }
                ];
                setCourses(mockCoursesData);
            } catch (err) {
                setError('Failed to load courses');
            }
        };
        loadCourses();
    }, []);

    // Handle course selection and fetch question banks
    const handleCourseChange = async (courseId: string) => {
        setSelectedCourse(courseId);
        if (courseId) {
            try {
                setLoading(true);
                const data = await fetchQuestionBanks(courseId);
                setQuestionBanks(data);
            } catch (err) {
                setError('Failed to load question banks');
            } finally {
                setLoading(false);
            }
        } else {
            setChapters([]);
        }
    };

    // Add this function to handle subject changes
    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubject(subjectId);
        setSelectedChapter(''); // Reset chapter selection when subject changes

        if (subjectId) {
            setChapters(mockChaptersMap[subjectId] || []);
        } else {
            setChapters([]);
        }
    };

    // Check if form is valid (both subject and chapter are selected)
    const isFormValid = selectedSubject && selectedChapter;

    useEffect(() => {
        const loadBanks = async () => {
            if (!selectedCourse) return;
            try {
                const data = await fetchQuestionBanks(selectedCourse);
                setQuestionBanks(data);
            } catch (err) {
                setError('Failed to load question banks');
            }
        };
        loadBanks();
    }, [selectedCourse]);

    const handleShuffle = () => {
        setShuffleQuestions(!shuffleQuestions);
    };

    const exportToWord = async () => {
        if (!testData.title || testData.combinations.length === 0) {
            setError('Please add a title and at least one combination before exporting');
            return;
        }

        // Create a new Document
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: testData.title,
                                bold: true,
                                size: 32,
                            }),
                        ],
                        spacing: { after: 400 },
                    }),
                    ...(testData.description ? [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: testData.description,
                                }),
                            ],
                            spacing: { after: 400 },
                        }),
                    ] : []),
                    ...testData.combinations.map((combination, index) =>
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Combination ${index + 1}:`,
                                    bold: true,
                                }),
                                new TextRun({
                                    text: `\nNumber of Questions: ${combination.numberOfQuestions}`,
                                }),
                                new TextRun({
                                    text: `\nTaxonomy Level: ${combination.taxonomyLevel}`,
                                }),
                                new TextRun({
                                    text: `\nDifficulty: ${combination.difficulty}`,
                                }),
                            ],
                            spacing: { before: 400, after: 200 },
                        })
                    ),
                ],
            }],
        });

        try {
            const blob = await Packer.toBlob(doc);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            saveAs(blob, `${testData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.docx`);
        } catch (err) {
            console.error('Error generating document:', err);
            setError('Failed to generate document');
        }
    };

    return (
        <div className="mx-auto max-w-270">
            <Breadcrumb
                pageName="Create Test Automatically"
                currentName="Create Test"
                breadcrumbItems={[
                    { name: "Home Page", path: "/" },
                    { name: "Create Test", path: "/create-test" }
                ]}
            />

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                <div
                    className="border-b border-stroke px-6.5 py-4 dark:border-strokedark cursor-pointer flex justify-between items-center"
                    onClick={() => setIsTestDetailsExpanded(!isTestDetailsExpanded)}
                >
                    <h3 className="font-medium text-black dark:text-white flex items-center gap-1">
                        Test Details
                        <span className="text-danger text-lg">*</span>
                    </h3>
                    <svg
                        className={`w-4 h-4 transform transition-transform duration-200 ${isTestDetailsExpanded ? 'rotate-180' : ''
                            }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
                {isTestDetailsExpanded && (
                    <div className="p-6.5">
                        <div className="mb-4.5">
                            <input
                                type="text"
                                placeholder="Enter test title"
                                value={testData.title}
                                onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                required
                            />
                        </div>
                        <div className="mb-4.5">
                            <select
                                value={selectedSubject}
                                onChange={(e) => handleSubjectChange(e.target.value)}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            >
                                <option value="">Select a subject</option>
                                {mockSubjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Test Details Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white flex items-center gap-1">
                        Question Choices
                        <span className="text-danger text-lg">*</span>
                    </h3>
                </div>
                <div className="p-6.5">


                    {/* Parameters Row */}
                    {testData.combinations.map((combination, index) => (
                        <div key={index} className="mb-6 relative">
                            <div className="grid grid-cols-4 gap-4 mb-4.5">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Number of Questions
                                    </label>
                                    <input
                                        type="number"
                                        value={combination.numberOfQuestions}
                                        onChange={(e) => updateCombination(index, 'numberOfQuestions', Number(e.target.value))}
                                        min="1"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Taxonomy Level
                                    </label>
                                    <select
                                        value={combination.taxonomyLevel}
                                        onChange={(e) => updateCombination(index, 'taxonomyLevel', e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                    >
                                        <option value="">Select Level</option>
                                        <option value="remember">Remember</option>
                                        <option value="understand">Understand</option>
                                        <option value="apply">Apply</option>
                                        <option value="analyze">Analyze</option>
                                        <option value="evaluate">Evaluate</option>
                                        <option value="create">Create</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Difficulty
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={combination.difficulty}
                                            onChange={(e) => updateCombination(index, 'difficulty', e.target.value)}
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                        >
                                            <option value="">Select Difficulty</option>
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                        {testData.combinations.length > 1 && (
                                            <button
                                                onClick={() => removeCombination(index)}
                                                className="p-2 text-danger hover:text-danger/80"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addNewCombination}
                        className="text-primary hover:text-primary/80 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add another combination
                    </button>

                    {/* Course and Test Bank Selection */}
                    <div className="mt-6 space-y-4">
                        {selectedSubject && (
                            <div>
                                <label className="mb-2.5 block text-black dark:text-white">
                                    Select Chapter
                                </label>
                                <select
                                    value={selectedChapter}
                                    onChange={(e) => setSelectedChapter(e.target.value)}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                >
                                    <option value="">Select a chapter</option>
                                    {chapters.map(chapter => (
                                        <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Preview
                    </h3>
                </div>

                <div className="p-6.5">
                    {/* Test Configuration */}
                    <div className="mb-6 bg-gray-50 dark:bg-meta-4 p-4 rounded-sm">
                        <h4 className="text-lg font-medium text-black dark:text-white mb-4">
                            Test Configuration
                        </h4>
                        <div className="flex gap-6 flex-wrap">
                            <div>
                                <label className="mb-2.5 block text-black dark:text-white">
                                    Letter Case
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setAnswerFormat(prev => ({ ...prev, case: 'uppercase' }))}
                                        className={`px-4 py-2 rounded ${answerFormat.case === 'uppercase'
                                            ? 'bg-primary text-white'
                                            : 'bg-white dark:bg-meta-4 border border-stroke'
                                            }`}
                                    >
                                        ABC
                                    </button>
                                    <button
                                        onClick={() => setAnswerFormat(prev => ({ ...prev, case: 'lowercase' }))}
                                        className={`px-4 py-2 rounded ${answerFormat.case === 'lowercase'
                                            ? 'bg-primary text-white'
                                            : 'bg-white dark:bg-meta-4 border border-stroke'
                                            }`}
                                    >
                                        abc
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2.5 block text-black dark:text-white">
                                    Separator
                                </label>
                                <div className="flex gap-3">
                                    {[')', '.', '/'].map(separator => (
                                        <button
                                            key={separator}
                                            onClick={() => setAnswerFormat(prev => ({ ...prev, separator }))}
                                            className={`px-4 py-2 rounded ${answerFormat.separator === separator
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-meta-4 border border-stroke'
                                                }`}
                                        >
                                            A{separator}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2.5 block text-black dark:text-white">
                                    Question Order
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleShuffle}
                                        className="px-4 py-2 rounded bg-white dark:bg-meta-4 border border-stroke hover:bg-primary hover:text-white hover:border-primary active:bg-opacity-80 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg
                                                className="w-4 h-4 transform group-hover:rotate-180 transition-transform duration-300"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                />
                                            </svg>
                                            <span className="whitespace-nowrap">Shuffle Questions</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2.5 block text-black dark:text-white">
                                    Answer Key
                                </label>
                                <button
                                    className={`px-4 py-2 rounded border bg-white dark:bg-meta-4 border-stroke hover:bg-primary hover:text-white hover:border-primary transition-all duration-200`}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                        <span>Include Key</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Test Preview */}
                    <div className="border border-stroke dark:border-strokedark rounded-sm p-6 relative">
                        <div className="mb-4">
                            <h4 className="text-lg font-medium text-black dark:text-white">
                                Test Preview
                            </h4>
                        </div>

                        {/* Preview Sample */}
                        <div className="space-y-4">
                            {testData.combinations.map((combination, index) => (
                                <div key={index} className="p-4 border rounded-sm dark:border-strokedark">
                                    <div className="font-medium text-black dark:text-white mb-2">
                                        Combination {index + 1}:
                                    </div>
                                    <div className="pl-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <div>Number of Questions: {combination.numberOfQuestions}</div>
                                        <div>Taxonomy Level: {combination.taxonomyLevel}</div>
                                        <div>Difficulty: {combination.difficulty}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Section */}
            <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Summary
                    </h3>
                </div>

                <div className="p-6.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Stats */}
                        <div className="bg-gray-50 dark:bg-meta-4 p-4 rounded-sm">
                            <h5 className="font-medium text-black dark:text-white mb-3">
                                Overview
                            </h5>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm">Total Questions:</span>
                                    <span className="font-medium">
                                        {testData.combinations.reduce((sum, comb) => sum + comb.numberOfQuestions, 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Combinations:</span>
                                    <span className="font-medium">{testData.combinations.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Distribution Chart */}
                        <div className="bg-gray-50 dark:bg-meta-4 p-4 rounded-sm">
                            <h5 className="font-medium text-black dark:text-white mb-3">
                                Question Distribution
                            </h5>
                            <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                                Distribution chart will be shown here
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Update the Save button to be disabled when form is invalid */}
            <div className="mt-6 flex gap-4">
                <button
                    onClick={() => window.history.back()}
                    className="flex flex-1 justify-center rounded bg-danger py-4 px-10 font-medium text-white hover:bg-opacity-90"
                >
                    Cancel
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className={`flex flex-1 justify-center rounded py-4 px-10 font-medium text-white ${isFormValid
                        ? 'bg-primary hover:bg-opacity-90'
                        : 'bg-gray-400 cursor-not-allowed'
                        }`}
                >
                    Save
                </button>

                <button
                    onClick={exportToWord}
                    className="flex flex-1 justify-center rounded bg-success py-4 px-10 font-medium text-white hover:bg-opacity-90"
                    disabled={!isFormValid}
                >
                    Export to Word
                </button>
            </div>
        </div>
    );
};

export default CreateTestAuto; 