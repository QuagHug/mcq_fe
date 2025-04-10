import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { fetchQuestionBanks } from '../services/api';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Dialog } from '@mui/material';

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
    chapter: string;
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

// Add this type near the other interfaces at the top
type Difficulty = 'easy' | 'medium' | 'hard';

// Add this type for the distribution table
interface QuestionDistribution {
    [key: string]: {
        [key in Difficulty]: number;
    };
}

// Add these interfaces before the generatePreviewQuestions function
interface PreviewQuestion {
    id: string;
    question_text: string;
    answers: PreviewAnswer[];
}

interface PreviewAnswer {
    answer_text: string;
    is_correct: boolean;
}

const CreateTestAuto: React.FC = (): JSX.Element => {
    const [testData, setTestData] = useState<TestData>({
        title: '',
        description: '',
        combinations: [{
            numberOfQuestions: 1,
            taxonomyLevel: 'remember',
            difficulty: 'easy',
            learningOutcome: 'lo1',
            chapter: ''
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
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewShowAll, setPreviewShowAll] = useState(false);
    const [previewPage, setPreviewPage] = useState(1);
    const previewItemsPerPage = 2; // Default to show only 2 questions initially
    const [includeKey, setIncludeKey] = useState(false);

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
                learningOutcome: 'lo1',
                chapter: ''
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

    // Check if form is valid (has title and at least one combination with questions)
    const isFormValid = testData.title && testData.combinations.some(comb => comb.numberOfQuestions > 0);

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

    // Update the calculateDistribution function
    const calculateDistribution = (): QuestionDistribution => {
        const distribution: QuestionDistribution = {
            'Remember': { easy: 0, medium: 0, hard: 0 },
            'Understand': { easy: 0, medium: 0, hard: 0 },
            'Apply': { easy: 0, medium: 0, hard: 0 },
            'Analyze': { easy: 0, medium: 0, hard: 0 },
            'Evaluate': { easy: 0, medium: 0, hard: 0 },
            'Create': { easy: 0, medium: 0, hard: 0 }
        };

        testData.combinations.forEach(combination => {
            const taxonomy = combination.taxonomyLevel.charAt(0).toUpperCase() + combination.taxonomyLevel.slice(1);
            const difficulty = combination.difficulty as Difficulty;
            if (distribution[taxonomy] && distribution[taxonomy][difficulty]) {
                distribution[taxonomy][difficulty] += combination.numberOfQuestions;
            }
        });

        return distribution;
    };

    // Add this helper function for text sanitization
    const sanitizeHtml = (html: string) => {
        return html.replace(/<\/?[^>]+(>|$)/g, '');
    };

    // Update the generatePreviewQuestions function with proper types
    const generatePreviewQuestions = (): PreviewQuestion[] => {
        let previewQuestions: PreviewQuestion[] = [];
        testData.combinations.forEach((combination, index) => {
            for (let i = 0; i < combination.numberOfQuestions; i++) {
                previewQuestions.push({
                    id: `${index}-${i}`,
                    question_text: `Sample ${combination.taxonomyLevel} level question (${combination.difficulty} difficulty)`,
                    answers: [
                        { answer_text: 'Sample answer 1', is_correct: true },
                        { answer_text: 'Sample answer 2', is_correct: false },
                        { answer_text: 'Sample answer 3', is_correct: false },
                        { answer_text: 'Sample answer 4', is_correct: false },
                    ]
                });
            }
        });
        return previewQuestions;
    };

    // Update the answer mapping in the preview blocks with proper types
    const renderAnswerOption = (answer: PreviewAnswer, ansIndex: number) => (
        <div key={ansIndex} className="text-black dark:text-white">
            {answerFormat.case === 'uppercase'
                ? String.fromCharCode(65 + ansIndex)
                : String.fromCharCode(97 + ansIndex)}
            {answerFormat.separator} {answer.answer_text}
            {includeKey && answer.is_correct && (
                <span className="text-meta-3 ml-2">✓</span>
            )}
        </div>
    );

    // Replace the entire renderPreviewBlock function with a simpler version
    const renderPreviewBlock = () => (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
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
                    <div className="flex gap-6 flex-wrap items-end">
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
                            <button
                                onClick={handleShuffle}
                                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2 px-4 text-white hover:bg-opacity-90"
                            >
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
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Shuffle Questions
                            </button>
                        </div>

                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">
                                Correct Answers
                            </label>
                            <div className="flex items-center gap-2 h-[38px]">
                                <button
                                    onClick={() => setIncludeKey(!includeKey)}
                                    className="relative w-[46px] h-[24px] rounded-full transition-colors duration-300 ease-in-out focus:outline-none"
                                    style={{
                                        backgroundColor: includeKey ? '#4318FF' : '#E2E8F0'
                                    }}
                                >
                                    <div
                                        className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out
                                            ${includeKey ? 'translate-x-[22px]' : 'translate-x-0'}`}
                                    />
                                </button>
                                <span className="text-sm text-black dark:text-white">
                                    {includeKey ? 'Show' : 'Hide'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Preview */}
                <div className="border border-stroke dark:border-strokedark rounded-sm p-6">
                    <h4 className="text-lg font-medium text-black dark:text-white">
                        Test Preview
                    </h4>
                </div>
            </div>
        </div>
    );

    // Remove the Preview Dialog since it's not needed yet
    const renderPreviewDialog = () => null;

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
                                        Chapter
                                    </label>
                                    <select
                                        value={combination.chapter}
                                        onChange={(e) => updateCombination(index, 'chapter', e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                    >
                                        <option value="">Chapter 1</option>
                                        {chapters.map(chapter => (
                                            <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
                                        ))}
                                    </select>
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
                                <div className="flex items-center gap-2">
                                    <div className="w-full">
                                        <label className="mb-2.5 block text-black dark:text-white">
                                            Difficulty
                                        </label>
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
                                    </div>
                                    {testData.combinations.length > 1 && (
                                        <button
                                            onClick={() => removeCombination(index)}
                                            className="mt-8 p-2 text-danger hover:text-danger/80"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
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

            {/* Question Distribution Section */}
            <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Question Distribution
                    </h3>
                </div>

                <div className="p-6.5">
                    <div className="grid grid-cols-1 gap-6">

                        {/* Distribution Table */}
                        <div className="bg-gray-50 dark:bg-meta-4 p-4 rounded-sm overflow-x-auto">
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
                                        const difficulties = calculateDistribution()[taxonomy];
                                        const rowTotal = Object.values(difficulties).reduce((sum, count) => sum + count, 0);

                                        return (
                                            <tr key={taxonomy}>
                                                <td className="py-3 px-4 border-b border-[#eee] dark:border-strokedark">
                                                    {taxonomy}
                                                </td>
                                                <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                    {difficulties.easy}
                                                </td>
                                                <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                    {difficulties.medium}
                                                </td>
                                                <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                    {difficulties.hard}
                                                </td>
                                                <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark font-medium">
                                                    {rowTotal}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Total Row */}
                                    <tr className="bg-gray-2 dark:bg-meta-4">
                                        <td className="py-3 px-4 font-medium">Total</td>
                                        <td className="py-3 px-4 text-center font-medium">
                                            {Object.values(calculateDistribution()).reduce((sum, diff) => sum + diff.easy, 0)}
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium">
                                            {Object.values(calculateDistribution()).reduce((sum, diff) => sum + diff.medium, 0)}
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium">
                                            {Object.values(calculateDistribution()).reduce((sum, diff) => sum + diff.hard, 0)}
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium">
                                            {testData.combinations.reduce((sum, comb) => sum + comb.numberOfQuestions, 0)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {renderPreviewBlock()}

            {renderPreviewDialog()}

            <div className="mt-6 flex gap-4">
                <button
                    onClick={() => window.history.back()}
                    className={`flex w-1/3 items-center justify-center gap-2.5 rounded-md bg-danger py-4 px-10 text-center font-medium text-white hover:bg-opacity-90`}
                >
                    <span>
                        <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2719H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z"
                                fill=""
                            ></path>
                            <path
                                d="M9.00039 9.11255C8.66289 9.11255 8.35352 9.3938 8.35352 9.75942V13.3313C8.35352 13.6688 8.63477 13.9782 9.00039 13.9782C9.33789 13.9782 9.64727 13.6969 9.64727 13.3313V9.75942C9.64727 9.3938 9.33789 9.11255 9.00039 9.11255Z"
                                fill=""
                            ></path>
                            <path
                                d="M11.2502 9.67504C10.8846 9.64692 10.6033 9.90004 10.5752 10.2657L10.4064 12.7407C10.3783 13.0782 10.6314 13.3875 10.9971 13.4157C11.0252 13.4157 11.0252 13.4157 11.0533 13.4157C11.3908 13.4157 11.6721 13.1625 11.6721 12.825L11.8408 10.35C11.8408 9.98442 11.5877 9.70317 11.2502 9.67504Z"
                                fill=""
                            ></path>
                            <path
                                d="M6.72245 9.67504C6.38495 9.70317 6.1037 10.0125 6.13182 10.35L6.3287 12.825C6.35683 13.1625 6.63808 13.4157 6.94745 13.4157C6.97558 13.4157 6.97558 13.4157 7.0037 13.4157C7.3412 13.3875 7.62245 13.0782 7.59433 12.7407L7.39745 10.2657C7.39745 9.90004 7.08808 9.64692 6.72245 9.67504Z"
                                fill=""
                            ></path>
                        </svg>
                    </span>
                    Cancel
                </button>

                <button
                    onClick={handleSubmit}
                    className={`flex w-1/3 items-center justify-center gap-2.5 rounded-md bg-meta-3 py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 ${!selectedCourse ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!selectedCourse}
                >
                    <span>
                        <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M16.5 1.5H1.5C0.675 1.5 0 2.175 0 3V15C0 15.825 0.675 16.5 1.5 16.5H16.5C17.325 16.5 18 15.825 18 15V3C18 2.175 17.325 1.5 16.5 1.5ZM16.5 15H1.5V3H16.5V15ZM4.5 7.5H13.5V9H4.5V7.5ZM4.5 10.5H13.5V12H4.5V10.5ZM4.5 4.5H13.5V6H4.5V4.5Z"
                                fill=""
                            ></path>
                        </svg>
                    </span>
                    Create Test
                </button>

                <button
                    onClick={exportToWord}
                    className={`flex w-1/3 items-center justify-center gap-2.5 rounded-md bg-primary py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 ${!selectedCourse || testData.combinations.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!selectedCourse || testData.combinations.length === 0}
                >
                    <span>
                        <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M16.8754 11.6719C16.5379 11.6719 16.2285 11.9531 16.2285 12.3187V14.8219C16.2285 15.075 16.0316 15.2719 15.7785 15.2719H2.22227C1.96914 15.2719 1.77227 15.075 1.77227 14.8219V12.3187C1.77227 11.9812 1.46289 11.6719 1.12539 11.6719C0.787891 11.6719 0.478516 11.9531 0.478516 12.3187V14.8219C0.478516 15.7781 1.23789 16.5375 2.19414 16.5375H15.7785C16.7348 16.5375 17.4941 15.7781 17.4941 14.8219V12.3187C17.5223 11.9531 17.2129 11.6719 16.8754 11.6719Z"
                                fill=""
                            ></path>
                            <path
                                d="M8.55074 12.3469C8.66324 12.4594 8.83199 12.5156 9.00074 12.5156C9.16949 12.5156 9.31012 12.4594 9.45074 12.3469L13.4726 8.43752C13.7257 8.1844 13.7257 7.79065 13.4726 7.53752C13.2195 7.2844 12.8257 7.2844 12.5726 7.53752L9.64762 10.4063V2.1094C9.64762 1.7719 9.36637 1.46252 9.00074 1.46252C8.66324 1.46252 8.35387 1.74377 8.35387 2.1094V10.4063L5.45074 7.53752C5.19762 7.2844 4.80387 7.2844 4.55074 7.53752C4.29762 7.79065 4.29762 8.1844 4.55074 8.43752L8.55074 12.3469Z"
                                fill=""
                            ></path>
                        </svg>
                    </span>
                    Export to Word
                </button>
            </div>
        </div>
    );
};

export default CreateTestAuto; 