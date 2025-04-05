import React from 'react';

interface TestDifficultyBadgeProps {
  difficulty: number;
  showLabel?: boolean;
  className?: string;
}

const TestDifficultyBadge: React.FC<TestDifficultyBadgeProps> = ({ 
  difficulty, 
  showLabel = true,
  className = '' 
}) => {
  // Get color based on difficulty
  const getColor = () => {
    if (difficulty < 2) return 'bg-green-100 text-green-800';
    if (difficulty < 4) return 'bg-emerald-100 text-emerald-800';
    if (difficulty < 6) return 'bg-yellow-100 text-yellow-800';
    if (difficulty < 8) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };
  
  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()}`}>
        {difficulty.toFixed(1)}/10
      </span>
    </div>
  );
};

export default TestDifficultyBadge; 