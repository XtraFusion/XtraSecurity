"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Shield,
    Smartphone,
    Key,
    Globe,
    Plus,
    Trash2,
    QrCode,
    Copy,
    Check,
    AlertTriangle,
    Loader2,
    ArrowLeft
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface MfaStatus {
    mfaEnabled: boolean;
    backupCodesRemaining: number;
}

interface IpAllowlist {
    ipAllowlist: string[];
    count: number;
}

export default function SecuritySettings() {
    const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
    const [ipAllowlist, setIpAllowlist] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // MFA Setup State
    const [setupDialogOpen, setSetupDialogOpen] = useState(false);
    const [qrCode, setQrCode] = useState("");
    const [mfaSecret, setMfaSecret] = useState("");
    const [verifyToken, setVerifyToken] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [backupCodesDialogOpen, setBackupCodesDialogOpen] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Disable MFA State
    const [disableDialogOpen, setDisableDialogOpen] = useState(false);
    const [disableToken, setDisableToken] = useState("");
    const [disabling, setDisabling] = useState(false);

    // IP Allowlist State
    const [newIp, setNewIp] = useState("");
    const [addingIp, setAddingIp] = useState(false);

    useEffect(() => {
        fetchSecuritySettings();
    }, []);

    const fetchSecuritySettings = async () => {
        try {
            setLoading(true);
            const [mfaRes, ipRes] = await Promise.all([
                fetch("/api/mfa/status"),
                fetch("/api/user/ip-allowlist")
            ]);

            if (mfaRes.ok) {
                const mfaData = await mfaRes.json();
                setMfaStatus(mfaData);
            }

            if (ipRes.ok) {
                const ipData: IpAllowlist = await ipRes.json();
                setIpAllowlist(ipData.ipAllowlist || []);
            }
        } catch (error) {
            console.error("Failed to fetch security settings:", error);
        } finally {
            setLoading(false);
        }
    };

    // MFA Setup Functions
    const startMfaSetup = async () => {
        try {
            const res = await fetch("/api/mfa/setup", { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            setQrCode(data.qrCode);
            setMfaSecret(data.secret);
            setSetupDialogOpen(true);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const verifyAndEnableMfa = async () => {
        if (verifyToken.length !== 6) {
            toast({ title: "Error", description: "Enter a 6-digit code", variant: "destructive" });
            return;
        }

        try {
            setVerifying(true);
            const res = await fetch("/api/mfa/setup", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: verifyToken })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            setBackupCodes(data.backupCodes);
            setSetupDialogOpen(false);
            setBackupCodesDialogOpen(true);
            setMfaStatus({ mfaEnabled: true, backupCodesRemaining: data.backupCodes.length });
            toast({ title: "Success", description: "MFA enabled successfully!" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setVerifying(false);
            setVerifyToken("");
        }
    };

    const disableMfa = async () => {
        if (disableToken.length !== 6) {
            toast({ title: "Error", description: "Enter a 6-digit code", variant: "destructive" });
            return;
        }

        try {
            setDisabling(true);
            const res = await fetch("/api/mfa/setup", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: disableToken })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            setMfaStatus({ mfaEnabled: false, backupCodesRemaining: 0 });
            setDisableDialogOpen(false);
            toast({ title: "Success", description: "MFA disabled" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setDisabling(false);
            setDisableToken("");
        }
    };

    // IP Allowlist Functions
    const addIpAddress = async () => {
        if (!newIp) {
            toast({ title: "Error", description: "Enter an IP address", variant: "destructive" });
            return;
        }

        try {
            setAddingIp(true);
            const res = await fetch("/api/user/ip-allowlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ip: newIp })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            setIpAllowlist(data.ipAllowlist);
            setNewIp("");
            toast({ title: "Success", description: `IP ${newIp} added` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setAddingIp(false);
        }
    };

    const removeIpAddress = async (ip: string) => {
        try {
            const res = await fetch("/api/user/ip-allowlist", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ip })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            setIpAllowlist(data.ipAllowlist);
            toast({ title: "Success", description: `IP ${ip} removed` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const copyBackupCode = (code: string, index: number) => {
        navigator.clipboard.writeText(code);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/projects">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                        Security Settings
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your account security, two-factor authentication, and IP restrictions
                    </p>
                </div>

                {/* MFA Section */}
                <Card className="bg-gradient-card border-primary/20 mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Smartphone className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Two-Factor Authentication</CardTitle>
                                    <CardDescription>
                                        Add an extra layer of security to your account
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge
                                variant={mfaStatus?.mfaEnabled ? "default" : "secondary"}
                                className={mfaStatus?.mfaEnabled ? "bg-success text-success-foreground" : ""}
                            >
                                {mfaStatus?.mfaEnabled ? "Enabled" : "Disabled"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {mfaStatus?.mfaEnabled ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Key className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Backup Codes</p>
                                            <p className="text-sm text-muted-foreground">
                                                {mfaStatus.backupCodesRemaining} codes remaining
                                            </p>
                                        </div>
                                    </div>
                                    {mfaStatus.backupCodesRemaining < 3 && (
                                        <Badge variant="destructive" className="gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            Low
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={() => setDisableDialogOpen(true)}
                                >
                                    Disable 2FA
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Two-factor authentication adds an extra layer of security. You'll need to enter a code from your authenticator app when accessing sensitive operations.
                                </p>
                                <Button onClick={startMfaSetup} className="gap-2">
                                    <QrCode className="h-4 w-4" />
                                    Enable 2FA
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* IP Allowlist Section */}
                <Card className="bg-gradient-card border-primary/20">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-info/10 rounded-lg">
                                <Globe className="h-5 w-5 text-info" />
                            </div>
                            <div>
                                <CardTitle>IP Allowlist</CardTitle>
                                <CardDescription>
                                    Restrict API access to specific IP addresses
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter IP address (e.g., 192.168.1.1 or 10.0.0.0/24)"
                                    value={newIp}
                                    onChange={(e) => setNewIp(e.target.value)}
                                    className="flex-1"
                                />
                                <Button onClick={addIpAddress} disabled={addingIp}>
                                    {addingIp ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>

                            {ipAllowlist.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No IP restrictions configured</p>
                                    <p className="text-sm">All IP addresses are currently allowed</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {ipAllowlist.map((ip, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                        >
                                            <code className="text-sm">{ip}</code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeIpAddress(ip)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                                Supports single IPs, CIDR notation (e.g., 192.168.1.0/24), and wildcards (e.g., 192.168.1.*)
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* MFA Setup Dialog */}
            <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                            Scan the QR code with your authenticator app
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {qrCode && (
                            <div className="flex justify-center p-4 bg-white rounded-lg">
                                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Manual Entry Key</Label>
                            <div className="flex gap-2">
                                <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
                                    {mfaSecret}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(mfaSecret);
                                        toast({ title: "Copied!" });
                                    }}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Verification Code</Label>
                            <Input
                                placeholder="Enter 6-digit code"
                                value={verifyToken}
                                onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                maxLength={6}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={verifyAndEnableMfa} disabled={verifying}>
                            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify & Enable
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Backup Codes Dialog */}
            <Dialog open={backupCodesDialogOpen} onOpenChange={setBackupCodesDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-warning" />
                            Save Your Backup Codes
                        </DialogTitle>
                        <DialogDescription>
                            Store these codes in a safe place. Each code can only be used once.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, index) => (
                            <button
                                key={index}
                                onClick={() => copyBackupCode(code, index)}
                                className="flex items-center justify-between p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                            >
                                <code className="text-sm font-mono">{code}</code>
                                {copiedIndex === index ? (
                                    <Check className="h-4 w-4 text-success" />
                                ) : (
                                    <Copy className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setBackupCodesDialogOpen(false)}>
                            I've Saved These Codes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Disable MFA Dialog */}
            <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Disable Two-Factor Authentication
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the extra layer of security from your account. Enter your current authenticator code to confirm.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Enter 6-digit code"
                            value={disableToken}
                            onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            maxLength={6}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={disableMfa}
                            disabled={disabling}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {disabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Disable 2FA
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
