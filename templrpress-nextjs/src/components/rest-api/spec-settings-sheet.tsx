"use client";

/**
 * Spec settings sheet — base URL override + global headers, persisted per
 * spec in localStorage. See openspec/changes/add-openapi-spec-overlay/.
 */

import { useEffect, useState } from "react";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  SheetFormField,
  SheetFormSection,
} from "@/components/ui/sheet-form";
import { toast } from "sonner";
import { useConfig } from "@/providers/config-provider";
import {
  EMPTY_OVERLAY,
  HeaderRow,
  SpecOverlay,
  loadOverlay,
  resetOverlay,
  saveOverlay,
} from "@/lib/openapi-overlay";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specName: string;
  /** Pretty label for the active spec, shown in the header. */
  specLabel: string;
  /** servers[0].url as declared by the spec (read-only chip). */
  specServerUrl?: string;
  /** Called after a successful Save or Reset so callers can refresh state. */
  onChanged?: () => void;
}

export function SpecSettingsSheet({
  open,
  onOpenChange,
  specName,
  specLabel,
  specServerUrl,
  onChanged,
}: Props) {
  const { branding } = useConfig();
  const appName = branding?.app_name || "TemplrPress";
  const [draft, setDraft] = useState<SpecOverlay>(EMPTY_OVERLAY);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  // Load the overlay every time the Sheet opens or the active spec changes.
  useEffect(() => {
    if (!open) return;
    setDraft(loadOverlay(specName));
    setRevealed({});
  }, [open, specName]);

  function updateHeader(idx: number, patch: Partial<HeaderRow>) {
    setDraft((d) => ({
      ...d,
      globalHeaders: d.globalHeaders.map((h, i) =>
        i === idx ? { ...h, ...patch } : h,
      ),
    }));
  }

  function addHeader() {
    setDraft((d) => ({
      ...d,
      globalHeaders: [...d.globalHeaders, { name: "", value: "", enabled: true }],
    }));
  }

  function removeHeader(idx: number) {
    setDraft((d) => ({
      ...d,
      globalHeaders: d.globalHeaders.filter((_, i) => i !== idx),
    }));
  }

  function handleSave() {
    saveOverlay(specName, draft);
    toast.success("Spec settings saved", {
      description: "Stored in this browser only.",
    });
    onOpenChange(false);
    onChanged?.();
  }

  function handleReset() {
    resetOverlay(specName);
    setDraft(EMPTY_OVERLAY);
    toast.success("Spec settings reset to defaults");
    onChanged?.();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b bg-[var(--tg-primary)] px-6 py-4 text-white">
          <SheetTitle className="text-white">Spec settings · {specLabel}</SheetTitle>
          <SheetDescription className="text-white/80">
            Base URL + global headers applied to every Try-It request for this
            spec. Stored in this browser only.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Base URL */}
          <SheetFormSection title="Base URL">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Spec declares:</span>
              <Badge variant="outline" className="font-mono">
                {specServerUrl || "(same origin)"}
              </Badge>
            </div>
            <SheetFormField
              label="Override"
              htmlFor="base-url-override"
              hint="Leave blank to use the spec's declared server URL."
            >
              <Input
                id="base-url-override"
                placeholder="https://staging.example.com"
                value={draft.baseUrlOverride ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, baseUrlOverride: e.target.value }))
                }
                className="font-mono"
              />
            </SheetFormField>
          </SheetFormSection>

          {/* Global headers */}
          <SheetFormSection title="Global headers">
            <p className="text-xs text-muted-foreground">
              Sent on every Try-It request for this spec. User-typed headers in
              the form still take precedence.
            </p>
            <div className="space-y-2">
              {draft.globalHeaders.length === 0 && (
                <p className="text-xs italic text-muted-foreground">
                  No global headers yet.
                </p>
              )}
              {draft.globalHeaders.map((h, i) => {
                const isRevealed = revealed[i] === true;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder="Header name"
                      value={h.name}
                      onChange={(e) => updateHeader(i, { name: e.target.value })}
                      className="font-mono text-xs"
                    />
                    <Input
                      placeholder="Value"
                      type={isRevealed ? "text" : "password"}
                      value={h.value}
                      onChange={(e) => updateHeader(i, { value: e.target.value })}
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setRevealed((r) => ({ ...r, [i]: !isRevealed }))
                      }
                      aria-label={isRevealed ? "Hide value" : "Reveal value"}
                    >
                      {isRevealed ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHeader(i)}
                      aria-label="Remove header"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHeader}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add header
              </Button>
            </div>
          </SheetFormSection>

          {/* Note about persistence (Reset action moved to the footer) */}
          <p className="text-[10px] text-muted-foreground">
            Settings are stored in this browser&apos;s localStorage only. Token
            values are never sent to the {appName} backend.
          </p>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex w-full items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
            >
              Reset to defaults
            </Button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-[var(--tg-primary)] text-white hover:bg-[var(--tg-primary)]/90"
              >
                Save
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
