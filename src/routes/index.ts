import { lazy } from 'react';

const GenerateQuestion = lazy(() => import('../pages/GenerateQuestion'));
const GenerateDistractors = lazy(() => import('../pages/GenerateDistractors'));
const HomePage = lazy(() => import('../pages/Dashboard/HomePage'));
const Questions = lazy(() => import('../pages/Questions'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const QuestionDetail = lazy(() => import('../pages/QuestionDetail'));
const QuestionEdit = lazy(() => import('../pages/QuestionEdit'));
const CoursesPage = lazy(() => import('../pages/Courses'));
const QuestionBanks = lazy(() => import('../pages/QuestionBanks'));
const AddOneQues = lazy(() => import('../pages/AddOneQues'));
const ImportQuestions = lazy(() => import('../pages/ImportQuestions'));
const AddManyQues = lazy(() => import('../pages/AddManyQues'));
const CreateTest = lazy(() => import('../pages/CreateTest'));
const CreateTestAuto = lazy(() => import('../pages/CreateTestAuto'));
const TestResults = lazy(() => import('../pages/TestResults'));

const coreRoutes = [
  {
    path: '/',
    title: 'Home',
    component: HomePage,
  },
  {
    path: '/courses',
    title: 'Courses',
    component: CoursesPage,
  },
  {
    path: '/courses/:courseId/question-banks',
    title: 'Question Banks',
    component: QuestionBanks,
  },
  {
    path: '/courses/:courseId/question-banks/:chapterId',
    title: 'Questions',
    component: Questions,
  },
  {
    path: '/courses/:courseId/question-banks/:chapterId/questions/:questionId',
    title: 'Question Detail',
    component: QuestionDetail,
  },
  {
    path: '/courses/:courseId/question-banks/:chapterId/questions/:questionId/edit',
    title: 'Edit Question',
    component: QuestionEdit,
  },
  {
    path: '/generate-questions',
    title: 'Generate Questions',
    component: GenerateQuestion,
  },
  {
    path: '/generate-distractors',
    title: 'Generate Distractors',
    component: GenerateDistractors,
  },
  {
    path: '/profile',
    title: 'Profile',
    component: Profile,
  },
  {
    path: '/add-one-question',
    title: 'Add One Question',
    component: AddOneQues,
  },
  {
    path: '/settings',
    title: 'Settings',
    component: Settings,
  },
  {
    path: '/import-questions',
    title: 'Import Questions',
    component: ImportQuestions,
  },
  {
    path: '/add-many-questions',
    title: 'Add Multiple Questions',
    component: AddManyQues,
  },
  {
    path: '/create-test-manual',
    title: 'Create Test Manually',
    component: CreateTest,
  },
  {
    path: '/create-test-auto',
    title: 'Create Test Automatically',
    component: CreateTestAuto,
  },
  {
    path: '/test-results',
    title: 'Test Results',
    component: TestResults,
  },
];

const routes = [...coreRoutes];

routes.push({
  path: '*',
  title: 'Not Found',
  component: HomePage
});

export default routes;
