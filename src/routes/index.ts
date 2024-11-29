import { lazy } from 'react';

const GenerateQuestion = lazy(() => import('../pages/GenerateQuestion'));
const Questions = lazy(() => import('../pages/Questions'));
const Chart = lazy(() => import('../pages/Chart'));
const FormElements = lazy(() => import('../pages/Form/FormElements'));
const FormLayout = lazy(() => import('../pages/Form/FormLayout'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const Tables = lazy(() => import('../pages/Tables'));
const Alerts = lazy(() => import('../pages/UiElements/Alerts'));
const Buttons = lazy(() => import('../pages/UiElements/Buttons'));
const QuestionDetail = lazy(() => import('../pages/QuestionDetail'));
const QuestionEdit = lazy(() => import('../pages/QuestionEdit'));
const CoursesPage = lazy(() => import('../pages/Courses'));
const QuestionBanks = lazy(() => import('../pages/QuestionBanks'));

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
    path: '/forms/form-elements',
    title: 'Forms Elements',
    component: FormElements,
  },
  {
    path: '/forms/form-layout',
    title: 'Form Layouts',
    component: FormLayout,
  },
  {
    path: '/tables',
    title: 'Tables',
    component: Tables,
  },
  {
    path: '/settings',
    title: 'Settings',
    component: Settings,
  },
  {
    path: '/chart',
    title: 'Chart',
    component: Chart,
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
];

const routes = [...coreRoutes];
export default routes;
