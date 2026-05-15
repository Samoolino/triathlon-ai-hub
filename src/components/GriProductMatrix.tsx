import { Network } from "lucide-react";
import { PRODUCT_MATRIX } from "@/lib/gri-framework";

const badge = "rounded-sm border border-console-line bg-console-sunken px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider";

export default function GriProductMatrix() {
  return (
    <div>
      <div className="mb-3">
        <h3 className="flex items-center gap-2 font-stencil text-sm">
          <Network className="h-4 w-4 text-accent" /> Event → GRI · Product / Strategy Matrix
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Each row maps an event component to its GRI standard, ESRS link, reportable output and product/business strategy.
        </p>
      </div>
      <div className="overflow-x-auto rounded-sm border border-console-line">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-console-sunken font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Event component</th>
              <th className="px-3 py-2">GRI</th>
              <th className="px-3 py-2">ESRS</th>
              <th className="px-3 py-2">Reportable output</th>
              <th className="px-3 py-2">Product / strategy</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCT_MATRIX.flatMap((s) => [
              <tr key={s.title + "_h"} className="border-t border-console-line bg-background/50">
                <td colSpan={5} className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                  {s.title}
                </td>
              </tr>,
              ...s.rows.map((r, i) => (
                <tr key={s.title + i} className="border-t border-console-line/60 align-top">
                  <td className="px-3 py-2 text-foreground">{r.component}</td>
                  <td className="px-3 py-2"><span className={badge}>{r.gri}</span></td>
                  <td className="px-3 py-2"><span className={badge}>{r.esrs}</span></td>
                  <td className="px-3 py-2 text-muted-foreground">{r.output}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.product}</td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}
