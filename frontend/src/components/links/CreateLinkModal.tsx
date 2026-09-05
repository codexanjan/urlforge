import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { urlApi } from '../../api';
import { useToast } from '../../hooks/useToast';
import { URLItem } from '../../types';
import { Link2, Sparkles, Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const createLinkSchema = z.object({
  original_url: z.string().min(1, 'Destination URL is required').url('Please enter a valid URL (e.g. https://example.com)'),
  custom_alias: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 3 && val.length <= 32 && /^[a-zA-Z0-9_-]+$/.test(val)), {
      message: 'Custom alias must be 3-32 characters, letters, numbers, hyphens or underscores',
    }),
  title: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  expires_at: z.string().optional(),
});

type CreateLinkFormValues = z.infer<typeof createLinkSchema>;

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUrl: URLItem) => void;
}

export const CreateLinkModal: React.FC<CreateLinkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLinkFormValues>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: {
      original_url: '',
      custom_alias: '',
      title: '',
      description: '',
      expires_at: '',
    },
  });

  const onSubmit = async (values: CreateLinkFormValues) => {
    try {
      const payload = {
        original_url: values.original_url,
        custom_alias: values.custom_alias ? values.custom_alias.trim() : undefined,
        title: values.title ? values.title.trim() : undefined,
        description: values.description ? values.description.trim() : undefined,
        expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
      };

      const result = await urlApi.create(payload);
      toast.success('Short link generated successfully!', 'Link Created');
      reset();
      onClose();
      onSuccess(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create short link', 'Error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Short Link"
      description="Shorten a destination URL, configure a custom alias, and enable tracking."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Destination URL"
          placeholder="https://example.com/my-long-landing-page..."
          leftIcon={<Link2 className="w-4 h-4" />}
          error={errors.original_url?.message}
          {...register('original_url')}
          autoFocus
        />

        <Input
          label="Custom Alias (Optional)"
          placeholder="my-project"
          leftIcon={<Sparkles className="w-4 h-4" />}
          helperText="urlforge.app/{custom-alias}"
          error={errors.custom_alias?.message}
          {...register('custom_alias')}
        />

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors pt-1"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>{showAdvanced ? 'Hide advanced settings' : 'Show advanced settings (Title, Expiration, Notes)'}</span>
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-surface-200 dark:border-surface-800 animate-slide-up">
            <Input
              label="Link Title (Optional)"
              placeholder="e.g. Summer Promo Campaign"
              leftIcon={<FileText className="w-4 h-4" />}
              error={errors.title?.message}
              {...register('title')}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300 mb-1.5">
                Description / Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Internal notes about where this link is deployed..."
                className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm text-foreground placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('description')}
              />
            </div>

            <Input
              label="Expiration Date (Optional)"
              type="datetime-local"
              leftIcon={<Calendar className="w-4 h-4" />}
              helperText="Link will return 410 Expired after this time"
              error={errors.expires_at?.message}
              {...register('expires_at')}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create Short Link
          </Button>
        </div>
      </form>
    </Modal>
  );
};
