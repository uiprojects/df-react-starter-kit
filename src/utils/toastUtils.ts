import Swal from 'sweetalert2';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    padding: '0.5em',
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
});

/**
 * Show a toast notification.
 * @param title - The title of the toast.
 * @param icon - The icon type (success, error, warning, info, question).
 */
export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' | 'question') => {
    Toast.fire({
        icon: icon,
        title: title,
        background: icon == 'success' ? 'green' : 'red',
        color: 'white'
    });
};