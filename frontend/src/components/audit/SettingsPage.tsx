import { useState } from "react";
import { PageLayout } from "./PageLayout";
import {
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Key,
  Database,
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "security" | "notifications" | "appearance" | "integrations";

const tabs: { key: SettingsTab; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "security", label: "Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "integrations", label: "Integrations", icon: Database },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300",
        enabled ? "bg-primary" : "bg-secondary"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function ProfileSection() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="relative group">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
            JD
          </div>
          <button className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs hover:bg-primary hover:text-primary-foreground transition-all">
            ✏️
          </button>
        </div>
        <div className="flex-1 space-y-4 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">First Name</label>
              <input defaultValue="James" className="w-full bg-secondary/50 border border-border px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Last Name</label>
              <input defaultValue="Donovan" className="w-full bg-secondary/50 border border-border px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Email</label>
            <input defaultValue="james.donovan@auditai.com" className="w-full bg-secondary/50 border border-border px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Role</label>
            <input defaultValue="Senior Auditor · Compliance Lead" disabled className="w-full bg-secondary/30 border border-border/50 px-4 py-2.5 rounded-xl text-sm text-muted-foreground cursor-not-allowed" />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function SecuritySection() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold mb-1">Password</h3>
        <p className="text-xs text-muted-foreground mb-4">Last changed 14 days ago</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Password</label>
            <input
              type={showPassword ? "text" : "password"}
              defaultValue="currentpassword"
              className="w-full bg-secondary/50 border border-border px-4 py-2.5 rounded-xl text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">New Password</label>
            <input type="password" placeholder="Enter new password" className="w-full bg-secondary/50 border border-border px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
        <div className="space-y-3">
          {[
            { icon: Smartphone, label: "Authenticator App", desc: "Google Authenticator or Authy", enabled: true },
            { icon: Mail, label: "Email OTP", desc: "james.donovan@auditai.com", enabled: true },
            { icon: Key, label: "Hardware Key", desc: "YubiKey or security key", enabled: false },
          ].map((method, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", method.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-secondary text-muted-foreground")}>
                  <method.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium">{method.label}</div>
                  <div className="text-xs text-muted-foreground">{method.desc}</div>
                </div>
              </div>
              {method.enabled ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                  <Check className="h-3 w-3" /> Enabled
                </span>
              ) : (
                <button className="text-xs font-medium text-primary hover:underline">Enable</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-semibold mb-2">Active Sessions</h3>
        <p className="text-xs text-muted-foreground mb-4">Manage devices where you're currently logged in</p>
        {[
          { device: "Chrome · Windows 11", location: "Mumbai, India", current: true, time: "Active now" },
          { device: "Safari · macOS", location: "London, UK", current: false, time: "2h ago" },
          { device: "Mobile App · iOS", location: "Mumbai, India", current: false, time: "1d ago" },
        ].map((session, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/20 transition-colors">
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  {session.device}
                  {session.current && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">This device</span>}
                </div>
                <div className="text-xs text-muted-foreground">{session.location} · {session.time}</div>
              </div>
            </div>
            {!session.current && (
              <button className="text-xs text-destructive hover:underline font-medium">Revoke</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsSection() {
  const [settings, setSettings] = useState({
    anomalyAlerts: true,
    weeklyDigest: true,
    complianceUpdates: true,
    apiAlerts: false,
    slackIntegration: true,
    emailReports: false,
  });

  const toggle = (key: keyof typeof settings) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Alert Preferences</h3>
        <div className="space-y-1">
          {[
            { key: "anomalyAlerts" as const, label: "Anomaly Alerts", desc: "Get notified when AI detects suspicious transactions" },
            { key: "weeklyDigest" as const, label: "Weekly Digest", desc: "Summary of audit findings every Monday" },
            { key: "complianceUpdates" as const, label: "Compliance Updates", desc: "SOX and regulatory compliance notifications" },
            { key: "apiAlerts" as const, label: "API Alerts", desc: "Webhook and API integration status changes" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/20 transition-all">
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <Toggle enabled={settings[item.key]} onToggle={() => toggle(item.key)} />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-semibold mb-4">Delivery Channels</h3>
        <div className="space-y-1">
          {[
            { key: "slackIntegration" as const, label: "Slack Notifications", desc: "#audit-alerts channel" },
            { key: "emailReports" as const, label: "Email Reports", desc: "james.donovan@auditai.com" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/20 transition-all">
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <Toggle enabled={settings[item.key]} onToggle={() => toggle(item.key)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppearanceSection() {
  const [selectedTheme, setSelectedTheme] = useState("dark");
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold mb-4">Theme</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: "dark", label: "Dark", gradient: "from-gray-900 to-gray-800", accent: "bg-amber-500" },
            { key: "light", label: "Light", gradient: "from-gray-100 to-white", accent: "bg-amber-600" },
            { key: "system", label: "System", gradient: "from-gray-900 via-gray-500 to-gray-100", accent: "bg-amber-500" },
          ].map((theme) => (
            <button
              key={theme.key}
              onClick={() => setSelectedTheme(theme.key)}
              className={cn(
                "relative p-1 rounded-2xl border-2 transition-all duration-300",
                selectedTheme === theme.key ? "border-primary shadow-lg shadow-primary/20" : "border-border hover:border-border/80"
              )}
            >
              <div className={cn("h-24 rounded-xl bg-gradient-to-br flex items-end p-3", theme.gradient)}>
                <div className="flex gap-1.5">
                  <div className={cn("h-2 w-8 rounded-full", theme.accent)} />
                  <div className="h-2 w-4 rounded-full bg-gray-500/50" />
                </div>
              </div>
              <div className="text-sm font-medium mt-2 mb-1 text-center">{theme.label}</div>
              {selectedTheme === theme.key && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-semibold mb-4">Language</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { code: "en", label: "English", flag: "🇺🇸" },
            { code: "hi", label: "Hindi", flag: "🇮🇳" },
            { code: "es", label: "Español", flag: "🇪🇸" },
            { code: "fr", label: "Français", flag: "🇫🇷" },
          ].map((lang) => (
            <button
              key={lang.code}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                lang.code === "en" ? "border-primary bg-primary/5" : "border-border hover:border-border/80 hover:bg-secondary/20"
              )}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.label}</span>
              {lang.code === "en" && <Check className="h-4 w-4 text-primary ml-auto" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntegrationsSection() {
  return (
    <div className="space-y-4">
      {[
        { name: "Slack", desc: "Send anomaly alerts to your Slack workspace", connected: true, color: "bg-[#4A154B]" },
        { name: "QuickBooks", desc: "Sync financial data from QuickBooks Online", connected: true, color: "bg-[#2CA01C]" },
        { name: "SAP ERP", desc: "Import enterprise resource planning data", connected: false, color: "bg-[#0FAAFF]" },
        { name: "Jira", desc: "Create audit tickets automatically", connected: true, color: "bg-[#0052CC]" },
        { name: "Power BI", desc: "Export dashboards to Power BI workspace", connected: false, color: "bg-[#F2C811]" },
        { name: "Xero", desc: "Accounting data sync and reconciliation", connected: false, color: "bg-[#13B5EA]" },
      ].map((integration, i) => (
        <div key={i} className="flex items-center justify-between p-5 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all group">
          <div className="flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-bold", integration.color)}>
              {integration.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-sm group-hover:text-primary transition-colors">{integration.name}</div>
              <div className="text-xs text-muted-foreground">{integration.desc}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {integration.connected ? (
              <>
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                </span>
                <button className="text-xs text-muted-foreground hover:text-destructive transition-colors">Disconnect</button>
              </>
            ) : (
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10">
                Connect <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  return (
    <PageLayout title="Settings" subtitle="Manage your account, security, and application preferences.">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1">
          <nav className="glass-card rounded-2xl border border-border/50 p-2 space-y-1 lg:sticky lg:top-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.key && <ChevronRight className="h-4 w-4 ml-auto" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 glass-card rounded-2xl border border-border/50 p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === "profile" && "Manage your personal information and account details."}
              {activeTab === "security" && "Configure authentication and access controls."}
              {activeTab === "notifications" && "Choose how and when you receive alerts."}
              {activeTab === "appearance" && "Customize the look and feel of your dashboard."}
              {activeTab === "integrations" && "Connect third-party tools and services."}
            </p>
          </div>

          {activeTab === "profile" && <ProfileSection />}
          {activeTab === "security" && <SecuritySection />}
          {activeTab === "notifications" && <NotificationsSection />}
          {activeTab === "appearance" && <AppearanceSection />}
          {activeTab === "integrations" && <IntegrationsSection />}
        </div>
      </div>
    </PageLayout>
  );
}
