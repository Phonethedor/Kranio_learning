document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const overlay = document.getElementById('overlay');
    const themeToggle = document.getElementById('themeToggle');

    // Sidebar Logic
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    function closeSidebarMenu() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    menuToggle.addEventListener('click', toggleSidebar);
    closeSidebar.addEventListener('click', closeSidebarMenu);
    overlay.addEventListener('click', closeSidebarMenu);

    // Close sidebar on window resize if it gets larger than mobile breakpoint
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebarMenu();
        }
    });

    // Theme Toggle Logic
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-theme');

        // Save preference
        if (body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }

        // Add a subtle animation to icon
        const icon = themeToggle.querySelector('span');
        icon.style.animation = 'none';
        icon.offsetHeight; /* trigger reflow */
        icon.style.animation = 'spin 0.5s ease';
    });
});

// Add spin keyframe dynamically
const styleDate = document.createElement('style');
styleDate.innerHTML = `
    @keyframes spin {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.2); }
        100% { transform: rotate(360deg) scale(1); }
    }
`;
document.head.appendChild(styleDate);
