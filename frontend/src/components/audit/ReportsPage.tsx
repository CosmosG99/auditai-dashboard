import { PageLayout } from "./PageLayout";
import { FileText, FileSpreadsheet, FileImage, Download, Eye, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const reports = Array.from({ length: 12 }, (_, i) => {
  const typeStr = ["pdf", "csv", "image"][Math.floor(Math.random() * 3)];
  let icon = FileText;
  let color = "text-red-400";
  let bg = "bg-red-400/10";
  let ext = ".pdf";
  
  if (typeStr === "csv") {
    icon = FileSpreadsheet;
    color = "text-emerald-400";
    bg = "bg-emerald-400/10";
    ext = ".csv";
  } else if (typeStr === "image") {
    icon = FileImage;
    color = "text-blue-400";
    bg = "bg-blue-400/10";
    ext = ".png";
  }

  const titles = [
    "Q3 Financial Audit Summary",
    "Weekly Anomaly Detection Log",
    "Vendor Risk Assessment",
    "Employee Expense Outliers",
    "International Transfer Log"
  ];

  return {
    id: `RPT-${Math.floor(Math.random() * 9000) + 1000}`,
    title: titles[Math.floor(Math.random() * titles.length)],
    date: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toLocaleDateString(),
    size: (Math.random() * 15 + 1).toFixed(1) + " MB",
    type: ext,
    icon,
    color,
    bg
  };
});

export function ReportsPage() {
  return (
    <PageLayout 
      title="Audit Reports" 
      subtitle="Generated documentation, spreadsheets, and visual evidence."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/10 backdrop-blur glass-card transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-primary/30 flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl", report.bg, report.color)}>
                  <report.icon className="h-6 w-6" />
                </div>
                <div className="font-mono text-xs text-muted-foreground/60">{report.id}</div>
              </div>
              <h3 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {report.title}{report.type}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-4">
                <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{report.date}</div>
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{report.size}</div>
              </div>
            </div>
            <div className="border-t border-border/40 p-3 bg-secondary/20 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium hover:bg-secondary/80 rounded-lg transition-colors">
                <Eye className="h-4 w-4" /> Preview
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-lg shadow-primary/20">
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
