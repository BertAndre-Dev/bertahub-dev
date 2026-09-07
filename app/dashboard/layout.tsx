"use client";

import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminNav,
  superAdminNav,
  securityNav,
  residentNav,
  estateAdminNav,
  companyNav,
  staffNav,
  energyProviderNav,
  type NavItem,
} from "@/data/page";
import { AppDispatch, RootState } from "@/redux/store";
import {
  hydrateAuthFromStorage,
  logoutLocally,
  selectEstateModules,
  selectUserRole,
} from "@/redux/slice/auth-mgt/auth-mgt-slice";
import { getSignedInUser, signOut } from "@/redux/slice/auth-mgt/auth-mgt";
import { getApiErrorMessage } from "@/lib/api-error";
import { clearCsrfToken, ensureCsrfToken } from "@/utils/csrf";
import { disconnectSocket } from "@/lib/socket";
import { CommunityChatSocketProvider } from "@/components/providers/CommunityChatSocketProvider";
import { WalletRequiredAlert } from "@/components/wallet/WalletRequiredAlert";
import { MembershipSwitcher } from "@/components/dashboard/MembershipSwitcher";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import { filterNavItemsByEstateModules } from "@/lib/nav-module-filter";
import Image from "next/image";
import Loader from "@/components/ui/Loader";

const DEFAULT_NAV_ROLE = "resident";

function parseNavHref(href: string): { pathname: string; role: string | null } {
  const queryIndex = href.indexOf("?");
  const pathname = queryIndex === -1 ? href : href.slice(0, queryIndex);
  const params = new URLSearchParams(
    queryIndex === -1 ? "" : href.slice(queryIndex + 1),
  );
  return { pathname, role: params.get("role") };
}

function normalizeNavRole(role: string | null): string {
  return (role ?? DEFAULT_NAV_ROLE).trim().toLowerCase().replace(/-/g, " ");
}

function isNavHrefActive(
  href: string,
  pathname: string,
  currentRole: string | null,
): boolean {
  const parsed = parseNavHref(href);
  if (pathname !== parsed.pathname) return false;
  if (parsed.role == null) {
    return true;
  }
  return normalizeNavRole(currentRole) === normalizeNavRole(parsed.role);
}

function isNavGroupCurrent(item: NavItem, pathname: string): boolean {
  const hrefs = [
    item.path,
    ...(item.children ?? []).map((child) => child.path),
  ].filter((path): path is string => Boolean(path));

  return hrefs.some((href) => {
    const { pathname: itemPath } = parseNavHref(href);
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  });
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { token, user: reduxUser } = useSelector(
    (state: RootState) => state.auth,
  );
  const userRole = useSelector(selectUserRole);
  const estateModules = useSelector(selectEstateModules);
  const hasFetchedUser = useRef(false);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openNavMenus, setOpenNavMenus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // 🔹 Handle sidebar state based on screen size (collapsed on mobile, expanded on desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile drawer when crossing sm so it does not stay open on desktop
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = () => {
      if (mq.matches) setMobileSidebarOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // 🔹 Load user from sessionStorage (per-tab) or redirect if missing
  useEffect(() => {
    if (typeof window === "undefined") return;
    const userData = sessionStorage.getItem("user");
    const rawAuth = sessionStorage.getItem("auth");
    const fromAuth = rawAuth
      ? (() => {
          try {
            return JSON.parse(rawAuth)?.user;
          } catch {
            return null;
          }
        })()
      : null;
    const user = userData
      ? (() => {
          try {
            return JSON.parse(userData);
          } catch {
            return null;
          }
        })()
      : fromAuth;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setUser(user);
    setLoading(false);
  }, [router]);

  // 🔹 Hydrate Redux state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(hydrateAuthFromStorage());
    }
  }, [dispatch]);

  // 🔹 Validate token and refresh user session (token is stored in "auth", not "token")
  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawAuth = sessionStorage.getItem("auth");
    const localToken = rawAuth
      ? (() => {
          try {
            return JSON.parse(rawAuth)?.token ?? null;
          } catch {
            return null;
          }
        })()
      : null;

    if (!localToken && !token) {
      router.push("/auth/login");
      return;
    }

    if (!hasFetchedUser.current && (token || localToken)) {
      hasFetchedUser.current = true;
      dispatch(getSignedInUser())
        .unwrap()
        .catch((err: unknown) => {
          const message = getApiErrorMessage(err);
          const statusCode = (err as { statusCode?: number })?.statusCode;
          const isUnauthorized =
            statusCode === 401 ||
            /unauthorized|session|token|expired/i.test(message ?? "");

          if (message) toast.error(message);
          else toast.error("Session expired. Please sign in again.");

          // Compulsory-bill and other 403s should not force logout.
          if (isUnauthorized || statusCode == null) {
            dispatch(logoutLocally());
            router.push("/auth/login");
          }
        });
    }
  }, [dispatch, router, token]);

  // 🔹 Ensure CSRF token exists for authenticated sessions (needed after refresh)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!token) return;
    ensureCsrfToken(token).catch(() => {
      // If this fails, state-changing requests will attempt to refresh it anyway.
    });
  }, [token]);

  // 🔹 Sign out: revoke tokens on server, then clear client session
  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const email =
      (typeof user?.email === "string" && user.email) ||
      (typeof reduxUser?.email === "string" && reduxUser.email) ||
      undefined;
    try {
      await dispatch(signOut(email ? { email } : undefined)).unwrap();
    } catch {
      // Still clear local session if the API is unreachable or already signed out
    } finally {
      clearCsrfToken();
      disconnectSocket();
      dispatch(logoutLocally());
      setSigningOut(false);
      toast.success("Signed out successfully");
      router.push("/auth/login");
    }
  };

  const navItems = useMemo(() => {
    if (!user) return [] as NavItem[];

    const role = (userRole || user?.role || "").toString().toLowerCase();
    let items: NavItem[] =
      role === "super admin"
        ? superAdminNav
        : role === "company"
          ? companyNav
          : role === "energy provider"
            ? energyProviderNav
          : role === "admin"
            ? adminNav
            : role === "estate admin"
              ? estateAdminNav
              : role === "resident"
                ? residentNav
                : role === "staff"
                  ? staffNav
                  : securityNav;

    if (role === "resident") {
      const residentType = (user?.residentType ?? "").toString().toLowerCase();
      if (residentType !== "owner") {
        items = items.filter(
          (item) =>
            item.label !== "Tenant Management" &&
            !(item.path
              ? item.path.includes("/dashboard/resident/user")
              : false),
        );
      }
    }

    const rolesWithModules = new Set([
      "admin",
      "resident",
      "security",
      "estate admin",
      "staff",
      "company",
      "energy provider",
    ]);
    if (rolesWithModules.has(role)) {
      items = filterNavItemsByEstateModules(items, estateModules, { role });
    }

    return items;
  }, [estateModules, user, userRole]);

  const currentNavRole = searchParams.get("role");

  useEffect(() => {
    const labelsToOpen = navItems
      .filter(
        (item) =>
          Boolean(item.children?.length) && isNavGroupCurrent(item, pathname),
      )
      .map((item) => item.label);
    if (labelsToOpen.length === 0) return;

    setOpenNavMenus((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const label of labelsToOpen) {
        if (!next[label]) {
          next[label] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [navItems, pathname]);

  const toggleNavMenu = (label: string) => {
    if (!sidebarOpen) setSidebarOpen(true);
    setOpenNavMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderNavItems = () => {
    if (!user) return null;

    const isNavPathActive = (itemPath: string) =>
      pathname === itemPath || pathname.startsWith(`${itemPath}/`);

    return navItems.map((item, i) => {
      const Icon = item.icon;
      const children = item.children ?? [];
      const hasChildren = children.length > 0;
      const groupOpen = Boolean(openNavMenus[item.label]);

      if (item.label === "Logout") {
        return (
          <button
            key={i}
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            className={`flex items-center w-full gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-muted/50 disabled:opacity-50 cursor-pointer`}
          >
            {Icon ? <Icon className="w-4 h-4 text-[#D31510]" /> : null}
            {sidebarOpen && (
              <span className="text-[#D31510]">{item.label}</span>
            )}
          </button>
        );
      }

      if (hasChildren) {
        return (
          <div key={i} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleNavMenu(item.label)}
              aria-expanded={groupOpen}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/50 active:scale-[0.97] motion-reduce:active:scale-100"
            >
              {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      groupOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </>
              )}
            </button>
            {sidebarOpen && groupOpen
              ? children.map((child) => {
                  if (!child.path) return null;
                  const childActive = isNavHrefActive(
                    child.path,
                    pathname,
                    currentNavRole,
                  );
                  return (
                    <Link
                      key={child.path}
                      href={child.path}
                      className={`flex w-full items-center gap-3 rounded-xl py-2 pr-4 pl-11 text-sm font-medium transition-all duration-200 ${
                        childActive
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span>{child.label}</span>
                    </Link>
                  );
                })
              : null}
          </div>
        );
      }

      if (!item.path) return null;

      const active = isNavPathActive(item.path);

      return (
        <Link
          key={i}
          href={item.path}
          className={`flex items-center w-full gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            active
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          {Icon ? <Icon className="w-4 h-4" /> : null}
          {sidebarOpen && <span>{item.label}</span>}
        </Link>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((open) => {
      const next = !open;
      if (next) setSidebarOpen(true);
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar: off-canvas below sm, docked from sm up */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-out sm:z-40 sm:transition-[width,transform] sm:duration-300 w-64 sm:translate-x-0 ${
          mobileSidebarOpen
            ? "max-sm:translate-x-0 max-sm:shadow-xl"
            : "max-sm:pointer-events-none max-sm:-translate-x-full"
        } ${sidebarOpen ? "sm:w-64" : "sm:w-20"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-sidebar-border pl-6">
            <div
              className={`flex items-center ${!sidebarOpen && "justify-center w-full"}`}
            >
              <Image
                src="/logo.svg"
                alt="BertaHub"
                width={200}
                height={200}
                className="h-16 w-auto max-w-full object-contain"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-8">
            {renderNavItems()}
          </nav>

          {/* User Info */}
          <div className="bg-[#f2f2f2] border-t border-sidebar-border px-2 py-4  ">
            <button
              type="button"
              className="flex items-center gap-0 md:gap-3 w-full hover:bg-sidebar-accent transition-colors overflow-x-scroll cursor-pointer"
              onClick={() => {
                const role = (userRole || user?.role || "")
                  .toString()
                  .toLowerCase();
                if (role === "resident") {
                  router.push("/dashboard/settings?tab=my-profile");
                }
              }}
              title={
                (userRole || user?.role || "").toString().toLowerCase() ===
                "resident"
                  ? "View profile"
                  : undefined
              }
            >
              <div className="bg-[#4E61E5] rounded-full overflow-hidden w-8 h-8 flex-shrink-0">
                <Image
                  src={user?.image || "/profile.svg"}
                  alt="User image"
                  width={40}
                  height={40}
                  className="rounded-full object-cover w-full h-full"
                />
              </div>
              {sidebarOpen && (
                <div className="flex-1 text-left">
                  <p className="text-base font-semibold">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-normal">
                      {user?.role === "resident"
                        ? user?.residentType || "Resident"
                        : user?.role}
                    </p>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main
        className={`flex-1 overflow-auto transition-all duration-300 ml-0 ${sidebarOpen ? "sm:ml-64" : "sm:ml-20"}`}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background">
          <div className="flex h-20 items-center justify-between gap-3 px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-initial">
              <div className="shrink-0 sm:hidden">
                <Image
                  src="/logo.svg"
                  alt="BertaHub"
                  width={250}
                  height={100}
                  className="h-16 w-auto max-w-[11rem] object-contain object-left"
                  priority
                />
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden sm:inline-flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-muted"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5 cursor-pointer" />
                ) : (
                  <Menu className="h-5 w-5 cursor-pointer" />
                )}
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <MembershipSwitcher className="hidden sm:block cursor-pointer" />
              <NotificationsBell />
              <MembershipSwitcher collapsed className="sm:hidden" />
              <button
                type="button"
                title="Open menu"
                onClick={toggleMobileSidebar}
                className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
              >
                {mobileSidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
              <Button
                variant="ghost"
                size="sm"
                disabled={signingOut}
                onClick={handleSignOut}
                className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <WalletRequiredAlert />

        {/* Page Content */}
        <Suspense fallback={<Loader fullScreen label="Loading..." />}>
          <CommunityChatSocketProvider>
            <div className="p-4 md:p-6">{children}</div>
          </CommunityChatSocketProvider>
        </Suspense>
      </main>
    </div>
  );
}
