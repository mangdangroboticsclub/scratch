document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-btn');
    const openButtons = document.querySelectorAll('[data-modal]');
    
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.add('closing'); // Add the closing class to modal-content
            }
            modal.classList.add('closing'); // Add the closing class to trigger the animation
            document.body.style.overflow = ''; // Restore background scrolling

            // Wait for the animation to finish before hiding the modal
            modal.addEventListener('animationend', () => {
                modal.style.display = 'none';
                modal.classList.remove('closing'); // Remove the closing class
                if (modalContent) {
                    modalContent.classList.remove('closing'); // Remove the closing class from modal-content
                }
            }, { once: true });
        }
    }

    openButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.closest('.modal').id;
            closeModal(modalId);
        });
    });

    // window.addEventListener('click', (event) => {
    //     modals.forEach(modal => {
    //         if (event.target === modal) {
    //             closeModal(modal.id);
    //         }
    //     });
    // });
});