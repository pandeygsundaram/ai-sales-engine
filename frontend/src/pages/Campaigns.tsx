import React from "react";
import { Megaphone } from "lucide-react";

export function Campaigns() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Campaigns</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage outbound calling and messaging campaigns.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        <Megaphone className="size-12 mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-zinc-300">Campaigns Module</h3>
        <p className="text-sm mt-1 max-w-md text-center">
          This module is currently under construction. Soon you'll be able to create and manage multi-channel sequences.
        </p>
      </div>
    </div>
  );
}
