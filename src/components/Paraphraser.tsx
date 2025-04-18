import React, { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

interface ParaphraserProps {
    questionText: string;
}

const Paraphraser: React.FC<ParaphraserProps> = ({ questionText }) => {
    // Remove <p> tags from the initial question text
    const cleanQuestionText = questionText.replace(/<\/?p>/g, '');

    const [selectedMode, setSelectedMode] = useState('Standard');
    const [synonymValue, setSynonymValue] = useState(50);
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(cleanQuestionText);
    const [showParaphrasedText, setShowParaphrasedText] = useState(false);
    const [paraphrasedText, setParaphrasedText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const modes = ['Standard', 'Academic', 'Simple'];

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        setSynonymValue(newValue as number);
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

    const handleParaphrase = () => {
        const cleanText = text.replace(/<\/?p>/g, '');
        setParaphrasedText(cleanText);
        setShowParaphrasedText(true);
    };

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <h3 className="text-2xl font-semibold text-black dark:text-white">
                    Paraphrase
                </h3>
            </div>
            {/* Paraphraser Section */}
            <div className="p-6.5">
                <div className="space-y-4">
                    {/* Top section with modes and slider */}
                    <div className="flex justify-between items-center">
                        {/* Mode selection buttons */}
                        <div className="flex gap-2">
                            {modes.map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setSelectedMode(mode)}
                                    className={`px-6 py-2 rounded-full transition-all duration-300 font-medium
                                        ${selectedMode === mode
                                            ? 'bg-primary text-white shadow-lg shadow-primary/50 scale-105'
                                            : 'text-gray-500 hover:text-primary hover:bg-primary/10 hover:scale-105'
                                        }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        {/* Synonyms slider */}
                        <div className="flex items-center gap-4 w-72">
                            <span className="text-black dark:text-white whitespace-nowrap font-medium">Synonyms:</span>
                            <Box sx={{ flex: 1 }}>
                                <Slider
                                    value={synonymValue}
                                    onChange={handleSliderChange}
                                    aria-label="Synonyms"
                                    size="small"
                                    min={0}
                                    max={100}
                                    sx={{
                                        color: '#3b82f6',
                                        padding: '5px 0',
                                        '& .MuiSlider-thumb': {
                                            width: 12,
                                            height: 12,
                                            backgroundColor: '#fff',
                                            border: '2px solid currentColor',
                                            '&:hover, &.Mui-focusVisible': {
                                                boxShadow: 'none',
                                            },
                                            '&:before': {
                                                display: 'none',
                                            },
                                        },
                                        '& .MuiSlider-track': {
                                            height: 4,
                                            border: 'none',
                                        },
                                        '& .MuiSlider-rail': {
                                            height: 4,
                                            opacity: 0.2,
                                            backgroundColor: 'currentColor',
                                        },
                                        '& .MuiSlider-mark': {
                                            display: 'none',
                                        },
                                    }}
                                />
                            </Box>
                            <div
                                className="text-black dark:text-white whitespace-nowrap font-medium min-w-[3.5rem] text-right cursor-pointer"
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
                                        className="w-12 bg-transparent border-b border-primary outline-none text-right"
                                        min="0"
                                        max="100"
                                    />
                                ) : (
                                    `${synonymValue}%`
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Text input area */}
                    <textarea
                        rows={4}
                        value={text}
                        onChange={handleTextChange}
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />

                    {/* Paraphrased text area */}
                    {showParaphrasedText && (
                        <div className="space-y-2">
                            <label className="block font-medium text-black dark:text-white">
                                Paraphrased Text:
                            </label>
                            <textarea
                                rows={4}
                                value={paraphrasedText}
                                readOnly
                                className="w-full rounded-lg border-[1.5px] border-primary/20 bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            />
                        </div>
                    )}

                    {/* Paraphrase button */}
                    <button
                        onClick={handleParaphrase}
                        className="flex w-full justify-center rounded bg-primary p-3 font-medium text-white hover:bg-primary/90 transition-colors"
                    >
                        Paraphrase
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Paraphraser; 