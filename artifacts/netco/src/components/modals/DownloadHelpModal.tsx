import { useState } from "react";
import { X, Download, Smartphone, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  configName?: string;
  appType?: string;
  fileExtension?: string;
}

export function DownloadHelpModal({
  isOpen,
  onClose,
  configName = "Server Config",
  appType = "HTTP Custom",
  fileExtension = ".hc",
}: DownloadHelpModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">How to Download & Use {configName}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Download */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-black font-semibold">1</div>
                <h3 className="text-base font-semibold">Download the Config File</h3>
              </div>

              <div className="bg-background/50 border border-border rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Click the <strong>Download Config</strong> button to save the file to your device.
                </p>
                <div className="bg-background rounded p-3 border border-border/50">
                  <code className="text-xs text-primary">{configName}{fileExtension}</code>
                </div>
                <p className="text-xs text-muted-foreground">
                  The file will be downloaded to your default Downloads folder.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Make sure you have <strong>{appType}</strong> installed on your Android device before proceeding.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Install App */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-black font-semibold">2</div>
                <h3 className="text-base font-semibold">Install the App</h3>
              </div>

              <p className="text-sm text-muted-foreground">
                If you don&apos;t have {appType} installed, download it from Google Play Store:
              </p>

              <a
                href="https://play.google.com/store/apps/details?id=xyz.easypro.httpcustom"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Download {appType} from Play Store</span>
              </a>

              <div className="bg-background/50 border border-border rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium">Steps:</h4>
                <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                  <li>Open Google Play Store on your Android device</li>
                  <li>Search for &quot;{appType}&quot;</li>
                  <li>Click &quot;Install&quot; and wait for installation to complete</li>
                  <li>Open the app when ready</li>
                </ol>
              </div>
            </div>
          )}

          {/* Step 3: Import Config */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-black font-semibold">3</div>
                <h3 className="text-base font-semibold">Import Config to {appType}</h3>
              </div>

              <div className="bg-background/50 border border-border rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-foreground">Steps to import:</h4>
                <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                  <li>Open <strong>{appType}</strong> application</li>
                  <li>Tap the menu icon (three horizontal lines)</li>
                  <li>Select <strong>&quot;Import Config&quot;</strong> or <strong>&quot;Add Config&quot;</strong></li>
                  <li>Choose the downloaded file ({configName}{fileExtension})</li>
                  <li>The config will be imported automatically</li>
                  <li>Select the imported config from the list</li>
                  <li>Tap <strong>&quot;Start&quot;</strong> or <strong>&quot;Connect&quot;</strong></li>
                </ol>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  You&apos;re all set! Your connection should now be active. If you experience issues, contact our support team.
                </p>
              </div>
            </div>
          )}

          {/* Contact Support */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-3">
              Need help? Contact us:
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://wa.me/254782829321"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-2 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href="https://t.me/netco"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
              >
                Telegram
              </a>
              <a
                href="mailto:netco@anonymiketech.online"
                className="text-xs px-3 py-2 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
              >
                Email
              </a>
            </div>
          </div>
        </div>

        {/* Footer - Step Navigation */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => step > 1 && setStep((step - 1) as any)}
            disabled={step === 1}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s as any)}
                className={`w-2 h-2 rounded-full transition-colors ${step === s ? "bg-primary" : "bg-muted"}`}
                aria-label={`Go to step ${s}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step < 3 && (
              <Button
                size="sm"
                onClick={() => step < 3 && setStep((step + 1) as any)}
              >
                Next
              </Button>
            )}
            {step === 3 && (
              <Button
                size="sm"
                onClick={onClose}
                className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
              >
                Got It!
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
