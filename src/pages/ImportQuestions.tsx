import { useState, useRef } from 'react';

const ImportQuestions = () => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        // Handle file upload logic here
        console.log('Files dropped:', files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            // Handle file upload logic here
            console.log('Files selected:', files);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-black dark:text-white">Import Questions</h1>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-[3px] border-dashed rounded-lg p-12 text-center transition-all duration-200
                    ${isDragging
                        ? 'border-primary/70 bg-primary/5 scale-[1.02]'
                        : 'border-gray-300/90 dark:border-gray-600/90 hover:border-primary/60 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
            >
                <div className="flex flex-col items-center space-y-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.2}
                        stroke="currentColor"
                        className="w-16 h-16 text-primary/70 transition-transform group-hover:scale-110"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>

                    <div className="space-y-2">
                        <p className="text-xl font-medium text-gray-700 dark:text-gray-300">
                            Drag and drop your file here, or{' '}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-primary/80 hover:text-primary transition-colors font-semibold hover:underline"
                            >
                                browse
                            </button>
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                        />
                        <p className="text-sm text-gray-500/80 dark:text-gray-400/80">
                            Supports: .xlsx, .xls, .csv
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportQuestions; 