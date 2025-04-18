export interface Question {
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

export interface QuestionBank {
    id: number;
    name: string;
    bank_id: string;
    parent: number | null;
    children: QuestionBank[];
    questions: any[];
}

export interface Answer {
    answer_text: string;
    is_correct: boolean;
}

export interface LearningObjective {
    id: string;
    name: string;
}

export interface SubjectLOs {
    [key: string]: LearningObjective[];
}

export interface AnswerFormat {
    case: 'uppercase' | 'lowercase';
    separator: string;
}

export interface Taxonomy {
    taxonomy: {
        name: string;
    };
    level: string;
}

export interface EditedQuestion extends Question {
    hiddenAnswers?: boolean[];
} 