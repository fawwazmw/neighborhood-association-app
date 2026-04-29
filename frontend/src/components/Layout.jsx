import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Building2,
  CreditCard,
  ArrowDownCircle,
  BarChart3,
  Menu,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Residents', href: '/residents', icon: Users },
  { name: 'Houses', href: '/houses', icon: Building2 },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Expenses', href: '/expenses', icon: ArrowDownCircle },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/*
 * Sidebar item padding.
 * Collapsed inner = 68 - 8 - 8 = 52px.
 * 18px icon → (52-18)/2 = 17px.  32px avatar → (52-32)/2 = 10px.
 * No padding transition — sidebar width handles the shift.
 */
const itemPad = (c) => (c ? 'px-[17px]' : 'px-3');
const itemPadWide = (c) => (c ? 'px-[10px]' : 'px-3');

/* Fade-only class for text labels — no layout transitions */
const textFade = (c) =>
  c ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3';

/* ─── Nav Items ─────────────────────────────────────────────────────────────── */
function NavItems({ location, collapsed, onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {navigation.map((item) => {
        const isActive =
          location.pathname === item.href ||
          (item.href !== '/' && location.pathname.startsWith(item.href));

        const link = (
          <Link
            to={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center rounded-lg h-10 w-full text-sm font-medium',
              itemPad(collapsed),
              isActive
                ? 'bg-white/15 text-white'
                : 'text-zinc-400 hover:bg-white/10 hover:text-white'
            )}
          >
            <item.icon className="size-[18px] shrink-0" />
            <span
              className={cn(
                'whitespace-nowrap overflow-hidden transition-opacity duration-150',
                textFade(collapsed)
              )}
            >
              {item.name}
            </span>
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.name} delayDuration={0}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.name}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.name}>{link}</div>;
      })}
    </nav>
  );
}

/* ─── Sidebar User ──────────────────────────────────────────────────────────── */
function SidebarUser({ user, collapsed, onLogout, loggingOut }) {
  if (!user) return null;

  return (
    <div className="px-2 pb-3 flex flex-col gap-0.5">
      <div className={cn('flex items-center rounded-lg h-10 w-full', itemPadWide(collapsed))}>
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="bg-emerald-600 text-white text-xs font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'min-w-0 overflow-hidden transition-opacity duration-150',
            collapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3 flex-1'
          )}
        >
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
        </div>
      </div>

      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={onLogout}
            disabled={loggingOut}
            className={cn(
              'flex items-center rounded-lg h-10 w-full text-sm text-zinc-400 hover:bg-white/10 hover:text-red-400 disabled:opacity-50',
              itemPad(collapsed)
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            <span
              className={cn(
                'whitespace-nowrap overflow-hidden transition-opacity duration-150',
                textFade(collapsed)
              )}
            >
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </span>
          </button>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right" className="font-medium">
            Sign Out
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}

/* ─── Main Layout ───────────────────────────────────────────────────────────── */
export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col bg-zinc-900 lg:flex will-change-[width] transition-[width] duration-200 ease-out',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex h-14 items-center shrink-0',
            collapsed ? 'px-[18px]' : 'px-3'
          )}
        >
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={collapsed ? () => setCollapsed(false) : undefined}
                onMouseEnter={() => setLogoHovered(true)}
                onMouseLeave={() => setLogoHovered(false)}
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg shrink-0',
                  collapsed
                    ? 'bg-white/10 hover:bg-white/20 cursor-pointer'
                    : 'bg-white/10 cursor-default'
                )}
              >
                {collapsed && logoHovered ? (
                  <PanelLeft className="size-4 text-white" />
                ) : (
                  <img src="/favicon.png" alt="Logo" className="size-5 object-contain" />
                )}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                Open sidebar
              </TooltipContent>
            )}
          </Tooltip>

          <span
            className={cn(
              'text-sm font-semibold text-white whitespace-nowrap overflow-hidden transition-opacity duration-150',
              collapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-2 flex-1'
            )}
          >
            Neighborhood Admin
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className={cn(
              'flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white shrink-0 transition-opacity duration-150',
              collapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
            )}
          >
            <PanelLeftClose className="size-[18px]" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          <NavItems location={location} collapsed={collapsed} />
        </div>

        {/* User */}
        <SidebarUser
          user={user}
          collapsed={collapsed}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          'will-change-[padding-left] transition-[padding-left] duration-200 ease-out',
          collapsed ? 'lg:pl-[68px]' : 'lg:pl-64'
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-sm px-4">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden size-9">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 bg-zinc-900 border-zinc-800 p-0 [&>button]:text-zinc-400 [&>button]:hover:text-white"
            >
              <div className="flex h-14 items-center gap-2 px-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/10 overflow-hidden">
                  <img src="/favicon.png" alt="Logo" className="size-5 object-contain" />
                </div>
                <span className="text-sm font-semibold text-white">
                  Neighborhood Admin
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-between h-[calc(100%-3.5rem)]">
                <div className="py-2 overflow-y-auto">
                  <NavItems
                    location={location}
                    collapsed={false}
                    onNavigate={() => setSheetOpen(false)}
                  />
                </div>
                <SidebarUser
                  user={user}
                  collapsed={false}
                  onLogout={handleLogout}
                  loggingOut={loggingOut}
                />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-foreground truncate">
              {navigation.find(
                (n) =>
                  location.pathname === n.href ||
                  (n.href !== '/' && location.pathname.startsWith(n.href))
              )?.name || 'Neighborhood Admin'}
            </h2>
          </div>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </TooltipContent>
          </Tooltip>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
