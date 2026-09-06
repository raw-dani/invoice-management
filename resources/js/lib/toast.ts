// Minimal toast utility - no external dep
type ToastType = 'success' | 'error' | 'info';

class ToastService {
    private container: HTMLElement | null = null;

    private ensureContainer() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
        document.body.appendChild(this.container);
    }

    private show(message: string, type: ToastType) {
        this.ensureContainer();
        const el = document.createElement('div');
        const colorClass = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-blue-600',
        }[type];
        el.className = `${colorClass} text-white px-4 py-2 rounded shadow-lg min-w-[200px] max-w-sm animate-fade-in`;
        el.textContent = message;
        this.container!.appendChild(el);
        setTimeout(() => {
            el.classList.add('opacity-0', 'transition-opacity');
            setTimeout(() => el.remove(), 300);
        }, 3500);
    }

    success(message: string) { this.show(message, 'success'); }
    error(message: string)   { this.show(message, 'error'); }
    info(message: string)    { this.show(message, 'info'); }
}

const toast = new ToastService();
export default toast;
