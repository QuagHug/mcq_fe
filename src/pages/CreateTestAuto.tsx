import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { fetchQuestionBanks, fetchCourses, createTest } from '../services/api';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Dialog } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface QuestionBank {
    id: number;
    name: string;
    bank_id: string;
    parent: number | null;
    children: QuestionBank[];
    questions: any[];
}

interface TestCombination {
    numberOfQuestions: number;
    taxonomyLevel: string;
    difficulty: string;
    learningOutcome: string;
    chapter: string;
}

interface TestData {
    title: string;
    description: string;
    duration: number;
    passingScore: number;
    combinations: TestCombination[];
    topics?: string[];
}

interface Chapter {
    id: number;
    name: string;
}

interface AnswerFormat {
    case: 'uppercase' | 'lowercase';
    separator: string;
}

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Add this type near the other interfaces at the top
type Difficulty = 'easy' | 'medium' | 'hard';

// Add this type for the distribution table
interface QuestionDistribution {
    [key: string]: {
        [key in Difficulty]: number;
    };
}

// Add these interfaces before the generatePreviewQuestions function
interface PreviewQuestion {
    id: string;
    question_text: string;
    answers: PreviewAnswer[];
}

interface PreviewAnswer {
    answer_text: string;
    is_correct: boolean;
}

// Add this helper function at the top of the file
const extractQuestionsFromBank = (bank: any): any[] => {
    let questions: any[] = [...(bank.questions || [])];
    if (bank.children) {
        bank.children.forEach((child: any) => {
            questions = [...questions, ...extractQuestionsFromBank(child)];
        });
    }
    return questions;
};

// Add this helper function after extractQuestionsFromBank
const getQuestionsFromBank = (bank: QuestionBank): Question[] => {
    const bankQuestions = bank.questions?.map(q => ({
        ...q,
        bank_id: bank.id.toString(),
        taxonomyLevel: q.taxonomies?.[0]?.level || '',
        difficulty: q.difficulty || ''
    })) || [];
    const childQuestions = bank.children?.flatMap(child =>
        getQuestionsFromBank(child)
    ) || [];
    return [...bankQuestions, ...childQuestions];
};

const CreateTestAuto: React.FC = (): JSX.Element => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
    const [testData, setTestData] = useState<TestData>({
        title: '',
        description: '',
        duration: 60,
        passingScore: 60,
        combinations: [{
            numberOfQuestions: 1,
            taxonomyLevel: 'Remember',
            difficulty: 'medium',
            chapter: ''
        }]
    });
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [availableTaxonomies, setAvailableTaxonomies] = useState<string[]>([]);
    const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([]);
    const [showDistribution, setShowDistribution] = useState(false);

    // Fetch courses on component mount
    useEffect(() => {
        const loadCourses = async () => {
            try {
                setLoading(true);
                const coursesData = await fetchCourses();
                setCourses(coursesData);
            } catch (err) {
                setError('Failed to load courses');
            } finally {
                setLoading(false);
            }
        };
        loadCourses();
    }, []);

    // Handle course change
    const handleCourseChange = async (courseId: string) => {
        setSelectedCourse(courseId);
        setSelectedQuestions([]);
        setTestData(prev => ({ ...prev, title: '', description: '' }));
        
        if (!courseId) return;
        
        try {
            setLoading(true);
            const banks = await fetchQuestionBanks(courseId);
            setQuestionBanks(banks);
            
            // Fetch all questions from all banks
            const allQuestions = banks.flatMap(bank => {
                const bankQuestions = bank.questions?.map(q => ({
                    ...q,
                    bank_id: bank.id.toString(),
                    taxonomyLevel: q.taxonomies?.[0]?.level || '',
                    difficulty: q.difficulty || ''
                })) || [];
                const childQuestions = bank.children?.flatMap(child =>
                    getQuestionsFromBank(child)
                ) || [];
                return [...bankQuestions, ...childQuestions];
            });
            
            setAllQuestions(allQuestions);
            const taxonomies = [...new Set(allQuestions.map(q => q.taxonomies?.[0]?.level))].filter(Boolean);
            const difficulties = [...new Set(allQuestions.map(q => q.difficulty))].filter(Boolean);

            setAvailableTaxonomies(taxonomies);
            setAvailableDifficulties(difficulties);

            console.log('Loaded Questions:', {
                total: allQuestions.length,
                taxonomyLevels: taxonomies,
                difficulties: difficulties
            });
        } catch (err) {
            setError('Failed to load question banks');
        } finally {
            setLoading(false);
        }
    };

    // Generate questions based on criteria
    const generateQuestions = async () => {
        try {
            setLoading(true);
            setError(''); // Clear any existing errors
            console.log('Starting question generation with:', {
                allQuestions: allQuestions.length,
                combinations: testData.combinations
            });

            // Create a new array with existing selected questions
            const selectedQs: Question[] = [...selectedQuestions];
            
            for (const combination of testData.combinations) {
                // Find questions matching the taxonomy level, excluding already selected ones
                const questionsForCombination = allQuestions.filter(q => {
                    const questionTaxonomy = q.taxonomies?.[0]?.level || '';
                    const questionDifficulty = q.difficulty || '';
                    
                    // Check if question is already selected
                    const isAlreadySelected = selectedQs.some(selected => selected.id === q.id);
                    if (isAlreadySelected) return false;
                    
                    // If no questions with exact difficulty match are found, use medium difficulty
                    const difficultyMatches = combination.difficulty === questionDifficulty;

                    const matches = questionTaxonomy === combination.taxonomyLevel && difficultyMatches;
                    
                    return matches;
                });

                if (questionsForCombination.length < combination.numberOfQuestions) {
                    throw new Error(`Not enough questions available for ${combination.taxonomyLevel} level with ${combination.difficulty} difficulty. Found: ${questionsForCombination.length}, Need: ${combination.numberOfQuestions}`);
                }

                const shuffled = [...questionsForCombination].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, combination.numberOfQuestions);
                selectedQs.push(...selected);
            }
            
            // Update selected questions by adding new ones to existing selection
            setSelectedQuestions(selectedQs);
            
        } catch (error) {
            console.error('Error generating questions:', error);
            setError(error instanceof Error ? error.message : 'Failed to generate questions');
        } finally {
            setLoading(false);
        }
    };

    // Add this function to handle removing a question
    const handleRemoveQuestion = (questionId: number) => {
        setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
    };

    // Update the useEffect where we process the banks data
    useEffect(() => {
        if (questionBanks && questionBanks.length > 0) {
            const allQuestions = questionBanks.flatMap(bank => extractQuestionsFromBank(bank));
            const taxonomies = [...new Set(allQuestions.map(q => q.taxonomies?.[0]?.level))].filter(Boolean);
            const difficulties = [...new Set(allQuestions.map(q => q.difficulty))].filter(Boolean);
            
            console.log("Available options:", { taxonomies, difficulties });
            setAvailableTaxonomies(taxonomies);
            setAvailableDifficulties(difficulties);
        }
    }, [questionBanks]);

    // Add the handleCreateTest function (after generateQuestions function)
    const handleCreateTest = async () => {
        try {
            setLoading(true);
            setError('');
            
            if (!selectedQuestions.length) {
                throw new Error('Please select at least one question');
            }

            // Format the test data
            const testPayload = {
                title: testData.title || 'Untitled Test',
                description: testData.description || '',
                duration: testData.duration,
                passing_score: testData.passingScore,
                configuration: {
                    letterCase: 'uppercase',
                    separator: ')',
                    includeAnswerKey: false
                },
                question_ids: selectedQuestions.map(question => question.id)
            };

            // Call API to create test
            const response = await createTest(selectedCourse, testPayload);
            
            if (response.id) {
                navigate(`/test-bank/${selectedCourse}/tests/${response.id}/edit`);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error('Error creating test:', err);
            setError(err instanceof Error ? err.message : 'Failed to create test');
        } finally {
            setLoading(false);
        }
    };

    // Add this function to calculate distribution
    const calculateDistribution = (questions: Question[]) => {
        const distribution: { [key: string]: { [key: string]: number } } = {};
        
        ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].forEach(taxonomy => {
            distribution[taxonomy] = {
                easy: 0,
                medium: 0,
                hard: 0
            };
        });

        questions.forEach(question => {
            const taxonomy = question.taxonomies?.[0]?.level || 'Remember';
            const difficulty = question.difficulty || 'medium';
            if (distribution[taxonomy]) {
                distribution[taxonomy][difficulty.toLowerCase()]++;
            }
        });

        return distribution;
    };

    return (
        <div className="mx-auto max-w-270">
            <Breadcrumb
                pageName="Create Test (Auto)"
                currentName="Create Test"
                breadcrumbItems={[
                    { name: "Dashboard", path: "/dashboard" },
                    { name: "Create Test", path: "#" }
                ]}
            />

            {/* Test Details Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">Select Course</h3>
                </div>
                <div className="p-6.5">
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Course <span className="text-meta-1">*</span>
                        </label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => handleCourseChange(e.target.value)}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        >
                            <option value="">Select Course</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedCourse && (
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                    <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">Test Details</h3>
                    </div>
                    <div className="p-6.5">
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Test Title <span className="text-meta-1">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter test title"
                                value={testData.title}
                                onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Question Selection Criteria */}
            {selectedCourse && (
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                    <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">Question Selection Criteria</h3>
                    </div>
                    <div className="p-6.5">
                        {testData.combinations.map((combination, index) => (
                            <div key={index} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Number of Questions
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={combination.numberOfQuestions}
                                        onChange={(e) => {
                                            const newCombinations = [...testData.combinations];
                                            newCombinations[index].numberOfQuestions = parseInt(e.target.value);
                                            setTestData(prev => ({ ...prev, combinations: newCombinations }));
                                        }}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Taxonomy Level
                                    </label>
                                    <select
                                        value={combination.taxonomyLevel}
                                        onChange={(e) => {
                                            const newCombinations = [...testData.combinations];
                                            newCombinations[index].taxonomyLevel = e.target.value;
                                            setTestData(prev => ({ ...prev, combinations: newCombinations }));
                                        }}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none"
                                    >
                                        {availableTaxonomies.map(level => (
                                            <option key={level} value={level}>
                                                {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">
                                        Difficulty
                                    </label>
                                    <select
                                        value={combination.difficulty}
                                        onChange={(e) => {
                                            const newCombinations = [...testData.combinations];
                                            newCombinations[index].difficulty = e.target.value;
                                            setTestData(prev => ({ ...prev, combinations: newCombinations }));
                                        }}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none"
                                    >
                                        {availableDifficulties.map(level => (
                                            <option key={level} value={level}>
                                                {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setTestData(prev => ({
                                    ...prev,
                                    combinations: [...prev.combinations, {
                                        numberOfQuestions: 1,
                                        taxonomyLevel: 'Remember',
                                        difficulty: 'medium',
                                        chapter: ''
                                    }]
                                }))}
                                className="text-primary hover:text-primary/80"
                            >
                                + Add Another Combination
                            </button>

                            <div className="flex flex-col items-end">
                                <button
                                    onClick={generateQuestions}
                                    disabled={loading || !selectedCourse || !testData.title}
                                    className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-white hover:bg-opacity-90 disabled:bg-opacity-50"
                                >
                                    {loading ? 'Generating...' : 'Generate Questions'}
                                </button>
                                {error && (
                                    <div className="mt-2 text-meta-1 text-sm">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Questions Preview */}
            {selectedQuestions.length > 0 && (
                <>
                    {/* Selected Questions Section */}
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                Questions ({selectedQuestions.length})
                            </h3>
                        </div>
                        <div className="p-6.5">
                            <div className="flex w-full flex-col gap-4">
                                <div className="grid grid-cols-12 border-b border-stroke pb-2 dark:border-strokedark">
                                    <div className="col-span-1 flex items-center">
                                        <p className="font-medium">#</p>
                                    </div>
                                    <div className="col-span-7 flex items-center">
                                        <p className="font-medium">Question</p>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-center">
                                        <p className="font-medium">Difficulty</p>
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                        <p className="font-medium">Taxonomy</p>
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                        <p className="font-medium">Action</p>
                                    </div>
                                </div>

                                {selectedQuestions.map((question, index) => (
                                    <div key={question.id} className="grid grid-cols-12 border-b border-stroke pb-5 dark:border-strokedark">
                                        <div className="col-span-1 flex items-center">
                                            <p className="text-sm text-black dark:text-white">{index + 1}.</p>
                                        </div>
                                        <div className="col-span-7 flex items-center">
                                            <p className="text-sm text-black dark:text-white">{question.question_text}</p>
                                        </div>
                                        <div className="col-span-2 flex items-center justify-center">
                                            <p className="text-sm text-black dark:text-white">
                                                {question.difficulty ? question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) : 'N/a'}
                                            </p>
                                        </div>
                                        <div className="col-span-1 flex items-center justify-center">
                                            <p className="text-sm text-black dark:text-white">
                                                {question.taxonomies?.[0]?.level || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="col-span-1 flex items-center justify-center">
                                            <button
                                                onClick={() => handleRemoveQuestion(question.id)}
                                                className="text-sm font-medium text-meta-1 hover:text-meta-1"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Distribution Section */}
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                Distribution
                            </h3>
                        </div>
                        <div className="p-6.5">
                            <div className="max-w-full overflow-x-auto">
                                <table className="w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                            <th className="py-4 px-4 font-medium text-black dark:text-white">
                                                Taxonomy Level
                                            </th>
                                            <th className="py-4 px-4 font-medium text-black dark:text-white text-center">
                                                Easy
                                            </th>
                                            <th className="py-4 px-4 font-medium text-black dark:text-white text-center">
                                                Medium
                                            </th>
                                            <th className="py-4 px-4 font-medium text-black dark:text-white text-center">
                                                Hard
                                            </th>
                                            <th className="py-4 px-4 font-medium text-black dark:text-white text-center">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(taxonomy => {
                                            const difficulties = calculateDistribution(selectedQuestions)[taxonomy];
                                            const rowTotal = Object.values(difficulties).reduce((sum, count) => sum + count, 0);
                                            if (rowTotal === 0) return null;

                                            return (
                                                <tr key={taxonomy}>
                                                    <td className="py-3 px-4 border-b border-[#eee] dark:border-strokedark">
                                                        {taxonomy}
                                                    </td>
                                                    <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                        {difficulties.easy}
                                                    </td>
                                                    <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                        {difficulties.medium}
                                                    </td>
                                                    <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark">
                                                        {difficulties.hard}
                                                    </td>
                                                    <td className="py-3 px-4 text-center border-b border-[#eee] dark:border-strokedark font-medium">
                                                        {rowTotal}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-gray-2 dark:bg-meta-4">
                                            <td className="py-3 px-4 font-medium">Total</td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                {Object.values(calculateDistribution(selectedQuestions)).reduce((sum, diff) => sum + diff.easy, 0)}
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                {Object.values(calculateDistribution(selectedQuestions)).reduce((sum, diff) => sum + diff.medium, 0)}
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                {Object.values(calculateDistribution(selectedQuestions)).reduce((sum, diff) => sum + diff.hard, 0)}
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                {selectedQuestions.length}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4.5 flex justify-end gap-3">
                                <button
                                    onClick={() => navigate('/tests')}
                                    className="inline-flex items-center justify-center rounded-md border border-primary py-2 px-6 text-center font-medium text-primary hover:bg-opacity-90"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTest}
                                    disabled={loading || selectedQuestions.length === 0}
                                    className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Add to Bank & Edit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CreateTestAuto; 