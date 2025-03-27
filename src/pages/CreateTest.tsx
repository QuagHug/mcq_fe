import { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import Pagination from '../components/Pagination';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchQuestionBanks, fetchCourses, createTest, fetchCourseTests } from '../services/api';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Dialog } from '@headlessui/react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import React from 'react';

interface Question {
    id: number;
    question_text: string;
    marks: number;
    bank_id: string;
    selected?: boolean;
    answers?: { answer_text: string; is_correct: boolean }[];
    taxonomies?: { taxonomy: { name: string }; level: string }[];
    learningObjective?: string;
}

interface QuestionBank {
    id: number;
    name: string;
    bank_id: string;
    parent: number | null;
    children: QuestionBank[];
    questions: any[];
}

interface Answer {
    answer_text: string;
    is_correct: boolean;
}

interface LearningObjective {
    id: string;
    name: string;
}

interface SubjectLOs {
    [key: string]: LearningObjective[];
}

interface AnswerFormat {
    case: 'uppercase' | 'lowercase';
    separator: string;
}

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Add new interface for edited answer visibility
interface EditedQuestion extends Question {
    hiddenAnswers?: boolean[];
}

// Update the truncateText function
const truncateText = (text: string, maxLength: number = 50) => {
    // First remove any HTML tags
    const cleanText = text.replace(/<[^>]+>/g, '');
    if (cleanText.length <= maxLength) return cleanText;
    // Find the last space before maxLength to avoid cutting words in the middle
    const lastSpace = cleanText.substring(0, maxLength).lastIndexOf(' ');
    // If no space found, just cut at maxLength
    const truncateAt = lastSpace > 0 ? lastSpace : maxLength;
    return cleanText.substring(0, truncateAt) + '...';
};

// Add this type near the other interfaces at the top
interface QuestionDistribution {
    [key: string]: {
        easy: number;
        medium: number;
        hard: number;
    };
}

const CreateTest = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Array<{ id: string, name: string }>>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [testData, setTestData] = useState({
        title: '',
        description: '',
    });

    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<string>('');
    const [showQuestionBank, setShowQuestionBank] = useState(false);
    const [isTestDetailsExpanded, setIsTestDetailsExpanded] = useState(true);
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [showTopics, setShowTopics] = useState(false);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
    const [selectedQuestionDetail, setSelectedQuestionDetail] = useState<Question | null>(null);
    const [showBloomsLevels, setShowBloomsLevels] = useState(false);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [isPreviewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [answerFormat, setAnswerFormat] = useState<AnswerFormat>({
        case: 'uppercase',
        separator: ')',
    });

    // Update state type
    const [editedQuestions, setEditedQuestions] = useState<{ [key: number]: EditedQuestion }>({});
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: boolean[] }>({});

    // Add these new state variables at the top with other state declarations
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Add new state for including answer key
    const [includeKey, setIncludeKey] = useState(false);
    const [shuffleAnswers, setShuffleAnswers] = useState(false);

    // Add subject handling
    const [selectedSubject, setSelectedSubject] = useState('');
    const mockSubjects = [
        { id: "1", name: "Mathematics" },
        { id: "2", name: "Physics" },
        { id: "3", name: "Computer Science" },
        { id: "4", name: "Chemistry" }
    ];

    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubject(subjectId);
    };

    const subjectLOs: SubjectLOs = {
        'DSA': [
            { id: 'lo1', name: 'L.O.1' },
            { id: 'lo2', name: 'L.O.2' },
            { id: 'lo3', name: 'L.O.3' }
        ],
        'PPL': [
            { id: 'lo1', name: 'L.O.1' },
            { id: 'lo2', name: 'L.O.2' },
            { id: 'lo3', name: 'L.O.3' },
            { id: 'lo4', name: 'L.O.4' }
        ]
    };

    // Replace topics with Bloom's levels
    const bloomsLevels = [
        'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'
    ];

    // Fetch courses on component mount
    useEffect(() => {
        const loadCourses = async () => {
            try {
                const coursesData = await fetchCourses();
                setCourses(coursesData);
            } catch (err) {
                setError('Failed to load courses');
            }
        };
        loadCourses();
    }, []);

    // Update the course selection handler
    const handleCourseChange = async (courseId: string) => {
        setSelectedCourse(courseId);
        if (courseId) {
            try {
                setLoading(true);
                // Only fetch question banks
                const banksData = await fetchQuestionBanks(courseId);
                setQuestionBanks(banksData);
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Failed to load question banks');
            } finally {
                setLoading(false);
            }
        } else {
            setQuestionBanks([]);
        }
    };

    useEffect(() => {
        const allQuestions = questionBanks.flatMap(bank => {
            const getQuestionsFromBank = (bank: QuestionBank): Question[] => {
                const bankQuestions = bank.questions?.map(q => ({
                    ...q,
                    bank_id: bank.id.toString() // Ensure each question has its bank_id
                })) || [];
                const childQuestions = bank.children?.flatMap(child =>
                    getQuestionsFromBank(child)
                ) || [];
                return [...bankQuestions, ...childQuestions];
            };
            return getQuestionsFromBank(bank);
        });

        const filtered = allQuestions.filter(question => {
            const matchesSearch = question.question_text.toLowerCase()
                .includes(searchQuery.toLowerCase());

            const matchesLevels = selectedLevels.length === 0 ||
                selectedLevels.some(level =>
                    question.taxonomies?.some((tax: { taxonomy: { name: string }; level: string }) =>
                        tax.taxonomy.name === "Bloom's Taxonomy" &&
                        tax.level === level
                    )
                );

            // Check if question belongs to selected bank or its children
            const matchesBank = !selectedBankId || (() => {
                // If no bank is selected, show all questions
                if (!selectedBankId) return true;

                // Find the selected bank in the tree
                const findBank = (banks: QuestionBank[]): QuestionBank | null => {
                    for (const bank of banks) {
                        if (bank.id.toString() === selectedBankId) return bank;
                        if (bank.children) {
                            const found = findBank(bank.children);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const selectedBank = findBank(questionBanks);
                if (!selectedBank) return false;

                // Get all bank IDs that should be included (selected bank and its children)
                const getAllBankIds = (bank: QuestionBank): string[] => {
                    const ids = [bank.id.toString()];
                    if (bank.children) {
                        bank.children.forEach(child => {
                            ids.push(...getAllBankIds(child));
                        });
                    }
                    return ids;
                };

                const validBankIds = getAllBankIds(selectedBank);
                return validBankIds.includes(question.bank_id);
            })();

            return matchesSearch && matchesLevels && matchesBank;
        });

        setFilteredQuestions(filtered);
    }, [searchQuery, selectedLevels, selectedBankId, questionBanks]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Test Data:', {
            ...testData,
            questions: selectedQuestions
        });
    };

    const toggleQuestionSelection = (question: Question) => {
        if (selectedQuestions.find(q => q.id === question.id)) {
            setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
        } else {
            setSelectedQuestions(prev => [...prev, question]);
        }
    };

    const handleShuffle = () => {
        setShuffleQuestions(!shuffleQuestions);
    };

    const toggleLevel = (level: string) => {
        setSelectedLevels(prev =>
            prev.includes(level)
                ? prev.filter(l => l !== level)
                : [...prev, level]
        );
    };

    const toggleLO = (loId: string) => {
        setSelectedTopics(prev =>
            prev.includes(loId)
                ? prev.filter(id => id !== loId)
                : [...prev, loId]
        );
    };

    // Add new function to shuffle answers for all questions
    const handleShuffleAnswers = () => {
        setShuffleAnswers(!shuffleAnswers);
    };

    // Modify the exportToWord function to handle answer key
    const exportToWord = async () => {
        if (!testData.title || selectedQuestions.length === 0) {
            setError('Please add a title and select questions before exporting');
            return;
        }

        // Prepare questions array - shuffle if needed
        const questionsToExport = shuffleQuestions
            ? [...selectedQuestions].sort(() => Math.random() - 0.5)
            : selectedQuestions;

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
                                    text: testData.description.replace(/<[^>]+>/g, ''),
                                }),
                            ],
                            spacing: { after: 400 },
                        }),
                    ] : []),

                    ...questionsToExport.flatMap((question, index) => {
                        // For each question, prepare its answers - shuffle if needed
                        const questionAnswers = shuffleAnswers
                            ? [...(question.answers || [])].sort(() => Math.random() - 0.5)
                            : question.answers || [];

                        return [
                            // Question text
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Question ${index + 1}: `,
                                        bold: true,
                                    }),
                                    new TextRun({
                                        text: question.question_text.replace(/<[^>]+>/g, ''),
                                    }),
                                ],
                                spacing: { before: 400, after: 200 },
                            }),

                            // Answers
                            ...questionAnswers.map((answer, ansIndex) =>
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: `${String.fromCharCode(65 + ansIndex)}) `,
                                            bold: true,
                                        }),
                                        new TextRun({
                                            text: answer.answer_text.replace(/<[^>]+>/g, ''),
                                        }),
                                    ],
                                    indent: { left: 720 },
                                    spacing: { before: 100, after: 100 },
                                })
                            ),
                        ];
                    }),
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

    const handleCancel = () => {
        navigate('/');
    };

    const handleQuestionClick = (question: Question) => {
        setSelectedQuestionDetail(question);
        setIsQuestionDialogOpen(true);
    };

    const sanitizeHtml = (html: string) => {
        return html.replace(/<\/?[^>]+(>|$)/g, '');
    };

    const calculateLOStats = (questions: Question[], selectedLOs: string[]) => {
        const stats = selectedLOs.reduce((acc, lo) => {
            acc[lo] = 0;
            return acc;
        }, {} as Record<string, number>);

        questions.forEach(question => {
            if (question.learningObjective) {
                stats[question.learningObjective]++;
            }
        });

        return stats;
    };

    const toggleAnswer = (questionId: number, answerIndex: number) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: prev[questionId]?.map((selected, idx) =>
                idx === answerIndex ? !selected : selected
            ) || []
        }));
    };

    const handleSaveChanges = async (overwrite: boolean) => {
        if (!selectedQuestionDetail) return;

        const selectedAnswersList = selectedAnswers[selectedQuestionDetail.id] || [];

        const updatedQuestion = {
            ...selectedQuestionDetail,
            hiddenAnswers: selectedAnswersList.map(selected => !selected)
        };

        if (overwrite) {
            try {
                console.log('Updating question in bank:', updatedQuestion);
            } catch (error) {
                console.error('Failed to update question in bank:', error);
                return;
            }
        }

        setEditedQuestions(prev => ({
            ...prev,
            [updatedQuestion.id]: updatedQuestion
        }));

        setSelectedQuestions(prev =>
            prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
        );

        setIsQuestionDialogOpen(false);
    };

    useEffect(() => {
        if (selectedQuestionDetail) {
            const existingQuestion = editedQuestions[selectedQuestionDetail.id];
            const initialAnswerStates = selectedQuestionDetail.answers?.map(() => true) || [];
            if (existingQuestion?.hiddenAnswers) {
                existingQuestion.hiddenAnswers.forEach((isHidden, index) => {
                    if (isHidden) {
                        initialAnswerStates[index] = false;
                    }
                });
            }

            setSelectedAnswers(prev => ({
                ...prev,
                [selectedQuestionDetail.id]: initialAnswerStates
            }));
        }
    }, [selectedQuestionDetail, editedQuestions]);

    // Add helper function to check if a question is in the test
    const isQuestionInTest = (questionId: number) => {
        return selectedQuestions.some(q => q.id === questionId);
    };

    // Add shuffle answers function
    const shuffleQuestionAnswers = (questionId: number) => {
        if (!selectedQuestionDetail?.answers) return;

        // Create a copy of the current answers array
        const currentAnswers = [...selectedQuestionDetail.answers];
        const currentSelected = selectedAnswers[questionId] || currentAnswers.map(() => true);

        // Create array of indices and shuffle them
        const indices = currentAnswers.map((_, index) => index);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Reorder answers and selected states based on shuffled indices
        const shuffledAnswers = indices.map(i => currentAnswers[i]);
        const shuffledSelected = indices.map(i => currentSelected[i]);

        // Update the question with shuffled answers
        setSelectedQuestionDetail({
            ...selectedQuestionDetail,
            answers: shuffledAnswers
        });

        // Update selected answers state
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: shuffledSelected
        }));
    };

    // Add a recursive function to render bank options
    const renderBankOptions = (banks: QuestionBank[], level: number = 0) => {
        return banks.map(bank => (
            <React.Fragment key={bank.id}>
                <option value={bank.id}>
                    {level > 0 ? '  '.repeat(level) + '↳ ' : ''}{bank.name}
                </option>
                {bank.children && bank.children.length > 0 && renderBankOptions(bank.children, level + 1)}
            </React.Fragment>
        ));
    };

    // Update the filtering logic to handle any depth of nesting
    const findQuestionInBank = (bank: QuestionBank, questionBankId: string): boolean => {
        if (bank.id.toString() === questionBankId) return true;
        if (bank.children) {
            return bank.children.some(child => findQuestionInBank(child, questionBankId));
        }
        return false;
    };

    const getAllQuestionsFromBank = (bank: QuestionBank): any[] => {
        const bankQuestions = bank.questions || [];
        const childQuestions = bank.children?.flatMap(child => getAllQuestionsFromBank(child)) || [];
        return [...bankQuestions, ...childQuestions];
    };

    const filterQuestions = () => {
        const allQuestions = questionBanks.flatMap(bank => getAllQuestionsFromBank(bank));

        return allQuestions.filter(question => {
            const matchesSearch = question.question_text.toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesBank = !selectedBankId ||
                question.bank_id === selectedBankId ||
                questionBanks.some(bank => findQuestionInBank(bank, selectedBankId));
            return matchesSearch && matchesBank;
        });
    };

    const handleCreateTest = async () => {
        if (!testData.title || selectedQuestions.length === 0 || !selectedCourse) {
            console.log('Validation failed:', {
                hasTitle: !!testData.title,
                hasQuestions: selectedQuestions.length > 0,
                hasSelectedCourse: !!selectedCourse
            });
            return;
        }

        try {
            console.log('Making API call with data:', {
                title: testData.title,
                question_ids: selectedQuestions.map(q => q.id)
            });

            setLoading(true);
            const response = await createTest(selectedCourse, {
                title: testData.title,
                question_ids: selectedQuestions.map(q => q.id)
            });

            console.log('API response:', response);
            navigate(`/courses/${selectedCourse}/tests`);
        } catch (error) {
            console.error('Failed to create test:', error);
            setError('Failed to create test. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Add this function before the return statement
    const calculateDistribution = () => {
        const distribution: QuestionDistribution = {
            'Remember': { easy: 0, medium: 0, hard: 0 },
            'Understand': { easy: 0, medium: 0, hard: 0 },
            'Apply': { easy: 0, medium: 0, hard: 0 },
            'Analyze': { easy: 0, medium: 0, hard: 0 },
            'Evaluate': { easy: 0, medium: 0, hard: 0 },
            'Create': { easy: 0, medium: 0, hard: 0 }
        };

        selectedQuestions.forEach(question => {
            const taxonomy = question.taxonomies?.find(tax =>
                tax.taxonomy.name === "Bloom's Taxonomy"
            )?.level || 'Remember';

            // For this example, we'll set all questions as 'medium' difficulty
            // You can modify this once you have actual difficulty data
            const difficulty = 'medium';

            if (distribution[taxonomy]) {
                distribution[taxonomy][difficulty]++;
            }
        });

        return distribution;
    };

    return (
        <div className="mx-auto max-w-270">
            <Breadcrumb
                pageName="Create Test Manually"
                currentName="Create Test"
                breadcrumbItems={[
                    { name: "Home Page", path: "/" },
                    { name: "Create Test", path: "/create-test" }
                ]}
            />

            <div className="mb-6">
                <select
                    value={selectedCourse}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none"
                >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                </select>
            </div>

            {loading && <div>Loading question banks...</div>}
            {error && <div className="text-danger">{error}</div>}

            {selectedCourse && !loading && (
                <>
                    {/* Test Details Block */}
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
                                className={`w-4 h-4 transform transition-transform duration-200 ${isTestDetailsExpanded ? 'rotate-180' : ''}`}
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
                                <div>
                                    {/* Editor component commented out */}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Question Selection Block */}
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark">
                        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-black dark:text-white flex items-center gap-1">
                                        Questions
                                        <span className="text-danger text-lg">*</span>
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Available Questions List */}
                        <div className="p-6.5 border-b border-stroke dark:border-strokedark">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-medium text-black dark:text-white">
                                    Available Questions
                                </h4>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        placeholder="Search questions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="rounded-md border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                    />
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowBloomsLevels(!showBloomsLevels)}
                                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2 px-6 text-white hover:bg-opacity-90"
                                        >
                                            <span>Bloom's Levels</span>
                                            <svg
                                                className={`w-4 h-4 transform transition-transform duration-200 ${showBloomsLevels ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>

                                        {showBloomsLevels && (
                                            <div className="absolute top-full right-0 mt-2 w-80 bg-[#C0C0C0] dark:bg-boxdark rounded-sm shadow-lg z-50 p-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {bloomsLevels.map(level => (
                                                        <button
                                                            key={level}
                                                            onClick={() => toggleLevel(level)}
                                                            className={`px-3 py-1 rounded-full text-sm ${selectedLevels.includes(level)
                                                                ? 'bg-primary text-white'
                                                                : 'bg-white dark:bg-meta-4 hover:bg-gray-100 dark:hover:bg-meta-3'
                                                                }`}
                                                        >
                                                            {level}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={selectedBankId}
                                            onChange={(e) => setSelectedBankId(e.target.value)}
                                            className="rounded-md border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none"
                                        >
                                            <option value="">All Banks</option>
                                            {renderBankOptions(questionBanks)}
                                        </select>
                                    </div>
                                    <svg
                                        className={`w-4 h-4 transform transition-transform duration-200 cursor-pointer ${showQuestionBank ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                        onClick={() => setShowQuestionBank(!showQuestionBank)}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Add Column Headers */}
                                <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-meta-4 rounded-sm">
                                    <div className="flex-1">
                                        <span className="font-medium text-black dark:text-white">Question</span>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <span className="font-medium text-black dark:text-white w-24 text-center">Difficulty</span>
                                        <span className="font-medium text-black dark:text-white w-24 text-center">Taxonomy</span>
                                        <span className="w-12"></span>
                                    </div>
                                </div>

                                {filteredQuestions
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((question, index) => {
                                        const isSelected = selectedQuestions.some(q => q.id === question.id);
                                        if (isSelected) return null;
                                        const availableQuestionIndex = filteredQuestions
                                            .filter(q => !selectedQuestions.some(sq => sq.id === q.id))
                                            .findIndex(q => q.id === question.id);
                                        const questionNumber = availableQuestionIndex + 1;

                                        return (
                                            <div
                                                key={question.id}
                                                className="p-4 border rounded-sm dark:border-strokedark"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <span className="text-gray-500 mr-2">{questionNumber}.</span>
                                                        <span
                                                            className="cursor-pointer hover:text-primary inline"
                                                            onClick={() => handleQuestionClick(question)}
                                                            title={question.question_text.replace(/<[^>]+>/g, '')}
                                                        >
                                                            {truncateText(question.question_text)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-8">
                                                        <span className="text-sm text-gray-500 w-24 text-center">
                                                            N/A
                                                        </span>
                                                        <span className="text-sm text-gray-500 w-24 text-center">
                                                            {question.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level || 'N/A'}
                                                        </span>
                                                        <button
                                                            onClick={() => toggleQuestionSelection(question)}
                                                            className="text-success hover:text-meta-3 w-12"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            <Pagination
                                totalItems={filteredQuestions.filter(q => !selectedQuestions.some(sq => sq.id === q.id)).length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={(page) => setCurrentPage(page)}
                                onItemsPerPageChange={(items) => {
                                    setItemsPerPage(items);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        {/* Selected Questions Section */}
                        {selectedQuestions.length > 0 && (
                            <div className="p-6.5">
                                <h4 className="font-medium text-black dark:text-white mb-4">
                                    Selected Questions ({selectedQuestions.length})
                                </h4>
                                <div className="space-y-4">
                                    {/* Add Column Headers for Selected Questions */}
                                    <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-meta-4 rounded-sm">
                                        <div className="flex-1">
                                            <span className="font-medium text-black dark:text-white">Question</span>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <span className="font-medium text-black dark:text-white w-24 text-center">Difficulty</span>
                                            <span className="font-medium text-black dark:text-white w-24 text-center">Taxonomy</span>
                                            <span className="w-12"></span>
                                        </div>
                                    </div>

                                    {selectedQuestions
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((question, index) => {
                                            const questionNumber = (currentPage - 1) * itemsPerPage + index + 1;
                                            return (
                                                <div
                                                    key={question.id}
                                                    className="p-4 border rounded-sm dark:border-strokedark"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex gap-4 flex-1">
                                                            <span className="text-gray-500">{questionNumber}.</span>
                                                            <div className="flex-1">
                                                                <div
                                                                    className="cursor-pointer hover:text-primary"
                                                                    onClick={() => handleQuestionClick(question)}
                                                                    dangerouslySetInnerHTML={{ __html: question.question_text }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-8">
                                                            <span className="text-sm text-gray-500 w-24 text-center">
                                                                N/A
                                                            </span>
                                                            <span className="text-sm text-gray-500 w-24 text-center">
                                                                {question.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level || 'N/A'}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleQuestionSelection(question);
                                                                }}
                                                                className="text-danger hover:text-meta-1 w-12"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>

                                <Pagination
                                    totalItems={selectedQuestions.length}
                                    itemsPerPage={itemsPerPage}
                                    currentPage={currentPage}
                                    onPageChange={(page) => setCurrentPage(page)}
                                    onItemsPerPageChange={(items) => {
                                        setItemsPerPage(items);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        )}
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
                                    {selectedQuestions.slice(0, 2).map((question, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="font-medium">
                                                Question {index + 1}: {sanitizeHtml(question.question_text)}
                                            </div>
                                            <div className="pl-4 space-y-1">
                                                {question.answers?.map((answer, ansIndex) => (
                                                    <div key={ansIndex}>
                                                        {answerFormat.case === 'uppercase'
                                                            ? String.fromCharCode(65 + ansIndex)
                                                            : String.fromCharCode(97 + ansIndex)}
                                                        {answerFormat.separator} {sanitizeHtml(answer.answer_text)}
                                                    </div>
                                                ))}
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
                                                    {selectedQuestions.length}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={handleCancel}
                            className="flex flex-1 justify-center rounded bg-danger py-4 px-10 font-medium text-white hover:bg-opacity-90"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                console.log('Save button clicked');
                                handleCreateTest();
                            }}
                            className="flex flex-1 justify-center rounded bg-primary py-4 px-10 font-medium text-white hover:bg-opacity-90"
                            disabled={!testData.title || selectedQuestions.length === 0 || !selectedCourse}
                        >
                            Save
                        </button>

                        <button
                            onClick={exportToWord}
                            className="flex flex-1 justify-center rounded bg-success py-4 px-10 font-medium text-white hover:bg-opacity-90"
                            disabled={selectedQuestions.length === 0}
                        >
                            Export to Word
                        </button>
                    </div>
                </>
            )}

            {/* Question Detail Dialog */}
            <Dialog
                open={isQuestionDialogOpen}
                onClose={() => setIsQuestionDialogOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-end pr-[15%] p-4">
                    <Dialog.Panel className="w-full max-w-3xl rounded-lg bg-white dark:bg-boxdark p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-black dark:text-white">
                                Question Details
                            </h2>
                            {isQuestionInTest(selectedQuestionDetail?.id || 0) && (
                                <button
                                    onClick={() => shuffleQuestionAnswers(selectedQuestionDetail?.id || 0)}
                                    className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-white hover:bg-opacity-90 transition-all duration-200"
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
                                    Shuffle Answers
                                </button>
                            )}
                        </div>

                        {selectedQuestionDetail && (
                            <div className="space-y-4">
                                <div className="text-black dark:text-white">
                                    <div dangerouslySetInnerHTML={{ __html: selectedQuestionDetail.question_text }} />
                                </div>

                                <div className="mt-4">
                                    <h4 className="font-medium text-black dark:text-white mb-2">Answers:</h4>
                                    <div className="space-y-2">
                                        {selectedQuestionDetail.answers?.map((answer, index) => {
                                            const isSelected = selectedAnswers[selectedQuestionDetail.id]?.[index] || false;
                                            const isHidden = editedQuestions[selectedQuestionDetail.id]?.hiddenAnswers?.[index];
                                            return (
                                                <div
                                                    key={index}
                                                    className={`p-2 rounded transition-all duration-200 ${isQuestionInTest(selectedQuestionDetail.id)
                                                        ? `cursor-pointer ${isSelected
                                                            ? answer.is_correct
                                                                ? 'bg-meta-3/10 border border-meta-3'
                                                                : 'bg-gray-100 dark:bg-meta-4'
                                                            : 'bg-gray-50 dark:bg-meta-4/50'
                                                        }`
                                                        : answer.is_correct
                                                            ? 'bg-meta-3/10 border border-meta-3'
                                                            : 'bg-gray-100 dark:bg-meta-4'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        {isQuestionInTest(selectedQuestionDetail.id) && (
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleAnswer(selectedQuestionDetail.id, index)}
                                                                className="mt-1 cursor-pointer"
                                                            />
                                                        )}
                                                        <div className={`flex-1 transition-all duration-200 ${!isSelected ? 'text-gray-400 font-normal' : 'text-black dark:text-white font-medium'}`}>
                                                            <span>{String.fromCharCode(65 + index)})</span>
                                                            <div className="inline-block ml-2" dangerouslySetInnerHTML={{ __html: answer.answer_text }} />
                                                            {answer.is_correct && (
                                                                <span className="text-meta-3 ml-2">✓</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-4">
                                    {isQuestionInTest(selectedQuestionDetail.id) ? (
                                        <>
                                            <button
                                                onClick={() => setIsQuestionDialogOpen(false)}
                                                className="rounded bg-danger px-6 py-2 text-white hover:bg-opacity-90"
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={() => handleSaveChanges(false)}
                                                className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => handleSaveChanges(true)}
                                                className="rounded bg-success px-6 py-2 text-white hover:bg-opacity-90"
                                            >
                                                Save & Overwrite
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsQuestionDialogOpen(false)}
                                            className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90"
                                        >
                                            Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog
                open={isPreviewDialogOpen}
                onClose={() => setPreviewDialogOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center">
                    <div
                        className="w-[90%] max-w-2xl bg-white dark:bg-boxdark rounded-lg shadow-lg p-8 max-h-[80vh] overflow-y-auto"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-semibold text-black dark:text-white">
                                {testData.title || 'Untitled Test'}
                            </h2>
                            <button
                                onClick={() => setPreviewDialogOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {(shuffleQuestions ? [...selectedQuestions].sort(() => Math.random() - 0.5) : selectedQuestions)
                                .map((question, index) => (
                                    <div key={index} className="space-y-3">
                                        <div className="font-medium text-black dark:text-white">
                                            Question {index + 1}: {sanitizeHtml(question.question_text)}
                                        </div>
                                        <div className="pl-6 space-y-2">
                                            {question.answers?.map((answer, ansIndex) => (
                                                <div
                                                    key={ansIndex}
                                                    className="text-black dark:text-white"
                                                >
                                                    {answerFormat.case === 'uppercase'
                                                        ? String.fromCharCode(65 + ansIndex)
                                                        : String.fromCharCode(97 + ansIndex)}
                                                    {answerFormat.separator} {sanitizeHtml(answer.answer_text)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default CreateTest; 