import React, { useState, useRef, DragEvent } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Menu, Transition } from '@headlessui/react';

interface Answer {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
}

interface GeneratedQuestion {
    id: string;
    question: string;
    answers: Answer[];
    explanation: {
        correct: string;
        incorrect: string;
    };
    similarity?: number;
}

const GenerateQuestion = () => {
    const [bloomsLevel, setBloomsLevel] = useState('');
    const [prompt, setPrompt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([
        {
            id: '1',
            question: 'What is Computer Network?',
            answers: [
                { id: 'A', text: 'A collection of autonomous computers', isCorrect: false, explanation: 'A computer network is a system of interconnected computers...' },
                { id: 'B', text: 'A system of interconnected computers', isCorrect: true, explanation: 'Other options are incorrect because...' },
                { id: 'C', text: 'A single computer with multiple processors', isCorrect: false, explanation: 'Other options are incorrect because...' },
                { id: 'D', text: 'A software application for sharing files', isCorrect: false, explanation: 'Other options are incorrect because...' },
            ],
            explanation: {
                correct: 'A computer network is a system of interconnected computers...',
                incorrect: 'Other options are incorrect because...'
            },
            similarity: 60
        },
        {
            id: '2',
            question: 'What is the primary function of TCP/IP in computer networking?',
            answers: [
                {
                    id: 'A',
                    text: 'Transmission Control Protocol/Internet Protocol is responsible for data delivery between applications across diverse networks',
                    explanation: 'TCP/IP is indeed the fundamental communication protocol of the Internet, handling how data is packaged, addressed, transmitted, routed, and received.',
                    isCorrect: true
                },
                {
                    id: 'B',
                    text: "It's only used for web browsing",
                    explanation: 'This is incorrect. TCP/IP is used for much more than just web browsing, including email, file transfer, and remote administration.',
                    isCorrect: false
                },
                {
                    id: 'C',
                    text: "It's a programming language for network applications",
                    explanation: 'This is incorrect. TCP/IP is a protocol suite, not a programming language.',
                    isCorrect: false
                },
                {
                    id: 'D',
                    text: "It's a type of network cable",
                    explanation: 'This is incorrect. TCP/IP is a protocol suite, not a physical component like a network cable.',
                    isCorrect: false
                }
            ],
            explanation: {
                correct: 'TCP/IP is indeed the fundamental communication protocol of the Internet, handling how data is packaged, addressed, transmitted, routed, and received.',
                incorrect: 'This is incorrect. TCP/IP is used for much more than just web browsing, including email, file transfer, and remote administration.'
            },
            similarity: 75
        }
    ]);
    const [selectedQuestions, setSelectedQuestions] = useState<{ [key: string]: boolean }>(() => {
        const initialState: { [key: string]: boolean } = {};
        generatedQuestions.forEach(question => {
            initialState[question.id] = true;
        });
        return initialState;
    });
    const [selectedQuestionBank, setSelectedQuestionBank] = useState('');
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
    const [allExpanded, setAllExpanded] = useState(false);

    const bloomsLevels = [
        'Remember',
        'Understand',
        'Apply',
        'Analyze',
        'Evaluate',
        'Create'
    ];

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
        setSelectedQuestions(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const toggleQuestionExpansion = (questionId: string) => {
        setExpandedQuestionId(prev => (prev === questionId ? null : questionId));
    };

    const truncateText = (text: string, maxLength: number = 50) => {
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

            {/* Input Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="p-6.5">
                    <div className="mb-4.5">
                        <div className="flex items-center justify-between mb-2.5">
                            <button
                                onClick={() => {
                                    // Add import logic here
                                }}
                                className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-center font-medium text-white hover:bg-opacity-90"
                            >
                                Import Questions
                            </button>
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

                    {/* <div className="grid grid-cols-3 gap-6">
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Number of Questions
                            </label>
                            <input
                                type="number"
                                min="1"
                                placeholder="Enter number of questions"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            />
                        </div>

                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Answers per Question
                            </label>
                            <input
                                type="number"
                                min="2"
                                placeholder="Enter number of answers"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            />
                        </div>

                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Bloom's Level
                            </label>
                            <select
                                value={bloomsLevel}
                                onChange={(e) => setBloomsLevel(e.target.value)}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            >
                                <option value="">Select Bloom's Level</option>
                                {bloomsLevels.map((level) => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div> */}

                    <div className="flex justify-end">
                        <button className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90">
                            Generate Questions
                        </button>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-stroke dark:bg-strokedark"></div>

            {/* Answer Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="p-6.5">
                    <div className="flex justify-between mb-4">
                        <label className="mb-2.5 text-black dark:text-white">Generated Questions</label>
                        <button
                            onClick={toggleAllQuestions}
                            className="mb-2.5 text-black dark:text-white hover:text-primary"
                        >
                            {allExpanded ? 'Collapse all' : 'Expand all'}
                        </button>
                    </div>
                    {/* Individual Question Blocks */}
                    <div className="space-y-6">
                        {generatedQuestions.map((question) => (
                            <div
                                key={question.id}
                                className="border border-stroke rounded-sm p-6 dark:border-strokedark"
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                                        {truncateText(question.question)}
                                    </h4>
                                    <div className="flex items-center space-x-2">
                                        <Menu as="div" className="relative" onClick={(e) => e.stopPropagation()}>
                                            <Menu.Button className="hover:text-primary">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="w-5 h-5 mt-1"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm0 5.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm0 5.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
                                                </svg>
                                            </Menu.Button>
                                            <Transition
                                                as={React.Fragment}
                                                enter="transition ease-out duration-100"
                                                enterFrom="transform opacity-0 scale-95"
                                                enterTo="transform opacity-100 scale-100"
                                                leave="transition ease-in duration-75"
                                                leaveFrom="transform opacity-100 scale-100"
                                                leaveTo="transform opacity-0 scale-95"
                                            >
                                                <Menu.Items className="absolute right-0 mt-2 w-32 origin-top-right bg-white dark:bg-boxdark divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                    <div className="py-1">
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleDuplicate(question.id)}
                                                                    className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                                                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                                                >
                                                                    Duplicate
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleDelete(question.id)}
                                                                    className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                                                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    </div>
                                                </Menu.Items>
                                            </Transition>
                                        </Menu>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className={`w-5 h-5 transition-transform duration-200 cursor-pointer ${expandedQuestionId === question.id || allExpanded ? 'rotate-180' : ''}`}
                                            onClick={() => toggleQuestionExpansion(question.id)}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>
                                </div>

                                {(expandedQuestionId === question.id || allExpanded) && (
                                    <div className="mt-4">
                                        <div className="mb-4 flex items-center">
                                            <h3 className="text-2xl font-semibold text-black dark:text-white">Question</h3>
                                            <div className="ml-4">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Bloom's Level: </span>
                                                <select
                                                    value={bloomsLevel}
                                                    onChange={(e) => setBloomsLevel(e.target.value)}
                                                    className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-none focus:ring-0"
                                                >
                                                    <option value="">N/A</option>
                                                    {bloomsLevels.map((level) => (
                                                        <option key={level} value={level}>
                                                            {level}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-body mt-2">{question.question}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h3 className="text-2xl font-semibold text-black dark:text-white">Answers</h3>
                                            <div className="space-y-4 mt-2">
                                                {question.answers.map((answer) => (
                                                    <div
                                                        key={answer.id}
                                                        className={`border rounded-md p-4 transition-all duration-200 ${answer.isCorrect
                                                            ? 'bg-success/10 border-success'
                                                            : 'bg-danger/10 border-danger'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between cursor-pointer">
                                                            <div className="flex items-center gap-4">
                                                                <span className={`font-semibold ${answer.isCorrect ? 'text-success' : 'text-danger'}`}>
                                                                    {answer.id}.
                                                                </span>
                                                                <p className={`font-medium ${answer.isCorrect ? 'text-success' : 'text-danger'}`}>
                                                                    {answer.text}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className={`mt-4 pl-8 text-sm border-t pt-4 ${answer.isCorrect ? 'text-success border-success' : 'text-danger border-danger'}`}>
                                                            {answer.explanation}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Similarity Note and Buttons */}
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <p className="text-body">
                                <span className="text-danger font-medium">NOTE:</span> There are questions in your bank that has {generatedQuestions[0]?.similarity}% similarity
                            </p>
                            <button className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90">
                                View similarity
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            {Object.values(selectedQuestions).some(value => value) && (
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedQuestionBank}
                                        onChange={(e) => setSelectedQuestionBank(e.target.value)}
                                        className="rounded border-[1.5px] border-stroke bg-transparent py-2 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="">Select Question Bank</option>
                                        <option value="networking">Networking</option>
                                        <option value="database">Database</option>
                                        <option value="ppl">PPL</option>
                                    </select>
                                </div>
                            )}
                            <button
                                className={`inline-flex items-center justify-center rounded-md py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 min-w-[100px] ${Object.values(selectedQuestions).some(value => value)
                                    ? 'bg-primary'
                                    : 'bg-danger'
                                    }`}
                            >
                                {Object.values(selectedQuestions).some(value => value) ? 'Add' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenerateQuestion;
