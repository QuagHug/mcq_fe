import React, { useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import SimilarityDialog from '../components/SimilarityDialog';
import ConfirmDialog from '../components/ConfirmDialog';

type ExpandedSections = {
    [key: string]: boolean;
};

type Answer = {
    id: string;
    text: string;
    explanation: string;
    grade: string;
};

type Question = {
    questionText: string;
    answers: Answer[];
    singleAnswer: boolean;
    shuffle: boolean;
};

type SelectedTags = {
    subject?: string;
    bloom?: string;
};

const AddManyQues = () => {
    const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
        context: true,
        content: true,
        tags: false,
    });

    const [context, setContext] = useState('');
    const [questions, setQuestions] = useState<Question[]>([{
        questionText: '',
        answers: [
            { id: 'A', text: '', explanation: '', grade: '0' },
            { id: 'B', text: '', explanation: '', grade: '0' },
            { id: 'C', text: '', explanation: '', grade: '0' },
            { id: 'D', text: '', explanation: '', grade: '0' },
        ],
        singleAnswer: true,
        shuffle: false,
    }]);

    const [selectedTags, setSelectedTags] = useState<SelectedTags>({});
    const [isSimilarityDialogOpen, setIsSimilarityDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleAnswerChange = (questionIndex: number, answerId: string, field: keyof Answer, value: string) => {
        setQuestions(prevQuestions => {
            const newQuestions = [...prevQuestions];
            const question = newQuestions[questionIndex];
            question.answers = question.answers.map(answer =>
                answer.id === answerId ? { ...answer, [field]: value } : answer
            );
            return newQuestions;
        });
    };

    const addNewQuestion = () => {
        setQuestions(prev => [...prev, {
            questionText: '',
            answers: [
                { id: 'A', text: '', explanation: '', grade: '0' },
                { id: 'B', text: '', explanation: '', grade: '0' },
                { id: 'C', text: '', explanation: '', grade: '0' },
                { id: 'D', text: '', explanation: '', grade: '0' },
            ],
            singleAnswer: true,
            shuffle: false,
        }]);
    };

    const handleTagChange = (category: keyof SelectedTags, value: string) => {
        setSelectedTags(prevTags => ({
            ...prevTags,
            [category]: value,
        }));
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-black dark:text-white">Add Question Group</h1>

            {/* Context Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
                    <h3 className="text-2xl font-semibold text-black dark:text-white">Context</h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-5 h-5 transition-transform duration-200 cursor-pointer ${expandedSections.context ? 'rotate-180' : ''}`}
                        onClick={() => toggleSection('context')}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
                {expandedSections.context && (
                    <div className="px-6.5 py-4">
                        <Editor
                            apiKey="rk63se2fx3gtxdcb6a6556yapoajd3drfp10hjc5u7km8vid"
                            value={context}
                            onEditorChange={setContext}
                            init={{
                                height: 300,
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
                                    'removeformat | table | equation | help',
                                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Main Questions and Answers Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
                    <h3 className="text-2xl font-semibold text-black dark:text-white">Questions and Answers</h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-5 h-5 transition-transform duration-200 cursor-pointer ${expandedSections.content ? 'rotate-180' : ''}`}
                        onClick={() => toggleSection('content')}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
                {expandedSections.content && (
                    <div className="px-6.5 py-4 space-y-6">
                        {questions.map((question, qIndex) => (
                            <React.Fragment key={qIndex}>
                                <div className="border border-stroke p-4 rounded-sm dark:border-strokedark">
                                    <h4 className="text-xl font-semibold mb-4 text-black dark:text-white">
                                        Question {qIndex + 1}
                                    </h4>

                                    {/* Question Text Editor */}
                                    <div className="mb-4">
                                        <Editor
                                            apiKey="rk63se2fx3gtxdcb6a6556yapoajd3drfp10hjc5u7km8vid"
                                            value={question.questionText}
                                            onEditorChange={(content) => {
                                                const newQuestions = [...questions];
                                                newQuestions[qIndex].questionText = content;
                                                setQuestions(newQuestions);
                                            }}
                                            init={{
                                                height: 200,
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
                                        />
                                    </div>

                                    {/* Question Settings */}
                                    <div className="flex flex-col gap-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            <label className="font-medium text-black dark:text-white">
                                                One or Multiple answers?
                                            </label>
                                            <select
                                                value={question.singleAnswer ? "one" : "multiple"}
                                                onChange={(e) => {
                                                    const newQuestions = [...questions];
                                                    newQuestions[qIndex].singleAnswer = e.target.value === "one";
                                                    setQuestions(newQuestions);
                                                }}
                                                className="rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                            >
                                                <option value="one">One answer only</option>
                                                <option value="multiple">Multiple answers allowed</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                checked={question.shuffle}
                                                onChange={(e) => {
                                                    const newQuestions = [...questions];
                                                    newQuestions[qIndex].shuffle = e.target.checked;
                                                    setQuestions(newQuestions);
                                                }}
                                                className="form-checkbox"
                                            />
                                            <label className="font-medium text-black dark:text-white">
                                                Shuffle the choices?
                                            </label>
                                        </div>
                                    </div>

                                    {/* Answers Section */}
                                    <div className="space-y-4">
                                        {question.answers.map((answer) => (
                                            <div key={answer.id} className="rounded border border-stroke p-4 bg-white dark:bg-boxdark">
                                                <div className="flex justify-between items-center mb-4">
                                                    <label className="font-medium text-black dark:text-white">
                                                        Answer {answer.id}
                                                    </label>
                                                    <select
                                                        value={answer.grade}
                                                        onChange={(e) => handleAnswerChange(qIndex, answer.id, 'grade', e.target.value)}
                                                        className="w-[200px] rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                                    >
                                                        <option value="100">100%</option>
                                                        <option value="50">50%</option>
                                                        <option value="10">10%</option>
                                                        <option value="5">5%</option>
                                                        <option value="0">0%</option>
                                                    </select>
                                                </div>

                                                {/* Answer Text Editor */}
                                                <Editor
                                                    apiKey="rk63se2fx3gtxdcb6a6556yapoajd3drfp10hjc5u7km8vid"
                                                    value={answer.text}
                                                    onEditorChange={(content) => handleAnswerChange(qIndex, answer.id, 'text', content)}
                                                    init={{
                                                        height: 100,
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
                                                />

                                                {/* Explanation Editor */}
                                                <div className="mt-4">
                                                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                                                        Explanation
                                                    </label>
                                                    <Editor
                                                        apiKey="rk63se2fx3gtxdcb6a6556yapoajd3drfp10hjc5u7km8vid"
                                                        value={answer.explanation}
                                                        onEditorChange={(content) => handleAnswerChange(qIndex, answer.id, 'explanation', content)}
                                                        init={{
                                                            height: 200,
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
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {qIndex < questions.length - 1 && (
                                    <div className="h-px bg-stroke dark:bg-strokedark w-full"></div>
                                )}
                            </React.Fragment>
                        ))}

                        {/* Add Question Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={addNewQuestion}
                                className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition"
                            >
                                Add Another Question
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
                        <label className="font-medium text-black dark:text-white">Tags</label>
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
                                <option value="math">none</option>
                                <option value="science">Science</option>
                                <option value="history">History</option>
                            </optgroup>
                            <optgroup label="Bloom's Level">
                                <option value="remember">Remember</option>
                                <option value="understand">Understand</option>
                                <option value="apply">Apply</option>
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

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-4">
                {/* Similarity Note and Button */}
                <div className="flex items-center gap-4">
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

                {/* Question Bank Selection and Add Button */}
                <div className="flex items-center gap-4">
                    <select
                        className="rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    >
                        <option value="">Choose Question Bank</option>
                        <optgroup label="Networking">
                            <option value="networking-ch1">Chapter 1: Introduction to Networks</option>
                            <option value="networking-ch2">Chapter 2: Network Protocols</option>
                            <option value="networking-ch3">Chapter 3: Network Security</option>
                        </optgroup>
                        <optgroup label="Database">
                            <option value="database-ch1">Chapter 1: Database Fundamentals</option>
                            <option value="database-ch2">Chapter 2: SQL and Queries</option>
                        </optgroup>
                        <optgroup label="PPL">
                            <option value="ppl-ch1">Chapter 1: Programming Concepts</option>
                            <option value="ppl-ch2">Chapter 2: Language Paradigms</option>
                            <option value="ppl-ch3">Chapter 3: Language Processing</option>
                        </optgroup>
                    </select>
                    <div className="flex flex-col gap-2">
                        <button
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition"
                        >
                            Add to bank
                        </button>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={() => setIsConfirmDialogOpen(true)}
                        className="px-4 py-2 bg-danger text-white rounded hover:bg-opacity-90 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* Dialogs */}
            <SimilarityDialog
                isOpen={isSimilarityDialogOpen}
                onClose={() => setIsSimilarityDialogOpen(false)}
                similarQuestions={[]}
            />

            <ConfirmDialog
                isOpen={isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(false)}
                onConfirm={() => {
                    // Reset form logic here
                    setIsConfirmDialogOpen(false);
                }}
                message="Are you sure you want to discard these changes?"
            />
        </div>
    );
};

export default AddManyQues; 