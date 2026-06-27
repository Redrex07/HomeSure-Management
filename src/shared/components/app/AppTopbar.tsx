import { Bell, Search, LogOut, UserCircle2, Settings, Check, Palette } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { useSession, setSession } from "@/features/auth/store/auth-store";
import { notifications, properties } from "@/shared/utils/mock-data";
import { NAV_BY_ROLE } from "./AppSidebar";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";

export function AppTopbar() {
  const session = useSession();
  const navigate = useNavigate();
  const [notes, setNotes] = useState(notifications);
  const [open, setOpen] = useState(false);
  const unread = notes.filter((n) => !n.read).length;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const initials = (session?.name ?? "User")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const logout = () => {
    setSession(null);
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="relative ml-2 hidden flex-1 max-w-md md:block">
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="relative h-9 w-full justify-start text-sm text-muted-foreground font-normal bg-background/50 backdrop-blur-md"
        >
          <Search className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">Search properties, tenants, requests…</span>
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Properties">
            {properties.slice(0, 3).map((property) => (
              <CommandItem
                key={property.id}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: "/app/properties" });
                }}
              >
                {property.name}
              </CommandItem>
            ))}
          </CommandGroup>
          {session?.role && NAV_BY_ROLE[session.role]?.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.title}
                    onSelect={() => {
                      setOpen(false);
                      navigate({ to: item.url });
                    }}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {item.title}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
      <div className="ml-auto flex items-center gap-1.5">
        {session?.role?.toLowerCase() === "landlord" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline-block">Theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Theme Color</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { document.documentElement.classList.remove("theme-neon-purple", "theme-custom"); document.documentElement.classList.add("theme-cyber-blue") }} className="gap-2 cursor-pointer">
                <span className="flex h-4 w-4 shrink-0 rounded-full bg-[#52b6ff] shadow-[0_0_8px_rgba(82,182,255,0.6)]" /> Cyber Blue
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { document.documentElement.classList.remove("theme-cyber-blue", "theme-custom"); document.documentElement.classList.add("theme-neon-purple") }} className="gap-2 cursor-pointer">
                <span className="flex h-4 w-4 shrink-0 rounded-full bg-[#b370ff]" /> Neon Purple
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { document.documentElement.classList.remove("theme-cyber-blue", "theme-neon-purple", "theme-custom") }} className="gap-2 cursor-pointer">
                <span className="flex h-4 w-4 shrink-0 rounded-full bg-[#4070ff]" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { document.documentElement.classList.remove("theme-cyber-blue", "theme-neon-purple"); document.documentElement.classList.add("theme-custom") }} className="gap-2 cursor-pointer">
                <span className="flex h-4 w-4 shrink-0 rounded-full bg-[#ff9040]" /> Custom
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <div className="text-sm font-semibold">Notifications</div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setNotes(notes.map((n) => ({ ...n, read: true })))}
              >
                <Check className="mr-1 h-3 w-3" /> Mark all read
              </Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="flex gap-3 border-b border-border/60 px-3 py-3 last:border-0 hover:bg-muted/50"
                >
                  <div
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-muted-foreground/30" : "bg-primary"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-medium">{n.title}</div>
                      <div className="shrink-0 text-[11px] text-muted-foreground">{n.time}</div>
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-2 px-1.5">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-medium leading-none">{session?.name ?? "User"}</div>
                <div className="mt-0.5 text-[10px] leading-none text-muted-foreground">
                  {session?.email ?? "user@homesure.app"}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/app/settings" })}>
              <UserCircle2 className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/app/settings" })}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
