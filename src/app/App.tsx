import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui/Toast';
import { router } from './router';
import { AuthSync } from './AuthSync';
import { ContentSync } from './ContentSync';
import { ThemeSync } from './ThemeSync';
import { PwaPrompt } from './PwaPrompt';
import { HydrationGate } from './HydrationGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <HydrationGate>
        <AuthSync />
        <ContentSync />
        <RouterProvider router={router} />
      </HydrationGate>
      <Toaster />
      <PwaPrompt />
    </QueryClientProvider>
  );
}
