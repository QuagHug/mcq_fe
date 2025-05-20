import { useState, useRef, DragEvent, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Editor } from '@tinymce/tinymce-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { fetchQuestionBanks, getValidToken, fetchBankQuestions, fetchCourses, generateDistractors, addDistractorsToQuestion } from '../services/api';

interface QuestionBank {
    id: number;
    name: string;
    questions: Question[];
    subBanks?: QuestionBank[];
}

interface Question {
    id: number;
    question_text: string;
    answers?: { answer_text: string; is_correct: boolean }[];
}

const GenerateDistractors = () => {
    const [question, setQuestion] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedDistractors, setGeneratedDistractors] = useState<Array<{
        answer_text: string;
        explanation: string;
        difficulty: string;
    }>>([]);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [numDistractors, setNumDistractors] = useState(3);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [selectedDistractor, setSelectedDistractor] = useState<{
        answer_text: string;
        explanation: string;
        difficulty: string;
    } | null>(null);
    const [contextSettings, setContextSettings] = useState<Array<{
        numQuestions: number;
        level: string;
        difficulty: string;
    }>>([{
        numQuestions: 1,
        level: '',
        difficulty: 'easy'
    }]);

    // State for bank selection
    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [selectedSubBankId, setSelectedSubBankId] = useState<number | null>(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
    const [bankLoading, setBankLoading] = useState(false);

    // State for available questions
    const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);

    // State for existing distractors
    const [existingDistractors, setExistingDistractors] = useState<Array<{
        answer_text: string;
        explanation?: string;
        difficulty?: string;
        is_correct: boolean;
    }>>([]);

    // Add these state variables with your other state declarations
    const [editingDistractorIndex, setEditingDistractorIndex] = useState<number | null>(null);
    const [editDistractorText, setEditDistractorText] = useState('');

    // Fetch question banks on component mount
    useEffect(() => {
        const loadQuestionBanks = async () => {
            try {
                setBankLoading(true);
                // Use the fetchCourses function from api.ts instead of direct fetch
                const data = await fetchCourses();
                setQuestionBanks(data);
            } catch (err) {
                setError('Failed to load courses');
            } finally {
                setBankLoading(false);
            }
        };
        loadQuestionBanks();
    }, []);

    // Get current selected bank, sub-bank, and questions
    const selectedBank = questionBanks.find(bank => bank.id === selectedBankId);
    const selectedSubBank = selectedBank?.subBanks?.find(bank => bank.id === selectedSubBankId);

    // Reset dependent selections when parent selection changes
    const handleBankChange = (bankId: number) => {
        setSelectedBankId(bankId);
        setSelectedSubBankId(null);
        setSelectedQuestionId(null);
        if (bankId) {
            loadBanksForCourse(bankId);
        }
    };

    const handleSubBankChange = (subBankId: number) => {
        setSelectedSubBankId(subBankId);
        setSelectedQuestionId(null);
        if (selectedBankId && subBankId) {
            loadQuestionsForBank(selectedBankId, subBankId);
        }
    };

    const handleQuestionChange = (questionId: number) => {
        setSelectedQuestionId(questionId);
        const question = availableQuestions.find(q => q.id === questionId);
        if (question) {
            // Set the question text
            setQuestion(question.question_text);
            
            // Find the correct answer and incorrect answers (distractors)
            const correctAnswerObj = question.answers?.find(a => a.is_correct);
            const distractors = question.answers?.filter(a => !a.is_correct) || [];
            
            if (correctAnswerObj) {
                setCorrectAnswer(correctAnswerObj.answer_text);
            } else {
                setCorrectAnswer('');
            }
            
            // Set existing distractors
            setExistingDistractors(distractors.map(d => ({
                answer_text: d.answer_text,
                is_correct: false,
                // Add default values for explanation and difficulty
                explanation: '',
                difficulty: 'medium'
            })));
        }
    };

    const handleGenerate = async () => {
        if (!selectedQuestionId || !correctAnswer) {
            setError('Please select a question and ensure there is a correct answer');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Create difficulty distribution from context settings
            const difficultyDistribution: Record<string, number> = {};
            contextSettings.forEach(setting => {
                const difficulty = setting.difficulty.toLowerCase();
                difficultyDistribution[difficulty] = (difficultyDistribution[difficulty] || 0) + setting.numQuestions;
            });
            
            // Get the selected question's text
            const selectedQuestion = availableQuestions.find(q => q.id === selectedQuestionId);
            if (!selectedQuestion) {
                throw new Error('Selected question not found');
            }
            
            const data = await generateDistractors(
                selectedQuestion.question_text,
                correctAnswer,
                difficultyDistribution
            );
            
            setGeneratedDistractors(data.distractors);
            setError(null);
        } catch (err) {
            console.error('Error generating distractors:', err);
            setError('Failed to generate distractors');
        } finally {
            setLoading(false);
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
                numQuestions: 1,
                level: '',
                difficulty: 'easy'
            }
        ]);
    };

    const handleAddDistractor = async (distractor: {
        answer_text: string;
        explanation: string;
        difficulty: string;
    }) => {
        if (!selectedQuestionId) {
            setError('No question selected');
            return;
        }
        
        setLoading(true);
        try {
            await addDistractorsToQuestion(
                selectedQuestionId,
                [{
                    answer_text: distractor.answer_text,
                    explanation: distractor.explanation || '',
                    difficulty: distractor.difficulty || 'medium'
                }]
            );
            
            // Add to existing distractors for immediate UI update
            setExistingDistractors(prev => [...prev, {
                ...distractor,
                is_correct: false
            }]);
            
            // Show success message
            setError('Distractor added successfully');
            setTimeout(() => setError(null), 2000);
            
            // Refresh question data to get updated distractors
            if (selectedBankId && selectedSubBankId) {
                loadQuestionsForBank(selectedBankId, selectedSubBankId);
            }
        } catch (err) {
            console.error('Error adding distractor:', err);
            setError('Failed to add distractor to question');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAdd = async () => {
        if (selectedDistractor && selectedQuestionId) {
            try {
                await addDistractorsToQuestion(
                    selectedQuestionId,
                    [{
                        answer_text: selectedDistractor.answer_text,
                        explanation: selectedDistractor.explanation || '',
                        difficulty: selectedDistractor.difficulty || 'medium'
                    }]
                );

                // Show success message or update UI
                console.log('Distractor added successfully');
                setIsConfirmDialogOpen(false);
                setSelectedDistractor(null);
                
                // Optionally refresh the question data
                // You might want to add a success message here
            } catch (err) {
                console.error('Error adding distractor:', err);
                setError('Failed to add distractor to question');
            }
        }
    };

    // Add a function to load question banks when a course is selected
    const loadBanksForCourse = async (courseId: number) => {
        try {
            setBankLoading(true);
            const data = await fetchQuestionBanks(courseId.toString());
            
            // Update the questionBanks array instead of selectedBank
            setQuestionBanks(prevBanks => {
                return prevBanks.map(bank => {
                    if (bank.id === courseId) {
                        return { ...bank, subBanks: data };
                    }
                    return bank;
                });
            });
        } catch (err) {
            setError('Failed to load question banks for this course');
        } finally {
            setBankLoading(false);
        }
    };

    // Add a function to load questions when a bank is selected
    const loadQuestionsForBank = async (courseId: number, bankId: number) => {
        try {
            setBankLoading(true);
            const data = await fetchBankQuestions(courseId.toString(), bankId.toString());
            setAvailableQuestions(data);
        } catch (err) {
            setError('Failed to load questions for this bank');
        } finally {
            setBankLoading(false);
        }
    };

    // Function to start editing a distractor
    const handleEditDistractor = (index: number) => {
        const distractor = existingDistractors[index];
        setEditDistractorText(distractor.answer_text);
        setEditingDistractorIndex(index);
    };

    // Function to save edited distractor
    const handleSaveDistractorEdit = async () => {
        if (editingDistractorIndex === null || !editDistractorText.trim() || !selectedQuestionId) {
            return;
        }
        
        setLoading(true);
        try {
            // Get the current distractor
            const currentDistractor = existingDistractors[editingDistractorIndex];
            
            // First, delete the old distractor by adding a new one with the updated text
            await addDistractorsToQuestion(
                selectedQuestionId,
                [{
                    answer_text: editDistractorText,
                    explanation: currentDistractor.explanation || '',
                    difficulty: currentDistractor.difficulty || 'medium'
                }]
            );
            
            // Update the local state
            const updatedDistractors = [...existingDistractors];
            updatedDistractors[editingDistractorIndex] = {
                ...updatedDistractors[editingDistractorIndex],
                answer_text: editDistractorText
            };
            setExistingDistractors(updatedDistractors);
            
            // Show success message
            setError('Distractor updated successfully');
            setTimeout(() => setError(null), 2000);
            
            // Refresh question data to get updated distractors
            if (selectedBankId && selectedSubBankId) {
                loadQuestionsForBank(selectedBankId, selectedSubBankId);
            }
        } catch (err) {
            console.error('Error updating distractor:', err);
            setError('Failed to update distractor');
        } finally {
            setLoading(false);
            setEditingDistractorIndex(null);
            setEditDistractorText('');
        }
    };

    // Function to cancel editing
    const handleCancelEdit = () => {
        setEditingDistractorIndex(null);
        setEditDistractorText('');
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

            {/* Place to Save Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Place to Save
                    </h3>
                </div>
                <div className="p-6.5">
                    <div className="grid grid-cols-3 gap-6">
                        {/* Subject (Bank) Selection */}
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Subject
                            </label>
                            <select
                                value={selectedBankId || ''}
                                onChange={(e) => handleBankChange(Number(e.target.value))}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            >
                                <option value="">Select Subject</option>
                                {questionBanks.map(bank => (
                                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Chapter (Sub-bank) Selection */}
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Chapter
                            </label>
                            <select
                                value={selectedSubBankId || ''}
                                onChange={(e) => handleSubBankChange(Number(e.target.value))}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                disabled={!selectedBankId}
                            >
                                <option value="">Select Chapter</option>
                                {selectedBank?.subBanks?.map(subBank => (
                                    <option key={subBank.id} value={subBank.id}>{subBank.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Question Selection */}
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Question
                            </label>
                            <select
                                value={selectedQuestionId || ''}
                                onChange={(e) => handleQuestionChange(Number(e.target.value))}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                disabled={!selectedSubBankId}
                            >
                                <option value="">Select Question</option>
                                {availableQuestions.map(question => (
                                    <option key={question.id} value={question.id}>{question.question_text}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {bankLoading && (
                        <div className="flex items-center justify-center py-4">
                            <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                </div>
            </div>

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
                    </div>

                    {/* Generated Distractors List */}
                    <div className="space-y-4">
                        {generatedDistractors.map((distractor, index) => (
                            <div key={index} className="p-4 border rounded-sm dark:border-strokedark">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-body dark:text-bodydark">{distractor.answer_text}</p>
                                        {distractor.explanation && (
                                            <p className="text-sm text-bodydark2 mt-2">
                                                <span className="font-medium">Explanation:</span> {distractor.explanation}
                                            </p>
                                        )}
                                        <p className="text-xs text-bodydark2 mt-1">
                                            <span className="font-medium">Difficulty:</span> {distractor.difficulty}
                                        </p>
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
                                    ''
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Existing Distractors Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-5">
                <div className="p-6.5">
                    <div className="mb-4">
                        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                            Current Question Distractors
                        </h2>
                    </div>

                    {selectedQuestionId && (
                        <div className="mb-5 p-4 bg-bodydark2 bg-opacity-10 rounded dark:bg-boxdark-2">
                            <h3 className="text-sm font-medium mb-1">Current Question:</h3>
                            <div 
                                className="text-black dark:text-white"
                                dangerouslySetInnerHTML={{ __html: question }}
                            />
                            
                            <div className="mt-2">
                                <h3 className="text-sm font-medium mb-1">Correct Answer:</h3>
                                <div className="text-success">
                                    {correctAnswer}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Existing Distractors List */}
                    <div className="space-y-4">
                        {existingDistractors.length > 0 ? (
                            existingDistractors.map((distractor, index) => (
                                <div key={index} className="p-4 border rounded-sm dark:border-strokedark bg-gray-50 dark:bg-boxdark-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            {editingDistractorIndex === index ? (
                                                <div className="mb-3">
                                                    <input
                                                        type="text"
                                                        value={editDistractorText}
                                                        onChange={(e) => setEditDistractorText(e.target.value)}
                                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                                    />
                                                    <div className="flex mt-2 space-x-2">
                                                        <button
                                                            onClick={handleSaveDistractorEdit}
                                                            className="text-success hover:underline"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="text-danger hover:underline"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-body dark:text-bodydark">{distractor.answer_text}</p>
                                            )}
                                            
                                            {distractor.explanation && (
                                                <p className="text-sm text-bodydark2 mt-2">
                                                    <span className="font-medium">Explanation:</span> {distractor.explanation}
                                                </p>
                                            )}
                                            {distractor.difficulty && (
                                                <p className="text-xs text-bodydark2 mt-1">
                                                    <span className="font-medium">Difficulty:</span> {distractor.difficulty}
                                                </p>
                                            )}
                                        </div>
                                        {editingDistractorIndex !== index && (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleEditDistractor(index)}
                                                    className="text-primary hover:text-opacity-80"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-body dark:text-bodydark">
                                No distractors for this question yet. Generate and add distractors above.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(false)}
                onConfirm={handleConfirmAdd}
                title="Add Distractor"
                message={`Are you sure you want to add "${selectedDistractor?.answer_text}" as a distractor to the selected question?`}
            />
        </div>
    );
};

export default GenerateDistractors; 