import React, { useState, useRef, useEffect } from 'react';
import { getValidToken } from '../services/api'; // Import the token function

interface ParaphraserProps {
    questionText: string;
    onParaphraseComplete?: (paraphrasedText: string) => void;
    onCreateNewQuestion?: (paraphrasedText: string) => void;
}

const Paraphraser: React.FC<ParaphraserProps> = ({ 
    questionText, 
    onParaphraseComplete,
    onCreateNewQuestion 
}) => {
    // Remove <p> tags from the initial question text
    const cleanQuestionText = questionText.replace(/<\/?p>/g, '');

    const [selectedMode, setSelectedMode] = useState('Standard');
    const [synonymValue, setSynonymValue] = useState(50);
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(cleanQuestionText);
    const [showParaphrasedText, setShowParaphrasedText] = useState(false);
    const [paraphrasedText, setParaphrasedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update text when questionText prop changes
    useEffect(() => {
        const cleanText = questionText.replace(/<\/?p>/g, '');
        setText(cleanText);
    }, [questionText]);

    const modes = ['Standard', 'Academic', 'Simple'];

    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSynonymValue(parseInt(event.target.value));
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseInt(event.target.value);
        if (isNaN(value)) value = 0;
        if (value < 0) value = 0;
        if (value > 100) value = 100;
        setSynonymValue(value);
    };

    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(event.target.value);
        setShowParaphrasedText(false);
    };

    const handleParaphrasedTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setParaphrasedText(event.target.value);
    };

    const handleInputBlur = () => {
        setIsEditing(false);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            setIsEditing(false);
        }
    };

    const handlePercentageDoubleClick = () => {
        setIsEditing(true);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, 0);
    };

    const handleParaphrase = async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            const cleanText = text.replace(/<\/?p>/g, '');
            
            // Format the text to include answer options if they exist
            let formattedText = cleanText;
            
            // Get a valid token
            const token = await getValidToken();
            
            const response = await fetch('https://kong-2cabd4da88injmaw8.kongcloud.dev/t5/api/paraphrase/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Add the Bearer token
                },
                body: JSON.stringify({
                    mcq: formattedText
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            setParaphrasedText(data.paraphrased);
            setShowParaphrasedText(true);
            setSuccessMessage(`Paraphrasing completed in ${data.processing_time || 'a few seconds'}`);
        } catch (err) {
            console.error('Paraphrasing error:', err);
            setError(err instanceof Error ? err.message : 'Failed to paraphrase text');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateAndSave = async () => {
        if (onParaphraseComplete && paraphrasedText) {
            setSuccessMessage(null);
            setError(null);
            try {
                onParaphraseComplete(paraphrasedText);
                setSuccessMessage("Question updated successfully!");
            } catch (err) {
                setError("Failed to update question");
                console.error('Update error:', err);
            }
        }
    };

    const handleCreateNewQuestion = async () => {
        if (onCreateNewQuestion && paraphrasedText) {
            setSuccessMessage(null);
            setError(null);
            try {
                onCreateNewQuestion(paraphrasedText);
                setSuccessMessage("New question created successfully!");
            } catch (err) {
                setError("Failed to create new question");
                console.error('Create error:', err);
            }
        }
    };

    return (
        <div className="mb-6 rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">Paraphraser</h3>
            
            <div className="mb-4">
                <div className="flex flex-wrap gap-3 mb-4">
                    {modes.map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setSelectedMode(mode)}
                            className={`rounded-md px-4 py-2 text-sm font-medium ${
                                selectedMode === mode
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
                
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Synonym Slider
                        </label>
                        <div
                            className="flex items-center justify-center w-12 h-6 bg-gray-100 dark:bg-gray-700 rounded-md cursor-pointer"
                            onDoubleClick={handlePercentageDoubleClick}
                        >
                            {isEditing ? (
                                <input
                                    ref={inputRef}
                                    type="number"
                                    value={synonymValue}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    onKeyDown={handleInputKeyDown}
                                    className="w-12 h-6 bg-gray-100 dark:bg-gray-700 text-center text-sm outline-none"
                                />
                            ) : (
                                <span className="text-sm font-medium">{synonymValue}%</span>
                            )}
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={synonymValue}
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>
                
                <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Original Text
                    </label>
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        rows={4}
                    ></textarea>
                </div>
                
                <button
                    onClick={handleParaphrase}
                    disabled={isLoading || !text.trim()}
                    className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Paraphrasing...
                        </>
                    ) : (
                        'Paraphrase'
                    )}
                </button>
            </div>
            
            {error && (
                <div className="mb-4 p-3 bg-danger/10 text-danger rounded-md">
                    {error}
                </div>
            )}
            
            {successMessage && (
                <div className="mb-4 p-3 bg-success/10 text-success rounded-md">
                    {successMessage}
                </div>
            )}
            
            {showParaphrasedText && (
                <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Paraphrased Text
                    </label>
                    <textarea
                        value={paraphrasedText}
                        onChange={handleParaphrasedTextChange}
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        rows={4}
                    ></textarea>
                    <div className="mt-3 flex justify-end gap-3">
                        <button
                            onClick={handleUpdateAndSave}
                            className="inline-flex items-center justify-center rounded-md bg-success py-2 px-6 text-center font-medium text-white hover:bg-opacity-90"
                        >
                            Update and Save
                        </button>
                        {onCreateNewQuestion && (
                            <button
                                onClick={handleCreateNewQuestion}
                                className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90"
                            >
                                Create New Question
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Paraphraser; 