import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { checkQuestionSimilarity, fetchQuestionDetail, fetchBankDetails } from '../services/api';

interface Answer {
  id: number;
  answer_text: string;
  is_correct: boolean;
  explanation?: string;
}

interface SimilarQuestion {
  question_id: number;
  similarity: number;
  question_text: string;
  question_bank_id: number;
  course_id?: string;
  bank_name?: string;
  course_name?: string;
  answers?: Answer[];
}

interface SimilarityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questionText: string;
  questionBankId: number;
  courseId?: string;
  onEditQuestion?: () => void;
  onParaphraseQuestion?: () => void;
  onDiscardQuestion?: () => void;
}

const SimilarityDialog: React.FC<SimilarityDialogProps> = ({
  isOpen,
  onClose,
  questionText,
  questionBankId,
  courseId,
  onEditQuestion,
  onParaphraseQuestion,
  onDiscardQuestion
}) => {
  const [similarQuestions, setSimilarQuestions] = useState<SimilarQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.75);
  const [selectedQuestion, setSelectedQuestion] = useState<SimilarQuestion | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [bankCoursesMap, setBankCoursesMap] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isOpen && questionText && questionBankId) {
      fetchSimilarQuestions();
      
      if (courseId) {
        setBankCoursesMap(prev => ({
          ...prev,
          [questionBankId]: courseId
        }));
      }
    }
  }, [isOpen, questionText, questionBankId, threshold, courseId]);

  const fetchSimilarQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await checkQuestionSimilarity(questionText, questionBankId, threshold);
      setSimilarQuestions(result.similar_questions || []);
      setSelectedQuestion(null);
      
      if (result.similar_questions && result.similar_questions.length > 0) {
        await Promise.all(
          result.similar_questions
            .filter(q => !bankCoursesMap[q.question_bank_id])
            .map(async q => {
              try {
                const bankDetails = await fetchBankDetails(q.question_bank_id.toString());
                if (bankDetails && bankDetails.course_id) {
                  setBankCoursesMap(prev => ({
                    ...prev,
                    [q.question_bank_id]: bankDetails.course_id
                  }));
                }
              } catch (err) {
                console.error(`Failed to get course for bank ${q.question_bank_id}`, err);
              }
            })
        );
      }
    } catch (err) {
      console.error('Error fetching similar questions:', err);
      setError('Failed to fetch similar questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionDetails = async (question: SimilarQuestion) => {
    setLoadingDetails(true);
    try {
      const questionCourseId = 
        question.course_id || 
        bankCoursesMap[question.question_bank_id] || 
        courseId;
      
      if (!questionCourseId) {
        throw new Error('Could not determine course ID for this question');
      }
      
      const bankId = question.question_bank_id.toString();
      const questionId = question.question_id.toString();
      
      console.log(`Fetching details for question ${questionId} in bank ${bankId} of course ${questionCourseId}`);
      
      const details = await fetchQuestionDetail(questionCourseId, bankId, questionId);
      
      setSelectedQuestion(prev => {
        if (prev && prev.question_id === question.question_id) {
          return {
            ...prev,
            ...details,
            course_id: questionCourseId,
            answers: details.answers
          };
        }
        return prev;
      });
    } catch (err) {
      console.error('Error fetching question details:', err);
      setError('Failed to fetch question details: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleQuestionSelect = (question: SimilarQuestion) => {
    setSelectedQuestion(question);
    fetchQuestionDetails(question);
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const formatSimilarity = (similarity: number) => {
    return (similarity * 100).toFixed(1) + '%';
  };

  const getSimilarityColorClass = (similarity: number) => {
    if (similarity >= 0.9) return 'text-danger';
    if (similarity >= 0.8) return 'text-warning';
    return 'text-success';
  };

  const getQuestionUrl = (question: SimilarQuestion) => {
    const qCourseId = question.course_id || bankCoursesMap[question.question_bank_id] || courseId;
    if (!qCourseId) return '#';
    return `/courses/${qCourseId}/question-banks/${question.question_bank_id}/questions/${question.question_id}`;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-black dark:text-white"
                >
                  Similar Questions Found
                </Dialog.Title>
                
                <div className="mt-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black dark:text-white mb-1">
                      Similarity Threshold: {(threshold * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="0.95"
                      step="0.05"
                      value={threshold}
                      onChange={(e) => setThreshold(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>

                  <div className="mb-4 p-4 border border-gray-200 dark:border-strokedark rounded-md">
                    <h4 className="text-md font-medium mb-2 text-black dark:text-white">Your Question:</h4>
                    <p className="text-body">{stripHtml(questionText)}</p>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : error ? (
                    <div className="text-danger p-4">{error}</div>
                  ) : similarQuestions.length === 0 ? (
                    <div className="text-body p-4">No similar questions found with current threshold.</div>
                  ) : (
                    <div className="mt-4">
                      <h4 className="text-md font-medium mb-2 text-black dark:text-white">Similar Questions:</h4>
                      <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-strokedark rounded-md">
                        {similarQuestions.map((q) => (
                          <div 
                            key={q.question_id}
                            className={`p-4 border-b border-gray-200 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-boxdark-lighter cursor-pointer ${selectedQuestion?.question_id === q.question_id ? 'bg-gray-50 dark:bg-boxdark-lighter' : ''}`}
                            onClick={() => handleQuestionSelect(q)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-body line-clamp-2">{stripHtml(q.question_text)}</p>
                              </div>
                              <div className={`ml-4 font-bold ${getSimilarityColorClass(q.similarity)}`}>
                                {formatSimilarity(q.similarity)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedQuestion && (
                    <div className="mt-4 p-4 border border-gray-200 dark:border-strokedark rounded-md">
                      <div className="flex justify-between items-start">
                        <h4 className="text-md font-medium mb-2 text-black dark:text-white">
                          Selected Question Details:
                        </h4>
                        <a 
                          href={getQuestionUrl(selectedQuestion)}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Open in new tab
                        </a>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Similarity: </span>
                        <span className={getSimilarityColorClass(selectedQuestion.similarity)}>
                          {formatSimilarity(selectedQuestion.similarity)}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Question ID: </span>
                        <span>{selectedQuestion.question_id}</span>
                      </div>
                      <div className="mb-4">
                        <span className="font-medium">Full Text: </span>
                        <p className="mt-1 text-body">{stripHtml(selectedQuestion.question_text)}</p>
                      </div>
                      
                      {loadingDetails ? (
                        <div className="flex justify-center items-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : selectedQuestion.answers ? (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2">Answers:</h5>
                          <ul className="space-y-2">
                            {selectedQuestion.answers.map((answer, index) => (
                              <li 
                                key={answer.id || index} 
                                className={`p-2 rounded ${answer.is_correct ? 'bg-success bg-opacity-10 border-l-4 border-success' : ''}`}
                              >
                                <div className="flex items-start">
                                  <div className={`h-5 w-5 flex-shrink-0 rounded-full border mr-2 ${answer.is_correct ? 'bg-success border-success' : 'border-gray-300'}`}>
                                    {answer.is_correct && (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-body">{stripHtml(answer.answer_text)}</p>
                                    {answer.explanation && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Explanation: {stripHtml(answer.explanation)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="mt-2 text-gray-500">
                          Answer details not available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {onEditQuestion && (
                    <button
                      onClick={() => {
                        onClose();
                        onEditQuestion();
                      }}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
                    >
                      Edit Question
                    </button>
                  )}
                  
                  {onParaphraseQuestion && (
                    <button
                      onClick={() => {
                        onClose();
                        onParaphraseQuestion();
                      }}
                      className="inline-flex items-center justify-center rounded-md bg-success px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
                    >
                      Paraphrase Question
                    </button>
                  )}
                  
                  {onDiscardQuestion && (
                    <button
                      onClick={() => {
                        onClose();
                        onDiscardQuestion();
                      }}
                      className="inline-flex items-center justify-center rounded-md bg-danger px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
                    >
                      Discard Question
                    </button>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="inline-flex items-center justify-center rounded-md border border-stroke px-6 py-2.5 text-center font-medium hover:bg-opacity-90"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SimilarityDialog; 