import { useState, useRef, DragEvent } from 'react';
import Breadcrumb from '../components/Breadcrumb';

interface Answer {
    id: string;
    text: string;
    isCorrect: boolean;
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
        // Mock data - replace with actual generated questions
        {
            id: '1',
            question: 'What is Computer Network?',
            answers: [
                { id: 'A', text: 'A collection of autonomous computers', isCorrect: false },
                { id: 'B', text: 'A system of interconnected computers', isCorrect: true },
                { id: 'C', text: 'A single computer with multiple processors', isCorrect: false },
                { id: 'D', text: 'A software application for sharing files', isCorrect: false },
            ],
            explanation: {
                correct: 'A computer network is a system of interconnected computers...',
                incorrect: 'Other options are incorrect because...'
            },
            similarity: 60
        },
        // Add more mock questions as needed
    ]);
    const [selectedQuestions, setSelectedQuestions] = useState<{ [key: string]: boolean }>(() => {
        const initialState: { [key: string]: boolean } = {};
        generatedQuestions.forEach(question => {
            initialState[question.id] = true;
        });
        return initialState;
    });
    const [selectedQuestionBank, setSelectedQuestionBank] = useState('');

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
                            <label className="text-black dark:text-white">
                                Prompting
                            </label>
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

                    <div className="grid grid-cols-3 gap-6">
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
                    </div>

                    <div className="flex justify-end">
                        <button className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90">
                            Generate
                        </button>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-stroke dark:bg-strokedark"></div>

            {/* Answer Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="p-6.5">
                    {/* Individual Question Blocks */}
                    <div className="space-y-6">
                        {generatedQuestions.map((question) => (
                            <div
                                key={question.id}
                                className="border border-stroke rounded-sm p-6 dark:border-strokedark"
                            >
                                {/* Question */}
                                <div className="mb-4">
                                    <div className="group inline-flex items-center gap-2">
                                        <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                                            Question {question.id}
                                        </h4>
                                        <p className="text-body">{question.question}</p>
                                        <button className="hidden group-hover:block hover:text-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Answers */}
                                <div className="mb-4 space-y-2">
                                    {question.answers.map((answer) => (
                                        <div
                                            key={answer.id}
                                            className={`group flex items-center justify-between p-3 rounded ${answer.isCorrect
                                                ? 'bg-success bg-opacity-5 border border-success'
                                                : 'bg-danger bg-opacity-5 border border-danger'
                                                }`}
                                        >
                                            <div>
                                                <span className="font-medium">{answer.id}.</span> {answer.text}
                                            </div>
                                            <button className="hidden group-hover:block hover:text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Explanation */}
                                <div className="mb-4 space-y-2">
                                    <div className="group">
                                        <div className="flex items-center justify-between">
                                            <h5 className="font-medium text-black dark:text-white">Correct Answer Explanation:</h5>
                                            <button className="hidden group-hover:block hover:text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-body">{question.explanation.correct}</p>
                                    </div>
                                    <div className="group">
                                        <div className="flex items-center justify-between">
                                            <h5 className="font-medium text-black dark:text-white">Incorrect Answers Explanation:</h5>
                                            <button className="hidden group-hover:block hover:text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-body">{question.explanation.incorrect}</p>
                                    </div>
                                </div>

                                {/* Keep Question Checkbox & Learning Outcome */}
                                <div className="flex items-center gap-8 mb-4">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`keep-question-${question.id}`}
                                            checked={selectedQuestions[question.id] || false}
                                            onChange={() => toggleQuestionSelection(question.id)}
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-400 bg-transparent transition-all checked:border-primary checked:bg-primary hover:border-primary dark:border-gray-500"
                                        />
                                        <div className="pointer-events-none absolute left-0 top-0 h-full w-full rounded-md peer-checked:border-none">
                                            <svg
                                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
                                                width="10"
                                                height="8"
                                                viewBox="0 0 10 8"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M9.44741 1.06097C9.70558 0.776188 9.67866 0.346597 9.38794 0.0884293C9.09721 -0.169739 8.65881 -0.143819 8.40064 0.140965L3.95458 5.05766L1.59936 2.43533C1.34119 2.15055 0.902789 2.12463 0.612064 2.38281C0.32134 2.64099 0.29542 3.07939 0.553595 3.37011L3.45121 6.60673C3.57638 6.74578 3.75415 6.82492 3.93853 6.82609C4.1229 6.82726 4.30169 6.75036 4.42836 6.61277L9.44741 1.06097Z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                        </div>
                                        <label
                                            htmlFor={`keep-question-${question.id}`}
                                            className="cursor-pointer pl-3 text-body"
                                        >
                                            Would you like to keep this question?
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Enter learning outcome tag"
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                        />
                                    </div>
                                </div>
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
