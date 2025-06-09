"use client";

import { useWallet } from "@/hooks/use-wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEX_CONFIG } from "@/lib/token-list";

export function DebugWallet() {
  const { connection, bctChain } = useWallet();

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="border-white/10 bg-black/80 backdrop-blur-xl max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center">
            🔧 Debug: Wallet Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-400">Connected:</span>
              <Badge
                variant={connection.isConnected ? "default" : "secondary"}
                className="ml-1"
              >
                {connection.isConnected ? "Yes" : "No"}
              </Badge>
            </div>

            <div>
              <span className="text-gray-400">Chain ID:</span>
              <Badge variant="outline" className="ml-1 text-white">
                {connection.chainId || "None"}
              </Badge>
            </div>

            <div>
              <span className="text-gray-400">Expected:</span>
              <Badge variant="outline" className="ml-1 text-green-400">
                {DEX_CONFIG.CHAIN_ID}
              </Badge>
            </div>

            <div>
              <span className="text-gray-400">Correct Net:</span>
              <Badge
                variant={
                  connection.isCorrectNetwork ? "default" : "destructive"
                }
                className="ml-1"
              >
                {connection.isCorrectNetwork ? "Yes" : "No"}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-gray-400">Network Name:</span>
            <span className="text-white ml-2">
              {connection.networkName || "Unknown"}
            </span>
          </div>

          <div>
            <span className="text-gray-400">Address:</span>
            <span className="text-white ml-2 font-mono">
              {connection.address
                ? `${connection.address.slice(
                    0,
                    8
                  )}...${connection.address.slice(-6)}`
                : "None"}
            </span>
          </div>

          <div>
            <span className="text-gray-400">Balance:</span>
            <span className="text-white ml-2">
              {connection.balance || "0"}{" "}
              {connection.isCorrectNetwork ? "BCT" : "ETH"}
            </span>
          </div>

          {connection.error && (
            <div className="p-2 rounded bg-red-500/20 border border-red-500/30">
              <span className="text-red-300 text-xs">{connection.error}</span>
            </div>
          )}

          <div className="pt-2 border-t border-white/10">
            <div className="text-gray-400 text-xs">
              Expected: {bctChain.name} ({bctChain.id})
            </div>
            <div className="text-gray-400 text-xs">RPC: {bctChain.rpcUrl}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
