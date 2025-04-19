import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import SimilarityDialog from '../components/SimilarityDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { fetchCourses, fetchQuestionBanks, addQuestion, fetchQuestionGroups, createQuestionGroup } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

type ExpandedSections = {
    [key: string]: boolean;
};

type Answer = {
    id: string;
    text: string;
    explanation: string;
    grade: string;
};

interface Question {
    questionText: string;
    answers: Answer[];
    singleAnswer: boolean;
    shuffle: false;
    difficulty?: string;
}

interface GroupSubmission {
    name: string;
    context: string;
    questions: Question[];
}

type SelectedTags = {
    subject?: string;
    bloom?: string;
};

const AddManyQues = () => {
    const { courseId, chapterId } = useParams();
    const navigate = useNavigate();
    
    const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
        context: true,
        content: true,
        tags: false,
    });

    const [context, setContext] = useState('');
    const [questions, setQuestions] = useState<Question[]>([{
        questionText: '',
        answers: [
            { id: 'A', text: '', explanation: '', grade: '0' },
            { id: 'B', text: '', explanation: '', grade: '0' },
            { id: 'C', text: '', explanation: '', grade: '0' },
            { id: 'D', text: '', explanation: '', grade: '0' },
        ],
        singleAnswer: true,
        shuffle: false,
    }]);

    const [selectedTags, setSelectedTags] = useState<SelectedTags>({});
    const [isSimilarityDialogOpen, setIsSimilarityDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

    const [courses, setCourses] = useState<Array<{ id: string, name: string }>>([]);
    const [banks, setBanks] = useState<Array<{ id: string, name: string }>>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBank, setSelectedBank] = useState('');
    const [groupName, setGroupName] = useState('');

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const coursesData = await fetchCourses();
                setCourses(coursesData);
            } catch (err) {
                setError('Failed to load courses');
            }
        };
        loadCourses();
    }, []);

    const handleCourseChange = async (courseId: string) => {
        setSelectedCourse(courseId);
        if (courseId) {
            try {
                const banksData = await fetchQuestionBanks(courseId);
                setBanks(banksData);
            } catch (err) {
                setError('Failed to load question banks');
            }
        } else {
            setBanks([]);
        }
        setSelectedBank('');
    };

    const stripHtml = (html) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const handleSubmit = async () => {
        // Use the selected course and bank if URL params are not available
        const effectiveCourseId = courseId || selectedCourse;
        const effectiveBankId = chapterId || selectedBank;
        
        if (!effectiveCourseId || !effectiveBankId) {
            setError('Please select a course and question bank');
            return;
        }
        
        if (!groupName.trim()) {
            setError('Group name is required');
            return;
        }
        
        if (!context.trim()) {
            setError('Context is required');
            return;
        }
        
        if (questions.some(q => !q.questionText.trim())) {
            setError('All questions must have text');
            return;
        }
        
        if (questions.some(q => q.answers.some(a => !a.text.trim()))) {
            setError('All answers must have text');
            return;
        }
        
        setLoading(true);
        try {
            // Step 1: Create the question group
            const groupResponse = await createQuestionGroup(effectiveCourseId, effectiveBankId, {
                name: groupName,
                context: context
            });
            
            const groupId = groupResponse.id;
            
            // Step 2: Create each question in the group
            for (const question of questions) {
                // Transform the question data to match the API format
                const questionData = {
                    question_text: stripHtml(question.questionText),
                    question_group_id: groupId,
                    difficulty: question.difficulty || 'medium',
                    answers: question.answers.map(answer => ({
                        answer_text: answer.text,
                        is_correct: answer.grade !== '0',
                        explanation: answer.explanation
                    }))
                };
                
                await addQuestion(effectiveCourseId, effectiveBankId, questionData);
            }
            
            // Success! Navigate back to the questions list
            navigate(`/courses/${effectiveCourseId}/question-banks/${effectiveBankId}/questions`, {
                state: { success: 'Question group created successfully' }
            });
            
        } catch (err) {
            console.error('Error creating question group:', err);
            setError('Failed to create question group');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleAnswerChange = (questionIndex: number, answerId: string, field: keyof Answer, value: string) => {
        setQuestions(prevQuestions => {
            const newQuestions = [...prevQuestions];
            const question = newQuestions[questionIndex];
            question.answers = question.answers.map(answer =>
                answer.id === answerId ? { ...answer, [field]: value } : answer
            );
            return newQuestions;
        });
    };

    const addNewQuestion = () => {
        setQuestions(prev => [...prev, {
            questionText: '',
            answers: [
                { id: 'A', text: '', explanation: '', grade: '0' },
                { id: 'B', text: '', explanation: '', grade: '0' },
                { id: 'C', text: '', explanation: '', grade: '0' },
                { id: 'D', text: '', explanation: '', grade: '0' },
            ],
            singleAnswer: true,
            shuffle: false,
        }]);
    };

    const handleTagChange = (category: keyof SelectedTags, value: string) => {
        setSelectedTags(prevTags => ({
            ...prevTags,
            [category]: value,
        }));
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-black dark:text-white">Add Question Group</h1>

            {/* Context Block */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
                    <h3 className="text-2xl font-semibold text-black dark:text-white">Context</h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-5 h-5 transition-transform duration-200 cursor-pointer ${expandedSections.context ? 'rotate-180' : ''}`}
                        onClick={() => toggleSection('context')}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
                {expandedSections.context && (
                    <div className="px-6.5 py-4">
                        <div className="mb-4">
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                                Group Name
                            </label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Enter a name for this question group"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            />
                        </div>
                        
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Context (shared among all questions in this group)
                </label>
                <Editor
                    apiKey="it0vzbrjmv1qzhgge99xqz12j84evhl7q00gf4b0v3ylwlfx"
                    value={context}
                    onEditorChange={setContext}
                    init={{
                        height: 250,
                        menubar: false,
                        plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image',
                            'charmap', 'preview', 'anchor', 'searchreplace',
                            'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                            'media', 'table', 'code', 'help', 'wordcount', 'equation'
                        ],
                        toolbar: 'undo redo | formatselect | ' +
                            'bold italic forecolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | table | equation | help',
                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                    }}
                />
            </div>
        )}
    </div>

    {/* Main Questions and Answers Block */}
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
            <h3 className="text-2xl font-semibold text-black dark:text-white">Questions and Answers</h3>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`w-5 h-5 transition-transform duration-200 cursor-pointer ${expandedSections.content ? 'rotate-180' : ''}`}
                onClick={() => toggleSection('content')}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
        </div>
        {expandedSections.content && (
            <div className="px-6.5 py-4 space-y-6">
                {questions.map((question, qIndex) => (
                    <React.Fragment key={qIndex}>
                        <div className="border border-stroke p-4 rounded-sm dark:border-strokedark">
                            <h4 className="text-xl font-semibold mb-4 text-black dark:text-white">
                                Question {qIndex + 1}
                            </h4>

                            {/* Question Text Editor */}
                            <div className="mb-4">
                                <Editor
                                    apiKey="it0vzbrjmv1qzhgge99xqz12j84evhl7q00gf4b0v3ylwlfx"
                                    value={question.questionText}
                                    onEditorChange={(content) => {
                                        const newQuestions = [...questions];
                                        newQuestions[qIndex].questionText = content;
                                        setQuestions(newQuestions);
                                    }}
                                    init={{
                                        height: 250,
                                        menubar: false,
                                        plugins: [
                                            'advlist', 'autolink', 'lists', 'link', 'image',
                                            'charmap', 'preview', 'anchor', 'searchreplace',
                                            'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                                            'media', 'table', 'code', 'help', 'wordcount', 'equation'
                                        ],
                                        toolbar: 'undo redo | formatselect | ' +
                                            'bold italic forecolor | alignleft aligncenter ' +
                                            'alignright alignjustify | bullist numlist outdent indent | ' +
                                            'removeformat | equation | help',
                                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                                    }}
                                />
                            </div>

                            {/* Question Settings */}
                            <div className="flex flex-col gap-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <label className="font-medium text-black dark:text-white">
                                        Difficulty:
                                    </label>
                                    <select
                                        value={question.difficulty || 'medium'}
                                        onChange={(e) => {
                                            const newQuestions = [...questions];
                                            newQuestions[qIndex].difficulty = e.target.value;
                                            setQuestions(newQuestions);
                                        }}
                                        className="rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="font-medium text-black dark:text-white">
                                        One or Multiple answers?
                                    </label>
                                    <select
                                        value={question.singleAnswer ? "one" : "multiple"}
                                        onChange={(e) => {
                                            const newQuestions = [...questions];
                                            newQuestions[qIndex].singleAnswer = e.target.value === "one";
                                            setQuestions(newQuestions);
                                        }}
                                        className="rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="one">One answer only</option>
                                        <option value="multiple">Multiple answers allowed</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={question.shuffle}
                                        onChange={(e) => {
                                            const newQuestions = [...questions];
                                            newQuestions[qIndex].shuffle = e.target.checked;
                                            setQuestions(newQuestions);
                                        }}
                                        className="form-checkbox"
                                    />
                                    <label className="font-medium text-black dark:text-white">
                                        Shuffle the choices?
                                    </label>
                                </div>
                            </div>

                            {/* Answers Section */}
                            <div className="space-y-4">
                                {question.answers.map((answer) => (
                                    <div key={answer.id} className="rounded border border-stroke p-4 bg-white dark:bg-boxdark">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="font-medium text-black dark:text-white">
                                                Answer {answer.id}
                                            </label>
                                            <select
                                                value={answer.grade}
                                                onChange={(e) => handleAnswerChange(qIndex, answer.id, 'grade', e.target.value)}
                                                className="w-[200px] rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                            >
                                                <option value="100">100%</option>
                                                <option value="50">50%</option>
                                                <option value="10">10%</option>
                                                <option value="5">5%</option>
                                                <option value="0">0%</option>
                                            </select>
                                        </div>

                                        {/* Answer Text Editor */}
                                        <Editor
                                            apiKey="it0vzbrjmv1qzhgge99xqz12j84evhl7q00gf4b0v3ylwlfx"
                                            value={answer.text}
                                            onEditorChange={(content) => handleAnswerChange(qIndex, answer.id, 'text', content)}
                                            init={{
                                                height: 250,
                                                menubar: false,
                                                plugins: [
                                                    'advlist', 'autolink', 'lists', 'link', 'image',
                                                    'charmap', 'preview', 'anchor', 'searchreplace',
                                                    'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                                                    'media', 'table', 'code', 'help', 'wordcount', 'equation'
                                                ],
                                                toolbar: 'undo redo | formatselect | ' +
                                                    'bold italic forecolor | alignleft aligncenter ' +
                                                    'alignright alignjustify | bullist numlist outdent indent | ' +
                                                    'removeformat | equation | help',
                                                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                                            }}
                                        />

                                        {/* Explanation Editor */}
                                        <div className="mt-4">
                                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                                                Explanation
                                            </label>
                                            <Editor
                                                apiKey="it0vzbrjmv1qzhgge99xqz12j84evhl7q00gf4b0v3ylwlfx"
                                                value={answer.explanation}
                                                onEditorChange={(content) => handleAnswerChange(qIndex, answer.id, 'explanation', content)}
                                                init={{
                                                    height: 250,
                                                    menubar: false,
                                                    plugins: [
                                                        'advlist', 'autolink', 'lists', 'link', 'image',
                                                        'charmap', 'preview', 'anchor', 'searchreplace',
                                                        'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                                                        'media', 'table', 'code', 'help', 'wordcount', 'equation'
                                                    ],
                                                    toolbar: 'undo redo | formatselect | ' +
                                                        'bold italic forecolor | alignleft aligncenter ' +
                                                        'alignright alignjustify | bullist numlist outdent indent | ' +
                                                        'removeformat | equation | help',
                                                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {qIndex < questions.length - 1 && (
                            <div className="h-px bg-stroke dark:bg-strokedark w-full"></div>
                        )}
                    </React.Fragment>
                ))}

                {/* Add Question Button */}
                <div className="flex justify-center">
                    <button
                        onClick={addNewQuestion}
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition"
                    >
                        Add Another Question
                    </button>
                </div>
            </div>
        )}
    </div>

    {/* Tags Block */}
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
            <h3 className="text-2xl font-semibold text-black dark:text-white">Tags</h3>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`w-5 h-5 transition-transform duration-200 cursor-pointer ${expandedSections.tags ? 'rotate-180' : ''}`}
                onClick={() => toggleSection('tags')}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
        </div>
        {expandedSections.tags && (
            <div className="px-6.5 py-4">
                <select
                    onChange={(e) => {
                        const value = e.target.value;
                        const category = (e.target.options[e.target.selectedIndex].parentElement as HTMLOptGroupElement)?.label.toLowerCase();
                        if (category) {
                            handleTagChange(category as keyof SelectedTags, value);
                        }
                    }}
                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                >
                    <optgroup label="Subject">
                        <option value="None">None</option>
                        <option value="DSA">DSA</option>
                        <option value="PPL">PPL</option>
                    </optgroup>
                    <optgroup label="Bloom's Level">
                        <option value="Remember">Remember</option>
                        <option value="Understand">Understand</option>
                        <option value="Apply">Apply</option>
                    </optgroup>
                </select>
                <div className="mt-2">
                    {Object.entries(selectedTags).map(([category, tag]) => (
                        <div key={category} className="relative inline-block mr-2">
                            <span className="inline-block border border-gray-400 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded dark:border-gray-600 dark:text-gray-300">
                                {tag}
                            </span>
                            <span
                                className="absolute right-0 top-0 transform translate-x-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-red-500"
                                onClick={() => handleTagChange(category as keyof SelectedTags, '')}
                            >
                                &times;
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>

    {/* Upper block: Similarity Note + Course Selection */}
    <div className="flex justify-between items-center mt-4">
        {/* Left side: Note and View Similarity */}
        <div className="flex items-center gap-4">
            <p className="text-body">
                <span className="text-danger font-medium">NOTE:</span> There are questions in your bank that are similar.
            </p>
            <button
                onClick={() => setIsSimilarityDialogOpen(true)}
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
            >
                View similarity
            </button>
        </div>

        {/* Right side: Course and Bank Selection */}
        <div className="flex items-center gap-4">
            <select
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="rounded border border-stroke bg-transparent py-2.5 px-3 font-medium outline-none"
            >
                <option value="">Choose Course</option>
                {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                ))}
            </select>

            <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="rounded border border-stroke bg-transparent py-2.5 px-3 font-medium outline-none"
                disabled={!selectedCourse}
            >
                <option value="">Choose Question Bank</option>
                {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
            </select>
        </div>
    </div>

    {/* Submit Button */}
    <div className="flex justify-end mt-6">
        {error && (
            <div className="text-danger mr-4 self-center">
                {error}
            </div>
        )}
        <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-md hover:bg-opacity-90 transition disabled:opacity-50"
        >
            {loading ? 'Creating...' : 'Create Question Group'}
        </button>
    </div>

    {/* Dialogs */}
    <SimilarityDialog
        isOpen={isSimilarityDialogOpen}
        onClose={() => setIsSimilarityDialogOpen(false)}
        similarQuestions={[]}
    />

    <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => {
            // Reset form logic here
            setIsConfirmDialogOpen(false);
        }}
        message="Are you sure you want to discard these changes?"
    />
</div>
);
};

export default AddManyQues; 