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
import { Pie } from 'react-chartjs-2';
import React from 'react';
import axios from 'axios';

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

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Add new interface for edited answer visibility
interface EditedQuestion extends Question {
    hiddenAnswers?: boolean[];
}

// Update the truncateText function
const truncateText = (text: string, maxLength: number = 50) => {
    // First remove any HTML tags
    const cleanText = text.replace(/<[^>]+>/g, '');
    if (cleanText.length <= maxLength) return cleanText;
    // Find the last space before maxLength to avoid cutting words in the middle
    const lastSpace = cleanText.substring(0, maxLength).lastIndexOf(' ');
    // If no space found, just cut at maxLength
    const truncateAt = lastSpace > 0 ? lastSpace : maxLength;
    return cleanText.substring(0, truncateAt) + '...';
};

// Add this type near the other interfaces at the top
interface QuestionDistribution {
    [key: string]: {
        easy: number;
        medium: number;
        hard: number;
    };
}

const CreateTest = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Array<{ id: string, name: string }>>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [testData, setTestData] = useState({
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
    const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

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
                    question.taxonomies?.some((tax: { taxonomy: { name: string }; level: string }) =>
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
            await deleteTestDraft(selectedCourse);
            
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
            
            // Prepare the test data
            const testPayload = {
                title: testData.title,
                description: testData.description,
                duration: testData.duration,
                passing_score: testData.passingScore,
                shuffle_questions: shuffleQuestions,
                shuffle_answers: shuffleAnswers,
                include_answer_key: includeKey,
                answer_format: answerFormat,
                questions: selectedQuestions.map(q => ({
                    id: q.id,
                    // Include any edited question data
                    ...(editedQuestions[q.id] ? {
                        edited_text: editedQuestions[q.id].question_text,
                        hidden_answers: editedQuestions[q.id].hiddenAnswers
                    } : {})
                }))
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
                        await deleteTestDraft(selectedCourse);
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

        const updatedQuestion = {
            ...selectedQuestionDetail,
            hiddenAnswers: selectedAnswersList.map(selected => !selected)
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

    // Add shuffle answers function
    const shuffleQuestionAnswers = (questionId: number) => {
        if (!selectedQuestionDetail?.answers) return;

        // Create a copy of the current answers array
        const currentAnswers = [...selectedQuestionDetail.answers];
        const currentSelected = selectedAnswers[questionId] || currentAnswers.map(() => true);

        // Create array of indices and shuffle them
        const indices = currentAnswers.map((_, index) => index);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Reorder answers and selected states based on shuffled indices
        const shuffledAnswers = indices.map(i => currentAnswers[i]);
        const shuffledSelected = indices.map(i => currentSelected[i]);

        // Update the question with shuffled answers
        setSelectedQuestionDetail({
            ...selectedQuestionDetail,
            answers: shuffledAnswers
        });

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
                    question.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level || 'Remember'
                );
            return matchesSearch && matchesBank && matchesTaxonomy;
        });
    };

    // Add this function to handle pagination properly
    const getPagedQuestions = (questions, page, perPage) => {
        // Filter out questions that are already selected
        const availableQuestions = questions.filter(q => !selectedQuestions.some(sq => sq.id === q.id));
        
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
            const taxonomy = question.taxonomies?.find(tax =>
                tax.taxonomy.name === "Bloom's Taxonomy"
            )?.level || 'Remember';

            // For this example, we'll set all questions as 'medium' difficulty
            // You can modify this once you have actual difficulty data
            const difficulty = 'medium';

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
                        <div className="p-6.5 border-b border-stroke dark:border-strokedark">
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
                                    <div className="relative">
                                        <select
                                            value={selectedBankId}
                                            onChange={(e) => setSelectedBankId(e.target.value)}
                                            className="rounded-md border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none"
                                        >
                                            <option value="">All Banks</option>
                                            {renderBankOptions(questionBanks)}
                                        </select>
                                    </div>
                                    <svg
                                        className={`w-4 h-4 transform transition-transform duration-200 cursor-pointer ${showQuestionBank ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                        onClick={() => setShowQuestionBank(!showQuestionBank)}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Add Column Headers */}
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

                                {getPagedQuestions(filteredQuestions, availableQuestionsPage, itemsPerPage)
                                    .map((question, index) => {
                                        const questionNumber = ((availableQuestionsPage - 1) * itemsPerPage) + index + 1;
                                        
                                        return (
                                            <div
                                                key={question.id}
                                                className="p-4 border rounded-sm dark:border-strokedark"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-500">{questionNumber}.</span>
                                                            <div
                                                                className="flex items-center gap-2 text-sm font-medium text-black dark:text-white hover:text-primary"
                                                                onClick={() => handleQuestionClick(question)}
                                                            >
                                                                <div className="inline" dangerouslySetInnerHTML={{ __html: question.question_text }} />
                                                                {question.statistics && (
                                                                    <span className="text-xs text-gray-500 shrink-0">
                                                                        (D: {question.statistics.scaled_difficulty.toFixed(2)},
                                                                        Disc: {question.statistics.scaled_discrimination.toFixed(2)})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-8">
                                                        <span className="text-sm text-gray-500 w-24 text-center">
                                                            N/A
                                                        </span>
                                                        <span className="text-sm text-gray-500 w-24 text-center">
                                                            {question.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level || 'N/A'}
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
                                        );
                                    })}
                            </div>

                            <Pagination
                                totalItems={filteredQuestions.filter(q => !selectedQuestions.some(sq => sq.id === q.id)).length}
                                itemsPerPage={itemsPerPage}
                                currentPage={availableQuestionsPage}
                                onPageChange={(page) => setAvailableQuestionsPage(page)}
                                onItemsPerPageChange={(items) => {
                                    setItemsPerPage(items);
                                    setAvailableQuestionsPage(1);
                                    setSelectedQuestionsPage(1);
                                }}
                            />
                        </div>

                        {/* Selected Questions Section */}
                        {selectedQuestions.length > 0 && (
                            <div className="p-6.5">
                                <h4 className="font-medium text-black dark:text-white mb-4">
                                    Selected Questions ({selectedQuestions.length})
                                </h4>
                                <div className="space-y-4">
                                    {/* Add Column Headers for Selected Questions */}
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

                                    {selectedQuestions
                                        .slice((selectedQuestionsPage - 1) * itemsPerPage, selectedQuestionsPage * itemsPerPage)
                                        .map((question, index) => {
                                            const questionNumber = ((selectedQuestionsPage - 1) * itemsPerPage) + index + 1;
                                            return (
                                                <div
                                                    key={question.id}
                                                    className="p-4 border rounded-sm dark:border-strokedark"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex gap-4 flex-1">
                                                            <span className="text-gray-500">{questionNumber}.</span>
                                                            <div className="flex-1">
                                                                <div
                                                                    className="cursor-pointer hover:text-primary"
                                                                    onClick={() => handleQuestionClick(question)}
                                                                    dangerouslySetInnerHTML={{ __html: question.question_text }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-8">
                                                            <span className="text-sm text-gray-500 w-24 text-center">
                                                                N/A
                                                            </span>
                                                            <span className="text-sm text-gray-500 w-24 text-center">
                                                                {question.taxonomies?.find(tax => tax.taxonomy.name === "Bloom's Taxonomy")?.level || 'N/A'}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleQuestionSelection(question);
                                                                }}
                                                                className="text-danger hover:text-meta-1 w-12"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>

                                <Pagination
                                    totalItems={selectedQuestions.length}
                                    itemsPerPage={itemsPerPage}
                                    currentPage={selectedQuestionsPage}
                                    onPageChange={(page) => setSelectedQuestionsPage(page)}
                                    onItemsPerPageChange={(items) => {
                                        setItemsPerPage(items);
                                        setAvailableQuestionsPage(1);
                                        setSelectedQuestionsPage(1);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Preview Block */}
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
                        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                Preview
                            </h3>
                        </div>

                        <div className="p-6.5">
                            {/* Test Configuration */}
                            <div className="mb-6 bg-gray-50 dark:bg-meta-4 p-4 rounded-sm">
                                <h4 className="text-lg font-medium text-black dark:text-white mb-4">
                                    Test Configuration
                                </h4>
                                <div className="flex gap-6 flex-wrap">
                                    <div>
                                        <label className="mb-2.5 block text-black dark:text-white">
                                            Letter Case
                                        </label>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setAnswerFormat(prev => ({ ...prev, case: 'uppercase' }))}
                                                className={`px-4 py-2 rounded ${answerFormat.case === 'uppercase'
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white dark:bg-meta-4 border border-stroke'
                                                    }`}
                                            >
                                                ABC
                                            </button>
                                            <button
                                                onClick={() => setAnswerFormat(prev => ({ ...prev, case: 'lowercase' }))}
                                                className={`px-4 py-2 rounded ${answerFormat.case === 'lowercase'
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white dark:bg-meta-4 border border-stroke'
                                                    }`}
                                            >
                                                abc
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2.5 block text-black dark:text-white">
                                            Separator
                                        </label>
                                        <div className="flex gap-3">
                                            {[')', '.', '/'].map(separator => (
                                                <button
                                                    key={separator}
                                                    onClick={() => setAnswerFormat(prev => ({ ...prev, separator }))}
                                                    className={`px-4 py-2 rounded ${answerFormat.separator === separator
                                                        ? 'bg-primary text-white'
                                                        : 'bg-white dark:bg-meta-4 border border-stroke'
                                                        }`}
                                                >
                                                    A{separator}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2.5 block text-black dark:text-white">
                                            Answer Key
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIncludeKey(!includeKey)}
                                                className="relative w-[46px] h-[24px] rounded-full transition-colors duration-300 ease-in-out focus:outline-none"
                                                style={{
                                                    backgroundColor: includeKey ? '#4318FF' : '#E2E8F0'
                                                }}
                                            >
                                                {/* Sliding circle button */}
                                                <div
                                                    className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out
                                                        ${includeKey ? 'translate-x-[22px]' : 'translate-x-0'}`}
                                                />
                                            </button>
                                            <span className="text-sm text-black dark:text-white">
                                                {includeKey ? 'Show' : 'Hide'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Test Preview */}
                            <div className="border border-stroke dark:border-strokedark rounded-sm p-6 relative">
                                <div className="mb-4 flex justify-between items-center">
                                    <h4 className="text-lg font-medium text-black dark:text-white">
                                        Test Preview
                                    </h4>
                                    
                                    {/* Update the Show All button */}
                                    {selectedQuestions.length > 2 && (
                                        <button
                                            onClick={handleShowAllQuestions}
                                            className="text-primary hover:text-opacity-80 text-sm font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Show All Questions
                                        </button>
                                    )}
                                </div>

                                {/* Preview Sample */}
                                <div className="space-y-4">
                                    {selectedQuestions.slice(0, 2).map((question, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="font-medium">
                                                Question {index + 1}: {sanitizeHtml(question.question_text)}
                                            </div>
                                            <div className="pl-4 space-y-1">
                                                {question.answers?.map((answer, ansIndex) => (
                                                    <div key={ansIndex}>
                                                        {answerFormat.case === 'uppercase'
                                                            ? String.fromCharCode(65 + ansIndex)
                                                            : String.fromCharCode(97 + ansIndex)}
                                                        {answerFormat.separator} {sanitizeHtml(answer.answer_text)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Update the message at the bottom with a more visible button */}
                                {selectedQuestions.length > 2 && (
                                    <div className="mt-4 text-sm text-gray-500">
                                        {selectedQuestions.length - 2} more question{selectedQuestions.length - 2 !== 1 ? 's' : ''} not shown. 
                                        <button 
                                            onClick={handleShowAllQuestions}
                                            className="ml-2 px-3 py-1 bg-primary text-white rounded-md text-xs hover:bg-opacity-90"
                                        >
                                            Preview All
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
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
                                                const difficulties = calculateDistribution()[taxonomy];
                                                const rowTotal = Object.values(difficulties).reduce((sum, count) => sum + count, 0);

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
                                            {/* Total Row */}
                                            <tr className="bg-gray-2 dark:bg-meta-4">
                                                <td className="py-3 px-4 font-medium">Total</td>
                                                <td className="py-3 px-4 text-center font-medium">
                                                    {Object.values(calculateDistribution()).reduce((sum, diff) => sum + diff.easy, 0)}
                                                </td>
                                                <td className="py-3 px-4 text-center font-medium">
                                                    {Object.values(calculateDistribution()).reduce((sum, diff) => sum + diff.medium, 0)}
                                                </td>
                                                <td className="py-3 px-4 text-center font-medium">
                                                    {Object.values(calculateDistribution()).reduce((sum, diff) => sum + diff.hard, 0)}
                                                </td>
                                                <td className="py-3 px-4 text-center font-medium">
                                                    {selectedQuestions.length}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Export Buttons - REMOVED Save Draft button */}
                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={exportToWord}
                            className={`inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10 ${
                                !selectedCourse || selectedQuestions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={!selectedCourse || selectedQuestions.length === 0}
                        >
                            <span>
                                <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16.8754 11.6719C16.5379 11.6719 16.2285 11.9531 16.2285 12.3187V14.8219C16.2285 15.075 16.0316 15.2719 15.7785 15.2719H2.22227C1.96914 15.2719 1.77227 15.075 1.77227 14.8219V12.3187C1.77227 11.9812 1.49102 11.6719 1.12539 11.6719C0.759766 11.6719 0.478516 11.9531 0.478516 12.3187V14.8219C0.478516 15.7781 1.23789 16.5375 2.19414 16.5375H15.7785C16.7348 16.5375 17.4941 15.7781 17.4941 14.8219V12.3187C17.5223 11.9531 17.2129 11.6719 16.8754 11.6719Z" fill=""></path>
                                    <path d="M8.55074 12.3469C8.66324 12.4594 8.83199 12.5156 9.00074 12.5156C9.16949 12.5156 9.31012 12.4594 9.45074 12.3469L13.4726 8.43752C13.7257 8.1844 13.7257 7.79065 13.4726 7.53752C13.2195 7.2844 12.8257 7.2844 12.5726 7.53752L9.64762 10.4063V2.1094C9.64762 1.7719 9.36637 1.46252 9.00074 1.46252C8.66324 1.46252 8.35387 1.74377 8.35387 2.1094V10.4063L5.45699 7.53752C5.20387 7.2844 4.81012 7.2844 4.55699 7.53752C4.30387 7.79065 4.30387 8.1844 4.55699 8.43752L8.55074 12.3469Z" fill=""></path>
                                </svg>
                            </span>
                            Export to Word
                        </button>
                        
                        <button
                            onClick={() => setPreviewDialogOpen(true)}
                            className={`inline-flex items-center justify-center gap-2.5 rounded-md bg-meta-3 py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10 ${
                                !selectedCourse || selectedQuestions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={!selectedCourse || selectedQuestions.length === 0}
                        >
                            <span>
                                <svg className="fill-current" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill=""></path>
                                </svg>
                            </span>
                            Preview Test
                        </button>
                        
                        <button
                            onClick={handleCreateTest}
                            className={`inline-flex items-center justify-center gap-2.5 rounded-md bg-meta-3 py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10 ${
                                !selectedCourse ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
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
                                        d="M9 3.75C4.65 3.75 1.125 6.75 0 10.5C1.125 14.25 4.65 17.25 9 17.25C13.35 17.25 16.875 14.25 18 10.5C16.875 6.75 13.35 3.75 9 3.75ZM9 15C6.525 15 4.5 12.975 4.5 10.5C4.5 8.025 6.525 6 9 6C11.475 6 13.5 8.025 13.5 10.5C13.5 12.975 11.475 15 9 15ZM9 7.5C7.35 7.5 6 8.85 6 10.5C6 12.15 7.35 13.5 9 13.5C10.65 13.5 12 12.15 12 10.5C12 8.85 10.65 7.5 9 7.5Z"
                                        fill=""
                                    ></path>
                                </svg>
                            </span>
                            Create Test
                        </button>
                        
                        <button
                            onClick={handleCancel}
                            className={`inline-flex items-center justify-center gap-2.5 rounded-md bg-danger py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10 ${
                                !selectedCourse ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
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
                    </div>
                </>
            )}

            {/* Question Detail Dialog */}
            <Dialog
                open={isQuestionDialogOpen}
                onClose={() => setIsQuestionDialogOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-end pr-[15%] p-4">
                    <Dialog.Panel className="w-full max-w-3xl rounded-lg bg-white dark:bg-boxdark p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-black dark:text-white">
                                Question Details
                            </h2>
                            {isQuestionInTest(selectedQuestionDetail?.id || 0) && (
                                <button
                                    onClick={() => shuffleQuestionAnswers(selectedQuestionDetail?.id || 0)}
                                    className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-white hover:bg-opacity-90 transition-all duration-200"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    Shuffle Answers
                                </button>
                            )}
                        </div>

                        {selectedQuestionDetail && (
                            <div className="space-y-4">
                                <div className="text-black dark:text-white">
                                    <div dangerouslySetInnerHTML={{ __html: selectedQuestionDetail.question_text }} />
                                </div>

                                <div className="mt-4">
                                    <h4 className="font-medium text-black dark:text-white mb-2">Answers:</h4>
                                    <div className="space-y-2">
                                        {selectedQuestionDetail.answers?.map((answer, index) => {
                                            const isSelected = selectedAnswers[selectedQuestionDetail.id]?.[index] || false;
                                            const isHidden = editedQuestions[selectedQuestionDetail.id]?.hiddenAnswers?.[index];
                                            return (
                                                <div
                                                    key={index}
                                                    className={`p-2 rounded transition-all duration-200 ${isQuestionInTest(selectedQuestionDetail.id)
                                                        ? `cursor-pointer ${isSelected
                                                            ? answer.is_correct
                                                                ? 'bg-meta-3/10 border border-meta-3'
                                                                : 'bg-gray-100 dark:bg-meta-4'
                                                            : 'bg-gray-50 dark:bg-meta-4/50'
                                                        }`
                                                        : answer.is_correct
                                                            ? 'bg-meta-3/10 border border-meta-3'
                                                            : 'bg-gray-100 dark:bg-meta-4'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        {isQuestionInTest(selectedQuestionDetail.id) && (
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleAnswer(selectedQuestionDetail.id, index)}
                                                                className="mt-1 cursor-pointer"
                                                            />
                                                        )}
                                                        <div className={`flex-1 transition-all duration-200 ${!isSelected ? 'text-gray-400 font-normal' : 'text-black dark:text-white font-medium'}`}>
                                                            <span>{String.fromCharCode(65 + index)})</span>
                                                            <div className="inline-block ml-2" dangerouslySetInnerHTML={{ __html: answer.answer_text }} />
                                                            {answer.is_correct && (
                                                                <span className="text-meta-3 ml-2">✓</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-4">
                                    {isQuestionInTest(selectedQuestionDetail.id) ? (
                                        <>
                                            <button
                                                onClick={() => setIsQuestionDialogOpen(false)}
                                                className="rounded bg-danger px-6 py-2 text-white hover:bg-opacity-90"
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={() => handleSaveChanges(false)}
                                                className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => handleSaveChanges(true)}
                                                className="rounded bg-success px-6 py-2 text-white hover:bg-opacity-90"
                                            >
                                                Save & Overwrite
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsQuestionDialogOpen(false)}
                                            className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90"
                                        >
                                            Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog
                open={previewDialogOpen}
                onClose={() => {
                    setPreviewDialogOpen(false);
                    setPreviewShowAll(false);
                    setPreviewPage(1);
                }}
                className="relative z-[100]"
            >
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center">
                    <div
                        className="w-[90%] max-w-2xl bg-white dark:bg-boxdark rounded-lg shadow-lg p-8 max-h-[80vh] overflow-y-auto"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-semibold text-black dark:text-white">
                                {testData.title || 'Untitled Test'}
                            </h2>
                            <button
                                onClick={() => setPreviewDialogOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {(shuffleQuestions ? [...selectedQuestions].sort(() => Math.random() - 0.5) : selectedQuestions)
                                .map((question, index) => (
                                    <div key={index} className="space-y-3">
                                        <div className="font-medium text-black dark:text-white">
                                            Question {index + 1}: {sanitizeHtml(question.question_text)}
                                        </div>
                                        <div className="pl-6 space-y-2">
                                            {question.answers?.map((answer, ansIndex) => (
                                                <div
                                                    key={ansIndex}
                                                    className="text-black dark:text-white"
                                                >
                                                    {answerFormat.case === 'uppercase'
                                                        ? String.fromCharCode(65 + ansIndex)
                                                        : String.fromCharCode(97 + ansIndex)}
                                                    {answerFormat.separator} {sanitizeHtml(answer.answer_text)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
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