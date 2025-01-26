"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { toast } from "~/hooks/use-toast";

// Add this interface for the API response type
interface BlueskyAuthResponse {
  success: boolean;
  error?: string;
  token?: string;
}

export function BlueskyAuth() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/bluesky/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data: BlueskyAuthResponse =
        (await response.json()) as BlueskyAuthResponse;

      if (!data.success) {
        throw new Error(data.error ?? "Failed to connect to Bluesky");
      }

      if (!data.token) {
        throw new Error("No token received from server");
      }

      localStorage.setItem("bluesky_token", data.token);
      toast({
        title: "Success",
        description: "Connected to Bluesky successfully!",
      });
      setIdentifier("");
      setPassword("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to connect to Bluesky",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Bluesky Handle or Email
        </label>
        <Input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="handle.bsky.social"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          App Password
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your app-specific password"
        />
      </div>
      <Button
        className="w-full"
        onClick={handleConnect}
        disabled={isConnecting || !identifier || !password}
      >
        {isConnecting ? "Connecting..." : "Connect Bluesky Account"}
      </Button>
    </div>
  );
}
