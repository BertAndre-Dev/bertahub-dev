'use client';

import { ReactNode, useState, useEffect } from "react";
import { Provider } from 'react-redux';
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/redux/store";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BookDemoProvider } from "@/components/landing-page/book-demo-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function ClientProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <BookDemoProvider>
          <TooltipProvider delayDuration={0}>
          <ToastContainer position="top-center" autoClose={3000} />
          {children}
          </TooltipProvider>
        </BookDemoProvider>
      </PersistGate>
    </Provider>
  );
}
