// Debug utilities for testing code generation
function debugCodeGeneration() {
    console.log('=== Code Generation Debug ===');
    
    // Check if necessary objects exist
    console.log('✓ window.Blockly:', !!window.Blockly);
    console.log('✓ window.workspace:', !!window.workspace);
    console.log('✓ window.codeGenerator:', !!window.codeGenerator);
    console.log('✓ window.blocklyInterpreter:', !!window.blocklyInterpreter);
    console.log('✓ window.showCodeModal:', !!window.showCodeModal);
    
    if (window.Blockly) {
        console.log('✓ Blockly.Python:', !!window.Blockly.Python);
        console.log('✓ Blockly.JavaScript:', !!window.Blockly.JavaScript);
        
        // Check if our custom generators are loaded
        if (window.Blockly.Python) {
            console.log('✓ Python start_flag generator:', !!window.Blockly.Python['start_flag']);
            console.log('✓ Python send_msg generator:', !!window.Blockly.Python['send_msg']);
            console.log('✓ Python send_cmd_dropdown generator:', !!window.Blockly.Python['send_cmd_dropdown']);
        }
        
        if (window.Blockly.JavaScript) {
            console.log('✓ JavaScript start_flag generator:', !!window.Blockly.JavaScript['start_flag']);
            console.log('✓ JavaScript send_msg generator:', !!window.Blockly.JavaScript['send_msg']);
            console.log('✓ JavaScript send_cmd_dropdown generator:', !!window.Blockly.JavaScript['send_cmd_dropdown']);
        }
    }
    
    if (window.workspace) {
        const blocks = window.workspace.getAllBlocks(false);
        console.log(`✓ Workspace has ${blocks.length} blocks`);
        
        blocks.forEach((block, index) => {
            console.log(`  Block ${index + 1}: ${block.type}`);
        });
    }
    
    // Test code generation
    if (window.codeGenerator && window.workspace) {
        console.log('\n=== Testing Code Generation ===');
        try {
            const pythonCode = window.codeGenerator.generatePythonCode();
            console.log('✓ Python code generated:', pythonCode.length, 'characters');
            console.log('Python code:');
            console.log('---START PYTHON CODE---');
            console.log(pythonCode);
            console.log('---END PYTHON CODE---');
        } catch (error) {
            console.error('✗ Python code generation error:', error);
        }

        try {
            const jsCode = window.codeGenerator.generateJavaScriptCode();
            console.log('✓ JavaScript code generated:', jsCode.length, 'characters');
            console.log('JavaScript code:');
            console.log('---START JAVASCRIPT CODE---');
            console.log(jsCode);
            console.log('---END JAVASCRIPT CODE---');
        } catch (error) {
            console.error('✗ JavaScript code generation error:', error);
        }
    }
    
    console.log('=== Debug Complete ===');
}

// Test button click simulation
function testCodeModal() {
    console.log('Testing code modal...');
    if (window.showCodeModal) {
        window.showCodeModal.generateAndShowCode();
        console.log('✓ Code modal generation triggered');
    } else {
        console.error('✗ Show code modal not available');
    }
}

// Test run execution
function testExecution() {
    console.log('Testing block-by-block execution...');
    if (window.blocklyInterpreter) {
        console.log('✓ Blockly interpreter available');
        
        if (!window.workspace) {
            console.error('✗ Workspace not available');
            return;
        }

        const topBlocks = window.workspace.getTopBlocks(true);
        console.log(`Found ${topBlocks.length} top-level blocks`);
        
        if (topBlocks.length === 0) {
            console.log('No blocks to execute');
        } else {
            console.log('Starting test execution...');
            window.blocklyInterpreter.runBlockByBlock();
        }
    } else {
        console.error('✗ Blockly interpreter not available');
    }
}

// Make functions globally available for browser console testing
window.debugCodeGeneration = debugCodeGeneration;
window.testCodeModal = testCodeModal;
window.testExecution = testExecution;

console.log('✅ Debug utilities loaded. Use debugCodeGeneration(), testCodeModal(), or testExecution() in console.');
