"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Wallet,
  ChevronDown,
  Copy,
  ExternalLink,
  Power,
  AlertCircle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useWallet, WalletProvider } from "@/hooks/use-wallet";
import { toast } from "sonner";

interface WalletButtonProps {
  className?: string;
  variant?: "default" | "compact";
}

export function WalletButton({
  className = "",
  variant = "default",
}: WalletButtonProps) {
  const {
    connection,
    connect,
    disconnect,
    formatAddress,
    formatBalance,
    supportedWallets,
    bctChain,
  } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const handleConnect = async (wallet: WalletProvider) => {
    await connect(wallet.id);
    setShowModal(false);
    if (connection.isConnected) {
      toast.success(`Connected to ${wallet.name}`, {
        description: "Your wallet has been connected successfully.",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowAccountModal(false);
    toast.info("Wallet disconnected");
  };

  const copyAddress = () => {
    if (connection.address) {
      navigator.clipboard.writeText(connection.address);
      toast.success("Address copied to clipboard");
    }
  };

  const openExplorer = () => {
    if (connection.address) {
      window.open(
        `${bctChain.explorer}/address/${connection.address}`,
        "_blank"
      );
    }
  };

  // Not connected state
  if (!connection.isConnected) {
    return (
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogTrigger asChild>
          <Button
            className={`
              relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 
              hover:from-blue-600 hover:to-purple-700 text-white border-0 
              transition-all duration-300 hover:scale-105 hover:shadow-2xl 
              hover:shadow-purple-500/25 group ${className}
            `}
            size={variant === "compact" ? "sm" : "default"}
          >
            <Wallet className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            Connect Wallet
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-slate-900/95 border-white/10 backdrop-blur-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center">
              <Wallet className="w-6 h-6 mr-3 text-blue-400" />
              Connect to BCTChain
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Chain Info */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {bctChain.name}
                    </div>
                    <div className="text-sm text-blue-200">
                      Next-gen synthetic assets
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Live
                </Badge>
              </div>
            </div>

            {connection.error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-200 text-sm">{connection.error}</p>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Wallet Options */}
            <div className="space-y-3">
              <div className="text-white font-medium mb-3">
                Choose your wallet:
              </div>
              {supportedWallets.map((wallet) => (
                <Button
                  key={wallet.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group"
                  onClick={() => handleConnect(wallet)}
                  disabled={connection.isConnecting}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium group-hover:text-blue-300 transition-colors">
                        {wallet.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {wallet.description}
                      </div>
                    </div>
                    {!wallet.installed && (
                      <Badge
                        variant="outline"
                        className="text-xs text-gray-400 border-gray-600"
                      >
                        Install
                      </Badge>
                    )}
                    {connection.isConnecting && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    )}
                  </div>
                </Button>
              ))}
            </div>

            <div className="pt-4 text-center">
              <p className="text-xs text-gray-400">
                By connecting a wallet, you agree to BCTChain's{" "}
                <a
                  href="/terms"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Terms of Service
                </a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Connected state
  return (
    <Dialog open={showAccountModal} onOpenChange={setShowAccountModal}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`
            bg-white/5 border-white/10 text-white hover:bg-white/10 
            hover:border-white/20 transition-all duration-200 group ${className}
          `}
          size={variant === "compact" ? "sm" : "default"}
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-mono">
              {formatAddress(connection.address)}
            </span>
            {variant !== "compact" && (
              <>
                <Separator orientation="vertical" className="h-4 bg-white/20" />
                <span className="text-sm">
                  {formatBalance(connection.balance)} BCT
                </span>
              </>
            )}
            <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-200" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-slate-900/95 border-white/10 backdrop-blur-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-3 text-green-400" />
            Wallet Connected
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Account Info */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-400 text-sm">Account</div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 text-sm">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-mono text-lg">
                {formatAddress(connection.address)}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyAddress}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={openExplorer}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-1">Balance</div>
              <div className="text-white text-3xl font-bold">
                {formatBalance(connection.balance)}{" "}
                <span className="text-lg text-gray-400">BCT</span>
              </div>
              <div className="text-gray-400 text-sm mt-1">
                ≈ ${(parseFloat(connection.balance || "0") * 1.23).toFixed(2)}{" "}
                USD
              </div>
            </div>
          </div>

          {/* Network */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm">Network</div>
                <div className="text-white font-medium">{bctChain.name}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
              onClick={() =>
                window.open(
                  `${bctChain.explorer}/address/${connection.address}`,
                  "_blank"
                )
              }
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>

            <Button
              variant="destructive"
              className="w-full bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
              onClick={handleDisconnect}
            >
              <Power className="w-4 h-4 mr-2" />
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
