'use client';

import DashboardLayout from "@/app/dashboard/layout";
import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Provider } from 'react-redux';
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/redux/store";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ClientProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathName = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Paths that should NOT use the Dashboard layout
  const excludePaths = [
    '/',
    '/auth/sign-up',
    '/auth/login',
    '/auth/forgot-password',
    '/security/visitor',
    '/error',
  ];

  // Check if current path matches any excluded path
  const isExcluded = excludePaths.some(path => pathName.startsWith(path));

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <ToastContainer position="top-center" autoClose={3000} />
        {isExcluded ? (
          children
        ) : (
          <DashboardLayout>{children}</DashboardLayout>
        )}
      </PersistGate>
    </Provider>
  );
}
