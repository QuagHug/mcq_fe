import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { Dialog } from '@headlessui/react';
import { updateTest, fetchTestDetail, fetchQuestions, fetchQuestionBanks } from '../services/api';
import TestConfiguration from '../components/TestConfiguration';
import QuestionDisplay from '../components/QuestionDisplay';
import QuestionDistribution from '../components/QuestionDistribution';

interface Question {
    id: string | number;
    question_text: string;
    answers: {
        id: string;
        answer_text: string;
        is_correct: boolean;
        explanation?: string;
    }[];
    taxonomyLevel?: string;
    taxonomies?: { 
        id?: number;
        taxonomy: { 
            id?: number;
            name: string;
            levels?: string[];
        }; 
        level: string;
    }[];
    difficulty?: 'easy' | 'medium' | 'hard';
    explanation?: string;
}

interface Test {
    id: string;
    title: string;
    description?: string;
    configuration: {
        letterCase: 'uppercase' | 'lowercase';
        separator: string;
        includeAnswerKey: boolean;
    };
    questions: {
        id: number;
        question: number;
        question_data: Question;
    }[];
}

interface QuestionBank {
    id: string;
    name: string;
    questions: Question[];
}

interface TagProps {
    value: string;
    type: 'difficulty' | 'taxonomy';
}

const Tag = ({ value, type }: TagProps) => {
    const getColor = () => {
        if (type === 'difficulty') {
            switch (value.toLowerCase()) {
                case 'easy':
                    return 'bg-[#E7F6EC] text-[#1B9C85] border border-[#1B9C85]';
                case 'medium':
                    return 'bg-[#FFF4E5] text-[#FF9F29] border border-[#FF9F29]';
                case 'hard':
                    return 'bg-[#FFE7E7] text-[#FF0060] border border-[#FF0060]';
                default:
                    return 'bg-gray-100 text-gray-600 border border-gray-400';
            }
        } else {
            switch (value.toLowerCase()) {
                case 'remember':
                    return 'bg-[#E5F3FF] text-[#0079FF] border border-[#0079FF]';
                case 'understand':
                    return 'bg-[#E5F6FF] text-[#00A9FF] border border-[#00A9FF]';
                case 'apply':
                    return 'bg-[#E7F6EC] text-[#1B9C85] border border-[#1B9C85]';
                case 'analyze':
                    return 'bg-[#FFF4E5] text-[#FF9F29] border border-[#FF9F29]';
                case 'evaluate':
                    return 'bg-[#FFE7E7] text-[#FF0060] border border-[#FF0060]';
                case 'create':
                    return 'bg-[#F3E5FF] text-[#9C1AFF] border border-[#9C1AFF]';
                default:
                    return 'bg-gray-100 text-gray-600 border border-gray-400';
            }
        }
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()}`}>
            {value}
        </span>
    );
};

const EditTest = () => {
    const { courseId, testId } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState<Test | null>(null);
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
    const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);

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

    // Add state for question banks
    const [questionBanks, setQuestionBanks] = useState<Array<{ id: string }>>([]);

    // Add filtering effect
    useEffect(() => {
        const filtered = availableQuestions.filter(question => {
            const matchesSearch = question.question_text.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Check both taxonomyLevel and taxonomies
            const taxonomyLevel = question.taxonomyLevel || 
                question.taxonomies?.find(tax => 
                    tax.taxonomy.name === "Bloom's Taxonomy"
                )?.level || '';
            
            const matchesLevel = selectedLevels.length === 0 ||
                selectedLevels.includes(taxonomyLevel.toLowerCase());
            
            const matchesBank = !selectedBankId || question.id.toString().startsWith(selectedBankId);
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

    // Load test data
    useEffect(() => {
        const loadTest = async () => {
            if (!courseId || !testId) return;

            setLoading(true);
            try {
                const testData = await fetchTestDetail(courseId, testId);
                setTest({
                    ...testData,
                    questions: testData.questions.map((q: any) => ({
                        id: q.question,
                        question: q.question,
                        question_data: q.question_data
                    }))
                });
            } catch (err) {
                setError('Failed to load test');
            } finally {
                setLoading(false);
            }
        };
        loadTest();
    }, [courseId, testId]);

    // Update the loadQuestions function
    useEffect(() => {
        const loadQuestions = async () => {
            if (!courseId) return;

            try {
                // First fetch question banks
                const banks = await fetchQuestionBanks(courseId);
                setQuestionBanks(banks);

                // Then fetch questions from all banks
                const allQuestions = [];
                for (const bank of banks) {
                    const bankQuestions = await fetchQuestions(courseId, bank.id);
                    allQuestions.push(...bankQuestions);
                }
                setAvailableQuestions(allQuestions);
            } catch (err) {
                setError('Failed to load questions');
            }
        };
        loadQuestions();
    }, [courseId]);

    const handleSave = async () => {
        if (!courseId || !testId || !test) return;

        try {
            setLoading(true);
            await updateTest(courseId, testId, {
                title: test.title,
                config: test.configuration,
                question_ids: test.questions.map(q => q.id)
            });
            navigate(`/test-bank/${courseId}`);
        } catch (err) {
            setError('Failed to save test');
        } finally {
            setLoading(false);
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
        if (!test) return;

        if (test.questions.some(q => q.id === Number(question.id))) {
            // Remove question
            setTest({
                ...test,
                questions: test.questions.filter(q => q.id !== Number(question.id))
            });
        } else {
            // Add question with all its data
            setTest({
                ...test,
                questions: [
                    ...test.questions,
                    {
                        id: Number(question.id),
                        question: Number(question.id),
                        question_data: question
                    }
                ]
            });
        }
    };

    const getTaxonomyLevel = (question: Question): string => {
        // First check taxonomies array
        if (question.taxonomies && question.taxonomies.length > 0) {
            const bloomsTaxonomy = question.taxonomies.find(
                tax => tax.taxonomy.name === "Bloom's Taxonomy"
            );
            if (bloomsTaxonomy) {
                return bloomsTaxonomy.level;
            }
        }
        
        // Then check taxonomyLevel property
        if (question.taxonomyLevel) {
            return question.taxonomyLevel;
        }
        
        return 'N/A';
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;
    if (!test) return <div>No test found</div>;

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
                            onChange={(e) => setTest(prev => {
                                if (!prev) return null;
                                return {
                                    ...prev,
                                    title: e.target.value
                                };
                            })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                    </div>
                    <div className="mb-4.5">
                        <textarea
                            placeholder="Enter test description"
                            value={test.description || ''}
                            onChange={(e) => setTest(prev => {
                                if (!prev) return null;
                                return {
                                    ...prev,
                                    description: e.target.value
                                };
                            })}
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
                            {filteredQuestions.map((question, index) => (
                                <div 
                                    key={question.id}
                                    className="flex justify-between items-center px-4 py-3 rounded-sm border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 cursor-pointer"
                                    onClick={() => toggleQuestionSelection(question)}
                                >
                                    <div className="flex-1 pr-4">
                                        <span className="text-sm">{index + 1}. {truncateText(question.question_text)}</span>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-24 text-center">
                                            {question.difficulty && (
                                                <Tag value={question.difficulty} type="difficulty" />
                                            )}
                                        </div>
                                        <div className="w-24 text-center">
                                            <Tag value={getTaxonomyLevel(question)} type="taxonomy" />
                                        </div>
                                        <div className="w-12 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleQuestionSelection(question);
                                                }}
                                                className="text-primary hover:text-primary-dark"
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
                            {test && test.questions.map((questionWrapper, index) => {
                                const question = questionWrapper.question_data;
                                return (
                                    <div 
                                        key={questionWrapper.id}
                                        className="flex justify-between items-center px-4 py-3 rounded-sm border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 cursor-pointer"
                                        onClick={() => handleQuestionClick(question)}
                                    >
                                        <div className="flex-1 pr-4">
                                            <span className="text-sm">{index + 1}. {truncateText(question.question_text)}</span>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="w-24 text-center">
                                                {question.difficulty && (
                                                    <Tag value={question.difficulty} type="difficulty" />
                                                )}
                                            </div>
                                            <div className="w-24 text-center">
                                                <Tag value={getTaxonomyLevel(question)} type="taxonomy" />
                                            </div>
                                            <div className="w-12 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleQuestionSelection(question);
                                                    }}
                                                    className="text-danger hover:text-danger-dark"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Distribution */}
            {test && test.questions.length > 0 && (
                <div className="col-span-12 xl:col-span-12 mt-4">
                    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                        <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                            Question Distribution
                        </h4>
                        <QuestionDistribution 
                            selectedQuestions={test.questions.map(q => ({
                                ...q.question_data,
                                // Ensure taxonomyLevel is set if it's in taxonomies but not directly
                                taxonomyLevel: getTaxonomyLevel(q.question_data)
                            }))} 
                            editedQuestions={{}}
                        />
                    </div>
                </div>
            )}

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
                                        value={selectedQuestion.question_text}
                                        onChange={(e) => setSelectedQuestion({
                                            ...selectedQuestion,
                                            question_text: e.target.value
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
                                        {selectedQuestion.answers.map((option, index) => (
                                            <div key={option.id} className="flex items-center gap-4">
                                                <input
                                                    type="radio"
                                                    checked={option.is_correct}
                                                    onChange={() => {
                                                        const newAnswers = selectedQuestion.answers.map((opt, i) => ({
                                                            ...opt,
                                                            is_correct: i === index
                                                        }));
                                                        setSelectedQuestion({
                                                            ...selectedQuestion,
                                                            answers: newAnswers
                                                        });
                                                    }}
                                                    className="form-radio"
                                                />
                                                <input
                                                    type="text"
                                                    value={option.answer_text}
                                                    onChange={(e) => {
                                                        const newAnswers = [...selectedQuestion.answers];
                                                        newAnswers[index] = {
                                                            ...newAnswers[index],
                                                            answer_text: e.target.value
                                                        };
                                                        setSelectedQuestion({
                                                            ...selectedQuestion,
                                                            answers: newAnswers
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
                                            value={selectedQuestion.taxonomyLevel || getTaxonomyLevel(selectedQuestion)}
                                            onChange={(e) => {
                                                const newTaxonomyLevel = e.target.value;
                                                // Update both taxonomyLevel and taxonomies for compatibility
                                                setSelectedQuestion({
                                                    ...selectedQuestion,
                                                    taxonomyLevel: newTaxonomyLevel,
                                                    taxonomies: [
                                                        {
                                                            taxonomy: {
                                                                name: "Bloom's Taxonomy"
                                                            },
                                                            level: newTaxonomyLevel
                                                        }
                                                    ]
                                                });
                                            }}
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                        >
                                            {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(level => (
                                                <option key={level} value={level}>
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
                                            // Ensure both taxonomyLevel and taxonomies are set
                                            const updatedQuestion = {
                                                ...selectedQuestion,
                                                taxonomyLevel: selectedQuestion.taxonomyLevel || getTaxonomyLevel(selectedQuestion),
                                                taxonomies: [
                                                    {
                                                        taxonomy: {
                                                            name: "Bloom's Taxonomy"
                                                        },
                                                        level: selectedQuestion.taxonomyLevel || getTaxonomyLevel(selectedQuestion)
                                                    }
                                                ]
                                            };
                                            
                                            setTest(prev => {
                                                if (!prev) return null;
                                                return {
                                                    ...prev,
                                                    questions: prev.questions.map(q =>
                                                        q.id === updatedQuestion.id
                                                            ? { id: Number(updatedQuestion.id), question: Number(updatedQuestion.id), question_data: updatedQuestion }
                                                            : q
                                                    )
                                                };
                                            });
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