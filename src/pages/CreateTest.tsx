import { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { fetchQuestionBanks, fetchCourses } from '../services/api';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Dialog } from '@headlessui/react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

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
    questions: Question[];
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
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
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
    const [showLOs, setShowLOs] = useState(false);
    const [selectedLOs, setSelectedLOs] = useState<string[]>([]);
    const [isPreviewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [answerFormat, setAnswerFormat] = useState<AnswerFormat>({
        case: 'uppercase',
        separator: ')',
    });

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

    // Update state name for clarity
    const [showBloomsLevels, setShowBloomsLevels] = useState(false);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

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

    // Combine all questions from all banks into one array
    useEffect(() => {
        const allQuestions = questionBanks.flatMap(bank => bank.questions);
        setFilteredQuestions(allQuestions);
    }, [questionBanks]);

    // Filter questions based on search query and selected topics
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
            return matchesSearch && matchesLevels;
        });
        setFilteredQuestions(filtered);
    }, [searchQuery, selectedLevels, questionBanks]);

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

    const handleDescriptionChange = (content: string) => {
        setTestData(prev => ({
            ...prev,
            description: content
        }));
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
        setSelectedLOs(prev =>
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
                    // Title
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

                    // Description (if exists)
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

                    // Questions and Answers
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

                        // Answers
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
                                            color: '008000', // Green color for correct answers
                                        }),
                                    ] : []),
                                ],
                                indent: {
                                    left: 720, // 0.5 inch indent
                                },
                                spacing: {
                                    before: 100,
                                    after: 100,
                                },
                            })
                        ) || []),

                        // Add a blank line after each question
                        new Paragraph({
                            spacing: {
                                after: 200,
                            },
                        }),
                    ]),
                ],
            }],
        });

        // Generate and save the document
        try {
            const blob = await Packer.toBlob(doc);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            saveAs(blob, `${testData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.docx`);
        } catch (err) {
            console.error('Error generating document:', err);
            setError('Failed to generate document');
        }
    };

    const exportToPDF = async () => {
        if (!testData.title || selectedQuestions.length === 0) {
            setError('Please add a title and select questions before exporting');
            return;
        }

        try {
            // Create a temporary div to render the content
            const content = document.createElement('div');
            content.innerHTML = `
                <div style="padding: 20px; font-family: Arial, sans-serif;">
                    <h1 style="font-size: 24px; margin-bottom: 20px;">${testData.title}</h1>
                    ${testData.description ? `<div style="margin-bottom: 20px;">${testData.description}</div>` : ''}
                    ${selectedQuestions.map((question, index) => `
                        <div style="margin-bottom: 20px;">
                            <div style="margin-bottom: 10px;">
                                <strong>Question ${index + 1}:</strong> ${question.question_text}
                            </div>
                            ${question.answers?.map((answer, ansIndex) => `
                                <div style="margin-left: 20px; margin-bottom: 5px;">
                                    ${String.fromCharCode(65 + ansIndex)}) ${answer.answer_text}
                                    ${answer.is_correct ? ' ✓' : ''}
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            `;
            document.body.appendChild(content);

            // Convert to PDF
            const pdf = new jsPDF('p', 'pt', 'a4');
            const canvas = await html2canvas(content, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            // Remove the temporary element
            document.body.removeChild(content);

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 595.28; // A4 width in points
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= 841.89; // A4 height in points

            // Add new pages if content overflows
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= 841.89;
            }

            // Save the PDF
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            pdf.save(`${testData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`);

        } catch (err) {
            console.error('Error generating PDF:', err);
            setError('Failed to generate PDF');
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    const handleQuestionClick = (question: Question) => {
        setSelectedQuestionDetail(question);
        setIsQuestionDialogOpen(true);
    };

    // Add this helper function at the top of your component
    const sanitizeHtml = (html: string) => {
        return html.replace(/<\/?[^>]+(>|$)/g, '');
    };

    // Add this helper function to calculate L.O. statistics
    const calculateLOStats = (questions: Question[], selectedLOs: string[]) => {
        const stats = selectedLOs.reduce((acc, lo) => {
            acc[lo] = 0;
            return acc;
        }, {} as Record<string, number>);

        questions.forEach(question => {
            // You'll need to add L.O. information to your questions
            // This is just an example - adjust according to your data structure
            if (question.learningObjective) {
                stats[question.learningObjective]++;
            }
        });

        return stats;
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
                                                            className={`px-3 py-1 rounded-full text-sm ${
                                                                selectedLevels.includes(level)
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
                                        <button
                                            onClick={() => selectedTopics.length > 0 && setShowLOs(!showLOs)}
                                            disabled={selectedTopics.length === 0}
                                            className={`inline-flex items-center justify-center gap-2 rounded-md py-2 px-6 text-white transition-colors duration-200
                                                ${selectedTopics.length === 0
                                                    ? 'bg-primary/40 cursor-not-allowed'
                                                    : 'bg-primary hover:bg-opacity-90'}`}
                                        >
                                            <span>L.O.</span>
                                            <svg
                                                className={`w-4 h-4 transform transition-transform duration-200 ${showLOs ? 'rotate-180' : ''}`}
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

                                        {showLOs && selectedTopics.length > 0 && (
                                            <div className="absolute top-full right-0 mt-2 w-48 bg-[#C0C0C0] dark:bg-boxdark rounded-sm shadow-lg z-50 p-4">
                                                <div className="flex flex-col gap-2">
                                                    {selectedTopics.map(topic => (
                                                        subjectLOs[topic]?.map(lo => (
                                                            <button
                                                                key={`${topic}-${lo.id}`}
                                                                onClick={() => toggleLO(lo.id)}
                                                                className={`px-3 py-1 rounded-full text-sm text-left ${selectedLOs.includes(lo.id)
                                                                    ? 'bg-primary text-white'
                                                                    : 'bg-white dark:bg-meta-4 hover:bg-gray-100 dark:hover:bg-meta-3'
                                                                    }`}
                                                            >
                                                                {lo.name}
                                                            </button>
                                                        ))
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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
                                    {selectedQuestions.map((question, index) => (
                                        <div
                                            key={question.id}
                                            className="p-4 border rounded-sm dark:border-strokedark"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-4">
                                                    <span className="text-gray-500">{index + 1}.</span>
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
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Available Questions List */}
                        <div className="p-6.5">
                            <h4 className="font-medium text-black dark:text-white mb-4">
                                Available Questions
                            </h4>
                            <div className="space-y-4">
                                {filteredQuestions.map(question => {
                                    const isSelected = selectedQuestions.some(q => q.id === question.id);
                                    if (isSelected) return null;
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
                        </div>

                        {/* Question Bank Selection */}
                        {showQuestionBank && (
                            <div className="p-6.5 border-t border-stroke dark:border-strokedark">
                                <div className="mb-4.5">
                                    <select
                                        value={selectedBankId || ''}
                                        onChange={(e) => setSelectedBankId(Number(e.target.value))}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="">Select Question Bank</option>
                                        {questionBanks.map(bank => (
                                            <option key={bank.id} value={bank.id}>{bank.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedBankId && selectedBankId !== 0 && (
                                    <div className="space-y-4">
                                        {questionBanks
                                            .find(bank => bank.id === selectedBankId)
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
                                    onChange={(e) => setSelectedBankId(Number(e.target.value))}
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
                                        <div className="flex justify-between">
                                            <span className="text-sm">Selected L.O.s:</span>
                                            <span className="font-medium">{selectedLOs.length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* L.O. Distribution Chart */}
                                <div className="bg-gray-50 dark:bg-meta-4 p-4 rounded-sm">
                                    <h5 className="font-medium text-black dark:text-white mb-3">
                                        L.O. Distribution
                                    </h5>
                                    {selectedLOs.length > 0 ? (
                                        <div className="w-full h-[200px] flex items-center justify-center">
                                            <Pie
                                                data={{
                                                    labels: selectedLOs.map(lo => {
                                                        for (const topic of selectedTopics) {
                                                            const foundLO = subjectLOs[topic]?.find(l => l.id === lo);
                                                            if (foundLO) {
                                                                return `${topic} - ${foundLO.name}`;
                                                            }
                                                        }
                                                        return lo;
                                                    }),
                                                    datasets: [
                                                        {
                                                            data: Object.values(calculateLOStats(selectedQuestions, selectedLOs)),
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
                                            No L.O.s selected
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

                <div className="fixed inset-0 flex items-center justify-end pr-[20%] p-4">
                    <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white dark:bg-boxdark p-6">
                        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
                            Question Details
                        </h2>

                        {selectedQuestionDetail && (
                            <div className="space-y-4">
                                <div className="text-black dark:text-white">
                                    <div dangerouslySetInnerHTML={{ __html: selectedQuestionDetail.question_text }} />
                                </div>

                                <div className="mt-4">
                                    <h4 className="font-medium text-black dark:text-white mb-2">Answers:</h4>
                                    <div className="space-y-2">
                                        {selectedQuestionDetail.answers?.map((answer, index) => (
                                            <div
                                                key={index}
                                                className={`p-2 rounded ${answer.is_correct
                                                    ? 'bg-meta-3/10 border border-meta-3'
                                                    : 'bg-gray-100 dark:bg-meta-4'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span>{String.fromCharCode(65 + index)})</span>
                                                    <div dangerouslySetInnerHTML={{ __html: answer.answer_text }} />
                                                    {answer.is_correct && (
                                                        <span className="text-meta-3 ml-2">✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setIsQuestionDialogOpen(false)}
                                        className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90"
                                    >
                                        Close
                                    </button>
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