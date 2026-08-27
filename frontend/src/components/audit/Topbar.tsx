import { Bell, Search, Sun, Moon, Languages, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useThemeLang } from "./ThemeLangContext";
import type { Lang } from "@/lib/i18n";
import { AuditAILogo } from "./AuditAILogo";

const langLabels: Record<Lang, string> = { en: "English", hi: "हिन्दी", kok: "Konkani" };

export function Topbar() {
  const { theme, setTheme, lang, setLang, t } = useThemeLang();
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="h-full flex items-center gap-3 px-4 lg:px-6">
        <div className="lg:hidden">
          <AuditAILogo compact />
        </div>
        <div className="flex-1 max-w-xl relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t.search} className="pl-9 bg-secondary/50 border-border h-10" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:inline-flex gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Language">
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(langLabels) as Lang[]).map((l) => (
                <DropdownMenuItem
                  key={l}
                  onClick={() => setLang(l)}
                  className={lang === l ? "text-primary" : ""}
                >
                  {langLabels[l]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-primary text-primary-foreground text-[10px]">
              7
            </Badge>
          </Button>
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-secondary text-foreground text-xs">RA</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
