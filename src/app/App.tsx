import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui/Toast';
import { router } from './router';
import { ThemeSync } from './ThemeSync';
import { PwaPrompt } from './PwaPrompt';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <RouterProvider router={router} />
      <Toaster />
      <PwaPrompt />
    </QueryClientProvider>
  );
}
