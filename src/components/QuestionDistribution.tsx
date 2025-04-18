import React from 'react';
import { Question, EditedQuestion } from '../types';

interface QuestionDistributionProps {
    selectedQuestions: Question[];
    editedQuestions: { [key: number]: EditedQuestion };
}

interface Distribution {
    [key: string]: {
        easy: number;
        medium: number;
        hard: number;
    };
}

const QuestionDistribution: React.FC<QuestionDistributionProps> = ({
    selectedQuestions,
    editedQuestions
}) => {
    const calculateDistribution = () => {
        const distribution: Distribution = {
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

    return (
        <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    Question Distribution
                </h3>
            </div>

            <div className="p-6.5">
                <div className="grid grid-cols-1 gap-6">
                    {/* Distribution Table */}
                    <div className="bg-gray-50 dark:bg-meta-4 p-4 rounded-sm overflow-x-auto">
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
    );
};

export default QuestionDistribution; 