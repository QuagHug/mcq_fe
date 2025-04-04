import React, { useState, useEffect, useRef } from 'react';
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

// Add this type near the other interfaces at the top
type Difficulty = 'easy' | 'medium' | 'hard';

// Add this type for the distribution table
interface QuestionDistribution {
    [key: string]: {
        [key in Difficulty]: number;
    };
}

const CreateTestAuto: React.FC = (): JSX.Element => {
    const [testData, setTestData] = useState<TestData>({
        title: '',
        description: '',
        combinations: [],
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
    const [validationErrors, setValidationErrors] = useState<{
        title: boolean;
        combinations: boolean;
    }>({
        title: false,
        combinations: false
    });
    const [subjects, setSubjects] = useState<Array<{ id: string, name: string }>>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<string>('');
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [answerFormat, setAnswerFormat] = useState<AnswerFormat>({
        case: 'uppercase',
        separator: ')',
    });
    const [showTitleWarning, setShowTitleWarning] = useState(false);
    const [showSubjectWarning, setShowSubjectWarning] = useState(false);
    const [showCombinationWarning, setShowCombinationWarning] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const subjectSelectRef = useRef<HTMLSelectElement>(null);
    const combinationsSectionRef = useRef<HTMLDivElement>(null);

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

    const scrollToElement = (element: HTMLElement | null) => {
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add temporary highlight effect
            element.classList.add('border-primary', 'ring-2', 'ring-primary');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-primary');
            }, 2000);
        }
    };

    // Clear title warning when user types in title
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTestData({ ...testData, title: e.target.value });
        if (showTitleWarning && e.target.value.trim()) {
            setShowTitleWarning(false);
        }
    };

    // Clear subject warning when user selects a subject
    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubject(subjectId);
        setSelectedChapter(''); // Reset chapter selection when subject changes
        if (subjectId) {
            setChapters(mockChaptersMap[subjectId] || []);
            if (showSubjectWarning) {
                setShowSubjectWarning(false);
            }
        } else {
            setChapters([]);
        }
    };

    const handleSubmit = async () => {
        const hasTitleError = !testData.title.trim();
        const hasSubjectError = !selectedSubject;
        const hasCombinationError = testData.combinations.length === 0;

        // Reset all warnings initially
        setShowTitleWarning(false);
        setShowSubjectWarning(false);
        setShowCombinationWarning(false);

        // Check title first
        if (hasTitleError) {
            setShowTitleWarning(true);
            setTimeout(() => {
                scrollToElement(titleInputRef.current);
            }, 0);
            return;
        }


        if (hasSubjectError) {
            setShowSubjectWarning(true);
            setTimeout(() => {
                scrollToElement(subjectSelectRef.current);
            }, 0);
            return;
        }

        if (hasCombinationError) {
            setShowCombinationWarning(true);
            setTimeout(() => {
                const element = document.getElementById('questionChoicesSection');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('border-danger', 'ring-2', 'ring-danger');
                    setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-danger');
                    }, 2000);
                }
            }, 0);
            return;
        }

        try {
            // Add your submission logic here
            console.log('Submitting test data:', testData);
        } catch (error) {
            console.error('Error submitting test:', error);
        }
    };

    // Add handler for combination changes
    const handleCombinationChange = (index: number, field: keyof TestCombination, value: string | number) => {
        updateCombination(index, field, value);
        if (showCombinationWarning && testData.combinations.length > 0 &&
            !testData.combinations.some(comb => comb.numberOfQuestions === 0)) {
            setShowCombinationWarning(false);
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
                                ref={titleInputRef}
                                type="text"
                                placeholder="Enter test title"
                                value={testData.title}
                                onChange={handleTitleChange}
                                className={`w-full rounded border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${showTitleWarning ? 'border-danger' : 'border-stroke'
                                    }`}
                            />
                            {showTitleWarning && (
                                <div className="mt-2 text-danger text-sm">
                                    Please enter a test title
                                </div>
                            )}
                        </div>
                        <div className="mb-4.5">
                            <select
                                ref={subjectSelectRef}
                                value={selectedSubject}
                                onChange={(e) => handleSubjectChange(e.target.value)}
                                className={`w-full rounded border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${showSubjectWarning ? 'border-danger' : 'border-stroke'
                                    }`}
                            >
                                <option value="">Select a subject</option>
                                {mockSubjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                                ))}
                            </select>
                            {showSubjectWarning && (
                                <div className="mt-2 text-danger text-sm">
                                    Please select a subject
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Test Details Block */}
            <div
                id="questionChoicesSection"
                ref={combinationsSectionRef}
                className={`rounded-sm border bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6 ${showCombinationWarning ? 'border-danger' : 'border-stroke'
                    }`}
            >
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white flex items-center gap-1">
                        Question Choices
                        <span className="text-danger text-lg">*</span>
                    </h3>
                    {showCombinationWarning && (
                        <div className="mt-1 text-danger text-sm">
                            Please add at least one question
                        </div>
                    )}
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
                                        onChange={(e) => handleCombinationChange(index, 'numberOfQuestions', Number(e.target.value))}
                                        min="1"
                                        className={`w-full rounded border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input ${showCombinationWarning && combination.numberOfQuestions === 0 ? 'border-danger' : 'border-stroke'
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Taxonomy Level
                                    </label>
                                    <select
                                        value={combination.taxonomyLevel}
                                        onChange={(e) => handleCombinationChange(index, 'taxonomyLevel', e.target.value)}
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
                                            onChange={(e) => handleCombinationChange(index, 'difficulty', e.target.value)}
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
                        {/* Remove the chapter selection section */}
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
                            {testData.combinations.length > 0 ? (
                                testData.combinations.map((combination, index) => (
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
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <p>No questions selected yet.</p>
                                    <p className="text-sm mt-2">Please configure your question choices to see the preview.</p>
                                </div>
                            )}
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

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => window.history.back()}
                    className="flex flex-1 justify-center rounded bg-danger py-4 px-10 font-medium text-white hover:bg-opacity-90 cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    className="flex flex-1 justify-center rounded bg-primary py-4 px-10 font-medium text-white hover:bg-opacity-90 cursor-pointer"
                >
                    Save
                </button>
                <button
                    onClick={exportToWord}
                    className="flex flex-1 justify-center rounded bg-success py-4 px-10 font-medium text-white hover:bg-opacity-90 cursor-pointer"
                    disabled={!isFormValid}
                >
                    Export to Word
                </button>
            </div>
        </div>
    );
};

export default CreateTestAuto; 