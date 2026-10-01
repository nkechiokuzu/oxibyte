import { useState } from 'react';
import { X, Server, CheckCircle2, AlertCircle, Wifi, Usb, Globe, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServerConfigModal({ isOpen, onClose }: ServerConfigModalProps) {
  const currentUrl = getApiBaseUrl();
  const [url, setUrl] = useState(() => localStorage.getItem('oxibyte_server_ip') || currentUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  async function handleTest(targetUrl?: string) {
    const testTarget = (targetUrl || url).trim();
    if (!testTarget) return;

    const formatted = testTarget.startsWith('http')
      ? (testTarget.endsWith('/api') ? testTarget : `${testTarget.replace(/\/$/, '')}/api`)
      : `http://${testTarget}:5000/api`;

    setTesting(true);
    setTestResult(null);

    try {
      const pingUrl = `${formatted}/healthz`;
      let status = 0;

      if (Capacitor.isNativePlatform()) {
        const res = await CapacitorHttp.request({
          method: 'GET',
          url: pingUrl,
          connectTimeout: 5000,
          readTimeout: 5000,
        });
        status = res.status;
      } else {
        const res = await fetch(pingUrl, { method: 'GET' });
        status = res.status;
      }

      // Any HTTP response (200, 304, 401) means the server is reachable and listening!
      if (status >= 200 && status < 500) {
        setTestResult({
          ok: true,
          message: `Connected successfully! (Server responded with HTTP ${status})`,
        });
      } else {
        setTestResult({
          ok: false,
          message: `Server reachable but returned HTTP ${status}.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err?.message || 'Could not connect. Ensure server is running on PC.',
      });
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    const cleaned = url.trim();
    if (cleaned) {
      const formatted = cleaned.startsWith('http')
        ? (cleaned.endsWith('/api') ? cleaned : `${cleaned.replace(/\/$/, '')}/api`)
        : `http://${cleaned}:5000/api`;
      localStorage.setItem('oxibyte_server_ip', formatted);
    } else {
      localStorage.removeItem('oxibyte_server_ip');
    }
    window.location.reload();
  }

  function applyPreset(presetUrl: string) {
    setUrl(presetUrl);
    handleTest(presetUrl);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#121224] p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Server className="text-[#ff6b35]" size={18} />
            <h3 className="font-display text-base font-bold text-white">Backend Server Setup</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#858496] hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[#aaa9ba]">
          Connect via Cloudflare Tunnel (works seamlessly on 4G, 5G or any Wi-Fi), USB cable (ADB reverse), or your local Wi-Fi IP.
        </p>

        <div className="mt-4">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#858496]">
            Server URL or IP
          </label>
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://pvc-newton-shop-table.trycloudflare.com/api"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-3.5 py-2.5 text-sm text-white placeholder:text-[#68687a] focus:border-[#ff6b35] focus:outline-none"
          />
        </div>

        {/* Quick Presets */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('https://pvc-newton-shop-table.trycloudflare.com/api')}
            className="flex items-center gap-1.5 rounded-lg border border-[#57cfc8]/30 bg-[#57cfc8]/10 px-2.5 py-1 text-[11px] font-medium text-[#57cfc8] hover:bg-[#57cfc8]/20"
          >
            <Globe size={12} className="text-[#57cfc8]" />
            Cloudflare Tunnel (4G/Wi-Fi)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('http://localhost:5000/api')}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-[#aaa9ba] hover:border-[#ff6b35] hover:text-white"
          >
            <Usb size={12} className="text-[#f3c969]" />
            ADB USB (localhost:5000)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('http://192.168.229.207:5000/api')}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-[#aaa9ba] hover:border-[#ff6b35] hover:text-white"
          >
            <Wifi size={12} className="text-[#aaa9ba]" />
            Wi-Fi IP (192.168.229.207)
          </button>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-xl border p-2.5 text-xs ${
              testResult.ok
                ? 'border-[#57cfc8]/30 bg-[#57cfc8]/10 text-[#57cfc8]'
                : 'border-[#ff938f]/30 bg-[#ff938f]/10 text-[#ff938f]'
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 size={16} className="shrink-0 text-[#57cfc8]" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-[#ff938f]" />
            )}
            <span className="leading-tight">{testResult.message}</span>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={testing}
            onClick={() => handleTest()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 py-2.5 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-50"
          >
            {testing ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                Testing…
              </>
            ) : (
              'Test Connection'
            )}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl bg-[#ff6b35] py-2.5 text-xs font-bold text-[#1a1a2e] hover:bg-[#ff7b48]"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}
