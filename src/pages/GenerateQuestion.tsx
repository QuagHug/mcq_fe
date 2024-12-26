import React, { useState, useRef, DragEvent, useEffect, Fragment } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Menu, Transition, Dialog } from '@headlessui/react';
import SimilarityDialog from '../components/SimilarityDialog';
import { generateQuestions, fetchCourses, fetchQuestionBanks, bulkCreateQuestions } from '../services/api';

interface Answer {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
}

interface GeneratedQuestion {
    id: string;
    question_text: string;
    answers: {
        answer_text: string;
        is_correct: boolean;
        explanation: string;
    }[];
    taxonomies: {
        taxonomy_id: number;
        level: string;
        difficulty: string;
    }[];
}

interface EditingQuestion {
    id: string;
    question_text: string;
    answers: {
        answer_text: string;
        is_correct: boolean;
        explanation: string;
    }[];
}

const GenerateQuestion = () => {
    const [bloomsLevel, setBloomsLevel] = useState('');
    const [prompt, setPrompt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<{ [key: string]: boolean }>({});
    const [selectedQuestionBank, setSelectedQuestionBank] = useState('');
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
    const [allExpanded, setAllExpanded] = useState(false);
    const [isSimilarityDialogOpen, setIsSimilarityDialogOpen] = useState(false);
    const [courses, setCourses] = useState<Array<{ id: string, name: string }>>([]);
    const [banks, setBanks] = useState<Array<{ id: string, name: string }>>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState('');
    const [contextSettings, setContextSettings] = useState<Array<{
        numQuestions: number;
        level: string;
        difficulty: string;
    }>>([{
        numQuestions: 5,
        level: '',
        difficulty: ''
    }]);
    const [selectedQuestionsForBank, setSelectedQuestionsForBank] = useState<{ [key: string]: boolean }>({});
    const [showBankSelection, setShowBankSelection] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<EditingQuestion | null>(null);
    const [editedQuestions, setEditedQuestions] = useState<{ [key: string]: EditingQuestion }>({});

    const bloomsLevels = [
        'Remember',
        'Understand',
        'Apply',
        'Analyze',
        'Evaluate',
        'Create'
    ];

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

    const handleCourseChange = async (courseId: string) => {
        setSelectedCourse(courseId);
        if (courseId) {
            try {
                const banksData = await fetchQuestionBanks(courseId);
                setBanks(banksData);
            } catch (err) {
                setError('Failed to load question banks');
            }
        } else {
            setBanks([]);
        }
        setSelectedBank('');
    };

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt');
            return;
        }

        setLoading(true);
        try {
            // Format all settings into a single context string
            const settingsText = contextSettings.map(setting => 
                `Generate ${setting.numQuestions} questions at ${setting.level} level with ${setting.difficulty} difficulty.`
            ).join('\n');

            // Combine prompt and settings into one context
            const context = `${prompt}\n\nRequirements:\n${settingsText}`;

            const questions = await generateQuestions(context);
            
            const formattedQuestions = questions.map((q: any, index: number) => ({
                id: String(index + 1),
                question_text: q.question_text,
                answers: q.answers,
                taxonomies: q.taxonomies
            }));
            
            setGeneratedQuestions(formattedQuestions);
            setError(null);
        } catch (err) {
            setError('Failed to generate questions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            setPrompt(text as string);
        };
        reader.readAsText(file);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const toggleQuestionSelection = (questionId: string) => {
        setSelectedQuestionsForBank(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const toggleQuestionExpansion = (questionId: string) => {
        setExpandedQuestionId(prev => (prev === questionId ? null : questionId));
    };

    const truncateText = (text: string | undefined, maxLength: number = 50) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    const handleDuplicate = (questionId: string) => {
        console.log(`Duplicate question with ID: ${questionId}`);
    };

    const handleDelete = (questionId: string) => {
        console.log(`Delete question with ID: ${questionId}`);
    };

    const toggleAllQuestions = () => {
        setAllExpanded(!allExpanded);
        setExpandedQuestionId(allExpanded ? null : 'all');
    };

    const addNewSetting = () => {
        setContextSettings([
            ...contextSettings,
            {
                numQuestions: 5,
                level: '',
                difficulty: ''
            }
        ]);
    };

    const updateSetting = (index: number, field: string, value: string | number) => {
        const newSettings = [...contextSettings];
        newSettings[index] = {
            ...newSettings[index],
            [field]: value
        };
        setContextSettings(newSettings);
    };

    const removeSetting = (index: number) => {
        setContextSettings(contextSettings.filter((_, i) => i !== index));
    };

    const handleAddToBank = async () => {
        if (!selectedCourse || !selectedBank) {
            setError('Please select both course and bank');
            return;
        }

        const selectedQuestions = generatedQuestions.filter(q => selectedQuestionsForBank[q.id]);
        if (selectedQuestions.length === 0) {
            setError('Please select at least one question');
            return;
        }

        setLoading(true);
        try {
            const formattedQuestions = selectedQuestions.map(q => ({
                question_text: editedQuestions[q.id]?.question_text || q.question_text,
                answers: editedQuestions[q.id]?.answers || q.answers
            }));

            await bulkCreateQuestions(selectedCourse, selectedBank, formattedQuestions);
            setError(null);
            setShowBankSelection(false);
            setSelectedQuestionsForBank({});
            setEditedQuestions({});
            // Optional: Show success message
        } catch (err) {
            setError('Failed to add questions to bank');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (question: GeneratedQuestion) => {
        setEditingQuestion({
            id: question.id,
            question_text: editedQuestions[question.id]?.question_text || question.question_text,
            answers: editedQuestions[question.id]?.answers || question.answers
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (!editingQuestion) return;
        
        setEditedQuestions(prev => ({
            ...prev,
            [editingQuestion.id]: editingQuestion
        }));
        setIsEditModalOpen(false);
        setEditingQuestion(null);
    };

    return (
        <div className="space-y-6">
            <Breadcrumb
                pageName="Generate Questions"
                currentName="Generate Questions"
                parentPath=""
                parentName=""
                parentPath2=""
                parentName2=""
            />

            {error && (
                <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-danger">
                    {error}
                </div>
            )}

            {/* Input Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="p-6.5">
                    <div className="mb-4.5">
                        <div className="flex items-center justify-between mb-2.5">
                            <div className="w-[120px]"></div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".txt,.doc,.docx"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file);
                                    }}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="hover:text-primary"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div
                            className={`relative ${isDragging ? 'bg-primary bg-opacity-10' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <textarea
                                rows={6}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter your prompt here or drag & drop a file..."
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            />
                            {isDragging && (
                                <div className="absolute inset-0 flex items-center justify-center rounded border-2 border-dashed border-primary bg-primary bg-opacity-10">
                                    <p className="text-primary">Drop your file here</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings section */}
                    <div className="space-y-4">
                        {contextSettings.map((setting, index) => (
                            <div key={index} className="flex gap-4 items-start">
                                <div className="flex-1 grid grid-cols-3 gap-6">
                                    <div className="mb-4.5">
                                        <label className="mb-2.5 block text-black dark:text-white">
                                            Number of Questions
                                        </label>
                                        <input
                                            type="number"
                                            value={setting.numQuestions}
                                            onChange={(e) => updateSetting(index, 'numQuestions', Number(e.target.value))}
                                            min="1"
                                            max="10"
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                        />
                                    </div>

                                    <div className="mb-4.5">
                                        <label className="mb-2.5 block text-black dark:text-white">
                                            Taxonomy Level
                                        </label>
                                        <select
                                            value={setting.level}
                                            onChange={(e) => updateSetting(index, 'level', e.target.value)}
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                        >
                                            <option value="">Select Level</option>
                                            {bloomsLevels.map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-4.5">
                                        <label className="mb-2.5 block text-black dark:text-white">
                                            Difficulty
                                        </label>
                                        <select
                                            value={setting.difficulty}
                                            onChange={(e) => updateSetting(index, 'difficulty', e.target.value)}
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                        >
                                            <option value="">Select Difficulty</option>
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {contextSettings.length > 1 && (
                                    <button
                                        onClick={() => removeSetting(index)}
                                        className="mt-8 p-2 text-danger hover:text-danger/80"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                        
                        <button
                            onClick={addNewSetting}
                            className="text-primary hover:text-primary/80 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add another combination
                        </button>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className={`inline-flex items-center justify-center rounded-md py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 ${
                                loading ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                'Generate Questions'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-stroke dark:bg-strokedark"></div>

            {/* Generated Questions Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="p-6.5">
                    <div className="flex justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                                Generated Questions
                            </h2>
                            {generatedQuestions.length > 0 && (
                                <button
                                    onClick={toggleAllQuestions}
                                    className="text-sm text-black dark:text-white hover:text-primary"
                                >
                                    {allExpanded ? 'Collapse all' : 'Expand all'}
                                </button>
                            )}
                        </div>
                        {generatedQuestions.length > 0 && (
                            <div className="flex items-center gap-4">
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => handleCourseChange(e.target.value)}
                                    className="rounded border-[1.5px] border-stroke bg-transparent py-2 px-5 font-medium outline-none"
                                >
                                    <option value="">Choose Course</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedBank}
                                    onChange={(e) => setSelectedBank(e.target.value)}
                                    className="rounded border-[1.5px] border-stroke bg-transparent py-2 px-5 font-medium outline-none"
                                    disabled={!selectedCourse}
                                >
                                    <option value="">Choose Question Bank</option>
                                    {banks.map(bank => (
                                        <option key={bank.id} value={bank.id}>{bank.name}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={handleAddToBank}
                                    disabled={!selectedBank || Object.keys(selectedQuestionsForBank).length === 0}
                                    className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                                >
                                    Add Selected to Bank
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Questions List */}
                    <div className="space-y-4">
                        {generatedQuestions.map((question) => (
                            <div key={question.id} className="border border-stroke rounded-sm p-6 dark:border-strokedark">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedQuestionsForBank[question.id] || false}
                                            onChange={() => toggleQuestionSelection(question.id)}
                                            className="w-5 h-5 text-primary border-stroke dark:border-strokedark rounded"
                                        />
                                        <p className="text-body">
                                            {editedQuestions[question.id]?.question_text || question.question_text}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditClick(question)}
                                            className="p-1 hover:text-primary"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => toggleQuestionExpansion(question.id)}
                                            className="p-1 hover:text-primary"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className={`w-5 h-5 transition-transform duration-200 ${
                                                    expandedQuestionId === question.id || allExpanded ? 'rotate-180' : ''
                                                }`}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {(expandedQuestionId === question.id || allExpanded) && (
                                    <div className="space-y-4 mt-4 ml-9">
                                        {question.answers.map((answer, index) => (
                                            <div
                                                key={index}
                                                className={`border rounded-md p-4 transition-all duration-200 ${
                                                    answer.is_correct ? 'bg-success/10 border-success' : 'bg-danger/10 border-danger'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-semibold ${answer.is_correct ? 'text-success' : 'text-danger'}`}>
                                                            {index + 1}.
                                                        </span>
                                                        <p className={`font-medium ${answer.is_correct ? 'text-success' : 'text-danger'}`}>
                                                            {answer.answer_text}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`mt-4 pl-8 text-sm border-t pt-4 ${answer.is_correct ? 'text-success border-success' : 'text-danger border-danger'}`}>
                                                    {answer.explanation}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Similarity Note */}
                    <div className="mt-6 flex items-center gap-4">
                        <p className="text-body">
                            <span className="text-danger font-medium">NOTE:</span> There are questions in your bank that are similar.
                        </p>
                        <button
                            onClick={() => setIsSimilarityDialogOpen(true)}
                            className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90"
                        >
                            View similarity
                        </button>
                    </div>
                </div>
            </div>

            <SimilarityDialog
                isOpen={isSimilarityDialogOpen}
                onClose={() => setIsSimilarityDialogOpen(false)}
                similarQuestions={[
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
                    }
                ]}
            />

            {/* Edit Modal */}
            <Transition appear show={isEditModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsEditModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-boxdark">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                                    >
                                        Edit Question
                                    </Dialog.Title>
                                    {editingQuestion && (
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-white">
                                                    Question Text
                                                </label>
                                                <textarea
                                                    value={editingQuestion.question_text}
                                                    onChange={(e) => setEditingQuestion({
                                                        ...editingQuestion,
                                                        question_text: e.target.value
                                                    })}
                                                    className="mt-1 w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-white">
                                                    Answers
                                                </label>
                                                {editingQuestion.answers.map((answer, index) => (
                                                    <div key={index} className="space-y-2">
                                                        <div className="flex items-center gap-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={answer.is_correct}
                                                                onChange={(e) => {
                                                                    const newAnswers = [...editingQuestion.answers];
                                                                    newAnswers[index] = {
                                                                        ...answer,
                                                                        is_correct: e.target.checked
                                                                    };
                                                                    setEditingQuestion({
                                                                        ...editingQuestion,
                                                                        answers: newAnswers
                                                                    });
                                                                }}
                                                                className="w-4 h-4 text-primary"
                                                            />
                                                            <textarea
                                                                value={answer.answer_text}
                                                                onChange={(e) => {
                                                                    const newAnswers = [...editingQuestion.answers];
                                                                    newAnswers[index] = {
                                                                        ...answer,
                                                                        answer_text: e.target.value
                                                                    };
                                                                    setEditingQuestion({
                                                                        ...editingQuestion,
                                                                        answers: newAnswers
                                                                    });
                                                                }}
                                                                className="flex-1 rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                                                rows={2}
                                                            />
                                                        </div>
                                                        <textarea
                                                            value={answer.explanation}
                                                            onChange={(e) => {
                                                                const newAnswers = [...editingQuestion.answers];
                                                                newAnswers[index] = {
                                                                    ...answer,
                                                                    explanation: e.target.value
                                                                };
                                                                setEditingQuestion({
                                                                    ...editingQuestion,
                                                                    answers: newAnswers
                                                                });
                                                            }}
                                                            placeholder="Explanation"
                                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                                            rows={2}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-6 flex justify-end gap-4">
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                                    onClick={() => setIsEditModalOpen(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                                    onClick={handleSaveEdit}
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default GenerateQuestion;
