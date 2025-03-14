import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';

interface QuestionBank {
    id: number;
    name: string;
    questions: any[];
}

interface TestCombination {
    numberOfQuestions: number;
    taxonomyLevel: string;
    difficulty: string;
    learningOutcome: string;
}

interface TestData {
    title: string;
    description: string;
    combinations: TestCombination[];
    topics?: string[];
}

interface Chapter {
    id: number;
    name: string;
}

const CreateTestAuto: React.FC = () => {
    const [testData, setTestData] = useState<TestData>({
        title: '',
        description: '',
        combinations: [{
            numberOfQuestions: 1,
            taxonomyLevel: 'remember',
            difficulty: 'easy',
            learningOutcome: 'lo1'
        }],
        topics: []
    });

    const [courses, setCourses] = useState<Array<{ id: string, name: string }>>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [isTestDetailsExpanded, setIsTestDetailsExpanded] = useState(true);
    const [showTopics, setShowTopics] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<Array<{ id: string, name: string }>>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<string>('');

    const topics = [
        'PPL', 'DSA', 'Discrete Math', 'Dynamic Programming', 'Math'
    ];

    // Mock data for subjects and chapters
    const mockSubjects = [
        { id: "1", name: "Mathematics" },
        { id: "2", name: "Physics" },
        { id: "3", name: "Computer Science" },
        { id: "4", name: "Chemistry" }
    ];

    const mockChaptersMap: Record<string, Chapter[]> = {
        "1": [ // Mathematics chapters
            { id: 1, name: "Algebra" },
            { id: 2, name: "Calculus" },
            { id: 3, name: "Geometry" },
            { id: 4, name: "Statistics" }
        ],
        "2": [ // Physics chapters
            { id: 5, name: "Mechanics" },
            { id: 6, name: "Thermodynamics" },
            { id: 7, name: "Electromagnetism" }
        ],
        "3": [ // Computer Science chapters
            { id: 8, name: "Programming Basics" },
            { id: 9, name: "Data Structures & Algorithms" },
            { id: 10, name: "PPL" }
        ],
        "4": [ // Chemistry chapters
            { id: 11, name: "Organic Chemistry" },
            { id: 12, name: "Inorganic Chemistry" },
            { id: 13, name: "Physical Chemistry" }
        ]
    };

    const toggleTopic = (topic: string) => {
        setTestData(prev => ({
            ...prev,
            topics: prev.topics?.includes(topic)
                ? prev.topics.filter(t => t !== topic)
                : [...(prev.topics || []), topic]
        }));
    };

    const handleDescriptionChange = (content: string) => {
        setTestData(prev => ({
            ...prev,
            description: content
        }));
    };

    const addNewCombination = () => {
        setTestData(prev => ({
            ...prev,
            combinations: [...prev.combinations, {
                numberOfQuestions: 1,
                taxonomyLevel: 'remember',
                difficulty: 'easy',
                learningOutcome: 'lo1'
            }]
        }));
    };

    const removeCombination = (index: number) => {
        if (testData.combinations.length > 1) {
            setTestData(prev => ({
                ...prev,
                combinations: prev.combinations.filter((_, i) => i !== index)
            }));
        }
    };

    const updateCombination = (index: number, field: keyof TestCombination, value: string | number) => {
        setTestData(prev => ({
            ...prev,
            combinations: prev.combinations.map((comb, i) =>
                i === index ? { ...comb, [field]: value } : comb
            )
        }));
    };

    const handleSubmit = async () => {
        try {
            // Add your submission logic here
            console.log('Submitting test data:', testData);
        } catch (error) {
            console.error('Error submitting test:', error);
        }
    };

    // Fetch courses on component mount
    useEffect(() => {
        const loadCourses = async () => {
            try {
                const mockCoursesData = [
                    { id: "1", name: "Introduction to Programming" },
                    { id: "2", name: "Data Structures and Algorithms" },
                    { id: "3", name: "Web Development" },
                    { id: "4", name: "Machine Learning" },
                    { id: "5", name: "Database Systems" }
                ];
                setCourses(mockCoursesData);
            } catch (err) {
                setError('Failed to load courses');
            }
        };
        loadCourses();
    }, []);

    // Set initial subjects when component mounts
    useEffect(() => {
        setSubjects(mockSubjects);
    }, []);

    // Modified handleSubjectChange to use mock data
    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubject(subjectId);
        setSelectedChapter(''); // Reset chapter selection when subject changes

        if (subjectId) {
            setChapters(mockChaptersMap[subjectId] || []);
        } else {
            setChapters([]);
        }
    };

    // Check if form is valid (both subject and chapter are selected)
    const isFormValid = selectedSubject && selectedChapter;

    return (
        <div className="mx-auto max-w-270">
            <Breadcrumb
                pageName="Create Test Automatically"
                currentName="Create Test"
                breadcrumbItems={[
                    { name: "Home Page", path: "/" },
                    { name: "Create Test", path: "/create-test" }
                ]}
            />

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                <div
                    className="border-b border-stroke px-6.5 py-4 dark:border-strokedark cursor-pointer flex justify-between items-center"
                    onClick={() => setIsTestDetailsExpanded(!isTestDetailsExpanded)}
                >
                    <h3 className="font-medium text-black dark:text-white">
                        Test Details
                    </h3>
                    <svg
                        className={`w-4 h-4 transform transition-transform duration-200 ${isTestDetailsExpanded ? 'rotate-180' : ''
                            }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
                {isTestDetailsExpanded && (
                    <div className="p-6.5">
                        <div className="mb-4.5">
                            <input
                                type="text"
                                placeholder="Enter test title"
                                value={testData.title}
                                onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            {/* <Editor
                                apiKey="rk63se2fx3gtxdcb6a6556yapoajd3drfp10hjc5u7km8vid"
                                init={{
                                    height: 250,
                                    menubar: false,
                                    plugins: [
                                        'advlist', 'autolink', 'lists', 'link', 'image',
                                        'charmap', 'preview', 'anchor', 'searchreplace',
                                        'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                                        'media', 'table', 'code', 'help', 'wordcount', 'equation',
                                        'placeholder'
                                    ],
                                    toolbar: 'undo redo | formatselect | ' +
                                        'bold italic forecolor | alignleft aligncenter ' +
                                        'alignright alignjustify | bullist numlist outdent indent | ' +
                                        'removeformat | equation | help',
                                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                                    placeholder: 'Enter test description...',
                                    setup: (editor) => {
                                        editor.on('init', () => {
                                            const editorElement = editor.getContainer();
                                            if (editorElement) {
                                                const iframe = editorElement.querySelector('iframe');
                                                if (iframe) {
                                                    const iframeDocument = iframe.contentDocument;
                                                    if (iframeDocument) {
                                                        const body = iframeDocument.body;
                                                        if (!body.textContent?.trim()) {
                                                            body.setAttribute('data-mce-placeholder', 'Enter test description...');
                                                        }
                                                    }
                                                }
                                            }
                                        });
                                    }
                                }}
                                value={testData.description}
                                onEditorChange={handleDescriptionChange}
                            /> */}
                        </div>
                    </div>
                )}
            </div>

            {/* Test Details Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Test Prompt
                    </h3>
                </div>
                <div className="p-6.5">


                    {/* Parameters Row */}
                    {testData.combinations.map((combination, index) => (
                        <div key={index} className="mb-6 relative">
                            <div className="grid grid-cols-4 gap-4 mb-4.5">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Number of Questions
                                    </label>
                                    <input
                                        type="number"
                                        value={combination.numberOfQuestions}
                                        onChange={(e) => updateCombination(index, 'numberOfQuestions', Number(e.target.value))}
                                        min="1"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Taxonomy Level
                                    </label>
                                    <select
                                        value={combination.taxonomyLevel}
                                        onChange={(e) => updateCombination(index, 'taxonomyLevel', e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                    >
                                        <option value="">Select Level</option>
                                        <option value="remember">Remember</option>
                                        <option value="understand">Understand</option>
                                        <option value="apply">Apply</option>
                                        <option value="analyze">Analyze</option>
                                        <option value="evaluate">Evaluate</option>
                                        <option value="create">Create</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Difficulty
                                    </label>
                                    <select
                                        value={combination.difficulty}
                                        onChange={(e) => updateCombination(index, 'difficulty', e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                    >
                                        <option value="">Select Difficulty</option>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Learning Outcome
                                    </label>
                                    <select
                                        value={combination.learningOutcome}
                                        onChange={(e) => updateCombination(index, 'learningOutcome', e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                    >
                                        <option value="lo1">LO1</option>
                                        <option value="lo2">LO2</option>
                                        <option value="lo3">LO3</option>
                                        <option value="lo4">LO4</option>
                                    </select>
                                </div>
                            </div>

                            {testData.combinations.length > 1 && (
                                <button
                                    onClick={() => removeCombination(index)}
                                    className="absolute right-0 top-0 p-2 text-danger hover:text-danger/80"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={addNewCombination}
                        className="text-primary hover:text-primary/80 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add another combination
                    </button>

                    {/* Course and Test Bank Selection */}
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">
                                Select Subject
                            </label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => handleSubjectChange(e.target.value)}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            >
                                <option value="">Select a subject</option>
                                {mockSubjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedSubject && (
                            <div>
                                <label className="mb-2.5 block text-black dark:text-white">
                                    Select Chapter
                                </label>
                                <select
                                    value={selectedChapter}
                                    onChange={(e) => setSelectedChapter(e.target.value)}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                >
                                    <option value="">Select a chapter</option>
                                    {chapters.map(chapter => (
                                        <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Update the Save button to be disabled when form is invalid */}
            <div className="mt-6">
                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className={`flex w-full justify-center rounded p-3 font-medium text-gray ${isFormValid
                        ? 'bg-primary hover:bg-opacity-90'
                        : 'bg-gray-400 cursor-not-allowed'
                        }`}
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default CreateTestAuto; 