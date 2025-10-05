
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { routes } from "./routes";
import { Provider } from "react-redux";
import { store } from "./store";
import { RedirectProvider } from '@/contexts/RedirectContext';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const Router = () => {
  const element = useRoutes(routes);
  return element;
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipPrimitive.Provider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <RedirectProvider> {/* Wrap with RedirectProvider */}
              <Router />
            </RedirectProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipPrimitive.Provider>
    </QueryClientProvider>
  </Provider>
);

export default App;
