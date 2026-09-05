import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { URLItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Copy, Check, Share2 } from 'lucide-react';

interface ShareModalProps {
  url: URLItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenQr?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  url,
  isOpen,
  onClose,
  onOpenQr,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!url) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url.short_url);
      setCopied(true);
      toast.success('Short link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: url.title || 'URLForge Short Link',
          text: `Check out this link: ${url.short_url}`,
          url: url.short_url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Short Link"
      description={url.title || url.short_url}
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* Link display & copy */}
        <div className="flex items-center gap-2 p-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
          <input
            type="text"
            readOnly
            value={url.short_url}
            className="flex-1 bg-transparent px-2 text-sm text-foreground outline-none font-mono select-all"
          />
          <Button
            size="sm"
            variant="primary"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {typeof navigator.share === 'function' && (
            <Button
              variant="outline"
              onClick={handleNativeShare}
              leftIcon={<Share2 className="w-4 h-4" />}
            >
              Native Share
            </Button>
          )}

          {onOpenQr && (
            <Button
              variant="outline"
              className={typeof navigator.share === 'function' ? '' : 'col-span-2'}
              onClick={() => {
                onClose();
                onOpenQr();
              }}
            >
              View QR Code
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
