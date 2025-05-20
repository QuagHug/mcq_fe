import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface SimilarQuestionPair {
  test1_question_index: number;
  test1_question_text: string;
  test1_question_id: number;
  test2_question_index: number;
  test2_question_text: string;
  test2_question_id: number;
  similarity_score: number;
}

interface SimilarTest {
  test_id: number;
  test_title: string;
  similarity_score: number;
  similar_question_count: number;
  total_questions_in_existing_test: number;
  question_coverage: number;
  similar_question_pairs: SimilarQuestionPair[];
}

interface TestSimilarityResponse {
  candidate_questions_count: number;
  similar_tests: SimilarTest[];
  total_similar_tests: number;
}

interface TestSimilarityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  similarityData: TestSimilarityResponse | null;
  courseId: string;
  onProceedAnyway?: () => void;
}

const TestSimilarityDialog: React.FC<TestSimilarityDialogProps> = ({
  isOpen,
  onClose,
  similarityData,
  courseId,
  onProceedAnyway
}) => {
  const [expandedTestId, setExpandedTestId] = useState<number | null>(null);

  // Function to format similarity score as percentage
  const formatSimilarity = (similarity: number) => {
    return (similarity * 100).toFixed(1) + '%';
  };

  // Function to get appropriate color class based on similarity score
  const getSimilarityColorClass = (similarity: number) => {
    if (similarity >= 0.7) return 'text-danger font-bold';
    if (similarity >= 0.5) return 'text-warning font-semibold';
    return 'text-success';
  };

  // Strip HTML tags from text
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const toggleExpandTest = (testId: number) => {
    if (expandedTestId === testId) {
      setExpandedTestId(null);
    } else {
      setExpandedTestId(testId);
    }
  };

  if (!similarityData) return null;

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
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                >
                  Similar Tests Found
                </Dialog.Title>
                
                <div className="mt-4">
                  <div className="mb-4 p-3 bg-warning bg-opacity-10 border-l-4 border-warning rounded">
                    <p className="text-warning">
                      <strong>Warning:</strong> The test you're creating is similar to {similarityData.total_similar_tests} existing 
                      {similarityData.total_similar_tests === 1 ? ' test' : ' tests'} in this course.
                    </p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {similarityData.similar_tests.map((test) => (
                      <div key={test.test_id} className="mb-4 border border-stroke dark:border-strokedark rounded-lg">
                        <div 
                          className="p-3 border-b border-stroke dark:border-strokedark cursor-pointer flex justify-between items-center"
                          onClick={() => toggleExpandTest(test.test_id)}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{test.test_title}</h4>
                            <div className="flex mt-1 text-sm">
                              <div className="mr-4">
                                <span>Similarity: </span>
                                <span className={getSimilarityColorClass(test.similarity_score)}>
                                  {formatSimilarity(test.similarity_score)}
                                </span>
                              </div>
                              <div className="mr-4">
                                <span>Similar Questions: </span>
                                <span className="font-medium">{test.similar_question_count} of {test.total_questions_in_existing_test}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg">
                            {expandedTestId === test.test_id ? '−' : '+'}
                          </span>
                        </div>
                        
                        {expandedTestId === test.test_id && (
                          <div className="p-3">
                            <h5 className="font-medium mb-2">Similar Question Pairs:</h5>
                            <div className="space-y-2">
                              {test.similar_question_pairs.map((pair, index) => (
                                <div key={index} className="p-2 border border-gray-100 dark:border-strokedark rounded">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Similarity: 
                                      <span className={getSimilarityColorClass(pair.similarity_score)}>
                                        {formatSimilarity(pair.similarity_score)}
                                      </span>
                                    </span>
                                    
                                    <a 
                                      href={`/courses/${courseId}/question-banks/${pair.test2_question_id}/edit`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline"
                                    >
                                      View question
                                    </a>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs mb-1 text-gray-500">Your question:</p>
                                      <p className="text-sm">{stripHtml(pair.test1_question_text)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs mb-1 text-gray-500">Existing question:</p>
                                      <p className="text-sm">{stripHtml(pair.test2_question_text)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  {onProceedAnyway && (
                    <button
                      onClick={() => {
                        onClose();
                        onProceedAnyway();
                      }}
                      className="inline-flex items-center justify-center rounded-md bg-warning px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
                    >
                      Proceed Anyway
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
                  >
                    Review Test Content
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

export default TestSimilarityDialog; 