import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { signOut } from '@/lib/auth';
import { LogOut, LayoutDashboard, Menu, Home, Info, Image } from 'lucide-react';
import { toast } from 'sonner';

export const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/about', label: 'About', icon: Info },
    { href: '/gallery', label: 'Gallery', icon: Image },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavLinks = () => (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            isActive(link.href)
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-secondary'
          }`}
        >
          <link.icon className="w-4 h-4" />
          <span>{link.label}</span>
        </Link>
      ))}
      {isAdmin && (
        <Link
          to="/admin"
          onClick={() => setOpen(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            isActive('/admin')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-secondary'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
      )}
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-brand-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold">
          <span className="text-gradient">MYNE WINNER</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <NavLinks />
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 ml-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-2 mt-8">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
