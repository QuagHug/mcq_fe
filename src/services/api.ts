const API_BASE_URL = 'http://localhost:8000/api';

export const fetchQuestionBanks = async (courseId: string) => {
  const response = await fetch(`${API_BASE_URL}/question-banks/`, {
    headers: {
      'Authorization': `Bearer ${document.cookie.split('token=')[1]}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch question banks');
  return response.json();
};

export const fetchQuestions = async (questionBankId: string) => {
  const response = await fetch(`${API_BASE_URL}/question-banks/${questionBankId}/questions/`, {
    headers: {
      'Authorization': `Bearer ${document.cookie.split('token=')[1]}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch questions');
  return response.json();
};

export const fetchQuestionDetail = async (questionBankId: string, questionId: string) => {
  const response = await fetch(`${API_BASE_URL}/question-banks/${questionBankId}/questions/${questionId}/`, {
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