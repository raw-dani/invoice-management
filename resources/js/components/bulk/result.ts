import toast from '../../lib/toast';

/**
 * Report a bulk action result to the user via toast.
 */
export function reportBulkResult(label: string, total: number, failed: number): void {
    if (total === 0) {
        toast.info('No applicable items selected.');
    } else if (failed === 0) {
        toast.success(`${label} applied to ${total} item(s).`);
    } else {
        toast.error(`${label} applied to ${total - failed} item(s); ${failed} failed/skipped.`);
    }
}

/**
 * Report a bulk delete result.
 */
export function reportBulkDelete(total: number, failed: number): void {
    if (total === 0) {
        toast.info('No deletable items selected.');
    } else if (failed === 0) {
        toast.success(`Deleted ${total} item(s).`);
    } else {
        toast.error(`Deleted ${total - failed} item(s); ${failed} skipped (not allowed).`);
    }
}