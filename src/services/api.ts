const API_BASE_URL = 'http://localhost:8000/api';

export const fetchQuestionBanks = async (courseId: string) => {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/`, {
    headers: {
      'Authorization': `Bearer ${document.cookie.split('token=')[1]}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch question banks');
  return response.json();
};

export const createQuestionBank = async (courseId: string, bankData: { name: string }) => {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${document.cookie.split('token=')[1]}`
    },
    body: JSON.stringify(bankData)
  });
  if (!response.ok) throw new Error('Failed to create question bank');
  return response.json();
};

export const fetchQuestions = async (courseId: string, bankId: string) => {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/questions/`, {
    headers: {
      'Authorization': `Bearer ${document.cookie.split('token=')[1]}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch questions');
  return response.json();
};

export const fetchQuestionDetail = async (courseId: string, bankId: string, questionId: string) => {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/questions/${questionId}/`, {
    headers: {
      'Authorization': `Bearer ${document.cookie.split('token=')[1]}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch question detail');
  return response.json();
};

export const deleteQuestionBank = async (courseId: string, bankId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${document.cookie.split('token=')[1]}`
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete question bank');
        }

        return true;
    } catch (error) {
        console.error('Error deleting question bank:', error);
        throw error;
    }
};

export const deleteQuestion = async (courseId: string, chapterId: string, questionId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/question-banks/${chapterId}/questions/${questionId}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${document.cookie.split('token=')[1]}`
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete question');
        }

        return true;
    } catch (error) {
        console.error('Error deleting question:', error);
        throw error;
    }
};

type QuestionData = {
    question_bank: string;
    question_text: string;
    answers: {
        answer_text: string;
        is_correct: boolean;
        explanation: string;
    }[];
}

export const addQuestion = async (courseId: string, bankId: string, questionData: QuestionData) => {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/questions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
    });
    if (!response.ok) throw new Error('Failed to add question');
    return response.json();
};
export const getQuestionBanks = async (courseId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/`, {
            headers: {
                'Authorization': `Bearer ${document.cookie.split('token=')[1]}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch question banks');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching question banks:', error);
        throw error;
    }
};

export const fetchCourses = async () => {
    const response = await fetch(`${API_BASE_URL}/courses/`, {
        headers: {
            'Authorization': `Bearer ${document.cookie.split('token=')[1]}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch courses');
    return response.json();
}; 