import { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import Pagination from '../components/Pagination';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchQuestionBanks, fetchCourses } from '../services/api';
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
            setQuestionBanks([]);
        }
    };

    useEffect(() => {
        const allQuestions = questionBanks.flatMap(bank => bank.questions);
        setFilteredQuestions(allQuestions);
    }, [questionBanks]);

    useEffect(() => {
        const allQuestions = questionBanks.flatMap(bank => bank.questions);
        const filtered = allQuestions.filter(question => {
            const matchesSearch = question.question_text.toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesLevels = selectedLevels.length === 0 ||
                selectedLevels.some(level =>
                    question.taxonomies?.some(tax =>
                        tax.taxonomy.name === "Bloom's Taxonomy" &&
                        tax.level === level
                    )
                );
            const matchesBank = !selectedBankId || 
                question.bank_id === selectedBankId;
            
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
        setSelectedQuestions(prevQuestions => {
            const shuffled = [...prevQuestions];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        });
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

    const exportToWord = async () => {
        if (!testData.title || selectedQuestions.length === 0) {
            setError('Please add a title and select questions before exporting');
            return;
        }

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
                        spacing: {
                            after: 400,
                        },
                    }),

                    ...(testData.description ? [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: testData.description.replace(/<[^>]+>/g, ''),
                                }),
                            ],
                            spacing: {
                                after: 400,
                            },
                        }),
                    ] : []),

                    ...selectedQuestions.flatMap((question, index) => [
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
                            spacing: {
                                before: 400,
                                after: 200,
                            },
                        }),

                        ...(question.answers?.map((answer, ansIndex) =>
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `${String.fromCharCode(65 + ansIndex)}) `,
                                        bold: true,
                                    }),
                                    new TextRun({
                                        text: answer.answer_text.replace(/<[^>]+>/g, ''),
                                    }),
                                    ...(answer.is_correct ? [
                                        new TextRun({
                                            text: ' ✓',
                                            bold: true,
                                            color: '008000',
                                        }),
                                    ] : []),
                                ],
                                indent: {
                                    left: 720,
                                },
                                spacing: {
                                    before: 100,
                                    after: 100,
                                },
                            })
                        ) || []),

                        new Paragraph({
                            spacing: {
                                after: 200,
                            },
                        }),
                    ]),
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
    const shuffleAnswers = (questionId: number) => {
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
                            <h3 className="font-medium text-black dark:text-white">
                                Test Details
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
                                <div>
                                    {/* <Editor
                                        apiKey="rk63se2fx3gtxdcb6a6556yapoajd3drfp10hjc5u7km8vid"
                                        init={{
                                            height: 250,
                                            menubar: false,
                                            plugins: [
                                                'advlist', 'autolink', 'lists', 'link', 'image',
                                                'charmap', 'preview', 'anchor', 'searchreplace',
                                                'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                                                'media', 'table', 'code', 'help', 'wordcount', 'equation',
                                                'placeholder'
                                            ],
                                            toolbar: 'undo redo | formatselect | ' +
                                                'bold italic forecolor | alignleft aligncenter ' +
                                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                                'removeformat | equation | help',
                                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                                            placeholder: 'Enter test description...',
                                            setup: (editor) => {
                                                editor.on('init', () => {
                                                    const editorElement = editor.getContainer();
                                                    if (editorElement) {
                                                        const iframe = editorElement.querySelector('iframe');
                                                        if (iframe) {
                                                            const iframeDocument = iframe.contentDocument;
                                                            if (iframeDocument) {
                                                                const body = iframeDocument.body;
                                                                if (!body.textContent?.trim()) {
                                                                    body.setAttribute('data-mce-placeholder', 'Enter test description...');
                                                                }
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                        }}
                                        value={testData.description}
                                        onEditorChange={handleDescriptionChange}
                                    /> */}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Question Selection Block */}
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-black dark:text-white">
                                        Selected Questions ({selectedQuestions.length})
                                    </h3>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        placeholder="Search questions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="rounded-md border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                    />
                                    <button
                                        onClick={handleShuffle}
                                        className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-white hover:bg-opacity-90"
                                    >
                                        Shuffle Questions
                                    </button>
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
                                            {questionBanks.map(bank => (
                                                <React.Fragment key={bank.id}>
                                                    <option value={bank.id}>{bank.name}</option>
                                                    {bank.children?.map(childBank => (
                                                        <option key={childBank.id} value={childBank.id}>
                                                            ↳ {childBank.name}
                                                        </option>
                                                    ))}
                                                </React.Fragment>
                                            ))}
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
                        </div>

                        {/* Selected Questions Section */}
                        {selectedQuestions.length > 0 && (
                            <div className="p-6.5 border-b border-stroke dark:border-strokedark">
                                <h4 className="font-medium text-black dark:text-white mb-4">
                                    Questions in Test
                                </h4>
                                <div className="space-y-4">
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
                                                        <div className="flex gap-4">
                                                            <span className="text-gray-500">{questionNumber}.</span>
                                                            <div className="flex-1">
                                                                <div
                                                                    className="cursor-pointer hover:text-primary"
                                                                    onClick={() => handleQuestionClick(question)}
                                                                    dangerouslySetInnerHTML={{ __html: question.question_text }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm text-gray-500"></span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleQuestionSelection(question);
                                                                }}
                                                                className="text-danger hover:text-meta-1"
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

                        {/* Available Questions List */}
                        <div className="p-6.5">
                            <h4 className="font-medium text-black dark:text-white mb-4">
                                Available Questions
                            </h4>
                            <div className="space-y-4">
                                {filteredQuestions
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((question, index) => {
                                        const isSelected = selectedQuestions.some(q => q.id === question.id);
                                        if (isSelected) return null;
                                        const questionNumber = (currentPage - 1) * itemsPerPage + index + 1;
                                        return (
                                            <div
                                                key={question.id}
                                                className="p-4 border rounded-sm dark:border-strokedark"
                                            >
                                                <div className="flex justify-between items-start">
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
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => toggleQuestionSelection(question)}
                                                            className="text-success hover:text-meta-3"
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
                                    setCurrentPage(1); // Reset to first page when changing items per page
                                }}
                            />
                        </div>

                        {/* Question Bank Selection */}
                        {showQuestionBank && (
                            <div className="p-6.5 border-t border-stroke dark:border-strokedark">
                                <div className="mb-4.5">
                                    <select
                                        value={selectedBankId || ''}
                                        onChange={(e) => setSelectedBankId(e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="">Select Question Bank</option>
                                        {questionBanks.map(bank => (
                                            <option key={bank.id} value={bank.id}>{bank.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedBankId && selectedBankId !== '0' && (
                                    <div className="space-y-4">
                                        {questionBanks
                                            .find(bank => bank.id === Number(selectedBankId))
                                            ?.questions.map(question => {
                                                const isSelected = selectedQuestions.some(q => q.id === question.id);
                                                return (
                                                    <div
                                                        key={question.id}
                                                        className="p-4 border rounded-sm dark:border-strokedark"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <span
                                                                    className="cursor-pointer hover:text-primary inline"
                                                                    onClick={() => handleQuestionClick(question)}
                                                                    dangerouslySetInnerHTML={{ __html: question.question_text }}
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => toggleQuestionSelection(question)}
                                                                disabled={isSelected}
                                                                className={`text-success hover:text-meta-3 disabled:opacity-50 disabled:cursor-not-allowed ${isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''
                                                                    }`}
                                                            >
                                                                Add
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
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
                            {/* Answer Format Configuration */}
                            <div className="mb-6 bg-gray-50 dark:bg-meta-4 p-4 rounded-sm">
                                <h4 className="text-lg font-medium text-black dark:text-white mb-4">
                                    Answer Format
                                </h4>
                                <div className="flex gap-6">
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
                                </div>
                            </div>

                            {/* Test Preview */}
                            <div
                                className="border border-stroke dark:border-strokedark rounded-sm p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors duration-200"
                                onClick={() => {
                                    // Create and show a preview dialog
                                    setPreviewDialogOpen(true);
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-medium text-black dark:text-white">
                                        Test Preview
                                    </h4>
                                    <span className="text-sm text-meta-3">Click to view full preview</span>
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

                            {/* Test Bank Selection */}
                            <div className="mt-6">
                                <label className="mb-2.5 block text-black dark:text-white">
                                    Add to Test Bank
                                </label>
                                <select
                                    value={selectedBankId || ''}
                                    onChange={(e) => setSelectedBankId(e.target.value)}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                >
                                    <option value="">Select a test bank</option>
                                    {questionBanks.map(bank => (
                                        <option key={bank.id} value={bank.id}>{bank.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Section */}
                    <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                Statistics
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
                                            <span className="font-medium">{selectedQuestions.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Selected Topics:</span>
                                            <span className="font-medium">{selectedTopics.length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* L.O. Distribution Chart */}
                                <div className="bg-gray-50 dark:bg-meta-4 p-4 rounded-sm">
                                    <h5 className="font-medium text-black dark:text-white mb-3">
                                        L.O. Distribution
                                    </h5>
                                    {selectedTopics.length > 0 ? (
                                        <div className="w-full h-[200px] flex items-center justify-center">
                                            <Pie
                                                data={{
                                                    labels: selectedTopics.map(topic => {
                                                        const foundLOs = subjectLOs[topic]?.map(lo => lo.name);
                                                        return foundLOs ? foundLOs.join(', ') : topic;
                                                    }),
                                                    datasets: [
                                                        {
                                                            data: Object.values(calculateLOStats(selectedQuestions, selectedTopics)),
                                                            backgroundColor: [
                                                                'rgba(255, 99, 132, 0.5)',
                                                                'rgba(54, 162, 235, 0.5)',
                                                                'rgba(255, 206, 86, 0.5)',
                                                                'rgba(75, 192, 192, 0.5)',
                                                                'rgba(153, 102, 255, 0.5)',
                                                            ],
                                                            borderColor: [
                                                                'rgba(255, 99, 132, 1)',
                                                                'rgba(54, 162, 235, 1)',
                                                                'rgba(255, 206, 86, 1)',
                                                                'rgba(75, 192, 192, 1)',
                                                                'rgba(153, 102, 255, 1)',
                                                            ],
                                                            borderWidth: 1,
                                                        },
                                                    ],
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            position: 'right',
                                                            labels: {
                                                                color: 'rgb(156, 163, 175)',
                                                                font: {
                                                                    size: 12
                                                                }
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                                            No topics selected
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={exportToWord}
                            className="flex w-full justify-center rounded bg-success p-3 font-medium text-gray hover:bg-opacity-90"
                            disabled={selectedQuestions.length === 0}
                        >
                            Export to Word
                        </button>

                        <button
                            onClick={() => {
                                console.log('Save button clicked');
                            }}
                            className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
                            disabled={selectedQuestions.length === 0}
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex w-full justify-center rounded bg-danger p-3 font-medium text-gray hover:bg-opacity-90"
                        >
                            Cancel
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
                                    onClick={() => shuffleAnswers(selectedQuestionDetail?.id || 0)}
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
                            {selectedQuestions.map((question, index) => (
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