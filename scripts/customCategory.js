class CustomCategory extends Blockly.ToolboxCategory {
  /**
   * Constructor for a custom category.
   * @override
   */
    constructor(categoryDef, toolbox, opt_parent) {
        super(categoryDef, toolbox, opt_parent);
    }

  /** @override */
    addColourBorder_(colour) {
        this.rowDiv_.style.backgroundColor = colour;
    }

    /** @override */
    setSelected(isSelected){
        // We do not store the label span on the category, so use getElementsByClassName.
        var labelDom = this.rowDiv_.getElementsByClassName('blocklyToolboxCategoryLabel')[0];
        if (isSelected) {
            // Lighten the background color when selected
            this.rowDiv_.style.backgroundColor = this.lightenColor(this.colour_, 0.2);
        } else {
            // Set the background back to the original colour.
            this.rowDiv_.style.backgroundColor = this.colour_;
        }
        // This is used for accessibility purposes.
        Blockly.utils.aria.setState(/** @type {!Element} */ (this.htmlDiv_),
            Blockly.utils.aria.State.SELECTED, isSelected);
    }

    /**
     * Helper function to lighten a hex color by a given amount (0-1)
     */
    lightenColor(hex, amt) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        }
        var num = parseInt(hex, 16);
        var r = (num >> 16) & 0xFF;
        var g = (num >> 8) & 0xFF;
        var b = num & 0xFF;
        r = Math.min(255, Math.floor(r + (255 - r) * amt));
        g = Math.min(255, Math.floor(g + (255 - g) * amt));
        b = Math.min(255, Math.floor(b + (255 - b) * amt));
        return `rgb(${r}, ${g}, ${b})`;
    }
}

Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName,
    CustomCategory, true);