import { Menu, Home, FileText, Radio, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

const navigationItems = [
  { icon: Home, label: 'Dashboard', href: '#dashboard' },
  { icon: FileText, label: 'Intel Logs', href: '#intel-logs' },
  { icon: Radio, label: 'Live Feed', href: '#live-feed' },
  { icon: Settings, label: 'Settings', href: '#settings' },
];

const NavigationDrawer = () => {
  return (
    // THE FIX IS HERE: modal={false}
    <Drawer modal={false}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-sidebar-accent">
          <Menu className="w-5 h-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-sidebar border-sidebar-border">
        <DrawerHeader className="border-b border-sidebar-border">
          <DrawerTitle className="font-display text-xl tracking-wider">TACTICAL NAVIGATION</DrawerTitle>
          <DrawerDescription className="font-tactical text-muted-foreground">
            Access command modules and intelligence systems
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-6 space-y-2">
          {navigationItems.map((item) => (
            <DrawerClose asChild key={item.label}>
              <a
                href={item.href}
                className="flex items-center gap-4 p-4 rounded-lg bg-sidebar-accent/50 border border-sidebar-border hover:bg-sidebar-accent hover:border-primary/50 transition-all group"
              >
                <div className="p-2 rounded bg-primary/10 border border-primary/30 group-hover:glow-primary transition-all">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-tactical font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">[MODULE_ACCESS]</p>
                </div>
              </a>
            </DrawerClose>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default NavigationDrawer;