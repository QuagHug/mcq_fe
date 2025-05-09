import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { checkQuestionSimilarity } from '../services/api';

interface SimilarQuestion {
  question_id: number;
  similarity: number;
  question_text: string;
  question_bank_id: number;
}

interface SimilarityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questionText: string;
  questionBankId: number;
}

const SimilarityDialog: React.FC<SimilarityDialogProps> = ({
  isOpen,
  onClose,
  questionText,
  questionBankId
}) => {
  const [similarQuestions, setSimilarQuestions] = useState<SimilarQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.75);

  useEffect(() => {
    if (isOpen && questionText && questionBankId) {
      fetchSimilarQuestions();
    }
  }, [isOpen, questionText, questionBankId, threshold]);

  const fetchSimilarQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await checkQuestionSimilarity(questionText, questionBankId, threshold);
      setSimilarQuestions(result.similar_questions || []);
    } catch (err) {
      console.error('Error fetching similar questions:', err);
      setError('Failed to fetch similar questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to strip HTML tags for display
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                >
                  Similar Questions
                </Dialog.Title>
                
                <div className="mt-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Similarity Threshold
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
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>50%</span>
                      <span>{(threshold * 100).toFixed(0)}%</span>
                      <span>95%</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-700 dark:text-white mb-2">Your Question:</h4>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      {stripHtml(questionText)}
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : error ? (
                    <div className="text-danger p-3 bg-danger/10 rounded-md">{error}</div>
                  ) : similarQuestions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No similar questions found.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-gray-700 dark:text-white">
                        Found {similarQuestions.length} similar questions:
                      </h4>
                      {similarQuestions.map((q) => (
                        <div key={q.question_id} className="border border-stroke dark:border-strokedark rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1" dangerouslySetInnerHTML={{ __html: q.question_text }}></div>
                            <div className="ml-4 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                              {(q.similarity * 100).toFixed(1)}% match
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Question ID: {q.question_id} • Bank ID: {q.question_bank_id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    onClick={onClose}
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