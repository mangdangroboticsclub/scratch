// Function manager for dynamic function calls
class FunctionManager {
  constructor(workspace) {
    this.workspace = workspace;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for workspace changes to update function calls
    this.workspace.addChangeListener(this.handleWorkspaceChange.bind(this));
    
    // Override Blockly's procedure validation to allow our smart naming
    this.overrideProcedureValidation();
  }

  overrideProcedureValidation() {
    // Store original functions for proper delegation
    const originalGetDefNoReturn = Blockly.Procedures.getDefNoReturn;
    const originalGetDefReturn = Blockly.Procedures.getDefReturn;
    
    // Override to return existing blocks but prevent auto-creation
    Blockly.Procedures.getDefNoReturn = function(name, workspace) {
      console.log('[DEBUG] getDefNoReturn called for:', name);
      
      // First try to find existing block
      const blocks = workspace.getAllBlocks(false);
      const existingBlock = blocks.find(block => 
        block.type === 'procedures_defnoreturn' && 
        block.getFieldValue('NAME') === name
      );
      
      if (existingBlock) {
        console.log('[DEBUG] Found existing defnoreturn block:', existingBlock.id);
        return existingBlock;
      }
      
      console.log('[DEBUG] No existing defnoreturn block found, returning null to prevent auto-creation');
      // Don't auto-create new blocks - return null
      return null;
    };
    
    Blockly.Procedures.getDefReturn = function(name, workspace) {
      console.log('[DEBUG] getDefReturn called for:', name);
      
      // First try to find existing block
      const blocks = workspace.getAllBlocks(false);
      const existingBlock = blocks.find(block => 
        block.type === 'procedures_defreturn' && 
        block.getFieldValue('NAME') === name
      );
      
      if (existingBlock) {
        console.log('[DEBUG] Found existing defreturn block:', existingBlock.id);
        return existingBlock;
      }
      
      console.log('[DEBUG] No existing defreturn block found, returning null to prevent auto-creation');
      // Don't auto-create new blocks - return null
      return null;
    };
    
    // Disable the procedure name validation entirely
    Blockly.Procedures.findLegalName = function(name, block) {
      console.log('[DEBUG] findLegalName called for:', name);
      // Always allow the name as-is
      return name;
    };
    
    // Also override mutateCallers to prevent any automatic creation
    if (Blockly.Procedures.mutateCallers) {
      Blockly.Procedures.mutateCallers = function(defBlock) {
        console.log('[DEBUG] mutateCallers called, but skipping to prevent auto-creation');
        // Skip the mutation to prevent auto-creation
        return;
      };
    }
    
    // Override getDefinition to prevent auto-creation when called from function call blocks
    if (Blockly.Procedures.getDefinition) {
      const originalGetDefinition = Blockly.Procedures.getDefinition;
      Blockly.Procedures.getDefinition = function(name, workspace) {
        console.log('[DEBUG] getDefinition called for:', name);
        
        // Check if definition exists
        const blocks = workspace.getAllBlocks(false);
        const existingDef = blocks.find(block => 
          (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn') && 
          block.getFieldValue('NAME') === name
        );
        
        if (existingDef) {
          console.log('[DEBUG] Found existing definition:', existingDef.id);
          return existingDef;
        }
        
        console.log('[DEBUG] No existing definition found, returning null');
        return null;
      };
    }
    
    console.log('[DEBUG] Procedure validation overrides installed');
  }

  handleWorkspaceChange(event) {
    if (event.type === Blockly.Events.BLOCK_CREATE || 
        event.type === Blockly.Events.BLOCK_DELETE ||
        event.type === Blockly.Events.BLOCK_CHANGE) {
      
      // Debug: Log the event for troubleshooting
      console.log('Workspace change:', event.type, event.blockId);
      
      // If a procedure definition block was just created, fix its name
      if (event.type === Blockly.Events.BLOCK_CREATE) {
        // Use setTimeout to avoid interfering with the block creation process
        setTimeout(() => {
          const block = this.workspace.getBlockById(event.blockId);
          if (block) {
            // Check if this is a function call block that might trigger auto-creation
            if (block.type === 'procedures_callnoreturn' || block.type === 'procedures_callreturn') {
              console.log('[DEBUG] Function call block created:', block.type, block.getFieldValue('NAME'));
              // Don't do anything - our overrides should prevent auto-creation
            }
            // Fix procedure definition blocks if they were created
            else if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn') {
              this.fixNewProcedureBlockName(event.blockId);
            }
          }
        }, 10);
      }
      
      // Handle function name changes specifically
      if (event.type === Blockly.Events.BLOCK_CHANGE && event.element === 'field' && event.name === 'NAME') {
        const block = this.workspace.getBlockById(event.blockId);
        if (block && (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn')) {
          console.log('[DEBUG] Function name changed from', event.oldValue, 'to', event.newValue, ', updating toolbox');
          // Use setTimeout to allow the field change to complete
          setTimeout(() => {
            this.updateAvailableFunctions();
          }, 50);
        }
      }
      // Don't run cleanup/update immediately after a name change to avoid conflicts
      else if (event.type !== Blockly.Events.BLOCK_CHANGE || event.element !== 'field') {
        // Clean up auto-created procedure definitions first
        this.cleanupAutoCreatedProcedures();
        
        // Then update available functions
        this.updateAvailableFunctions();
      }
    }
  }

  fixNewProcedureBlockName(blockId) {
    const block = this.workspace.getBlockById(blockId);
    if (!block) return;
    
    if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn') {
      const currentName = block.getFieldValue('NAME');
      console.log('New procedure block created with name:', currentName);
      
      // If it's a default name and we need to apply smart naming
      if (currentName === 'doSomething' || currentName === 'compute') {
        // Get existing names BEFORE this block was created to avoid counting itself
        const existingNames = this.workspace.getAllBlocks(false)
          .filter(b => b.id !== blockId && (b.type === 'procedures_defnoreturn' || b.type === 'procedures_defreturn'))
          .map(b => b.getFieldValue('NAME'));
        
        // Only apply smart naming if the name is actually taken by another block
        if (existingNames.includes(currentName)) {
          const smartName = this.getNextAvailableFunctionName(currentName);
          if (smartName !== currentName) {
            console.log('Applying smart name:', smartName);
            
            // Use setValue instead of setText for proper field updating
            const nameField = block.getField('NAME');
            if (nameField && nameField.setValue) {
              nameField.setValue(smartName);
            } else if (nameField && nameField.setText) {
              nameField.setText(smartName);
            }
          }
        }
      }
    }
  }

  cleanupAutoCreatedProcedures() {
    // For now, let's disable this entirely since it's causing issues
    // The original problem was fixed by our other overrides
    // We can revisit this later if needed
    return;
    
    // Find all procedure definitions with auto-generated names (containing numbers)
    const allBlocks = this.workspace.getAllBlocks(false);
    const autoCreatedDefs = allBlocks.filter(block => {
      if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn') {
        const name = block.getFieldValue('NAME');
        // Only remove blocks that are clearly auto-created by Blockly, not our smart-named ones
        // Be more conservative - only remove if it's a clear auto-creation pattern
        return /\d+$/.test(name) && 
               (name.includes('doSomething') || name.includes('compute')) &&
               !this.isIntentionallyNumberedFunction(name) &&
               // Additional check: make sure it's not a block we just created
               !block.isInFlyout && 
               block.rendered;
      }
      return false;
    });

    // Remove auto-created definitions
    autoCreatedDefs.forEach(block => {
      console.log('Removing auto-created block:', block.getFieldValue('NAME'));
      block.dispose();
    });
  }

  // Check if a function name is one we intentionally created with numbering
  isIntentionallyNumberedFunction(name) {
    // Get the current expected names from our smart naming system
    const expectedNoReturnName = this.getNextAvailableFunctionName('doSomething');
    const expectedReturnName = this.getNextAvailableFunctionName('compute');
    
    // Allow the function if it matches our expected naming pattern
    return name === expectedNoReturnName || name === expectedReturnName ||
           name === 'doSomething' || name === 'compute';
  }

  updateAvailableFunctions() {
    // Get all function definition blocks
    const functionDefs = this.workspace.getAllBlocks(false).filter(block => 
      block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn'
    );

    console.log('[DEBUG] Found function definitions:', functionDefs.map(b => ({
      type: b.type,
      name: b.getFieldValue('NAME'),
      id: b.id
    })));

    // Create a set of available function names
    const availableFunctions = new Set();
    functionDefs.forEach(block => {
      const functionName = block.getFieldValue('NAME');
      if (functionName && functionName.trim() !== '') {
        availableFunctions.add({
          name: functionName,
          hasReturn: block.type === 'procedures_defreturn'
        });
      }
    });

    // Update the toolbox with available functions
    this.updateToolboxWithFunctions(availableFunctions);
  }

  updateToolboxWithFunctions(availableFunctions) {
    // Get current toolbox
    const toolbox = this.workspace.getToolbox();
    if (!toolbox) return;

    // Find the functions category
    const functionsCategory = toolbox.getToolboxItems().find(item => 
      item.getName && item.getName().toLowerCase() === 'functions'
    );

    if (!functionsCategory) return;

    // Create dynamic function call blocks
    const dynamicBlocks = [];
    
    // Add basic definition blocks with smart naming using mutation
    const nextNoReturnName = this.getNextAvailableFunctionName('doSomething');
    const nextReturnName = this.getNextAvailableFunctionName('compute');
    
    // Debug: Log the names we're using
    console.log('Smart naming:', { nextNoReturnName, nextReturnName });
    
    dynamicBlocks.push({
      kind: 'block',
      type: 'procedures_defnoreturn',
      fields: { NAME: nextNoReturnName },
      extraState: { name: nextNoReturnName }
    });
    
    dynamicBlocks.push({
      kind: 'block',
      type: 'procedures_defreturn',
      fields: { NAME: nextReturnName },
      extraState: { name: nextReturnName }
    });

    // Add available function calls dynamically
    console.log('[DEBUG] Updating toolbox with functions:', Array.from(availableFunctions).map(f => f.name));
    availableFunctions.forEach(func => {
      if (func.hasReturn) {
        dynamicBlocks.push({
          kind: 'block',
          type: 'procedures_callreturn',
          fields: { NAME: func.name }
        });
      } else {
        dynamicBlocks.push({
          kind: 'block',
          type: 'procedures_callnoreturn',
          fields: { NAME: func.name }
        });
      }
    });

    // Update the functions category content
    functionsCategory.updateFlyoutContents(dynamicBlocks);
  }

  // Get the next available function name by incrementing if needed
  getNextAvailableFunctionName(baseName) {
    const existingNames = this.getAvailableFunctions().map(func => func.name);
    
    // If the base name is not taken, use it
    if (!existingNames.includes(baseName)) {
      return baseName;
    }
    
    // Find the next available numbered version
    let counter = 2;
    let candidateName = `${baseName}${counter}`;
    
    while (existingNames.includes(candidateName)) {
      counter++;
      candidateName = `${baseName}${counter}`;
    }
    
    return candidateName;
  }

  // Method to get all available functions for external use
  getAvailableFunctions() {
    const functionDefs = this.workspace.getAllBlocks(false).filter(block => 
      block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn'
    );

    return functionDefs.map(block => ({
      name: block.getFieldValue('NAME'),
      hasReturn: block.type === 'procedures_defreturn',
      block: block
    }));
  }

  // Method to create a call block for a specific function
  createCallBlock(functionName, hasReturn = false) {
    const blockType = hasReturn ? 'procedures_callreturn' : 'procedures_callnoreturn';
    const block = this.workspace.newBlock(blockType);
    block.getField('NAME').setText(functionName);
    block.initSvg();
    block.render();
    return block;
  }
}

// Make it globally available
window.FunctionManager = FunctionManager;
