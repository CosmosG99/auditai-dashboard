import { PageLayout } from "./PageLayout";
import { ArrowDownRight, ArrowUpRight, Search, Filter, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const transactions = Array.from({ length: 20 }, (_, i) => ({
  id: `TRX-${Math.floor(Math.random() * 1000000)}`,
  date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString(),
  description: [
    "AWS Web Services", "Stripe Payout", "GitHub Enterprise", "Office Supplies", "Client Payment - Alpha Corp"
  ][Math.floor(Math.random() * 5)],
  amount: (Math.random() * 15000).toFixed(2),
  type: Math.random() > 0.4 ? "debit" : "credit",
  status: Math.random() > 0.1 ? "completed" : "pending",
  department: ["Engineering", "HR", "Sales", "Marketing", "Operations"][Math.floor(Math.random() * 5)],
}));

export function TransactionsPage() {
  return (
    <PageLayout 
      title="Transactions" 
      subtitle="View and analyze all organization transactions."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/40 backdrop-blur-md p-4 rounded-xl border border-border">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search transactions, IDs, or amounts..." 
              className="w-full bg-background border border-border pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-secondary/50 transition-all text-sm font-medium">
              <Filter className="h-4 w-4" /> Filter
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium shadow-lg shadow-primary/20">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/20 backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4 hidden md:table-cell">Date</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">{tx.description}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">{tx.id}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                      {tx.date}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary/50 text-secondary-foreground">
                        {tx.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                        tx.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", tx.status === 'completed' ? "bg-emerald-500" : "bg-amber-500")} />
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={cn(
                        "font-semibold font-mono flex items-center justify-end gap-1",
                        tx.type === 'credit' ? "text-emerald-500" : "text-foreground"
                      )}>
                        {tx.type === 'credit' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4 text-muted-foreground" />}
                        ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
