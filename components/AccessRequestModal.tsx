"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert } from "lucide-react";
import axios from "axios";

interface AccessRequestModalProps {
    open: boolean;
    onClose: () => void;
    projectId: string; // The project we are requesting access to
    secretId?: string; // Optional: specific secret
    secretKey?: string; // Optional: display name
    resourceName?: string; // e.g. "Production Environment" or "API_KEY_PROD"
}

export function AccessRequestModal({
    open,
    onClose,
    projectId,
    secretId,
    secretKey,
    resourceName,
}: AccessRequestModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");
    const [duration, setDuration] = useState("60"); // Default 1 hour

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            toast({ title: "Reason required", description: "Please explain why you need access.", variant: "destructive" });
            return;
        }

        try {
            setLoading(true);
            await axios.post("/api/access-requests", {
                projectId,
                secretId,
                reason,
                duration: parseInt(duration),
            });

            toast({
                title: "Request Sent",
                description: "Your access request has been sent to the admins.",
            });
            onClose();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to send request",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const displayName = secretKey || resourceName || "Restricted Resource";

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <ShieldAlert className="h-5 w-5" />
                        <span className="font-semibold text-sm uppercase tracking-wider">Restricted Access</span>
                    </div>
                    <DialogTitle>Request Access to {displayName}</DialogTitle>
                    <DialogDescription>
                        You currently do not have permission to view or use this resource.
                        Submit a request for temporary access elevation.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration</Label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger id="duration">
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 Minutes</SelectItem>
                                <SelectItem value="60">1 Hour</SelectItem>
                                <SelectItem value="240">4 Hours</SelectItem>
                                <SelectItem value="1440">24 Hours</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Access will automatically expire after this duration.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Access</Label>
                        <Textarea
                            id="reason"
                            placeholder="I need to debug a production issue..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
