// TopBar visibility controller
class TopBarController {
    constructor() {
        this.topBar = document.getElementById('topBar');
        this.observer = null;
        this.isObserving = false;
        this.init();
    }

    init() {
        // Wait for Blockly to be fully initialized
        if (typeof Blockly !== 'undefined' && window.workspace) {
            this.startObserving();
        } else {
            // Wait for workspace to be available
            const checkWorkspace = () => {
                if (window.workspace) {
                    this.startObserving();
                } else {
                    setTimeout(checkWorkspace, 100);
                }
            };
            checkWorkspace();
        }
    }

    startObserving() {
        if (this.isObserving) return;

        // Create a MutationObserver to watch for changes in blocklyDiv
        this.observer = new MutationObserver(() => {
            this.checkFlyoutVisibility();
        });

        // Start observing the blocklyDiv for changes
        const blocklyDiv = document.getElementById('blocklyDiv');
        if (blocklyDiv) {
            this.observer.observe(blocklyDiv, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            this.isObserving = true;
            
            // Initial check
            this.checkFlyoutVisibility();
        }
    }

    checkFlyoutVisibility() {
        // Find all elements with blocklyFlyout class
        const flyouts = document.querySelectorAll('.blocklyFlyout');
        let flyoutVisible = false;

        flyouts.forEach(flyout => {
            const computedStyle = window.getComputedStyle(flyout);
            const display = computedStyle.display;
            const visibility = computedStyle.visibility;
            const opacity = computedStyle.opacity;

            // Check if flyout is visible (not display:none, not visibility:hidden, not opacity:0)
            if (display !== 'none' && visibility !== 'hidden' && opacity !== '0') {
                flyoutVisible = true;
            }
        });

        // Show/hide topBar based on flyout visibility
        if (flyoutVisible) {
            this.hideTopBar();
        } else {
            this.showTopBar();
        }
    }

    hideTopBar() {
        if (this.topBar) {
            this.topBar.style.display = 'none';
        }
    }

    showTopBar() {
        if (this.topBar) {
            this.topBar.style.display = '';
        }
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.isObserving = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.topBarController = new TopBarController();
});
