import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { Dialog } from '@headlessui/react';

interface Question {
    id: string;
    text: string;
    options: {
        id: string;
        text: string;
        isCorrect: boolean;
    }[];
    explanation?: string;
    taxonomyLevel?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    selected?: boolean;
}

interface Test {
    id: string;
    title: string;
    description?: string;
    questions: Question[];
}

interface QuestionBank {
    id: string;
    name: string;
    questions: Question[];
}

// Mock question bank data
const mockQuestionBank: QuestionBank = {
    id: '1',
    name: 'DSA Question Bank',
    questions: [
        {
            id: '3',
            text: 'What is the space complexity of a binary search tree?',
            options: [
                { id: 'A', text: 'O(1)', isCorrect: false },
                { id: 'B', text: 'O(n)', isCorrect: true },
                { id: 'C', text: 'O(log n)', isCorrect: false },
                { id: 'D', text: 'O(n²)', isCorrect: false }
            ],
            explanation: 'The space complexity of a binary search tree is O(n) where n is the number of nodes.',
            taxonomyLevel: 'remember',
            difficulty: 'easy'
        },
        {
            id: '4',
            text: 'Which sorting algorithm has the best average case time complexity?',
            options: [
                { id: 'A', text: 'Bubble Sort', isCorrect: false },
                { id: 'B', text: 'Quick Sort', isCorrect: true },
                { id: 'C', text: 'Insertion Sort', isCorrect: false },
                { id: 'D', text: 'Selection Sort', isCorrect: false }
            ],
            explanation: 'Quick Sort has an average time complexity of O(n log n) which is optimal for comparison-based sorting.',
            taxonomyLevel: 'understand',
            difficulty: 'medium'
        }
    ]
};

const mockTest: Test = {
    id: '1',
    title: 'DSA Midterm Exam',
    description: 'Midterm examination covering Data Structures and Algorithms',
    questions: [
        {
            id: '1',
            text: 'What is the time complexity of QuickSort in the average case?',
            options: [
                { id: 'A', text: 'O(n)', isCorrect: false },
                { id: 'B', text: 'O(n log n)', isCorrect: true },
                { id: 'C', text: 'O(n²)', isCorrect: false },
                { id: 'D', text: 'O(log n)', isCorrect: false }
            ],
            explanation: 'QuickSort has an average time complexity of O(n log n) due to its divide-and-conquer approach.',
            taxonomyLevel: 'understand',
            difficulty: 'medium',
            selected: true
        },
        {
            id: '2',
            text: 'What data structure would you use to implement a priority queue?',
            options: [
                { id: 'A', text: 'Array', isCorrect: false },
                { id: 'B', text: 'Linked List', isCorrect: false },
                { id: 'C', text: 'Heap', isCorrect: true },
                { id: 'D', text: 'Stack', isCorrect: false }
            ],
            explanation: 'A Heap is the most efficient data structure for implementing a priority queue.',
            taxonomyLevel: 'apply',
            difficulty: 'hard',
            selected: true
        }
    ]
};

const EditTest = () => {
    const { courseId, testId } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState<Test>(mockTest);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [answerFormat, setAnswerFormat] = useState({
        case: 'uppercase' as const,
        separator: ')',
    });
    const [availableQuestions, setAvailableQuestions] = useState<Question[]>(mockQuestionBank.questions);

    // Add new state variables for filtering and pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [showBloomsLevels, setShowBloomsLevels] = useState(false);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedBankId, setSelectedBankId] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

    // Add Bloom's levels array
    const bloomsLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

    // Add filtering effect
    useEffect(() => {
        const filtered = availableQuestions.filter(question => {
            const matchesSearch = question.text.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLevel = selectedLevels.length === 0 ||
                selectedLevels.includes(question.taxonomyLevel?.toLowerCase() || '');
            const matchesBank = !selectedBankId || question.id.startsWith(selectedBankId);
            return matchesSearch && matchesLevel && matchesBank;
        });
        setFilteredQuestions(filtered);
    }, [searchQuery, selectedLevels, selectedBankId, availableQuestions]);

    const toggleLevel = (level: string) => {
        setSelectedLevels(prev =>
            prev.includes(level)
                ? prev.filter(l => l !== level)
                : [...prev, level]
        );
    };

    const truncateText = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    useEffect(() => {
        const loadTest = async () => {
            setLoading(true);
            try {
                // In a real app, fetch the test data here
                setTest(mockTest);
                // Mark questions as selected if they're in the test
                const updatedAvailableQuestions = mockQuestionBank.questions.map(q => ({
                    ...q,
                    selected: test.questions.some(tq => tq.id === q.id)
                }));
                setAvailableQuestions(updatedAvailableQuestions);
            } catch (err) {
                setError('Failed to load test');
            } finally {
                setLoading(false);
            }
        };
        loadTest();
    }, [testId]);

    const handleSave = async () => {
        try {
            // In a real app, make an API call to save the test
            console.log('Saving test:', test);
            navigate(`/test-bank/${courseId}`);
        } catch (err) {
            setError('Failed to save test');
        }
    };

    const handleCancel = () => {
        navigate(`/test-bank/${courseId}`);
    };

    const handleQuestionClick = (question: Question) => {
        setSelectedQuestion(question);
        setIsQuestionDialogOpen(true);
    };

    const toggleQuestionSelection = (question: Question) => {
        if (question.selected) {
            // If question is being removed from selected list
            // 1. Remove from test questions
            setTest(prev => ({
                ...prev,
                questions: prev.questions.filter(q => q.id !== question.id)
            }));
            // 2. Add back to available questions if it's not already there
            setAvailableQuestions(prev => {
                const exists = prev.some(q => q.id === question.id);
                if (!exists) {
                    return [...prev, { ...question, selected: false }];
                }
                return prev.map(q =>
                    q.id === question.id ? { ...q, selected: false } : q
                );
            });
        } else {
            // If question is being added to selected list
            // 1. Add to test questions
            setTest(prev => ({
                ...prev,
                questions: [...prev.questions, { ...question, selected: true }]
            }));
            // 2. Mark as selected in available questions
            setAvailableQuestions(prev =>
                prev.map(q =>
                    q.id === question.id ? { ...q, selected: true } : q
                )
            );
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;

    return (
        <div className="mx-auto max-w-270">
            <Breadcrumb
                pageName="Edit Test"
                currentName={test.title}
                breadcrumbItems={[
                    { name: "Home Page", path: "/" },
                    { name: "Test Bank", path: "/test-bank" },
                    { name: "Edit Test", path: "#" }
                ]}
            />

            {/* Test Details Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Test Details
                    </h3>
                </div>
                <div className="p-6.5">
                    <div className="mb-4.5">
                        <input
                            type="text"
                            placeholder="Enter test title"
                            value={test.title}
                            onChange={(e) => setTest(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                    </div>
                    <div className="mb-4.5">
                        <textarea
                            placeholder="Enter test description"
                            value={test.description || ''}
                            onChange={(e) => setTest(prev => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Questions Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium text-black dark:text-white flex items-center gap-1">
                            Questions
                            <span className="text-danger text-lg">*</span>
                        </h3>
                    </div>
                </div>

                <div className="p-6.5">
                    {/* Available Questions */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium text-black dark:text-white">
                                Available Questions
                            </h4>
                            <div className="flex gap-4 items-center">
                                <input
                                    type="text"
                                    placeholder="Search questions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="rounded-md border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                />
                                <div className="relative">
                                    <button
                                        onClick={() => setShowBloomsLevels(!showBloomsLevels)}
                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2 px-6 text-white hover:bg-opacity-90"
                                    >
                                        <span>Bloom's Levels</span>
                                        <svg
                                            className={`w-4 h-4 transform transition-transform duration-200 ${showBloomsLevels ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>

                                    {showBloomsLevels && (
                                        <div className="absolute top-full right-0 mt-2 w-80 bg-[#C0C0C0] dark:bg-boxdark rounded-sm shadow-lg z-50 p-4">
                                            <div className="flex flex-wrap gap-2">
                                                {bloomsLevels.map(level => (
                                                    <button
                                                        key={level}
                                                        onClick={() => toggleLevel(level)}
                                                        className={`px-3 py-1 rounded-full text-sm ${selectedLevels.includes(level)
                                                            ? 'bg-primary text-white'
                                                            : 'bg-white dark:bg-meta-4 hover:bg-gray-100 dark:hover:bg-meta-3'
                                                            }`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Column Headers */}
                            <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-meta-4 rounded-sm">
                                <div className="flex-1">
                                    <span className="font-medium text-black dark:text-white">Question</span>
                                </div>
                                <div className="flex items-center gap-8">
                                    <span className="font-medium text-black dark:text-white w-24 text-center">Difficulty</span>
                                    <span className="font-medium text-black dark:text-white w-24 text-center">Taxonomy</span>
                                    <span className="w-12"></span>
                                </div>
                            </div>

                            {/* Available Questions List */}
                            {filteredQuestions
                                .filter(q => !test.questions.some(tq => tq.id === q.id))
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map((question, index) => (
                                    <div
                                        key={question.id}
                                        className="p-4 border rounded-sm dark:border-strokedark"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <span className="text-gray-500 mr-2">{index + 1}.</span>
                                                <span
                                                    className="cursor-pointer hover:text-primary inline"
                                                    onClick={() => handleQuestionClick(question)}
                                                >
                                                    {truncateText(question.text)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <span className={`text-xs px-2 py-1 rounded w-24 text-center ${question.difficulty === 'easy' ? 'bg-success/10 text-success' :
                                                    question.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                                                        'bg-danger/10 text-danger'
                                                    }`}>
                                                    {question.difficulty}
                                                </span>
                                                <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary w-24 text-center">
                                                    {question.taxonomyLevel}
                                                </span>
                                                <button
                                                    onClick={() => toggleQuestionSelection(question)}
                                                    className="text-success hover:text-meta-3 w-12"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Selected Questions */}
                    <div>
                        <h4 className="text-lg font-medium text-black dark:text-white mb-4">
                            Selected Questions ({test.questions.length})
                        </h4>
                        <div className="space-y-4">
                            {/* Column Headers */}
                            <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-meta-4 rounded-sm">
                                <div className="flex-1">
                                    <span className="font-medium text-black dark:text-white">Question</span>
                                </div>
                                <div className="flex items-center gap-8">
                                    <span className="font-medium text-black dark:text-white w-24 text-center">Difficulty</span>
                                    <span className="font-medium text-black dark:text-white w-24 text-center">Taxonomy</span>
                                    <span className="w-12"></span>
                                </div>
                            </div>

                            {/* Selected Questions List */}
                            {test.questions.map((question, index) => (
                                <div
                                    key={question.id}
                                    className="p-4 border border-primary bg-primary/5 rounded-sm"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <span className="text-gray-500 mr-2">{index + 1}.</span>
                                            <span
                                                className="cursor-pointer hover:text-primary inline"
                                                onClick={() => handleQuestionClick(question)}
                                            >
                                                {truncateText(question.text)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <span className={`text-xs px-2 py-1 rounded w-24 text-center ${question.difficulty === 'easy' ? 'bg-success/10 text-success' :
                                                question.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                                                    'bg-danger/10 text-danger'
                                                }`}>
                                                {question.difficulty}
                                            </span>
                                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary w-24 text-center">
                                                {question.taxonomyLevel}
                                            </span>
                                            <button
                                                onClick={() => toggleQuestionSelection(question)}
                                                className="text-danger hover:text-meta-1 w-12"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Summary
                    </h3>
                </div>
                <div className="p-6.5">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Distribution Table */}
                        <div className="bg-gray-50 dark:bg-meta-4 p-4 rounded-sm overflow-x-auto">
                            <h5 className="font-medium text-black dark:text-white mb-3">
                                Question Distribution
                            </h5>
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-2 dark:bg-meta-4">
                                        <th className="py-4 px-4 font-medium text-black dark:text-white border-b border-[#eee] dark:border-strokedark">
                                            Taxonomy Level
                                        </th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white border-b border-[#eee] dark:border-strokedark">
                                            Easy
                                        </th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white border-b border-[#eee] dark:border-strokedark">
                                            Medium
                                        </th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white border-b border-[#eee] dark:border-strokedark">
                                            Hard
                                        </th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white border-b border-[#eee] dark:border-strokedark">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(taxonomy => {
                                        const questions = test.questions.filter(q =>
                                            q.taxonomyLevel?.toLowerCase() === taxonomy.toLowerCase()
                                        );
                                        const easy = questions.filter(q => q.difficulty === 'easy').length;
                                        const medium = questions.filter(q => q.difficulty === 'medium').length;
                                        const hard = questions.filter(q => q.difficulty === 'hard').length;
                                        const total = easy + medium + hard;

                                        return (
                                            <tr key={taxonomy}>
                                                <td className="py-3 px-4 border-b border-[#eee] dark:border-strokedark">
                                                    {taxonomy}
                                                </td>
                                                <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                    {easy}
                                                </td>
                                                <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                    {medium}
                                                </td>
                                                <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                    {hard}
                                                </td>
                                                <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark font-medium">
                                                    {total}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Total Row */}
                                    <tr className="bg-gray-2 dark:bg-meta-4">
                                        <td className="py-3 px-4 font-medium">Total</td>
                                        <td className="py-3 px-4 text-center font-medium">
                                            {test.questions.filter(q => q.difficulty === 'easy').length}
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium">
                                            {test.questions.filter(q => q.difficulty === 'medium').length}
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium">
                                            {test.questions.filter(q => q.difficulty === 'hard').length}
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium">
                                            {test.questions.length}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={handleCancel}
                    className="flex flex-1 justify-center rounded bg-danger py-4 px-10 font-medium text-white hover:bg-opacity-90"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="flex flex-1 justify-center rounded bg-primary py-4 px-10 font-medium text-white hover:bg-opacity-90"
                >
                    Save Changes
                </button>
            </div>

            {/* Question Edit Dialog */}
            <Dialog
                open={isQuestionDialogOpen}
                onClose={() => setIsQuestionDialogOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-3xl rounded-lg bg-white dark:bg-boxdark p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-black dark:text-white">
                                Edit Question
                            </h2>
                            <button
                                onClick={() => setIsQuestionDialogOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {selectedQuestion && (
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Question Text
                                    </label>
                                    <textarea
                                        value={selectedQuestion.text}
                                        onChange={(e) => setSelectedQuestion({
                                            ...selectedQuestion,
                                            text: e.target.value
                                        })}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                        rows={4}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Options
                                    </label>
                                    <div className="space-y-2">
                                        {selectedQuestion.options.map((option, index) => (
                                            <div key={option.id} className="flex items-center gap-4">
                                                <input
                                                    type="radio"
                                                    checked={option.isCorrect}
                                                    onChange={() => {
                                                        const newOptions = selectedQuestion.options.map((opt, i) => ({
                                                            ...opt,
                                                            isCorrect: i === index
                                                        }));
                                                        setSelectedQuestion({
                                                            ...selectedQuestion,
                                                            options: newOptions
                                                        });
                                                    }}
                                                    className="form-radio"
                                                />
                                                <input
                                                    type="text"
                                                    value={option.text}
                                                    onChange={(e) => {
                                                        const newOptions = [...selectedQuestion.options];
                                                        newOptions[index] = {
                                                            ...newOptions[index],
                                                            text: e.target.value
                                                        };
                                                        setSelectedQuestion({
                                                            ...selectedQuestion,
                                                            options: newOptions
                                                        });
                                                    }}
                                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Explanation
                                    </label>
                                    <textarea
                                        value={selectedQuestion.explanation || ''}
                                        onChange={(e) => setSelectedQuestion({
                                            ...selectedQuestion,
                                            explanation: e.target.value
                                        })}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="mb-2.5 block text-black dark:text-white">
                                            Taxonomy Level
                                        </label>
                                        <select
                                            value={selectedQuestion.taxonomyLevel}
                                            onChange={(e) => setSelectedQuestion({
                                                ...selectedQuestion,
                                                taxonomyLevel: e.target.value
                                            })}
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                        >
                                            {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(level => (
                                                <option key={level} value={level.toLowerCase()}>
                                                    {level}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex-1">
                                        <label className="mb-2.5 block text-black dark:text-white">
                                            Difficulty
                                        </label>
                                        <select
                                            value={selectedQuestion.difficulty}
                                            onChange={(e) => setSelectedQuestion({
                                                ...selectedQuestion,
                                                difficulty: e.target.value as 'easy' | 'medium' | 'hard'
                                            })}
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 mt-6">
                                    <button
                                        onClick={() => setIsQuestionDialogOpen(false)}
                                        className="rounded bg-danger px-6 py-2 text-white hover:bg-opacity-90"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTest(prev => ({
                                                ...prev,
                                                questions: prev.questions.map(q =>
                                                    q.id === selectedQuestion.id ? selectedQuestion : q
                                                )
                                            }));
                                            setIsQuestionDialogOpen(false);
                                        }}
                                        className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

export default EditTest; 