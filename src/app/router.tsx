import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { PageSkeleton } from '@/components/ui/States';
import { AppLayout } from './layouts/AppLayout';
import { BareLayout } from './layouts/BareLayout';
import { RequireAuth, RequireOnboarding, RootRedirect } from './guards';
import { RouteError } from './RouteError';

/** Route-level code splitting: each page is its own chunk. */
const page = (load: () => Promise<{ default: ComponentType }>) => () => load().then((m) => ({ Component: m.default }));

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageSkeleton />,
    children: [
      { index: true, element: <RootRedirect /> },
      {
        element: <BareLayout />,
        children: [
          { path: 'welcome', lazy: page(() => import('@/features/onboarding/WelcomePage')) },
          { path: 'onboarding', lazy: page(() => import('@/features/onboarding/OnboardingPage')) },
          { path: 'login', lazy: page(() => import('@/features/auth/LoginPage')) },
          { path: 'register', lazy: page(() => import('@/features/auth/RegisterPage')) },
          { path: 'forgot-password', lazy: page(() => import('@/features/auth/ForgotPasswordPage')) },
          { path: 'reset-password', lazy: page(() => import('@/features/auth/ResetPasswordPage')) },
          { path: 'auth/callback', lazy: page(() => import('@/features/auth/AuthCallbackPage')) },
        ],
      },
      {
        element: <RequireOnboarding />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: 'dashboard', lazy: page(() => import('@/features/dashboard/DashboardPage')) },
              { path: 'learning-path', lazy: page(() => import('@/features/learn/LearningPathPage')) },
              { path: 'levels/:levelId', lazy: page(() => import('@/features/learn/LevelPage')) },
              { path: 'modules/:moduleId', lazy: page(() => import('@/features/learn/ModulePage')) },
              { path: 'grammar', lazy: page(() => import('@/features/grammar/GrammarPage')) },
              { path: 'grammar/:topicId', lazy: page(() => import('@/features/grammar/GrammarTopicPage')) },
              { path: 'practice', lazy: page(() => import('@/features/practice/PracticePage')) },
              { path: 'vocabulary', lazy: page(() => import('@/features/vocabulary/VocabularyPage')) },
              { path: 'profile', lazy: page(() => import('@/features/profile/ProfilePage')) },
              { path: 'progress', lazy: page(() => import('@/features/profile/ProgressPage')) },
              { path: 'settings', lazy: page(() => import('@/features/profile/SettingsPage')) },
              {
                element: <RequireAuth />,
                children: [{ path: 'account', lazy: page(() => import('@/features/profile/AccountPage')) }],
              },
              { path: 'assessments', lazy: page(() => import('@/features/assessment/AssessmentsPage')) },
            ],
          },
          {
            // Focused, full-screen learning flows without the bottom navigation.
            element: <BareLayout focus />,
            children: [
              { path: 'lessons/:lessonId', lazy: page(() => import('@/features/learn/LessonPage')) },
              { path: 'practice/:exerciseId', lazy: page(() => import('@/features/practice/PracticeSessionPage')) },
              { path: 'vocabulary/review', lazy: page(() => import('@/features/vocabulary/VocabularyReviewPage')) },
              { path: 'placement-test', lazy: page(() => import('@/features/assessment/PlacementTestPage')) },
            ],
          },
        ],
      },
      { path: 'home', element: <Navigate to="/dashboard" replace /> },
      { path: '*', lazy: page(() => import('./NotFoundPage')) },
    ],
  },
]);
