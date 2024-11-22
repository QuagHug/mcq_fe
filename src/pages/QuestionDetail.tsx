import { useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';

const QuestionDetail = () => {
    const { id } = useParams();

    // This should match with your data structure
    const getQuestionData = (id: string) => {
        return {
            id: 'Q_001',
            questionBankId: 'QB_2024_001',
            questionBankName: 'Computer Network',  // This should match with QuestionBankDetail
            question: 'What is Computer Network?',
            answers: [
                { id: 'A', text: 'A collection of autonomous computers', isCorrect: false },
                { id: 'B', text: 'A system of interconnected computers and devices that can communicate and share resources', isCorrect: true },
                { id: 'C', text: 'A single computer with multiple processors', isCorrect: false },
                { id: 'D', text: 'A software application for sharing files', isCorrect: false },
            ],
            explanation: {
                correct: 'Answer B is correct because a computer network is indeed a system of interconnected computers and devices that can communicate and share resources. This definition encompasses the fundamental aspects of networking including connectivity, communication, and resource sharing.',
                incorrect: 'Other answers are incorrect because:\nA - This is incomplete as it doesn\'t mention interconnection and resource sharing.\nC - This describes multiprocessing, not networking.\nD - This is just one application that can run on a network, not the network itself.'
            }
        };
    };

    const questionData = getQuestionData(id || '');

    return (
        <div className="space-y-6">
            <Breadcrumb
                pageName={`Question: ${questionData.id}`}
                parentPath="/question-bank"
                parentName="Question Bank"
                parentPath2={`/question-bank/${questionData.questionBankId}`}
                parentName2={questionData.questionBankName}
                currentName={questionData.id}
            />

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                {/* Question Section */}
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Question: {questionData.question}
                    </h3>
                </div>

                {/* Answers Section */}
                <div className="px-6.5 py-4">
                    <div className="space-y-4">
                        {questionData.answers.map((answer) => (
                            <div
                                key={answer.id}
                                className={`flex items-center gap-4 rounded-md border p-4 ${answer.isCorrect
                                    ? 'border-success bg-success bg-opacity-5'
                                    : 'border-danger bg-danger bg-opacity-5'
                                    }`}
                            >
                                <span className="font-medium">{answer.id}.</span>
                                <p>{answer.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Explanation Section */}
                <div className="border-t border-stroke px-6.5 py-4 dark:border-strokedark">
                    <div className="space-y-4">
                        <div>
                            <h4 className="mb-2 text-lg font-semibold text-black dark:text-white">
                                Correct Answer Explanation:
                            </h4>
                            <p className="text-[#64748B] dark:text-[#64748B]">
                                {questionData.explanation.correct}
                            </p>
                        </div>
                        <div>
                            <h4 className="mb-2 text-lg font-semibold text-black dark:text-white">
                                Incorrect Answers Explanation:
                            </h4>
                            <p className="text-[#64748B] dark:text-[#64748B] whitespace-pre-line">
                                {questionData.explanation.incorrect}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Note and Button Section */}
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

export default QuestionDetail; 