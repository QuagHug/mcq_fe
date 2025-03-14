import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import SimilarityDialog from '../components/SimilarityDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigate, useParams } from 'react-router-dom';
import { addQuestion, getQuestionBanks, fetchQuestionBanks, fetchCourses } from '../services/api';

// Define a type for the expanded sections
type ExpandedSections = {
    [key: string]: boolean;
};

// Define a type for answers
type Answer = {
    id: string;
    text: string;
    explanation: string;
    grade: string;
};

// Define a type for selected tags
type SelectedTags = {
    subject?: string;
    bloom?: string;
};

// Add this interface at the top with other interfaces
interface Bank {
    id: string;
    name: string;
    subject: string;
    parent_id?: string | null;
    children?: Bank[];
}

const AddOneQues = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [error, setError] = useState<string | null>(null);

    // Reuse existing state from original component
    const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
        question: true,
        answers: true,
        tags: false,
    });

    const [answers, setAnswers] = useState<Answer[]>([
        { id: 'A', text: '', explanation: '', grade: '0' },
        { id: 'B', text: '', explanation: '', grade: '0' },
        { id: 'C', text: '', explanation: '', grade: '0' },
        { id: 'D', text: '', explanation: '', grade: '0' },
    ]);

    const [selectedTags, setSelectedTags] = useState<SelectedTags>({});

    const [isSimilarityDialogOpen, setIsSimilarityDialogOpen] = useState(false);
    const [similarQuestions] = useState([
        {
            id: '1',
            question: 'What is the primary purpose of TCP/IP in computer networking?',
            similarity: 85,
            questionBank: 'Networking Basics'
        },
        {
            id: '2',
            question: 'Explain the role of TCP/IP protocols in network communication.',
            similarity: 75,
            questionBank: 'Advanced Networking'
        },
        // Add more similar questions as needed
    ]);

    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [questionType, setQuestionType] = useState('one');
    const [shuffle, setShuffle] = useState(false);
    const [questionContent, setQuestionContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedBank, setSelectedBank] = useState('');

    const [banks, setBanks] = useState<Bank[]>([]);
    const [courses, setCourses] = useState<Array<{ id: string, name: string }>>([]);
    const [selectedCourse, setSelectedCourse] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // First fetch courses
                const coursesData = await fetchCourses();
                setCourses(coursesData);

                // If courseId is provided (from URL params), fetch its question banks
                if (courseId) {
                    setSelectedCourse(courseId);
                    const banksData = await fetchQuestionBanks(courseId);
                    setBanks(banksData);
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Failed to load courses and question banks');
            }
        };

        fetchData();
    }, [courseId]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleAnswerChange = (id: string, field: keyof Answer, value: string) => {
        setAnswers(prevAnswers =>
            prevAnswers.map(answer =>
                answer.id === id ? { ...answer, [field]: value } : answer
            )
        );
    };

    const addNewAnswer = () => {
        const newId = String.fromCharCode(65 + answers.length); // Generate a new ID (A, B, C, ...)
        setAnswers(prevAnswers => [
            ...prevAnswers,
            { id: newId, text: '', explanation: '', grade: '0' },
        ]);
    };

    const handleTagChange = (category: keyof SelectedTags, value: string) => {
        setSelectedTags(prevTags => {
            if (!value) {
                // If value is empty, create new object without the category
                const { [category]: removed, ...rest } = prevTags;
                return rest;
            }
            // Otherwise, add/update the tag
            return {
                ...prevTags,
                [category]: value,
            };
        });
    };

    const handleDeleteAnswer = (id: string) => {
        if (answers.length > 2) {  // Keep minimum 2 answers
            setAnswers(prevAnswers => {
                const filteredAnswers = prevAnswers.filter(answer => answer.id !== id);
                // Reassign letters after deletion
                return filteredAnswers.map((answer, index) => ({
                    ...answer,
                    id: String.fromCharCode(65 + index) // Convert 0 to 'A', 1 to 'B', etc.
                }));
            });
        }
    };

    const resetForm = () => {
        setAnswers([
            { id: 'A', text: '', explanation: '', grade: '0' },
            { id: 'B', text: '', explanation: '', grade: '0' },
            { id: 'C', text: '', explanation: '', grade: '0' },
            { id: 'D', text: '', explanation: '', grade: '0' },
        ]);
        setExpandedSections({
            question: true,
            answers: true,
            tags: false,
        });
        setSelectedTags({});
    };

    const handleSubmit = async () => {
        console.log('Selected Course:', selectedCourse);
        console.log('Selected Bank:', selectedBank);
        console.log('Course ID from params:', courseId);

        if (!selectedBank || !selectedCourse) {
            setError('Please select a question bank and ensure course ID is available');
            return;
        }

        if (!questionContent) {
            setError('Please enter question content');
            return;
        }

        if (answers.some(answer => !answer.text)) {
            setError('Please fill in all answer texts');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Format the data according to the backend models
            const questionData = {
                question_bank: selectedBank,
                question_text: questionContent,
                answers: answers.map(answer => ({
                    answer_text: answer.text,
                    is_correct: answer.grade === "100", // Convert grade to boolean
                    explanation: answer.explanation || ""  // Use empty string if no explanation
                }))
            };

            await addQuestion(selectedCourse, selectedBank, questionData);
            navigate(`/courses/${selectedCourse}/question-banks/${selectedBank}`);
        } catch (err) {
            setError('Failed to add question');
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionChange = (content: string) => {
        setQuestionContent(content);
    };

    const handleCourseChange = async (courseId: string) => {
        console.log('Changing course to:', courseId);
        setSelectedCourse(courseId);
        try {
            const banksData = await fetchQuestionBanks(courseId);
            setBanks(banksData);
            setSelectedBank(''); // Reset bank selection when course changes
        } catch (err) {
            console.error('Failed to fetch question banks:', err);
            setError('Failed to load question banks');
        }
    };

    return (
        <div className="space-y-6">
            {/* Question Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
                    <h3 className="text-2xl font-semibold text-black dark:text-white">Question</h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-5 h-5 transition-transform duration-200 cursor-pointer ${expandedSections.question ? 'rotate-180' : ''}`}
                        onClick={() => toggleSection('question')}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
                {expandedSections.question && (
                    <div className="px-6.5 py-4 space-y-4">
                        <Editor
                            apiKey="gwxmqxpn8j1388tusd75evl4dpgvbwiqy6c4me5acrwqplum"
                            init={{
                                height: 250,
                                menubar: false,
                                plugins: [
                                    'advlist', 'autolink', 'lists', 'link', 'image',
                                    'charmap', 'preview', 'anchor', 'searchreplace',
                                    'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                                    'media', 'table', 'code', 'help', 'wordcount', 'equation'
                                ],
                                toolbar: 'undo redo | formatselect | ' +
                                    'bold italic forecolor | alignleft aligncenter ' +
                                    'alignright alignjustify | bullist numlist outdent indent | ' +
                                    'removeformat | equation | help',
                                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                            }}
                            value={questionContent}
                            onEditorChange={handleQuestionChange}
                        />

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <label className="font-medium text-black dark:text-white">One or Multiple answers?</label>
                                <select
                                    value={questionType}
                                    onChange={(e) => setQuestionType(e.target.value)}
                                    className="rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                >
                                    <option value="one">One answer only</option>
                                    <option value="multiple">Multiple answers allowed</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    id="shuffle"
                                    checked={shuffle}
                                    onChange={(e) => setShuffle(e.target.checked)}
                                    className="form-checkbox"
                                />
                                <label htmlFor="shuffle" className="font-medium text-black dark:text-white">Shuffle the choices?</label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Answers Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
                    <h3 className="text-2xl font-semibold text-black dark:text-white">Answers</h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-5 h-5 transition-transform duration-200 cursor-pointer ${expandedSections.answers ? 'rotate-180' : ''}`}
                        onClick={() => toggleSection('answers')}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
                {expandedSections.answers && (
                    <div className="px-6.5 py-4 space-y-4">
                        {answers.map(answer => (
                            <div key={answer.id} className="rounded border border-stroke p-4 bg-white dark:bg-boxdark space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="font-medium text-black dark:text-white">Answer {answer.id}</label>
                                    <button
                                        onClick={() => handleDeleteAnswer(answer.id)}
                                        className="text-gray-500 hover:text-red-500 transition-colors duration-200"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-5 h-5"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <Editor
                                    apiKey="gwxmqxpn8j1388tusd75evl4dpgvbwiqy6c4me5acrwqplum"
                                    value={answer.text}
                                    init={{
                                        height: 250,
                                        menubar: false,
                                        plugins: [
                                            'advlist', 'autolink', 'lists', 'link', 'image',
                                            'charmap', 'preview', 'anchor', 'searchreplace',
                                            'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                                            'media', 'table', 'code', 'help', 'wordcount', 'equation'
                                        ],
                                        toolbar: 'undo redo | formatselect | ' +
                                            'bold italic forecolor | alignleft aligncenter ' +
                                            'alignright alignjustify | bullist numlist outdent indent | ' +
                                            'removeformat | equation | help',
                                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                                    }}
                                    onEditorChange={(content) => handleAnswerChange(answer.id, 'text', content)}
                                />

                                <div className="flex items-center gap-4">
                                    <label className="font-medium text-black dark:text-white">Grade</label>
                                    <select
                                        value={answer.grade}
                                        onChange={(e) => handleAnswerChange(answer.id, 'grade', e.target.value)}
                                        className="w-[200px] rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="100">100%</option>
                                        <option value="50">50%</option>
                                        <option value="10">10%</option>
                                        <option value="5">5%</option>
                                        <option value="0">0%</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2.5 block font-medium text-black dark:text-white">Explanation</label>
                                    <Editor
                                        apiKey="gwxmqxpn8j1388tusd75evl4dpgvbwiqy6c4me5acrwqplum"
                                        value={answer.explanation}
                                        init={{
                                            height: 250,
                                            menubar: false,
                                            plugins: [
                                                'advlist', 'autolink', 'lists', 'link', 'image',
                                                'charmap', 'preview', 'anchor', 'searchreplace',
                                                'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                                                'media', 'table', 'code', 'help', 'wordcount', 'equation'
                                            ],
                                            toolbar: 'undo redo | formatselect | ' +
                                                'bold italic forecolor | alignleft aligncenter ' +
                                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                                'removeformat | equation | help',
                                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                                        }}
                                        onEditorChange={(content) => handleAnswerChange(answer.id, 'explanation', content)}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={addNewAnswer}
                                className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition"
                            >
                                Add more answers
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tags Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
                    <h3 className="text-2xl font-semibold text-black dark:text-white">Tags</h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-5 h-5 transition-transform duration-200 cursor-pointer ${expandedSections.tags ? 'rotate-180' : ''}`}
                        onClick={() => toggleSection('tags')}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
                {expandedSections.tags && (
                    <div className="px-6.5 py-4">
                        <select
                            onChange={(e) => {
                                const value = e.target.value;
                                const category = (e.target.options[e.target.selectedIndex].parentElement as HTMLOptGroupElement)?.label.toLowerCase();
                                if (category) {
                                    handleTagChange(category as keyof SelectedTags, value);
                                }
                            }}
                            className="w-full rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        >
                            <optgroup label="Subject">
                                <option value="None">None</option>
                                <option value="DSA">DSA</option>
                                <option value="PPL">PPL</option>
                            </optgroup>
                            <optgroup label="Bloom's Level">
                                <option value="Remember">Remember</option>
                                <option value="Understand">Understand</option>
                                <option value="Apply">Apply</option>
                            </optgroup>
                        </select>
                        <div className="mt-2">
                            {Object.entries(selectedTags).map(([category, tag]) => (
                                <div key={category} className="relative inline-block mr-2">
                                    <span className="inline-block border border-gray-400 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded dark:border-gray-600 dark:text-gray-300">
                                        {tag}
                                    </span>
                                    <span
                                        className="absolute right-0 top-0 transform translate-x-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-red-500"
                                        onClick={() => handleTagChange(category as keyof SelectedTags, '')}
                                    >
                                        &times;
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Upper block: Similarity Note + Course Selection */}
            <div className="flex justify-between items-center mt-4">
                {/* Left side: Note and View Similarity */}
                <div className="flex items-center gap-4">
                    <p className="text-body">
                        <span className="text-danger font-medium">NOTE:</span> There are questions in your bank that are similar.
                    </p>
                    <button
                        onClick={() => setIsSimilarityDialogOpen(true)}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
                    >
                        View similarity
                    </button>
                </div>

                {/* Right side: Course and Bank Selection */}
                <div className="flex items-center gap-4">
                    <select
                        value={selectedCourse}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        className="rounded border border-stroke bg-transparent py-2.5 px-3 font-medium outline-none"
                    >
                        <option value="">Choose Course</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    >
                        <option value="">Select Question Bank</option>
                        {banks
                            .filter(bank => !bank.parent_id) // Parent banks
                            .map(bank => (
                                <React.Fragment key={bank.id}>
                                    <option value={bank.id}>{bank.name}</option>
                                    {bank.children?.map(childBank => (
                                        <option key={childBank.id} value={childBank.id}>
                                            ↳ {childBank.name}
                                        </option>
                                    ))}
                                </React.Fragment>
                            ))
                        }
                    </select>
                </div>
            </div>

            {/* Lower block: Action Buttons and Error Message */}
            <div className="mt-4">
                {/* Buttons container */}
                <div className="flex justify-end items-center gap-4">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 bg-primary text-white rounded hover:bg-opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? 'Adding...' : 'Add to bank'}
                    </button>
                    <button
                        onClick={() => setIsConfirmDialogOpen(true)}
                        className="px-6 py-2.5 bg-danger text-white rounded hover:bg-opacity-90 transition"
                    >
                        Cancel
                    </button>
                </div>

                {/* Error message container */}
                {error && (
                    <div className="flex justify-end mt-2">
                        <p className="text-danger text-sm">{error}</p>
                    </div>
                )}
            </div>

            <SimilarityDialog
                isOpen={isSimilarityDialogOpen}
                onClose={() => setIsSimilarityDialogOpen(false)}
                similarQuestions={similarQuestions}
            />

            <ConfirmDialog
                isOpen={isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(false)}
                onConfirm={() => {
                    resetForm();
                    setIsConfirmDialogOpen(false);
                }}
                message="Are you sure you want to discard these changes?"
            />
        </div>
    );
};

export default AddOneQues;