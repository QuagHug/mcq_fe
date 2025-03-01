import { useState, useRef, DragEvent } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Editor } from '@tinymce/tinymce-react';
import ConfirmDialog from '../components/ConfirmDialog';

const GenerateDistractors = () => {
    const [question, setQuestion] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedDistractors, setGeneratedDistractors] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [numDistractors, setNumDistractors] = useState(3);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [selectedDistractor, setSelectedDistractor] = useState<string | null>(null);
    const [contextSettings, setContextSettings] = useState<Array<{
        numQuestions: number;
        level: string;
        difficulty: string;
    }>>([{
        numQuestions: 5,
        level: '',
        difficulty: ''
    }]);

    const handleGenerate = async () => {
        if (!question || !correctAnswer) {
            setError('Please provide both question and correct answer');
            return;
        }

        setLoading(true);
        try {
            // TODO: Implement the actual API call
            setGeneratedDistractors([
                'Sample distractor 1',
                'Sample distractor 2',
                'Sample distractor 3',
            ]);
            setError(null);
        } catch (err) {
            setError('Failed to generate distractors');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            setQuestion(text as string);
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

    const handleAddDistractor = (distractor: string) => {
        setSelectedDistractor(distractor);
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmAdd = () => {
        if (selectedDistractor && correctAnswer) {
            // TODO: Implement the actual API call to add the distractor to the question
            console.log('Adding distractor:', selectedDistractor, 'to question:', correctAnswer);
            setIsConfirmDialogOpen(false);
            setSelectedDistractor(null);
        }
    };

    return (
        <div className="space-y-6">
            <Breadcrumb
                pageName="Generate Distractors"
                currentName="Generate"
                breadcrumbItems={[
                    { name: "Home Page", path: "/" },
                    { name: "Generate", path: "/generate" },
                    { name: "Distractors", path: "/generate-distractors" }
                ]}
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
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Enter your context here or drag & drop a file..."
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
                                            Number of Distractors
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
                            className={`inline-flex items-center justify-center rounded-md py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 ${loading ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary'
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
                                'Generate Distractors'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-stroke dark:bg-strokedark"></div>

            {/* Generated Distractors Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="p-6.5">
                    <div className="flex justify-between mb-4">
                        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                            Generated Distractors
                        </h2>
                        <div className="flex items-center gap-4">
                            <select
                                value={correctAnswer}
                                onChange={(e) => setCorrectAnswer(e.target.value)}
                                className="rounded border-[1.5px] border-stroke bg-transparent py-2 px-5 font-medium outline-none"
                            >
                                <option value="">Select Question</option>
                                {/* TODO: Add questions from your question bank */}
                                <option value="sample1">Sample Question 1</option>
                                <option value="sample2">Sample Question 2</option>
                            </select>
                        </div>
                    </div>

                    {/* Generated Distractors List */}
                    <div className="space-y-4">
                        {generatedDistractors.map((distractor, index) => (
                            <div key={index} className="p-4 border rounded-sm dark:border-strokedark">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-body dark:text-bodydark">{distractor}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleAddDistractor(distractor)}
                                            className="text-success hover:text-meta-3"
                                        >
                                            Add to Question
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {generatedDistractors.length === 0 && (
                            <div className="text-center py-8 text-body dark:text-bodydark">
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin h-5 w-5 mr-3 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating distractors...
                                    </div>
                                ) : (
                                    'No distractors generated yet. Enter a question and correct answer above to generate distractors.'
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isConfirmDialogOpen}
                onClose={() => {
                    setIsConfirmDialogOpen(false);
                    setSelectedDistractor(null);
                }}
                onConfirm={handleConfirmAdd}
                message={`Are you sure you want to add this distractor to the selected question?`}
            />
        </div>
    );
};

export default GenerateDistractors; 