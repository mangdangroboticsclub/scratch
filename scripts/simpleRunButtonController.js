// Simple Run Button Controller for Cloud Hosting
// This file provides a robust, simple implementation for run/stop button functionality
// that works reliably on cloud hosting platforms like Google Cloud Storage

console.log('🔘 Simple Run Button Controller loading...');

// Global state tracking
let runButtonSetupComplete = false;

// Simple function to set up run/stop buttons with extensive logging
function setupSimpleRunButtons() {
    console.log('🔘 setupSimpleRunButtons called at:', new Date().toISOString());
    
    // Find buttons
    const runBtn = document.getElementById('runBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    console.log('🔘 Found buttons:', {
        runBtn: !!runBtn,
        stopBtn: !!stopBtn,
        runBtnId: runBtn?.id,
        runBtnVisible: runBtn ? getComputedStyle(runBtn).display !== 'none' : false
    });
    
    if (!runBtn || !stopBtn) {
        console.warn('⚠️ Buttons not found, retrying in 100ms...');
        setTimeout(setupSimpleRunButtons, 100);
        return;
    }
    
    if (runButtonSetupComplete) {
        console.log('✅ Run button setup already complete, skipping');
        return;
    }
    
    // Clear any existing handlers
    console.log('🧹 Clearing existing handlers...');
    runBtn.onclick = null;
    stopBtn.onclick = null;
    
    // Set up simple, direct onclick handlers
    console.log('🔧 Setting up new onclick handlers...');
    
    runBtn.onclick = function(e) {
        console.log('🚀 === RUN BUTTON CLICKED ===');
        console.log('Event details:', {
            type: e?.type,
            timestamp: new Date().toISOString(),
            buttonDisplay: runBtn.style.display,
            buttonVisible: getComputedStyle(runBtn).display !== 'none'
        });
        
        // Prevent event bubbling
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Note: No disabled check needed since button is hidden when not connected
        
        // Execute
        console.log('🎮 Starting execution...');
        try {
            // Check available execution functions
            console.log('Available functions:', {
                runBlockByBlock: !!window.runBlockByBlock,
                runContinuous: !!window.runContinuous,
                runFullSpeed: !!window.runFullSpeed
            });
            
            if (window.runBlockByBlock) {
                console.log('✅ Calling runBlockByBlock(10)...');
                window.runBlockByBlock(10);
                console.log('✅ runBlockByBlock called successfully');
            } else if (window.runContinuous) {
                console.log('✅ Calling runContinuous (fallback)...');
                window.runContinuous();
                console.log('✅ runContinuous called successfully');
            } else if (window.runFullSpeed) {
                console.log('✅ Calling runFullSpeed (fallback)...');
                window.runFullSpeed();
                console.log('✅ runFullSpeed called successfully');
            } else {
                console.error('❌ No execution function available!');
                alert('Execution system not ready. Please reload the page.');
            }
        } catch (error) {
            console.error('❌ Execution error:', error);
            alert('Error starting execution: ' + error.message);
        }
        
        return false;
    };
    
    stopBtn.onclick = function(e) {
        console.log('🛑 === STOP BUTTON CLICKED ===');
        console.log('Event details:', {
            type: e?.type,
            timestamp: new Date().toISOString()
        });
        
        // Prevent event bubbling
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Execute stop
        console.log('🎮 Stopping execution...');
        try {
            if (window.stopExecution) {
                console.log('✅ Calling stopExecution...');
                window.stopExecution();
                console.log('✅ stopExecution called successfully');
            } else {
                console.error('❌ stopExecution function not available!');
                alert('Stop function not ready. Please reload the page.');
            }
        } catch (error) {
            console.error('❌ Stop error:', error);
            alert('Error stopping execution: ' + error.message);
        }
        
        return false;
    };
    
    // Verify handlers were set
    console.log('🧪 Handler verification:', {
        runBtnOnclick: !!runBtn.onclick,
        stopBtnOnclick: !!stopBtn.onclick
    });
    
    // Add visual click test
    runBtn.style.border = '2px solid green';
    setTimeout(() => {
        runBtn.style.border = '';
    }, 1000);
    
    runButtonSetupComplete = true;
    console.log('✅ Simple run button setup complete!');
}

// Test function that can be called from console
window.testRunButton = function() {
    console.log('🧪 Testing run button...');
    const runBtn = document.getElementById('runBtn');
    if (runBtn && runBtn.onclick) {
        console.log('🎯 Manually triggering run button onclick...');
        runBtn.onclick({ 
            preventDefault: () => {}, 
            stopPropagation: () => {},
            type: 'manual'
        });
    } else {
        console.error('❌ Run button or onclick not found');
    }
};

window.testStopButton = function() {
    console.log('🧪 Testing stop button...');
    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn && stopBtn.onclick) {
        console.log('🎯 Manually triggering stop button onclick...');
        stopBtn.onclick({ 
            preventDefault: () => {}, 
            stopPropagation: () => {},
            type: 'manual'
        });
    } else {
        console.error('❌ Stop button or onclick not found');
    }
};

// Debug function
window.debugButtons = function() {
    console.log('🔍 Button Debug Info:');
    const runBtn = document.getElementById('runBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    console.log('Run Button:', {
        exists: !!runBtn,
        visible: runBtn ? getComputedStyle(runBtn).display !== 'none' : false,
        display: runBtn?.style.display,
        onclick: !!runBtn?.onclick,
        innerHTML: runBtn?.innerHTML
    });
    
    console.log('Stop Button:', {
        exists: !!stopBtn,
        visible: stopBtn ? getComputedStyle(stopBtn).display !== 'none' : false,
        display: stopBtn?.style.display,
        onclick: !!stopBtn?.onclick,
        innerHTML: stopBtn?.innerHTML
    });
    
    console.log('Execution Functions:', {
        runBlockByBlock: !!window.runBlockByBlock,
        stopExecution: !!window.stopExecution,
        runContinuous: !!window.runContinuous,
        runFullSpeed: !!window.runFullSpeed
    });
};

// Multiple initialization strategies for cloud hosting robustness
console.log('🚀 Initializing simple run button controller...');

// Try immediate setup
setupSimpleRunButtons();

// Try after short delay
setTimeout(setupSimpleRunButtons, 100);
setTimeout(setupSimpleRunButtons, 500);
setTimeout(setupSimpleRunButtons, 1000);

// Try after DOM loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSimpleRunButtons);
} else {
    setTimeout(setupSimpleRunButtons, 50);
}

// Try after window loaded
window.addEventListener('load', () => {
    setTimeout(setupSimpleRunButtons, 100);
});

console.log('🔘 Simple Run Button Controller loaded. Use window.testRunButton() to test.');
