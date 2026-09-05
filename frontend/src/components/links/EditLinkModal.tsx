import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { urlApi } from '../../api';
import { useToast } from '../../hooks/useToast';
import { URLItem } from '../../types';
import { Link2, FileText, Calendar } from 'lucide-react';

const editLinkSchema = z.object({
  original_url: z.string().min(1, 'Destination URL is required').url('Please enter a valid URL'),
  title: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  is_active: z.boolean(),
  expires_at: z.string().optional(),
});

type EditLinkFormValues = z.infer<typeof editLinkSchema>;

interface EditLinkModalProps {
  url: URLItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUrl: URLItem) => void;
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({
  url,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditLinkFormValues>({
    resolver: zodResolver(editLinkSchema),
    defaultValues: {
      original_url: '',
      title: '',
      description: '',
      is_active: true,
      expires_at: '',
    },
  });

  useEffect(() => {
    if (url) {
      reset({
        original_url: url.original_url,
        title: url.title || '',
        description: url.description || '',
        is_active: url.is_active,
        expires_at: url.expires_at ? new Date(url.expires_at).toISOString().slice(0, 16) : '',
      });
    }
  }, [url, reset]);

  if (!url) return null;

  const onSubmit = async (values: EditLinkFormValues) => {
    try {
      const payload = {
        original_url: values.original_url,
        title: values.title?.trim() || null,
        description: values.description?.trim() || null,
        is_active: values.is_active,
        expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
      };

      const updated = await urlApi.update(url.id, payload);
      toast.success('Link settings updated successfully!', 'Saved');
      onClose();
      onSuccess(updated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update link', 'Error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Link Settings"
      description={`Editing ${url.custom_alias || url.short_code}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Destination URL"
          placeholder="https://example.com"
          leftIcon={<Link2 className="w-4 h-4" />}
          error={errors.original_url?.message}
          {...register('original_url')}
        />

        <Input
          label="Title"
          placeholder="Link title"
          leftIcon={<FileText className="w-4 h-4" />}
          error={errors.title?.message}
          {...register('title')}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300 mb-1.5">
            Description / Notes
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('description')}
          />
        </div>

        <Input
          label="Expiration Date (Optional)"
          type="datetime-local"
          leftIcon={<Calendar className="w-4 h-4" />}
          helperText="Leave empty to never expire"
          error={errors.expires_at?.message}
          {...register('expires_at')}
        />

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="is_active"
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-surface-300 dark:border-surface-700"
            {...register('is_active')}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">
            Link is active (uncheck to temporarily disable redirects)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
