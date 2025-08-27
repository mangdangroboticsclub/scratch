function setFlyoutBackgroundColor(color) {
    // Find all flyout backgrounds and set their style fill
    document.querySelectorAll('.blocklyToolboxFlyout .blocklyFlyoutBackground').forEach(bg => {
        bg.setAttribute('style', `fill: ${color}`);
    });
}

function observeFlyoutColor(categoryColors) {
    const flyout = document.querySelector('.blocklyToolboxFlyout');
    if (!flyout) return;

    const observer = new MutationObserver(() => {
        // Get the selected category name from Blockly
        const selectedCategory = window.workspace.getToolbox().getSelectedItem();
        let color = '#ddd'; // default fallback

        if (selectedCategory && selectedCategory.name_) {
            // Use the lowercased key to match your categoryColors object
            const key = selectedCategory.name_.toLowerCase();
            color = categoryColors[key] || color;
        }
        setFlyoutBackgroundColor(color);
    });

    observer.observe(flyout, { childList: true, subtree: true });
}

// Category background colors are now handled by the CustomCategory class