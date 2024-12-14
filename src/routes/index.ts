import { lazy } from 'react';

const GenerateQuestion = lazy(() => import('../pages/GenerateQuestion'));
const Questions = lazy(() => import('../pages/Questions'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const Alerts = lazy(() => import('../pages/UiElements/Alerts'));
const Buttons = lazy(() => import('../pages/UiElements/Buttons'));
const QuestionDetail = lazy(() => import('../pages/QuestionDetail'));
const QuestionEdit = lazy(() => import('../pages/QuestionEdit'));
const CoursesPage = lazy(() => import('../pages/Courses'));
const QuestionBanks = lazy(() => import('../pages/QuestionBanks'));
const AddOneQues = lazy(() => import('../pages/AddOneQues'));
const ImportQuestions = lazy(() => import('../pages/ImportQuestions'));
const AddManyQues = lazy(() => import('../pages/AddManyQues'));

const coreRoutes = [
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
    path: '/ui/alerts',
    title: 'Alerts',
    component: Alerts,
  },
  {
    path: '/ui/buttons',
    title: 'Buttons',
    component: Buttons,
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
];

const routes = [...coreRoutes];
export default routes;
