import { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { fetchQuestionBanks, fetchCourses } from '../services/api';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Question {
    id: number;
    question_text: string;
    marks: number;
    selected?: boolean;
    answers?: { answer_text: string; is_correct: boolean }[];
}

interface QuestionBank {
    id: number;
    name: string;
    questions: Question[];
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
            const matchesTags = selectedTopics.length === 0 ||
                selectedTopics.some(topic => question.question_text.includes(topic));
            return matchesSearch && matchesTags;
        });
        setFilteredQuestions(filtered);
    }, [searchQuery, selectedTopics, questionBanks]);

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

    const topics = [
        'PPL', 'DSA', 'Discrete Math', 'Dynamic Programming', 'Math'
    ];

    const toggleTopic = (topic: string) => {
        setSelectedTopics(prev =>
            prev.includes(topic)
                ? prev.filter(t => t !== topic)
                : [...prev, topic]
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
                                    <Editor
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
                                    />
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
                                            onClick={() => setShowTopics(!showTopics)}
                                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2 px-6 text-white hover:bg-opacity-90"
                                        >
                                            <span>Tags</span>
                                            <svg
                                                className={`w-4 h-4 transform transition-transform duration-200 ${showTopics ? 'rotate-180' : ''
                                                    }`}
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

                                        {showTopics && (
                                            <div className="absolute top-full right-0 mt-2 w-80 bg-[#C0C0C0] dark:bg-boxdark rounded-sm shadow-lg z-50 p-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {topics.map(topic => (
                                                        <button
                                                            key={topic}
                                                            onClick={() => toggleTopic(topic)}
                                                            className={`px-3 py-1 rounded-full text-sm ${selectedTopics.includes(topic)
                                                                ? 'bg-primary text-white'
                                                                : 'bg-white dark:bg-meta-4 hover:bg-gray-100 dark:hover:bg-meta-3'
                                                                }`}
                                                        >
                                                            {topic}
                                                        </button>
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
                                        <div key={question.id} className="p-4 border rounded-sm dark:border-strokedark bg-gray-50 dark:bg-meta-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-4">
                                                    <span className="text-gray-500">{index + 1}.</span>
                                                    <div className="flex-1">
                                                        <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-gray-500"></span>
                                                    <button
                                                        onClick={() => toggleQuestionSelection(question)}
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
                                        <div key={question.id} className="p-4 border rounded-sm dark:border-strokedark">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-gray-500"></span>
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
                                                    <div key={question.id} className="p-4 border rounded-sm dark:border-strokedark">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
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

                    {/* Export Buttons */}
                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={exportToPDF}
                            className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
                            disabled={selectedQuestions.length === 0}
                        >
                            Export to PDF
                        </button>
                        <button
                            onClick={exportToWord}
                            className="flex w-full justify-center rounded bg-success p-3 font-medium text-gray hover:bg-opacity-90"
                            disabled={selectedQuestions.length === 0}
                        >
                            Export to Word
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
        </div>
    );
};

export default CreateTest; 