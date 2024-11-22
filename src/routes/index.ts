import { lazy } from 'react';

const Calendar = lazy(() => import('../pages/Calendar'));
const QuestionBank = lazy(() => import('../pages/QuestionBank'));
const QuestionBankDetail = lazy(() => import('../pages/QuestionBankDetail'));
const GenerateQuestion = lazy(() => import('../pages/GenerateQuestion'));
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

const coreRoutes = [
  {
    path: '/question-bank',
    title: 'Question Bank',
    component: QuestionBank,
  },
  {
    path: '/question-bank/:id',
    title: 'Question Bank Detail',
    component: QuestionBankDetail,
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
  {
    path: '/question/:id',
    title: 'Question Detail',
    component: QuestionDetail,
  },
  {
    path: '/question/:id/edit',
    title: 'Edit Question',
    component: QuestionEdit,
  },
];

const routes = [...coreRoutes];
export default routes;
