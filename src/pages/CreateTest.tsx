import { useState, useEffect, useRef } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import Pagination from '../components/Pagination';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    fetchQuestionBanks,
    fetchCourses,
    createTest,
    fetchCourseTests,
    saveTestDraft,
    getTestDraft,
    deleteTestDraft,
    getTestDrafts  // Add this import
} from '../services/api';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Dialog } from '@headlessui/react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import React from 'react';
import AnswerBlock from '../components/AnswerBlock';
import QuestionDistribution from '../components/QuestionDistribution';
import PreviewBlock from '../components/PreviewBlock';

interface Question {
    id: number;
    question_text: string;
    marks: number;
    bank_id: string;
    selected?: boolean;
    answers?: { answer_text: string; is_correct: boolean }[];
    taxonomies?: { taxonomy: { name: string }; level: string }[];
    learningObjective?: string;
    statistics?: {
        scaled_difficulty: number;
        scaled_discrimination: number;
    };
    difficulty?: 'easy' | 'medium' | 'hard';
}

interface QuestionBank {
    id: number;
    name: string;
    bank_id: string;
    parent: number | null;
    children: QuestionBank[];
    questions: any[];
}

interface Answer {
    answer_text: string;
    is_correct: boolean;
}

interface LearningObjective {
    id: string;
    name: string;
}

interface SubjectLOs {
    [key: string]: LearningObjective[];
}

interface AnswerFormat {
    case: 'uppercase' | 'lowercase';
    separator: string;
}

interface Taxonomy {
    taxonomy: {
        name: string;
    };
    level: string;
}

ChartJS.register(ArcElement, Tooltip, Legend);

interface EditedQuestion extends Question {
    hiddenAnswers?: boolean[];
}

const truncateText = (text: string, maxLength: number = 50) => {
    const cleanText = text.replace(/<[^>]+>/g, '');
    if (cleanText.length <= maxLength) return cleanText;
    const lastSpace = cleanText.substring(0, maxLength).lastIndexOf(' ');
    const truncateAt = lastSpace > 0 ? lastSpace : maxLength;
    return cleanText.substring(0, truncateAt) + '...';
};

interface QuestionDistribution {
    [key: string]: {
        easy: number;
        medium: number;
        hard: number;
    };
}

const sanitizeHtml = (html: string) => {
    if (!html) return '';
    const withoutTags = html.replace(/<\/?[^>]+(>|$)/g, '');
    const textarea = document.createElement('textarea');
    textarea.innerHTML = withoutTags;

    return textarea.value.trim();
};

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const CreateTest = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Array<{ id: string, name: string }>>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [testData, setTestData] = useState<{
        title: string;
        description: string;
        duration: number;
        passingScore: number;
        lastSaved: string | null;
    }>({
        title: '',
        description: '',
        duration: 60,
        passingScore: 60,
        lastSaved: null,
    });

    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<string>('');
    const [showQuestionBank, setShowQuestionBank] = useState(false);
    const [isTestDetailsExpanded, setIsTestDetailsExpanded] = useState(true);
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [showTopics, setShowTopics] = useState(false);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
    const [selectedQuestionDetail, setSelectedQuestionDetail] = useState<Question | null>(null);
    const [showBloomsLevels, setShowBloomsLevels] = useState(false);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [answerFormat, setAnswerFormat] = useState<AnswerFormat>({
        case: 'uppercase',
        separator: ')',
    });

    // Update state type
    const [editedQuestions, setEditedQuestions] = useState<{ [key: number]: EditedQuestion }>({});
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: boolean[] }>({});

    // Add these separate state variables for pagination
    const [availableQuestionsPage, setAvailableQuestionsPage] = useState(1);
    const [selectedQuestionsPage, setSelectedQuestionsPage] = useState(1);

    // Add new state for including answer key
    const [includeKey, setIncludeKey] = useState(false);
    const [shuffleAnswers, setShuffleAnswers] = useState(false);

    // Add subject handling
    const [selectedSubject, setSelectedSubject] = useState('');
    const mockSubjects = [
        { id: "1", name: "Mathematics" },
        { id: "2", name: "Physics" },
        { id: "3", name: "Computer Science" },
        { id: "4", name: "Chemistry" }
    ];

    // Add this state variable for items per page
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Add this state for the alert
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'error' | 'success' | 'warning'>('error');

    // Add this state for preview pagination
    const [previewShowAll, setPreviewShowAll] = useState(false);
    const [previewPage, setPreviewPage] = useState(1);
    const previewItemsPerPage = 2; // Default to show only 2 questions initially

    // Add these state variables for the custom confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

    const [editMode, setEditMode] = useState(false);
    const [editedQuestionText, setEditedQuestionText] = useState('');
    const [editedAnswers, setEditedAnswers] = useState<{ answer_text: string; is_correct: boolean }[]>([]);

    const [editingQuestionText, setEditingQuestionText] = useState(false);
    const [editingAnswerIndex, setEditingAnswerIndex] = useState<number | null>(null);
    const [tempQuestionText, setTempQuestionText] = useState('');
    const [tempAnswerText, setTempAnswerText] = useState('');

    // Add these new state variables after other state declarations
    const [checkedAvailableQuestions, setCheckedAvailableQuestions] = useState<Set<number>>(new Set());
    const [checkedSelectedQuestions, setCheckedSelectedQuestions] = useState<Set<number>>(new Set());

    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubject(subjectId);
    };

    const subjectLOs: SubjectLOs = {
        'DSA': [
            { id: 'lo1', name: 'L.O.1' },
            { id: 'lo2', name: 'L.O.2' },
            { id: 'lo3', name: 'L.O.3' }
        ],
        'PPL': [
            { id: 'lo1', name: 'L.O.1' },
            { id: 'lo2', name: 'L.O.2' },
            { id: 'lo3', name: 'L.O.3' },
            { id: 'lo4', name: 'L.O.4' }
        ]
    };

    // Replace topics with Bloom's levels
    const bloomsLevels = [
        'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'
    ];

    const titleInputRef = useRef<HTMLInputElement>(null);
    const questionsSectionRef = useRef<HTMLDivElement>(null);

    const scrollToElement = (element: HTMLElement | null) => {
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add temporary highlight effect
            element.classList.add('border-primary', 'ring-2', 'ring-primary');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-primary');
            }, 2000);
        }
    };

    // Update the useEffect to load draft immediately when entering the page
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);

                // Fetch courses first
                const coursesData = await fetchCourses();
                setCourses(coursesData);

                // Try to load draft immediately
                await loadTestDraftFromBackend();

                // If courseId is provided in URL and no draft was loaded with a course
                if (courseId && !selectedCourse) {
                    setSelectedCourse(courseId);
                    const banks = await fetchQuestionBanks(courseId);
                    setQuestionBanks(banks);
                } else if (selectedCourse) {
                    // If we have a selected course (from draft or URL), load its question banks
                    const banks = await fetchQuestionBanks(selectedCourse);
                    setQuestionBanks(banks);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
                setError('Failed to load initial data');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        // Set up auto-save interval
        const autoSaveInterval = setInterval(() => {
            if (selectedCourse && (testData.title || selectedQuestions.length > 0)) {
                saveTestDraftToBackend(false);
            }
        }, 2 * 60 * 1000); // 2 minutes

        return () => {
            clearInterval(autoSaveInterval);
        };
    }, [courseId]);

    // Update the handleCourseChange function to not load drafts
    const handleCourseChange = async (courseId: string) => {
        setSelectedCourse(courseId);

        try {
            setLoading(true);

            // Fetch question banks for the selected course
            const banks = await fetchQuestionBanks(courseId);
            setQuestionBanks(banks);

            // Don't load draft here anymore, as we already loaded it on page load

        } catch (error) {
            console.error('Error fetching question banks:', error);
            setError('Failed to load question banks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const allQuestions = questionBanks.flatMap(bank => {
            const getQuestionsFromBank = (bank: QuestionBank): Question[] => {
                const bankQuestions = bank.questions?.map(q => ({
                    ...q,
                    bank_id: bank.id.toString() // Ensure each question has its bank_id
                })) || [];
                const childQuestions = bank.children?.flatMap(child =>
                    getQuestionsFromBank(child)
                ) || [];
                return [...bankQuestions, ...childQuestions];
            };
            return getQuestionsFromBank(bank);
        });

        const filtered = allQuestions.filter(question => {
            const matchesSearch = question.question_text.toLowerCase()
                .includes(searchQuery.toLowerCase());

            const matchesLevels = selectedLevels.length === 0 ||
                selectedLevels.some(level =>
                    question.taxonomies?.some((tax: Taxonomy) =>
                        tax.taxonomy.name === "Bloom's Taxonomy" &&
                        tax.level === level
                    )
                );

            // Check if question belongs to selected bank or its children
            const matchesBank = !selectedBankId || (() => {
                // If no bank is selected, show all questions
                if (!selectedBankId) return true;

                // Find the selected bank in the tree
                const findBank = (banks: QuestionBank[]): QuestionBank | null => {
                    for (const bank of banks) {
                        if (bank.id.toString() === selectedBankId) return bank;
                        if (bank.children) {
                            const found = findBank(bank.children);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const selectedBank = findBank(questionBanks);
                if (!selectedBank) return false;

                // Get all bank IDs that should be included (selected bank and its children)
                const getAllBankIds = (bank: QuestionBank): string[] => {
                    const ids = [bank.id.toString()];
                    if (bank.children) {
                        bank.children.forEach(child => {
                            ids.push(...getAllBankIds(child));
                        });
                    }
                    return ids;
                };

                const validBankIds = getAllBankIds(selectedBank);
                return validBankIds.includes(question.bank_id);
            })();

            return matchesSearch && matchesLevels && matchesBank;
        });

        setFilteredQuestions(filtered);
    }, [searchQuery, selectedLevels, selectedBankId, questionBanks]);

    const [showTitleWarning, setShowTitleWarning] = useState(false);
    const [showQuestionWarning, setShowQuestionWarning] = useState(false);

    // Auto-save functionality
    useEffect(() => {
        // Only save if a course is selected and there's data to save
        if (selectedCourse && (testData.title || selectedQuestions.length > 0)) {
            const autoSaveTimer = setTimeout(() => {
                saveTestDraftToBackend(false); // Pass false to not show alerts for auto-save
            }, 5000); // Save every 5 seconds when changes are detected

            return () => clearTimeout(autoSaveTimer);
        }
    }, [
        selectedCourse,
        testData,
        selectedQuestions,
        answerFormat,
        includeKey,
        shuffleQuestions,
        shuffleAnswers,
        selectedTopics,
        selectedLevels,
        editedQuestions
    ]);

    // Load draft when course is selected
    // useEffect(() => {
    //     if (selectedCourse) {
    //         loadTestDraftFromBackend();
    //     }
    // }, [selectedCourse]);

    // Function to save draft to backend using the API service
    const saveTestDraftToBackend = async (showAlerts = true) => {
        try {
            const draftData = {
                courseId: selectedCourse,
                testData,
                selectedQuestions,
                answerFormat,
                includeKey,
                shuffleQuestions,
                shuffleAnswers,
                selectedTopics,
                selectedLevels,
                editedQuestions,
                lastUpdated: new Date().toISOString()
            };

            // Call API service function to save draft
            await saveTestDraft(selectedCourse, draftData);

            // Update last saved timestamp
            setTestData(prev => ({
                ...prev,
                lastSaved: new Date().toISOString()
            }));

            // Show success message only if showAlerts is true
            if (showAlerts) {
                setAlertMessage('Draft saved successfully');
                setAlertType('success');
                setShowAlert(true);

                // Auto-hide after 3 seconds
                setTimeout(() => {
                    setShowAlert(false);
                }, 3000);
            }

            return true;
        } catch (error) {
            console.error('Error saving draft:', error);

            // Show error message only if showAlerts is true
            if (showAlerts) {
                setAlertMessage('Failed to save draft. Please try again.');
                setAlertType('error');
                setShowAlert(true);

                // Auto-hide after 3 seconds
                setTimeout(() => {
                    setShowAlert(false);
                }, 3000);
            }

            return false;
        }
    };

    // Update the loadTestDraftFromBackend function to fetch question banks after loading a draft
    const loadTestDraftFromBackend = async () => {
        try {
            // Use the API service to get all drafts
            const drafts = await getTestDrafts();
            console.log('All drafts:', drafts);

            // Check if drafts is an array before proceeding
            if (!Array.isArray(drafts) || drafts.length === 0) {
                console.log('No drafts found');
                return false;
            }

            // Get the most recent draft (assuming one draft per user)
            const latestDraft = drafts.sort((a, b) => {
                // Handle missing updated_at
                if (!a.updated_at) return 1;
                if (!b.updated_at) return -1;
                return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            })[0];

            console.log('Latest draft:', latestDraft);

            if (latestDraft && latestDraft.draft_data) {
                // The actual data is in draft_data
                const draftData = latestDraft.draft_data;

                // Set the course from the draft
                let courseFromDraft = null;
                if (latestDraft.course) {
                    courseFromDraft = latestDraft.course.toString();
                    setSelectedCourse(courseFromDraft);
                }

                // Set all the state from the draft with defensive programming
                setTestData({
                    title: draftData.testData?.title || '',
                    description: draftData.testData?.description || '',
                    duration: draftData.testData?.duration || 60,
                    passingScore: draftData.testData?.passingScore || 60,
                    lastSaved: latestDraft.updated_at || new Date().toISOString()
                });

                // Set other state with null checks
                if (Array.isArray(draftData.selectedQuestions)) {
                    setSelectedQuestions(draftData.selectedQuestions);
                }

                if (draftData.answerFormat) {
                    setAnswerFormat(draftData.answerFormat);
                }

                setIncludeKey(Boolean(draftData.includeKey));
                setShuffleQuestions(Boolean(draftData.shuffleQuestions));
                setShuffleAnswers(Boolean(draftData.shuffleAnswers));

                if (Array.isArray(draftData.selectedTopics)) {
                    setSelectedTopics(draftData.selectedTopics);
                }

                if (Array.isArray(draftData.selectedLevels)) {
                    setSelectedLevels(draftData.selectedLevels);
                }

                if (draftData.editedQuestions) {
                    setEditedQuestions(draftData.editedQuestions);
                }

                // Fetch question banks for the course from the draft
                if (courseFromDraft) {
                    try {
                        const banks = await fetchQuestionBanks(courseFromDraft);
                        setQuestionBanks(banks);

                        // This will trigger the useEffect that filters questions
                        setSelectedBankId('');
                    } catch (bankError) {
                        console.error('Error fetching question banks:', bankError);
                    }
                }

                // Show success message
                setAlertMessage('Draft loaded successfully');
                setAlertType('success');
                setShowAlert(true);

                // Auto-hide after 3 seconds
                setTimeout(() => {
                    setShowAlert(false);
                }, 3000);

                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading draft:', error);

            // Show error message
            setAlertMessage('Failed to load draft. Starting with a new test.');
            setAlertType('warning');
            setShowAlert(true);

            // Auto-hide after 3 seconds
            setTimeout(() => {
                setShowAlert(false);
            }, 3000);

            return false;
        }
    };

    // Function to delete draft from backend with confirmation
    const deleteTestDraftFromBackend = async () => {
        // Show confirmation dialog before deleting
        if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
            // User cancelled the deletion
            setAlertMessage('Draft deletion cancelled');
            setAlertType('warning');
            setShowAlert(true);

            // Auto-hide after 3 seconds
            setTimeout(() => {
                setShowAlert(false);
            }, 3000);

            return false;
        }

        try {
            await deleteTestDraft();

            // Show success message
            setAlertMessage('Draft deleted successfully');
            setAlertType('success');
            setShowAlert(true);

            // Auto-hide after 3 seconds
            setTimeout(() => {
                setShowAlert(false);
            }, 3000);

            // Reset form to default values
            setTestData({
                title: '',
                description: '',
                duration: 60,
                passingScore: 60,
                lastSaved: null
            });
            setSelectedQuestions([]);
            setEditedQuestions({});

            return true;
        } catch (error) {
            console.error('Error deleting draft:', error);

            // Show error message
            setAlertMessage('Failed to delete draft. Please try again.');
            setAlertType('error');
            setShowAlert(true);

            // Auto-hide after 3 seconds
            setTimeout(() => {
                setShowAlert(false);
            }, 3000);

            return false;
        }
    };

    // Update the handleCreateTest function to delete the draft after successful test creation
    const handleCreateTest = async () => {
        // Validate test data
        if (!testData.title.trim()) {
            setShowTitleWarning(true);
            scrollToElement(titleInputRef.current);
            return;
        }

        if (selectedQuestions.length === 0) {
            setShowQuestionWarning(true);
            scrollToElement(questionsSectionRef.current);
            return;
        }

        try {
            setLoading(true);

            // Use shuffled questions if available, otherwise use selected questions
            const questionsToUse = shuffledQuestions.length > 0 ? shuffledQuestions : selectedQuestions;

            // Prepare the test data
            const testPayload = {
                title: testData.title,
                description: testData.description,
                question_ids: questionsToUse.map(q => q.id),
                config: {
                    letterCase: answerFormat.case,
                    separator: answerFormat.separator,
                    includeAnswerKey: includeKey
                }
            };

            // Create the test
            await createTest(selectedCourse, testPayload);

            // After successful test creation, delete the draft
            try {
                await deleteTestDraft();
                console.log('Draft deleted after test creation');
            } catch (draftError) {
                console.error('Error deleting draft after test creation:', draftError);
                // Continue even if draft deletion fails
            }

            // Show success message
            setAlertMessage('Test created successfully!');
            setAlertType('success');
            setShowAlert(true);

            // Navigate to the test bank after a short delay
            setTimeout(() => {
                navigate(`/test-bank/${selectedCourse}`);
            }, 1500);
        } catch (error) {
            console.error('Error creating test:', error);
            setError('Failed to create test');

            // Show error message
            setAlertMessage('Failed to create test. Please try again.');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    // Clear title warning when user types in title
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTestData({ ...testData, title: e.target.value });
        if (showTitleWarning && e.target.value.trim()) {
            setShowTitleWarning(false);
        }
    };

    // Add handler for question selection
    const handleQuestionSelection = (question: Question) => {
        if (selectedQuestions.find(q => q.id === question.id)) {
            setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
        } else {
            setSelectedQuestions(prev => [...prev, question]);
        }
        // Clear question warning if at least one question is selected
        if (showQuestionWarning && selectedQuestions.length > 0) {
            setShowQuestionWarning(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Test Data:', {
            ...testData,
            questions: selectedQuestions
        });
    };

    // Add this helper function before the return statement
    const isQuestionSelected = (questionId: number) => {
        return selectedQuestions.some(q => q.id === questionId);
    };

    // Update the toggleQuestionSelection function
    const toggleQuestionSelection = (question: Question) => {
        if (selectedQuestions.find(q => q.id === question.id)) {
            setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
        } else {
            setSelectedQuestions(prev => [...prev, question]);
        }
    };

    const handleShuffle = () => {
        setShuffleQuestions(!shuffleQuestions);
    };

    const toggleLevel = (level: string) => {
        setSelectedLevels(prev =>
            prev.includes(level)
                ? prev.filter(l => l !== level)
                : [...prev, level]
        );
    };

    const toggleLO = (loId: string) => {
        setSelectedTopics(prev =>
            prev.includes(loId)
                ? prev.filter(id => id !== loId)
                : [...prev, loId]
        );
    };

    // Add new function to shuffle answers for all questions
    const handleShuffleAnswers = () => {
        setShuffleAnswers(!shuffleAnswers);
    };

    // Update the exportToWord function
    const exportToWord = async () => {
        if (!testData.title.trim()) {
            setAlertMessage('Please add a title before exporting');
            setAlertType('warning');
            setShowAlert(true);

            // Auto-hide after 3 seconds
            setTimeout(() => {
                setShowAlert(false);
            }, 3000);

            // Scroll to title input
            setTimeout(() => {
                scrollToElement(titleInputRef.current);
            }, 100);
            return;
        }

        if (selectedQuestions.length === 0) {
            setAlertMessage('Please select at least one question before exporting');
            setAlertType('warning');
            setShowAlert(true);

            // Auto-hide after 3 seconds
            setTimeout(() => {
                setShowAlert(false);
            }, 3000);

            // Scroll to questions section
            setTimeout(() => {
                scrollToElement(questionsSectionRef.current);
            }, 100);
            return;
        }

        // Prepare questions array - shuffle if needed
        const questionsToExport = shuffleQuestions
            ? [...selectedQuestions].sort(() => Math.random() - 0.5)
            : selectedQuestions;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: testData.title,
                                bold: true,
                                size: 32,
                            }),
                        ],
                        spacing: { after: 400 },
                    }),

                    ...(testData.description ? [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: testData.description.replace(/<[^>]+>/g, ''),
                                }),
                            ],
                            spacing: { after: 400 },
                        }),
                    ] : []),

                    ...questionsToExport.flatMap((question, index) => {
                        // For each question, prepare its answers - shuffle if needed
                        const questionAnswers = shuffleAnswers
                            ? [...(question.answers || [])].sort(() => Math.random() - 0.5)
                            : question.answers || [];

                        return [
                            // Question text
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Question ${index + 1}: `,
                                        bold: true,
                                    }),
                                    new TextRun({
                                        text: question.question_text.replace(/<[^>]+>/g, ''),
                                    }),
                                ],
                                spacing: { before: 400, after: 200 },
                            }),

                            // Answers
                            ...questionAnswers.map((answer, ansIndex) =>
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: `${String.fromCharCode(65 + ansIndex)}) `,
                                            bold: true,
                                        }),
                                        new TextRun({
                                            text: answer.answer_text.replace(/<[^>]+>/g, ''),
                                        }),
                                    ],
                                    indent: { left: 720 },
                                    spacing: { before: 100, after: 100 },
                                })
                            ),
                        ];
                    }),
                ],
            }],
        });

        try {
            const blob = await Packer.toBlob(doc);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            saveAs(blob, `${testData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.docx`);
        } catch (err) {
            console.error('Error generating document:', err);
            setError('Failed to generate document');
        }
    };

    // Update the handleCancel function to use the custom modal
    const handleCancel = () => {
        // Only show confirmation if there are changes
        if (testData.title || selectedQuestions.length > 0) {
            setConfirmTitle('Delete Draft');
            setConfirmMessage('Are you sure you want to exit? Your draft will be deleted. This action cannot be undone.');
            setConfirmAction(() => async () => {
                // User confirmed deletion - delete the draft
                try {
                    if (selectedCourse) {
                        await deleteTestDraft();
                        setAlertMessage('Draft deleted successfully');
                        setAlertType('success');
                        setShowAlert(true);
                    }
                } catch (error) {
                    console.error('Error deleting draft:', error);
                    setAlertMessage('Failed to delete draft, but exiting anyway');
                    setAlertType('warning');
                    setShowAlert(true);
                }
                // Navigate back to the course page
                navigate(`/courses/${selectedCourse}`);
            });
            setShowConfirmModal(true);
        } else {
            // No changes, just navigate away
            navigate(`/courses/${selectedCourse}`);
        }
    };

    const handleQuestionClick = (question: Question) => {
        setSelectedQuestionDetail(question);
        // Initialize selected answers if the question is in the test
        if (isQuestionInTest(question.id)) {
            const existingQuestion = editedQuestions[question.id];
            const initialAnswerStates = question.answers?.map(() => true) || [];
            if (existingQuestion?.hiddenAnswers) {
                existingQuestion.hiddenAnswers.forEach((isHidden, index) => {
                    if (isHidden) {
                        initialAnswerStates[index] = false;
                    }
                });
            }
            setSelectedAnswers(prev => ({
                ...prev,
                [question.id]: initialAnswerStates
            }));
        }
        setIsQuestionDialogOpen(true);
    };

    const sanitizeHtml = (html: string) => {
        return html.replace(/<\/?[^>]+(>|$)/g, '');
    };

    const calculateLOStats = (questions: Question[], selectedLOs: string[]) => {
        const stats = selectedLOs.reduce((acc, lo) => {
            acc[lo] = 0;
            return acc;
        }, {} as Record<string, number>);

        questions.forEach(question => {
            if (question.learningObjective) {
                stats[question.learningObjective]++;
            }
        });

        return stats;
    };

    const toggleAnswer = (questionId: number, answerIndex: number) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: prev[questionId]?.map((selected, idx) =>
                idx === answerIndex ? !selected : selected
            ) || []
        }));
    };

    const handleSaveChanges = async (overwrite: boolean) => {
        if (!selectedQuestionDetail) return;

        const selectedAnswersList = selectedAnswers[selectedQuestionDetail.id] || [];

        // Create updated taxonomies array
        const updatedTaxonomies = selectedQuestionDetail.taxonomies?.map(tax => {
            if (tax.taxonomy.name === "Bloom's Taxonomy") {
                return {
                    ...tax,
                    level: selectedQuestionDetail.taxonomies?.find(t => t.taxonomy.name === "Bloom's Taxonomy")?.level || 'Remember'
                };
            }
            return tax;
        }) || [{
            taxonomy: { name: "Bloom's Taxonomy" },
            level: selectedQuestionDetail.taxonomies?.find(t => t.taxonomy.name === "Bloom's Taxonomy")?.level || 'Remember'
        }];

        const updatedQuestion = {
            ...selectedQuestionDetail,
            hiddenAnswers: selectedAnswersList.map(selected => !selected),
            difficulty: selectedQuestionDetail.difficulty,
            taxonomies: updatedTaxonomies
        };

        if (overwrite) {
            try {
                console.log('Updating question in bank:', updatedQuestion);
            } catch (error) {
                console.error('Failed to update question in bank:', error);
                return;
            }
        }

        setEditedQuestions(prev => ({
            ...prev,
            [updatedQuestion.id]: updatedQuestion
        }));

        setSelectedQuestions(prev =>
            prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
        );

        setEditMode(false);
        setIsQuestionDialogOpen(false);
    };

    useEffect(() => {
        if (selectedQuestionDetail) {
            const existingQuestion = editedQuestions[selectedQuestionDetail.id];
            const initialAnswerStates = selectedQuestionDetail.answers?.map(() => true) || [];
            if (existingQuestion?.hiddenAnswers) {
                existingQuestion.hiddenAnswers.forEach((isHidden, index) => {
                    if (isHidden) {
                        initialAnswerStates[index] = false;
                    }
                });
            }

            setSelectedAnswers(prev => ({
                ...prev,
                [selectedQuestionDetail.id]: initialAnswerStates
            }));
        }
    }, [selectedQuestionDetail, editedQuestions]);

    // Add helper function to check if a question is in the test
    const isQuestionInTest = (questionId: number) => {
        return selectedQuestions.some(q => q.id === questionId);
    };

    // Update the shuffleQuestionAnswers function
    const shuffleQuestionAnswers = (questionId: number) => {
        if (!selectedQuestionDetail?.answers) return;

        // Determine which answers array to shuffle
        const answersToUse = editMode && editedAnswers ? editedAnswers : selectedQuestionDetail.answers;
        if (!Array.isArray(answersToUse)) return;

        const currentAnswers = [...answersToUse];
        const currentSelected = selectedAnswers[questionId] || currentAnswers.map(() => true);

        // Create array of indices and shuffle them
        const indices = currentAnswers.map((_, index) => index);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Reorder answers and selected states based on shuffled indices
        const shuffledAnswers = indices.map(i => ({ ...currentAnswers[i] }));
        const shuffledSelected = indices.map(i => currentSelected[i]);

        if (editMode) {
            // Update edited answers if in edit mode
            setEditedAnswers(shuffledAnswers);
        } else {
            // Update the question with shuffled answers
            setSelectedQuestionDetail({
                ...selectedQuestionDetail,
                answers: shuffledAnswers
            });
        }

        // Update selected answers state
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: shuffledSelected
        }));
    };

    // Add a recursive function to render bank options
    const renderBankOptions = (banks: QuestionBank[], level: number = 0) => {
        return banks.map(bank => (
            <React.Fragment key={bank.id}>
                <option value={bank.id}>
                    {level > 0 ? '  '.repeat(level) + '↳ ' : ''}{bank.name}
                </option>
                {bank.children && bank.children.length > 0 && renderBankOptions(bank.children, level + 1)}
            </React.Fragment>
        ));
    };

    // Update the filtering logic to handle any depth of nesting
    const findQuestionInBank = (bank: QuestionBank, questionBankId: string): boolean => {
        if (bank.id.toString() === questionBankId) return true;
        if (bank.children) {
            return bank.children.some(child => findQuestionInBank(child, questionBankId));
        }
        return false;
    };

    const getAllQuestionsFromBank = (bank: QuestionBank): any[] => {
        const bankQuestions = bank.questions || [];
        const childQuestions = bank.children?.flatMap(child => getAllQuestionsFromBank(child)) || [];
        return [...bankQuestions, ...childQuestions];
    };

    // Update the filterQuestions function to handle pagination better
    const filterQuestions = () => {
        const allQuestions = questionBanks.flatMap(bank => getAllQuestionsFromBank(bank));

        return allQuestions.filter(question => {
            const matchesSearch = question.question_text.toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesBank = !selectedBankId ||
                question.bank_id === selectedBankId ||
                questionBanks.some(bank => findQuestionInBank(bank, selectedBankId));
            const matchesTaxonomy = selectedLevels.length === 0 ||
                selectedLevels.includes(
                    question.taxonomies?.find((tax: Taxonomy) => tax.taxonomy.name === "Bloom's Taxonomy")?.level || 'Remember'
                );
            return matchesSearch && matchesBank && matchesTaxonomy;
        });
    };

    // Add this function to handle pagination properly
    const getPagedQuestions = (questions: Question[], page: number, perPage: number) => {
        // Filter out questions that are already selected
        const availableQuestions = questions.filter((q: Question) => !selectedQuestions.some(sq => sq.id === q.id));

        // Calculate start and end indices
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;

        // Return the slice of questions for the current page
        return availableQuestions.slice(startIndex, endIndex);
    };

    // Add this function before the return statement
    const calculateDistribution = () => {
        const distribution: QuestionDistribution = {
            'Remember': { easy: 0, medium: 0, hard: 0 },
            'Understand': { easy: 0, medium: 0, hard: 0 },
            'Apply': { easy: 0, medium: 0, hard: 0 },
            'Analyze': { easy: 0, medium: 0, hard: 0 },
            'Evaluate': { easy: 0, medium: 0, hard: 0 },
            'Create': { easy: 0, medium: 0, hard: 0 }
        };

        selectedQuestions.forEach(question => {
            // Get the edited version of the question if it exists
            const editedQuestion = editedQuestions[question.id];
            const questionToUse = editedQuestion || question;

            // Get taxonomy level
            const taxonomy = questionToUse.taxonomies?.find(tax =>
                tax.taxonomy.name === "Bloom's Taxonomy"
            )?.level || 'Remember';

            // Get difficulty (use edited difficulty if available)
            const difficulty = (questionToUse.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard';

            // Update the distribution
            if (distribution[taxonomy]) {
                distribution[taxonomy][difficulty]++;
            }
        });

        return distribution;
    };

    // Create a single handler for showing all questions
    const handleShowAllQuestions = () => {
        setPreviewShowAll(true);
        setPreviewDialogOpen(true);
    };

    // Add this helper function for better shuffling
    const fisherYatesShuffle = (array: Question[]): Question[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Update the handleShuffleQuestions function
    const handleShuffleQuestions = () => {
        // Get new shuffled order
        let newShuffled = fisherYatesShuffle(selectedQuestions);

        // If the new order is the same as current, shuffle again
        if (shuffledQuestions.length > 0 &&
            newShuffled.map(q => q.id).join(',') === shuffledQuestions.map(q => q.id).join(',')) {
            newShuffled = fisherYatesShuffle(selectedQuestions);
        }

        setShuffledQuestions(newShuffled);

        // Show success message
        setAlertMessage('Questions shuffled successfully');
        setAlertType('success');
        setShowAlert(true);

        // Force a re-render of the preview section
        setTimeout(() => {
            setPreviewPage(prev => prev);
        }, 0);
    };

    // Add this function to handle editing completion
    const handleEditComplete = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (editingQuestionText) {
                setSelectedQuestionDetail(prev => prev ? {
                    ...prev,
                    question_text: tempQuestionText
                } : null);
                setEditingQuestionText(false);
            } else if (editingAnswerIndex !== null && selectedQuestionDetail) {
                const updatedAnswers = [...selectedQuestionDetail.answers || []];
                updatedAnswers[editingAnswerIndex] = {
                    ...updatedAnswers[editingAnswerIndex],
                    answer_text: tempAnswerText
                };
                setSelectedQuestionDetail(prev => prev ? {
                    ...prev,
                    answers: updatedAnswers
                } : null);
                setEditingAnswerIndex(null);
            }
        } else if (e.key === 'Escape') {
            setEditingQuestionText(false);
            setEditingAnswerIndex(null);
        }
    };

    // Add this function to handle blur events
    const handleBlur = () => {
        if (editingQuestionText) {
            setSelectedQuestionDetail(prev => prev ? {
                ...prev,
                question_text: tempQuestionText
            } : null);
            setEditingQuestionText(false);
        } else if (editingAnswerIndex !== null && selectedQuestionDetail) {
            const updatedAnswers = [...selectedQuestionDetail.answers || []];
            updatedAnswers[editingAnswerIndex] = {
                ...updatedAnswers[editingAnswerIndex],
                answer_text: tempAnswerText
            };
            setSelectedQuestionDetail(prev => prev ? {
                ...prev,
                answers: updatedAnswers
            } : null);
            setEditingAnswerIndex(null);
        }
    };

    // Add these new functions before the return statement
    const handleCheckAvailableQuestion = (questionId: number) => {
        setCheckedAvailableQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const handleCheckSelectedQuestion = (questionId: number) => {
        setCheckedSelectedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const handleAddSelectedQuestions = () => {
        const questionsToAdd = filteredQuestions.filter(q => checkedAvailableQuestions.has(q.id));
        setSelectedQuestions(prev => [...prev, ...questionsToAdd]);
        setCheckedAvailableQuestions(new Set()); // Clear checked questions
    };

    const handleRemoveSelectedQuestions = () => {
        setSelectedQuestions(prev => prev.filter(q => !checkedSelectedQuestions.has(q.id)));
        setCheckedSelectedQuestions(new Set()); // Clear checked questions
    };

    // Add these new functions before the return statement
    const handleAddAllCheckedQuestions = () => {
        const questionsToAdd = filteredQuestions.filter(q => checkedAvailableQuestions.has(q.id));
        setSelectedQuestions(prev => [...prev, ...questionsToAdd]);
        setCheckedAvailableQuestions(new Set()); // Clear checked questions
    };

    const handleRemoveAllCheckedQuestions = () => {
        setSelectedQuestions(prev => prev.filter(q => !checkedSelectedQuestions.has(q.id)));
        setCheckedSelectedQuestions(new Set()); // Clear checked questions
    };

    // Add these functions before the return statement
    const handleAddAll = () => {
        const availableQuestions = getPagedQuestions(filteredQuestions, availableQuestionsPage, itemsPerPage);
        setSelectedQuestions(prev => {
            const newQuestions = [...prev];
            availableQuestions.forEach(question => {
                if (!newQuestions.some(q => q.id === question.id)) {
                    newQuestions.push(question);
                }
            });
            return newQuestions;
        });
    };

    const handleRemoveAll = () => {
        const currentPageQuestions = selectedQuestions
            .slice((selectedQuestionsPage - 1) * itemsPerPage, selectedQuestionsPage * itemsPerPage)
            .map(q => q.id);
        setSelectedQuestions(prev => prev.filter(q => !currentPageQuestions.includes(q.id)));
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {/* Alert message */}
            {showAlert && (
                <div className={`fixed top-24 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 transform translate-y-0 
                    ${alertType === 'error' ? 'bg-danger text-white' :
                        alertType === 'success' ? 'bg-success text-white' :
                            'bg-warning text-black'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            {alertType === 'error' && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            {alertType === 'warning' && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            )}
                            {alertType === 'success' && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{alertMessage}</p>
                        </div>
                        <div className="ml-auto">
                            <button
                                onClick={() => setShowAlert(false)}
                                className="text-white hover:text-gray-200 focus:outline-none"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Breadcrumb
                pageName="Create Test Manually"
                currentName="Create Test"
                breadcrumbItems={[
                    { name: "Home Page", path: "/" },
                    { name: "Create Test", path: "/create-test" }
                ]}
            />

            <div className="mb-6">
                <select
                    value={selectedCourse}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none"
                >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                </select>
            </div>

            {loading && <div>Loading question banks...</div>}
            {error && <div className="text-danger">{error}</div>}

            {selectedCourse && !loading && (
                <>
                    {/* Test Details Block */}
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                        <div
                            className="border-b border-stroke px-6.5 py-4 dark:border-strokedark cursor-pointer flex justify-between items-center"
                            onClick={() => setIsTestDetailsExpanded(!isTestDetailsExpanded)}
                        >
                            <h3 className="font-medium text-black dark:text-white flex items-center gap-1">
                                Test Details
                                <span className="text-danger text-lg">*</span>
                            </h3>
                            <svg
                                className={`w-4 h-4 transform transition-transform duration-200 ${isTestDetailsExpanded ? 'rotate-180' : ''}`}
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
                                        ref={titleInputRef}
                                        type="text"
                                        placeholder="Enter test title"
                                        value={testData.title}
                                        onChange={handleTitleChange}
                                        className={`w-full rounded border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${showTitleWarning ? 'border-danger' : 'border-stroke'
                                            }`}
                                    />
                                    {showTitleWarning && (
                                        <div className="mt-2 text-danger text-sm">
                                            Please enter a test title
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Question Selection Block */}
                    <div
                        ref={questionsSectionRef}
                        className={`rounded-sm border bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6 ${showQuestionWarning ? 'border-danger' : 'border-stroke'
                            }`}
                    >
                        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-black dark:text-white flex items-center gap-1">
                                        Questions
                                        <span className="text-danger text-lg">*</span>
                                    </h3>
                                    {showQuestionWarning && (
                                        <div className="mt-1 text-danger text-sm">
                                            Please select at least one question
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Available Questions List */}
                        <AnswerBlock
                            title="Available Questions"
                            questions={getPagedQuestions(filteredQuestions, availableQuestionsPage, itemsPerPage)}
                            currentPage={availableQuestionsPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={filteredQuestions.filter(q => !selectedQuestions.some(sq => sq.id === q.id)).length}
                            onPageChange={(page) => setAvailableQuestionsPage(page)}
                            onItemsPerPageChange={(items) => {
                                setItemsPerPage(items);
                                setAvailableQuestionsPage(1);
                                setSelectedQuestionsPage(1);
                            }}
                            onQuestionClick={handleQuestionClick}
                            onToggleQuestion={toggleQuestionSelection}
                            isQuestionSelected={isQuestionSelected}
                            onRemoveAll={handleAddAll}
                            editedQuestions={editedQuestions}
                        />

                        {/* Selected Questions Section */}
                        {selectedQuestions.length > 0 && (
                            <AnswerBlock
                                title="Selected Questions"
                                questions={selectedQuestions}
                                currentPage={selectedQuestionsPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={selectedQuestions.length}
                                onPageChange={(page) => setSelectedQuestionsPage(page)}
                                onItemsPerPageChange={(items) => {
                                    setItemsPerPage(items);
                                    setAvailableQuestionsPage(1);
                                    setSelectedQuestionsPage(1);
                                }}
                                onQuestionClick={handleQuestionClick}
                                onToggleQuestion={toggleQuestionSelection}
                                isQuestionSelected={isQuestionSelected}
                                showRemoveAll={true}
                                onRemoveAll={handleRemoveAll}
                                editedQuestions={editedQuestions}
                            />
                        )}
                    </div>

                    {/* Question Distribution Section */}
                    <QuestionDistribution
                        selectedQuestions={selectedQuestions}
                        editedQuestions={editedQuestions}
                    />

                    {/* Preview Block */}
                    <PreviewBlock
                        testData={testData}
                        selectedQuestions={selectedQuestions}
                        shuffledQuestions={shuffledQuestions}
                        editedQuestions={editedQuestions}
                        answerFormat={answerFormat}
                        previewDialogOpen={previewDialogOpen}
                        setPreviewDialogOpen={setPreviewDialogOpen}
                        previewShowAll={previewShowAll}
                        setPreviewShowAll={setPreviewShowAll}
                        previewPage={previewPage}
                        setPreviewPage={setPreviewPage}
                        handleShuffleQuestions={handleShuffleQuestions}
                        includeKey={includeKey}
                        setIncludeKey={setIncludeKey}
                        setAnswerFormat={setAnswerFormat}
                    />

                    {/* Export Buttons - REMOVED Save Draft button */}
                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={handleCancel}
                            className={`flex w-1/3 items-center justify-center gap-2.5 rounded-md bg-danger py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 ${!selectedCourse ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!selectedCourse}
                        >
                            <span>
                                <svg
                                    className="fill-current"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2719H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z"
                                        fill=""
                                    ></path>
                                    <path
                                        d="M9.00039 9.11255C8.66289 9.11255 8.35352 9.3938 8.35352 9.75942V13.3313C8.35352 13.6688 8.63477 13.9782 9.00039 13.9782C9.33789 13.9782 9.64727 13.6969 9.64727 13.3313V9.75942C9.64727 9.3938 9.33789 9.11255 9.00039 9.11255Z"
                                        fill=""
                                    ></path>
                                    <path
                                        d="M11.2502 9.67504C10.8846 9.64692 10.6033 9.90004 10.5752 10.2657L10.4064 12.7407C10.3783 13.0782 10.6314 13.3875 10.9971 13.4157C11.0252 13.4157 11.0252 13.4157 11.0533 13.4157C11.3908 13.4157 11.6721 13.1625 11.6721 12.825L11.8408 10.35C11.8408 9.98442 11.5877 9.70317 11.2502 9.67504Z"
                                        fill=""
                                    ></path>
                                    <path
                                        d="M6.72245 9.67504C6.38495 9.70317 6.1037 10.0125 6.13182 10.35L6.3287 12.825C6.35683 13.1625 6.63808 13.4157 6.94745 13.4157C6.97558 13.4157 6.97558 13.4157 7.0037 13.4157C7.3412 13.3875 7.62245 13.0782 7.59433 12.7407L7.39745 10.2657C7.39745 9.90004 7.08808 9.64692 6.72245 9.67504Z"
                                        fill=""
                                    ></path>
                                </svg>
                            </span>
                            Cancel
                        </button>

                        <button
                            onClick={handleCreateTest}
                            className={`flex w-1/3 items-center justify-center gap-2.5 rounded-md bg-meta-3 py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 ${!selectedCourse ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!selectedCourse}
                        >
                            <span>
                                <svg
                                    className="fill-current"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M16.5 1.5H1.5C0.675 1.5 0 2.175 0 3V15C0 15.825 0.675 16.5 1.5 16.5H16.5C17.325 16.5 18 15.825 18 15V3C18 2.175 17.325 1.5 16.5 1.5ZM16.5 15H1.5V3H16.5V15ZM4.5 7.5H13.5V9H4.5V7.5ZM4.5 10.5H13.5V12H4.5V10.5ZM4.5 4.5H13.5V6H4.5V4.5Z"
                                        fill=""
                                    ></path>
                                </svg>
                            </span>
                            Create Test
                        </button>

                        <button
                            onClick={exportToWord}
                            className={`flex w-1/3 items-center justify-center gap-2.5 rounded-md bg-primary py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 ${!selectedCourse || selectedQuestions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!selectedCourse || selectedQuestions.length === 0}
                        >
                            <span>
                                <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M16.8754 11.6719C16.5379 11.6719 16.2285 11.9531 16.2285 12.3187V14.8219C16.2285 15.075 16.0316 15.2719 15.7785 15.2719H2.22227C1.96914 15.2719 1.77227 15.075 1.77227 14.8219V12.3187C1.77227 11.9812 1.46289 11.6719 1.12539 11.6719C0.787891 11.6719 0.478516 11.9531 0.478516 12.3187V14.8219C0.478516 15.7781 1.23789 16.5375 2.19414 16.5375H15.7785C16.7348 16.5375 17.4941 15.7781 17.4941 14.8219V12.3187C17.5223 11.9531 17.2129 11.6719 16.8754 11.6719Z"
                                        fill=""
                                    ></path>
                                    <path
                                        d="M8.55074 12.3469C8.66324 12.4594 8.83199 12.5156 9.00074 12.5156C9.16949 12.5156 9.31012 12.4594 9.45074 12.3469L13.4726 8.43752C13.7257 8.1844 13.7257 7.79065 13.4726 7.53752C13.2195 7.2844 12.8257 7.2844 12.5726 7.53752L9.64762 10.4063V2.1094C9.64762 1.7719 9.36637 1.46252 9.00074 1.46252C8.66324 1.46252 8.35387 1.74377 8.35387 2.1094V10.4063L5.45074 7.53752C5.19762 7.2844 4.80387 7.2844 4.55074 7.53752C4.29762 7.79065 4.29762 8.1844 4.55074 8.43752L8.55074 12.3469Z"
                                        fill=""
                                    ></path>
                                </svg>
                            </span>
                            Export to Word
                        </button>
                    </div>
                </>
            )}

            {/* Question Detail Dialog */}
            <Dialog
                open={isQuestionDialogOpen}
                onClose={() => {
                    setIsQuestionDialogOpen(false);
                    setEditMode(false);
                }}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-2xl h-[450px] rounded-lg bg-white dark:bg-boxdark p-4 max-h-[90vh] overflow-y-auto mx-auto transform translate-x-[100px] translate-y-[50px]">
                        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-boxdark z-10 pb-2">
                            <h2 className="text-lg font-semibold text-black dark:text-white">
                                Question Details
                            </h2>

                        </div>

                        {selectedQuestionDetail && (
                            <div className="space-y-3 flex flex-col h-[calc(100%-60px)]">
                                <div className="flex-grow">
                                    <div className="text-black dark:text-white">
                                        {editMode ? (
                                            editingQuestionText ? (
                                                <textarea
                                                    value={tempQuestionText}
                                                    onChange={(e) => setTempQuestionText(e.target.value)}
                                                    onKeyDown={handleEditComplete}
                                                    onBlur={handleBlur}
                                                    className="w-full p-2 border rounded-md"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div
                                                    onDoubleClick={() => {
                                                        setTempQuestionText(sanitizeHtml(selectedQuestionDetail.question_text));
                                                        setEditingQuestionText(true);
                                                    }}
                                                    className="cursor-text hover:bg-gray-100 dark:hover:bg-meta-4 p-2 rounded-md"
                                                >
                                                    Question: {sanitizeHtml(selectedQuestionDetail.question_text)}
                                                </div>
                                            )
                                        ) : (
                                            <div>Question: {sanitizeHtml(selectedQuestionDetail.question_text)}</div>
                                        )}
                                    </div>

                                    {editMode && (
                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="mb-1.5 block text-black dark:text-white">
                                                    Difficulty Level
                                                </label>
                                                <select
                                                    value={selectedQuestionDetail?.difficulty || 'medium'}
                                                    onChange={(e) => setSelectedQuestionDetail(prev => prev ? {
                                                        ...prev,
                                                        difficulty: e.target.value as 'easy' | 'medium' | 'hard'
                                                    } : null)}
                                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                                >
                                                    <option value="easy">Easy</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="hard">Hard</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-black dark:text-white">
                                                    Taxonomy Level
                                                </label>
                                                <select
                                                    value={selectedQuestionDetail?.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level || 'Remember'}
                                                    onChange={(e) => {
                                                        const newLevel = e.target.value;
                                                        setSelectedQuestionDetail(prev => {
                                                            if (!prev) return null;

                                                            // Create a new taxonomies array
                                                            let newTaxonomies;
                                                            if (prev.taxonomies && prev.taxonomies.length > 0) {
                                                                // If taxonomies exist, update the Bloom's taxonomy
                                                                newTaxonomies = prev.taxonomies.map(tax => {
                                                                    if (tax.taxonomy.name === "Bloom's Taxonomy") {
                                                                        return { ...tax, level: newLevel };
                                                                    }
                                                                    return tax;
                                                                });
                                                            } else {
                                                                // If no taxonomies exist, create a new one
                                                                newTaxonomies = [{
                                                                    taxonomy: { name: "Bloom's Taxonomy" },
                                                                    level: newLevel
                                                                }];
                                                            }

                                                            return {
                                                                ...prev,
                                                                taxonomies: newTaxonomies
                                                            };
                                                        });
                                                    }}
                                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                                >
                                                    {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(level => (
                                                        <option key={level} value={level}>{level}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-3">
                                        <h4 className="font-medium text-black dark:text-white mb-2">Answers:</h4>
                                        <div className="space-y-2">
                                            {selectedQuestionDetail.answers?.map((answer, index) => {
                                                const isSelected = selectedAnswers[selectedQuestionDetail.id]?.[index] || false;
                                                return (
                                                    <div
                                                        key={index}
                                                        className={`p-2 rounded-sm ${answer.is_correct ? 'bg-success/10' : ''} ${editMode ? 'hover:bg-gray-50 dark:hover:bg-meta-4' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            {editMode && (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleAnswer(selectedQuestionDetail.id, index)}
                                                                    className="mt-1 cursor-pointer"
                                                                />
                                                            )}
                                                            <div className="flex-grow">
                                                                <span>{String.fromCharCode(65 + index)}) </span>
                                                                {editMode ? (
                                                                    editingAnswerIndex === index ? (
                                                                        <textarea
                                                                            value={tempAnswerText}
                                                                            onChange={(e) => setTempAnswerText(e.target.value)}
                                                                            onKeyDown={handleEditComplete}
                                                                            onBlur={handleBlur}
                                                                            className="w-full p-2 border rounded-md"
                                                                            autoFocus
                                                                        />
                                                                    ) : (
                                                                        <span
                                                                            onDoubleClick={() => {
                                                                                setTempAnswerText(sanitizeHtml(answer.answer_text));
                                                                                setEditingAnswerIndex(index);
                                                                            }}
                                                                            className="cursor-text hover:bg-gray-100 dark:hover:bg-meta-4 p-1 rounded"
                                                                        >
                                                                            {sanitizeHtml(answer.answer_text)}
                                                                        </span>
                                                                    )
                                                                ) : (
                                                                    <span>
                                                                        {sanitizeHtml(answer.answer_text)}
                                                                        {!editMode && answer.is_correct && (
                                                                            <span className="text-meta-3 ml-2">✓</span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Question Detail Dialog buttons */}
                                <div className={`flex justify-end gap-3 py-2 mt-auto ${editMode ? 'sticky bottom-0 bg-white dark:bg-boxdark' : ''}`}>
                                    {!editMode ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setIsQuestionDialogOpen(false);
                                                    setEditMode(false);
                                                }}
                                                className="rounded bg-danger px-4 py-1.5 text-white hover:bg-opacity-90 min-w-[80px]"
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={() => setEditMode(true)}
                                                className="rounded bg-primary px-4 py-1.5 text-white hover:bg-opacity-90 min-w-[80px]"
                                            >
                                                Edit
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditMode(false);  // Just return to view mode
                                                }}
                                                className="rounded bg-danger px-4 py-1.5 text-white hover:bg-opacity-90 min-w-[80px]"
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={() => setEditMode(true)}
                                                className="rounded bg-primary px-4 py-1.5 text-white hover:bg-opacity-90 min-w-[80px]"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleSaveChanges(false)}
                                                className="rounded bg-primary px-4 py-1.5 text-white hover:bg-opacity-90 min-w-[80px]"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => handleSaveChanges(true)}
                                                className="rounded bg-success px-4 py-1.5 text-white hover:bg-opacity-90 min-w-[100px]"
                                            >
                                                Save & Overwrite
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </Dialog.Panel>
                </div>
            </Dialog>



            {/* Last saved indicator */}
            {testData.lastSaved && (
                <div className="mb-2">
                    <span className="text-sm text-gray-500">
                        Auto-saved: {new Date(testData.lastSaved).toLocaleString()}
                    </span>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark">
                        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                            {confirmTitle}
                        </h3>
                        <p className="mb-6 text-body-color dark:text-body-color-dark">
                            {confirmMessage}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="rounded border border-stroke px-4 py-2 text-black transition hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    confirmAction();
                                }}
                                className="rounded bg-danger px-4 py-2 text-white transition hover:bg-opacity-90"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTest; 