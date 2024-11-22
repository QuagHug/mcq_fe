import { useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';

const QuestionEdit = () => {
    const { id } = useParams();

    const questionData = {
        id: 'Q_001',
        question: 'What is Computer Network?',
        answers: [
            { id: 'A', text: 'A collection of autonomous computers', isCorrect: false },
            { id: 'B', text: 'A system of interconnected computers and devices that can communicate and share resources', isCorrect: true },
            { id: 'C', text: 'A single computer with multiple processors', isCorrect: false },
            { id: 'D', text: 'A software application for sharing files', isCorrect: false },
        ],
        explanation: {
            correct: 'Answer B is correct because a computer network is indeed a system of interconnected computers and devices that can communicate and share resources. This definition encompasses the fundamental aspects of networking including connectivity, communication, and resource sharing.',
            incorrect: 'A - This is incomplete as it doesn\'t mention interconnection and resource sharing.\nC - This describes multiprocessing, not networking.\nD - This is just one application that can run on a network, not the network itself.'
        }
    };

    return (
        <div className="space-y-6">
            <Breadcrumb
                pageName={`Question: ${questionData.id}`}
                parentPath="/question-bank"
                parentName="Question Bank"
                currentName={questionData.id}
            />

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                {/* Question Section */}
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <div className="group">
                        <div className="inline-flex items-center gap-2">
                            <h3 className="font-medium text-black dark:text-white">
                                Question: {questionData.question}
                            </h3>
                            <button className="hidden group-hover:block hover:text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Answers Section */}
                <div className="px-6.5 py-4">
                    <div className="space-y-4">
                        {questionData.answers.map((answer) => (
                            <div
                                key={answer.id}
                                className={`group rounded-md border p-4 ${answer.isCorrect
                                    ? 'border-success bg-success bg-opacity-5'
                                    : 'border-danger bg-danger bg-opacity-5'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium">{answer.id}.</span>
                                        <p>{answer.text}</p>
                                    </div>
                                    <button className="hidden group-hover:block hover:text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Explanation Section */}
                <div className="border-t border-stroke px-6.5 py-4 dark:border-strokedark">
                    <div className="space-y-4">
                        {/* Correct Answer Explanation */}
                        <div className="group">
                            <h4 className="mb-2 text-lg font-semibold text-black dark:text-white">
                                Correct Answer Explanation:
                            </h4>
                            <div className="inline-flex items-start gap-2">
                                <p className="text-[#64748B] dark:text-[#64748B]">
                                    {questionData.explanation.correct}
                                </p>
                                <button className="hidden group-hover:block hover:text-primary mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Incorrect Answers Explanation */}
                        <div>
                            <h4 className="mb-2 text-lg font-semibold text-black dark:text-white">
                                Incorrect Answers Explanation:
                            </h4>
                            {questionData.explanation.incorrect.split('\n').map((explanation, index) => (
                                explanation.trim() && (
                                    <div key={index} className="group mb-2">
                                        <div className="inline-flex items-start gap-2">
                                            <p className="text-[#64748B] dark:text-[#64748B]">
                                                {explanation}
                                            </p>
                                            <button className="hidden group-hover:block hover:text-primary mt-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </div>

                {/* Save Button Section */}
                <div className="px-6.5 py-4 dark:border-strokedark">
                    <div className="flex justify-end">
                        <button className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90">
                            Save edits
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <p className="text-body">
                    <span className="text-danger font-medium">NOTE:</span> There are questions in the bank that has 60% similarity
                </p>
                <button className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90">
                    View similarity
                </button>
            </div>
        </div>
    );
};

export default QuestionEdit; 