import { getRefreshToken } from "../utils/auth";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

// Add helper function to handle token management
const getValidToken = async () => {
  console.warn('All cookies at start of getValidToken:', document.cookie); // Debug log

  // Improved cookie parsing
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as { [key: string]: string });

  const token = cookies['token'];

  console.log('Current token:', token); // Debug log

  if (!token) throw new Error('No token found');

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    console.log('Token expired?', isExpired); // Debug log

    if (isExpired) {
      const refreshToken = cookies['refresh_token'];
      console.log('Using refresh token:', refreshToken); // Debug log
      if (!refreshToken) throw new Error('No refresh token found');

      const csrfToken = cookies['csrftoken'];
      console.log('Using CSRF token:', csrfToken); // Debug log

      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh: refreshToken
        }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to refresh token');

      const { access } = await response.json();
      console.log('New access token received:', access); // Debug log
      document.cookie = `token=${access}; path=/; secure; samesite=strict`;
      return access;
    }
  } catch (error) {
    console.error('Error handling token:', error);
    throw error;
  }

  return token;
};

export const fetchQuestionBanks = async (courseId: string) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch question banks');
  return response.json();
};

interface CreateBankParams {
    name: string;
    parent_id?: number | null;
}

export const createQuestionBank = async (courseId: string, params: CreateBankParams) => {
    const token = await getValidToken();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error('Failed to create question bank');
    return response.json();
};

export const fetchQuestions = async (courseId: string, bankId: string) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/questions/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch questions');
  return response.json();
};

export const fetchQuestionDetail = async (courseId: string, bankId: string, questionId: string) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/questions/${questionId}/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch question detail');
  return response.json();
};

export const editQuestion = async (courseId: string, bankId: string, questionId: string, questionData: any) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/questions/${questionId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(questionData),
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Server error:', errorData);
    throw new Error(`Failed to update question: ${response.status}`);
  }

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

export const deleteQuestion = async (courseId: string, bankId: string, questionId: string) => {
  try {
    const token = await getValidToken();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/questions/${questionId}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/questions/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch courses');
  return response.json();
};

export const bulkCreateQuestions = async (courseId: string, chapterId: string, questions: any[]) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${chapterId}/questions/bulk/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(questions)
  });

  if (!response.ok) {
    throw new Error('Failed to bulk import questions');
  }

  return response.json();
};

export const generateQuestions = async (context: string) => {
  try {
    const token = await getValidToken();
    const response = await fetch(`${API_BASE_URL}/generate-questions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        context
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Generate questions error:', errorData);
      throw new Error(`Failed to generate questions: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Generate questions error:', error);
    throw error;
  }
};

interface Question {
    id: number;
    question_text: string;
    marks: number;
}

export const createTest = async (courseId: string, testData: {
    title: string;
    description: string;
    questions: Question[];
}) => {
    const token = await getValidToken();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/tests/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
    });
    if (!response.ok) throw new Error('Failed to create test');
    return response.json();
};

export const fetchChildBanks = async (courseId: string, parentBankId: string) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/?parent_id=${parentBankId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch child banks');
  return response.json();
}; 