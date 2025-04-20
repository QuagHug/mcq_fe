import { getRefreshToken, getAccessToken } from "../utils/auth";

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
    const token = await getValidToken();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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

interface CreateTestRequest {
  title: string;
  question_ids: number[];
  config: {
    letterCase: 'uppercase' | 'lowercase';
    separator: string;
    includeAnswerKey: boolean;
  };
}

export const createTest = async (courseId: string, data: CreateTestRequest) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/tests/create/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Create test error:', errorData);
    throw new Error('Failed to create test');
  }

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

export const fetchCourseTests = async (courseId: string) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/tests`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch tests');
  }
  return response.json();
};

export const fetchTestDetail = async (courseId: string, testId: string) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/tests/${testId}/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch test details');
  }
  return response.json();
};

interface UpdateTestRequest {
  title: string;
  config: {
    letterCase: 'uppercase' | 'lowercase';
    separator: string;
    includeAnswerKey: boolean;
  };
  question_ids: number[];
}

export const updateTest = async (courseId: string, testId: string, data: UpdateTestRequest) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/tests/${testId}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update test');
  }

  return response.json();
};

export const deleteTest = async (courseId: string, testId: string) => {
  try {
    const token = await getValidToken();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/tests/${testId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete test');
    }

    return true;
  } catch (error) {
    console.error('Error deleting test:', error);
    throw error;
  }
};

export const uploadTestResults = async (courseId: string, testId: string, file: File) => {
    const token = await getValidToken();
    const formData = new FormData();
    formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/tests/${testId}/results/upload/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

    if (!response.ok) {
        const errorData = await response.json();
        throw { response: { status: response.status, data: errorData } };
    }

  return response.json();
};

export const saveTestDraft = async (courseId: string, draftData: any) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/test-drafts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      courseId,
      ...draftData
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save test draft');
  }

  return await response.json();
};

export const getTestDraft = async (courseId: string) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/test-drafts/${courseId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  if (response.status === 404) {
    return null; // No draft found
  }

  if (!response.ok) {
    throw new Error('Failed to get test draft');
  }

  return await response.json();
};

export const deleteTestDraft = async () => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/test-drafts/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete test draft');
  }

  return true;
};

export const getTestDrafts = async () => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/test-drafts/list`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch test drafts');
  }

  return await response.json();
};

/**
 * Fetch questions from a specific question bank
 * @param courseId - The ID of the course
 * @param bankId - The ID of the question bank
 * @returns Promise containing the questions in the bank
 */
export const fetchBankQuestions = async (courseId: string, bankId: string) => {
  try {
    const token = await getValidToken();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/questions/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bank questions');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching bank questions:', error);
    throw error;
  }
};

/**
 * Fetch question groups for a specific question bank
 * @param courseId - The ID of the course
 * @param bankId - The ID of the question bank
 * @returns Promise containing the question groups in the bank
 */
export const fetchQuestionGroups = async (courseId: string, bankId: string) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/groups/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch question groups');
  return response.json();
};

/**
 * Create a new question group
 * @param courseId - The ID of the course
 * @param bankId - The ID of the question bank
 * @param groupData - The data for the new question group
 * @returns Promise containing the created question group
 */
export const createQuestionGroup = async (courseId: string, bankId: string, groupData: { name: string, context: string }) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/groups/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(groupData)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create question group');
  }
  
  return response.json();
};

/**
 * Fetch a specific question group by ID
 * @param courseId - The ID of the course
 * @param bankId - The ID of the question bank
 * @param groupId - The ID of the question group
 * @returns Promise containing the question group details
 */
export const fetchQuestionGroup = async (courseId: string, bankId: string, groupId: number) => {
  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/groups/${groupId}/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch question group');
  }
  
  return response.json();
}; 