import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { urlApi } from '../../api';
import { URLItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Download, Copy, Check, QrCode } from 'lucide-react';

interface QrModalProps {
  url: URLItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ url, isOpen, onClose }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  if (!url) return null;

  const qrSvgUrl = `${urlApi.getQrUrl(url.id, 'svg')}&error_correction=${errorCorrection}`;
  const qrPngUrl = `${urlApi.getQrUrl(url.id, 'png')}&size=15&error_correction=${errorCorrection}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url.short_url);
      setCopied(true);
      toast.success('Short link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = async (format: 'svg' | 'png') => {
    const downloadUrl = format === 'svg' ? qrSvgUrl : qrPngUrl;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `qr_${url.custom_alias || url.short_code}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded QR code as ${format.toUpperCase()}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR Code"
      description={`Scannable QR code for ${url.custom_alias || url.short_code}`}
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl border border-surface-200 shadow-md">
          <img
            src={qrSvgUrl}
            alt={`QR code for ${url.short_url}`}
            className="w-52 h-52 object-contain"
          />
        </div>

        <div className="w-full text-xs font-mono text-surface-500 bg-surface-100 dark:bg-surface-800/80 p-2.5 rounded-lg truncate border border-surface-200 dark:border-surface-700">
          {url.short_url}
        </div>

        {/* Error correction toggle */}
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <span>Error Correction:</span>
          {(['L', 'M', 'Q', 'H'] as const).map((ec) => (
            <button
              key={ec}
              type="button"
              onClick={() => setErrorCorrection(ec)}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                errorCorrection === ec
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-300'
              }`}
            >
              {ec}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('png')}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download PNG
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('svg')}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download SVG
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="col-span-2"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied!' : 'Copy Short URL'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
