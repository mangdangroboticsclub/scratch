Blockly.Blocks['start_flag'] = {
  init: function() {
    this.appendDummyInput().appendField("Start");
    this.setNextStatement(true, null);
    this.setColour(120);
    this.setTooltip("Start flag (only one allowed, the new one will disappear)");
    this.setHelpUrl("");
  },
  onchange: function(event) {
    if (!this.workspace || this.isInFlyout) return;
    // Only act if this block is not connected (i.e., just placed or top-level)
    if (this.parentBlock_) return;
    // Only act on block creation or move
    if (event && event.type !== Blockly.Events.BLOCK_CREATE && event.type !== Blockly.Events.BLOCK_MOVE) return;
    const blocks = this.workspace.getAllBlocks(false);
    const myId = this.id;
    blocks.forEach(b => {
      if (b.type === 'start_flag' && b.id !== myId) {
        b.dispose(false, true);
      }
    });
  }
};

Blockly.Blocks['stop_flag'] = {
  init: function() {
    this.appendDummyInput().appendField("Stop");
    this.setPreviousStatement(true, null);
    this.setColour(0);
    this.setTooltip("Stop flag (only one allowed, the new one will disappear)");
    this.setHelpUrl("");
  },
  onchange: function(event) {
    if (!this.workspace || this.isInFlyout) return;
    if (this.parentBlock_) return;
    if (event && event.type !== Blockly.Events.BLOCK_CREATE && event.type !== Blockly.Events.BLOCK_MOVE) return;
    const blocks = this.workspace.getAllBlocks(false);
    const myId = this.id;
    blocks.forEach(b => {
      if (b.type === 'stop_flag' && b.id !== myId) {
        b.dispose(false, true);
      }
    });
  }
};

Blockly.Blocks['send_msg'] = {
  init: function() {
    this.appendValueInput("TEXT")
      .setCheck("String")
      .appendField("Send")
      .appendField(new Blockly.FieldLabelSerializable(""), "DUMMY")
      .appendField("to Santa");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FF6680");
    this.setTooltip("Send a message to Santa");
    this.setHelpUrl("");
  },
}


// Define a block with a dropdown to send commands to Santa (initially empty)
Blockly.Blocks['send_cmd_dropdown'] = {
  init: function() {
    this.dropdown = new Blockly.FieldDropdown([["No tools loaded", "NONE"]]);
    this.appendDummyInput("TOOL_SELECT")
        .appendField("Make Santa")
        .appendField(this.dropdown, "CMD");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FF6680");
    this.setTooltip("Send a command to Santa");
    this.setHelpUrl("");
    
    this.currentTool = null;
    this.availableTools = [];
    this.savedToolData = null; // Store tool data for restoration
    
    // Listen for dropdown changes to update parameter inputs
    this.dropdown.setValidator((newValue) => {
      this.updateParameterInputs(newValue);
      return newValue;
    });
    
    // Check if tools are already available when block is created, but avoid errors
    setTimeout(() => {
      if (window.bleManager && window.bleManager.availableTools && window.bleManager.availableTools.length > 0) {
        // Only update if block is still in the workspace (not in flyout)
        if (this.workspace && !this.isInFlyout) {
          this.updateDropdown(window.bleManager.availableTools);
        }
      }
    }, 100);
  },

  // Add serialization methods to save/restore tool selection and parameters
  saveExtraState: function() {
    const state = {};
    const selectedTool = this.getFieldValue('CMD');
    
    console.log('💾 Saving extra state for send_cmd_dropdown, selected tool:', selectedTool, 'currentTool:', this.currentTool);
    
    // Only save if a real tool is selected (not NONE or empty)
    if (selectedTool && selectedTool !== 'NONE' && this.currentTool) {
      state.selectedTool = selectedTool;
      state.toolParameters = {};
      
      // Save current tool data if available
      state.toolData = {
        name: this.currentTool.name,
        inputSchema: this.currentTool.inputSchema,
        description: this.currentTool.description
      };
      console.log('📋 Saving tool data:', state.toolData);
      
      // Save parameter values
      if (this.currentTool.inputSchema && this.currentTool.inputSchema.properties) {
        for (const [paramName, paramSchema] of Object.entries(this.currentTool.inputSchema.properties)) {
          if (paramSchema.type === 'boolean' || paramSchema.enum) {
            const field = this.getField(`${paramName}_VALUE`);
            if (field) {
              state.toolParameters[paramName] = field.getValue();
            }
          }
          // Note: Connected block values will be saved automatically by Blockly
        }
        console.log('🔧 Saving parameters:', state.toolParameters);
      }
      
      const result = state;
      console.log('💾 Save result:', result);
      return result;
    }
    
    console.log('💾 Save result: null (no valid tool selected)');
    return null;
  },

  loadExtraState: function(state) {
    if (!state) {
      console.log('🔄 loadExtraState called with no state');
      return;
    }
    
    console.log('🔄 Loading extra state for send_cmd_dropdown:', state);
    this.savedToolData = state;
    
    // Try to restore immediately if tools are available
    if (window.bleManager && window.bleManager.availableTools && window.bleManager.availableTools.length > 0) {
      console.log('✅ Tools available immediately, restoring state');
      this.restoreToolState();
    } else {
      // Mark for restoration when tools become available
      console.log('⏳ Tools not available yet, marking for restoration');
      this.needsRestoration = true;
    }
  },

  // Method to restore tool state from saved data
  restoreToolState: function() {
    if (!this.savedToolData) return;
    
    console.log('🔧 Restoring tool state:', this.savedToolData);
    const { selectedTool, toolData, toolParameters } = this.savedToolData;
    
    // If we have saved tool data, use it to restore the tool
    if (toolData && selectedTool) {
      console.log('📋 Restoring tool:', selectedTool, toolData);
      // Create a temporary tool object for restoration
      this.currentTool = toolData;
      
      // Update parameter inputs based on saved tool data
      this.updateParameterInputsFromToolData(toolData);
      
      // Update the dropdown menu to include the saved tool
      if (!this.availableTools.find(tool => tool.name === selectedTool)) {
        // Add the saved tool to available tools temporarily for restoration
        this.availableTools.push(toolData);
        this.dropdown.menuGenerator_ = this.availableTools.map(tool => [
          this.formatToolName(tool.name), 
          tool.name
        ]);
      }
      
      // Set the dropdown value (now it should be available)
      try {
        this.setFieldValue(selectedTool, 'CMD');
      } catch (e) {
        console.warn('Could not restore dropdown value:', e.message);
      }
      
      // Restore parameter field values
      if (toolParameters) {
        console.log('🔧 Restoring parameters:', toolParameters);
        for (const [paramName, value] of Object.entries(toolParameters)) {
          const field = this.getField(`${paramName}_VALUE`);
          if (field) {
            field.setValue(value);
          }
        }
      }
      
      // Update tooltip
      this.updateTooltip(toolData);
      console.log('✅ Tool state restored successfully');
    }
    
    this.savedToolData = null;
    this.needsRestoration = false;
  },

  // Helper method to update parameter inputs from saved tool data
  updateParameterInputsFromToolData: function(toolData) {
    this.clearParameterInputs();
    
    if (toolData.inputSchema && toolData.inputSchema.properties) {
      const properties = toolData.inputSchema.properties;
      let inputIndex = 0;
      
      for (const [paramName, paramSchema] of Object.entries(properties)) {
        this.addParameterInput(paramName, paramSchema, inputIndex);
        inputIndex++;
      }
    }
  },
  
  // Method to update dropdown options
  updateDropdown: function(tools) {
    this.availableTools = tools || [];
    
    if (!tools || tools.length === 0) {
      this.dropdown.menuGenerator_ = [["No tools loaded", "NONE"]];
      this.clearParameterInputs();
    } else {
      this.dropdown.menuGenerator_ = tools.map(tool => [
        this.formatToolName(tool.name), 
        tool.name
      ]);
    }
    
    // Force refresh of the dropdown - but avoid setting invalid values
    if (this.dropdown.sourceBlock_ && this.dropdown.sourceBlock_.rendered) {
      const currentValue = this.dropdown.getValue();
      
      // Check if current value is valid in the new menu
      const validOptions = this.dropdown.getOptions();
      const isCurrentValueValid = validOptions.some(option => option[1] === currentValue);
      
      console.log('🔄 Updating dropdown, current value:', currentValue, 'valid:', isCurrentValueValid, 'options:', validOptions.map(o => o[1]));
      
      if (isCurrentValueValid) {
        // Update parameter inputs for current selection if it's still valid
        this.updateParameterInputs(currentValue);
      } else {
        // Don't change the dropdown value if it's invalid - let restoration handle it
        console.log('⚠️ Current dropdown value is invalid, leaving as-is for restoration');
        // Clear parameter inputs since the current selection is invalid
        this.clearParameterInputs();
      }
    }
    
    // Check if this block needs restoration after tools are loaded
    if (this.needsRestoration) {
      console.log('🔄 Block needs restoration, triggering...');
      this.restoreToolState();
    }
  },
  
  // Format tool name for display
  formatToolName: function(toolName) {
    return toolName.charAt(0).toUpperCase() + toolName.slice(1).replace(/_/g, ' ');
  },
  
  // Find tool by name
  findTool: function(toolName) {
    return this.availableTools.find(tool => tool.name === toolName);
  },
  
  // Update parameter inputs based on selected tool
  updateParameterInputs: function(toolName) {
    if (!toolName || toolName === "NONE") {
      this.clearParameterInputs();
      return;
    }
    
    const tool = this.findTool(toolName);
    if (!tool) {
      this.clearParameterInputs();
      return;
    }
    
    this.currentTool = tool;
    this.clearParameterInputs();
    
    // Add parameter inputs based on tool's input schema
    if (tool.inputSchema && tool.inputSchema.properties) {
      const properties = tool.inputSchema.properties;
      let inputIndex = 0;
      
      for (const [paramName, paramSchema] of Object.entries(properties)) {
        this.addParameterInput(paramName, paramSchema, inputIndex);
        inputIndex++;
      }
    }
    
    // Update tooltip with tool description and parameters
    this.updateTooltip(tool);
  },
  
  // Clear all parameter inputs
  clearParameterInputs: function() {
    // Remove all inputs except the tool selection
    const inputsToRemove = [];
    
    // Get all input names from the inputList array
    this.inputList.forEach(input => {
      if (input.name && input.name !== "TOOL_SELECT") {
        inputsToRemove.push(input.name);
      }
    });
    
    // Remove each parameter input
    inputsToRemove.forEach(inputName => {
      try {
        this.removeInput(inputName);
      } catch (e) {
        // Input might already be removed, ignore error
        console.warn(`Could not remove input ${inputName}:`, e.message);
      }
    });
  },
  
  // Add a parameter input based on schema
  addParameterInput: function(paramName, paramSchema, index) {
    const inputName = `PARAM_${paramName.toUpperCase()}`;
    const displayName = this.formatToolName(paramName);
    
    // Determine input type based on parameter schema
    if (paramSchema.type === 'number' || paramSchema.type === 'integer') {
      this.appendValueInput(inputName)
          .setCheck("Number")
          .appendField(displayName);
    } else if (paramSchema.type === 'boolean') {
      this.appendDummyInput(inputName)
          .appendField(displayName)
          .appendField(new Blockly.FieldCheckbox(paramSchema.default || false), `${paramName}_VALUE`);
    } else if (paramSchema.enum) {
      // Create dropdown for enum values
      const options = paramSchema.enum.map(value => [
        this.formatToolName(value.toString()),
        value
      ]);
      this.appendDummyInput(inputName)
          .appendField(displayName)
          .appendField(new Blockly.FieldDropdown(options), `${paramName}_VALUE`);
    } else {
      // Default to string/text input
      this.appendValueInput(inputName)
          .setCheck("String")
          .appendField(displayName);
    }
  },
  
  // Update tooltip with tool information
  updateTooltip: function(tool) {
    let tooltip = `Send command to Santa: ${this.formatToolName(tool.name)}`;
    
    if (tool.description) {
      tooltip += `\n\n${tool.description}`;
    }
    
    if (tool.inputSchema && tool.inputSchema.properties) {
      tooltip += '\n\nParameters:';
      for (const [paramName, paramSchema] of Object.entries(tool.inputSchema.properties)) {
        tooltip += `\n• ${this.formatToolName(paramName)}`;
        if (paramSchema.description) {
          tooltip += `: ${paramSchema.description}`;
        }
        if (paramSchema.type) {
          tooltip += ` (${paramSchema.type})`;
        }
      }
    }
    
    this.setTooltip(tooltip);
  },
  
  // Get parameter values for execution
  getParameterValues: function() {
    const parameters = {};
    
    if (!this.currentTool || !this.currentTool.inputSchema || !this.currentTool.inputSchema.properties) {
      return parameters;
    }
    
    for (const [paramName, paramSchema] of Object.entries(this.currentTool.inputSchema.properties)) {
      const inputName = `PARAM_${paramName.toUpperCase()}`;
      
      if (paramSchema.type === 'boolean' || paramSchema.enum) {
        // Get value from field
        const field = this.getField(`${paramName}_VALUE`);
        if (field) {
          parameters[paramName] = field.getValue();
        }
      } else {
        // Get value from connected block
        const valueBlock = this.getInputTargetBlock(inputName);
        if (valueBlock) {
          // Use placeholder for code generation - will be resolved by generator
          parameters[paramName] = `[[${inputName}]]`;
        } else if (paramSchema.default !== undefined) {
          // Use default value if no block connected
          parameters[paramName] = paramSchema.default;
        }
      }
    }
    
    return parameters;
  }
};

// Global function to update all send_cmd_dropdown blocks with MCP tools
function updateSantaCommandDropdowns(tools) {
  if (!window.Blockly || !Blockly.getMainWorkspace) return;
  
  const workspace = Blockly.getMainWorkspace();
  if (!workspace) return;
  
  // Find all send_cmd_dropdown blocks in the workspace
  const blocks = workspace.getAllBlocks(false);
  blocks.forEach(block => {
    if (block.type === 'send_cmd_dropdown' && typeof block.updateDropdown === 'function') {
      block.updateDropdown(tools);
    }
  });
  
  console.log(`Updated ${blocks.filter(b => b.type === 'send_cmd_dropdown').length} Santa command dropdown(s) with ${tools ? tools.length : 0} tools`);
}

// Make function globally available
window.updateSantaCommandDropdowns = updateSantaCommandDropdowns;

// Global function to trigger restoration for blocks that were loaded before tools were available
function triggerSantaBlockRestoration() {
  if (!window.Blockly || !Blockly.getMainWorkspace) return;
  
  const workspace = Blockly.getMainWorkspace();
  if (!workspace) return;
  
  console.log('🔄 Triggering Santa block restoration...');
  const blocks = workspace.getAllBlocks(false);
  let restoredCount = 0;
  
  blocks.forEach(block => {
    if (block.type === 'send_cmd_dropdown' && block.needsRestoration && typeof block.restoreToolState === 'function') {
      console.log('🔧 Restoring block:', block.id);
      block.restoreToolState();
      restoredCount++;
    }
  });
  
  console.log(`✅ Restored ${restoredCount} Santa command blocks`);
}

// Make function globally available
window.triggerSantaBlockRestoration = triggerSantaBlockRestoration;

// Debug function to check the state of Santa blocks
function debugSantaBlocks() {
  if (!window.Blockly || !Blockly.getMainWorkspace) {
    console.log('❌ Blockly not available');
    return;
  }
  
  const workspace = Blockly.getMainWorkspace();
  if (!workspace) {
    console.log('❌ Workspace not available');
    return;
  }
  
  const blocks = workspace.getAllBlocks(false);
  const santaBlocks = blocks.filter(b => b.type === 'send_cmd_dropdown');
  
  console.log(`🔍 Found ${santaBlocks.length} Santa command blocks:`);
  
  santaBlocks.forEach((block, index) => {
    console.log(`📋 Block ${index + 1}:`, {
      id: block.id,
      selectedTool: block.getFieldValue('CMD'),
      currentTool: block.currentTool ? block.currentTool.name : 'none',
      needsRestoration: block.needsRestoration,
      savedToolData: block.savedToolData,
      availableTools: block.availableTools.length
    });
  });
  
  console.log('🔧 BLE Manager state:', {
    bleManager: !!window.bleManager,
    isConnected: window.bleManager ? window.bleManager.isConnected : false,
    availableTools: window.bleManager ? window.bleManager.availableTools.length : 0,
    tools: window.bleManager ? window.bleManager.availableTools.map(t => t.name) : []
  });
  
  console.log('💾 Workspace Storage state:', {
    workspaceStorage: !!window.workspaceStorage
  });
}

// Make debug function globally available
window.debugSantaBlocks = debugSantaBlocks;

// Test function to simulate tool loading for debugging
function testSantaBlockPersistence() {
  console.log('🧪 Testing Santa block persistence...');
  
  // Simulate some test tools
  const testTools = [
    {
      name: 'move_forward',
      description: 'Move Santa forward',
      inputSchema: {
        properties: {
          distance: { type: 'number', description: 'Distance to move' },
          speed: { type: 'string', enum: ['slow', 'medium', 'fast'], description: 'Movement speed' }
        }
      }
    },
    {
      name: 'say_message',
      description: 'Make Santa say a message',
      inputSchema: {
        properties: {
          message: { type: 'string', description: 'Message to say' },
          loud: { type: 'boolean', description: 'Say loudly', default: false }
        }
      }
    }
  ];
  
  // Simulate BLE manager with tools
  if (!window.bleManager) {
    window.bleManager = {
      availableTools: testTools,
      isConnected: true,
      triggerBlockRestoration: function() {
        console.log('🔄 Mock BLE Manager triggering restoration');
        if (typeof window.triggerSantaBlockRestoration === 'function') {
          window.triggerSantaBlockRestoration();
        }
      }
    };
  } else {
    window.bleManager.availableTools = testTools;
  }
  
  // Update all Santa blocks
  if (typeof window.updateSantaCommandDropdowns === 'function') {
    window.updateSantaCommandDropdowns(testTools);
    console.log('✅ Updated Santa blocks with test tools');
  }
  
  // Show current state
  setTimeout(() => {
    window.debugSantaBlocks();
  }, 500);
}

// Make test function globally available
window.testSantaBlockPersistence = testSantaBlockPersistence;

// Function to manually trigger save for testing
function testSantaBlockSave() {
  console.log('🧪 Testing Santa block save...');
  
  if (!window.Blockly || !Blockly.getMainWorkspace) {
    console.log('❌ Blockly not available');
    return;
  }
  
  const workspace = Blockly.getMainWorkspace();
  if (!workspace) {
    console.log('❌ Workspace not available');
    return;
  }
  
  const blocks = workspace.getAllBlocks(false);
  const santaBlocks = blocks.filter(b => b.type === 'send_cmd_dropdown');
  
  console.log(`🔍 Testing save for ${santaBlocks.length} Santa command blocks:`);
  
  santaBlocks.forEach((block, index) => {
    console.log(`📋 Block ${index + 1} (${block.id}):`);
    console.log('  - Selected tool:', block.getFieldValue('CMD'));
    console.log('  - Current tool:', block.currentTool ? block.currentTool.name : 'none');
    
    // Manually call saveExtraState to test
    const savedState = block.saveExtraState ? block.saveExtraState() : null;
    console.log('  - Saved state:', savedState);
  });
  
  // Test workspace serialization
  console.log('🔧 Testing workspace serialization...');
  const xml = Blockly.Xml.workspaceToDom(workspace);
  const xmlString = Blockly.Xml.domToPrettyText(xml);
  console.log('📄 Workspace XML preview:');
  console.log(xmlString.substring(0, 1000) + (xmlString.length > 1000 ? '...' : ''));
  
  // Trigger a manual save
  if (window.workspaceStorage && window.workspaceStorage.save) {
    console.log('💾 Triggering manual workspace save...');
    window.workspaceStorage.save();
  }
}

// Function to test loading from localStorage
function testSantaBlockLoad() {
  console.log('🧪 Testing Santa block load...');
  
  const data = localStorage.getItem('blockly_workspace_data');
  if (data) {
    console.log('📄 Found saved workspace data');
    try {
      const parsed = JSON.parse(data);
      console.log('📄 Workspace data preview:');
      console.log(parsed.xmlString.substring(0, 1000) + (parsed.xmlString.length > 1000 ? '...' : ''));
      
      // Look for send_cmd_dropdown blocks in the XML
      const santaBlockMatches = parsed.xmlString.match(/<block type="send_cmd_dropdown"[^>]*>/g);
      console.log(`🔍 Found ${santaBlockMatches ? santaBlockMatches.length : 0} Santa blocks in saved XML`);
      
      if (santaBlockMatches) {
        santaBlockMatches.forEach((match, index) => {
          console.log(`  Block ${index + 1}: ${match}`);
        });
      }
    } catch (e) {
      console.error('❌ Error parsing saved data:', e);
    }
  } else {
    console.log('❌ No saved workspace data found');
  }
}

// Make test function globally available
window.testSantaBlockSave = testSantaBlockSave;

// Make load test function globally available
window.testSantaBlockLoad = testSantaBlockLoad;

// Complete test of save/load cycle
function testSantaBlockSaveLoadCycle() {
  console.log('🧪 Testing complete Santa block save/load cycle...');
  
  // Step 1: Check current state
  console.log('📋 Step 1: Current state');
  window.debugSantaBlocks();
  
  // Step 2: Test save
  console.log('📋 Step 2: Testing save');
  window.testSantaBlockSave();
  
  // Step 3: Test load
  console.log('📋 Step 3: Testing load');
  window.testSantaBlockLoad();
  
  // Step 4: Simulate a reload by clearing and reloading
  console.log('📋 Step 4: Simulating workspace reload...');
  if (window.workspaceStorage && window.workspaceStorage.load) {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) {
      // Save current state, clear workspace, then reload
      console.log('💾 Saving, clearing, and reloading...');
      window.workspaceStorage.save();
      
      setTimeout(() => {
        workspace.clear();
        console.log('🗑️ Workspace cleared');
        
        setTimeout(() => {
          window.workspaceStorage.load();
          console.log('🔄 Workspace reloaded');
          
          setTimeout(() => {
            console.log('📋 Final state after reload:');
            window.debugSantaBlocks();
          }, 1000);
        }, 500);
      }, 500);
    }
  }
}

// Make complete test function globally available
window.testSantaBlockSaveLoadCycle = testSantaBlockSaveLoadCycle;

// Test if new serialization system is available
function testBlocklySerializationAPI() {
  console.log('🧪 Testing Blockly serialization API...');
  
  if (!window.Blockly) {
    console.log('❌ Blockly not available');
    return;
  }
  
  console.log('🔍 Blockly object:', Object.keys(Blockly));
  console.log('🔍 Blockly.serialization available:', !!Blockly.serialization);
  
  if (Blockly.serialization) {
    console.log('🔍 Blockly.serialization object:', Object.keys(Blockly.serialization));
    console.log('🔍 Blockly.serialization.workspaces available:', !!Blockly.serialization.workspaces);
    
    if (Blockly.serialization.workspaces) {
      console.log('🔍 Blockly.serialization.workspaces methods:', Object.keys(Blockly.serialization.workspaces));
    }
  }
  
  // Test with a simple workspace
  const workspace = Blockly.getMainWorkspace();
  if (workspace && Blockly.serialization && Blockly.serialization.workspaces) {
    try {
      console.log('🧪 Testing new serialization...');
      const state = Blockly.serialization.workspaces.save(workspace);
      console.log('✅ New serialization works! State:', state);
    } catch (e) {
      console.log('❌ New serialization failed:', e.message);
    }
  }
}

// Make test function globally available
window.testBlocklySerializationAPI = testBlocklySerializationAPI;

// // Robust patch: always patch BLEManager's handleMCPResponse to update Santa CMD dropdowns
function patchBLEManagerForSantaDropdowns() {
  if (
    window.bleManager &&
    typeof window.bleManager.handleMCPResponse === 'function' &&
    !window.bleManager._santaDropdownPatched
  ) {
    const origHandleMCPResponse = window.bleManager.handleMCPResponse.bind(window.bleManager);
    window.bleManager.handleMCPResponse = function(payload) {
      origHandleMCPResponse(payload);
      if (payload && payload.result && payload.result.tools && window.updateSantaCommandDropdowns) {
        window.updateSantaCommandDropdowns(payload.result.tools);
      }
    };
    window.bleManager._santaDropdownPatched = true;
  }
}

// Patch immediately if bleManager exists
patchBLEManagerForSantaDropdowns();

// Also patch whenever bleManager is set in the future
Object.defineProperty(window, 'bleManager', {
  configurable: true,
  set(value) {
    this._bleManager = value;
    patchBLEManagerForSantaDropdowns();
  },
  get() {
    return this._bleManager;
  }
});
// Helper function to execute a Santa command block via BLE
function executeSantaCommandBlock(block) {
  if (!window.bleManager || !window.bleManager.isDeviceConnected()) {
    console.error('BLE device not connected');
    return false;
  }
  
  const toolName = block.getFieldValue('CMD');
  if (!toolName || toolName === 'NONE') {
    console.error('No tool selected');
    return false;
  }
  
  const parameters = block.getParameterValues ? block.getParameterValues() : {};
  
  // Log the execution
  console.log(`Executing Santa command: ${toolName}`, parameters);
  
  // Execute via BLE manager
  return window.bleManager.executeToolByName(toolName, parameters);
}

// Make function globally available
window.executeSantaCommandBlock = executeSantaCommandBlock;