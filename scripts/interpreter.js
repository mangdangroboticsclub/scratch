class XiaozhiInterpreter {
    constructor() {
        this.interpreter = null;
        this.isRunning = false;
        this.isPaused = false;
        this.currentBlock = null;
        this.workspace = null;
        this.highlightedBlocks = [];
        this.stepDelay = 500; // Default delay between steps (ms)
    }

    initialize(workspace) {
        this.workspace = workspace;
        if (!window.Interpreter) {
            console.error('JS-Interpreter (Acorn) not loaded');
            return false;
        }
        console.log('✅ Interpreter initialized with workspace');
        return true;
    }

    generateCode() {
        if (!this.workspace) {
            console.error('No workspace initialized');
            return '';
        }

        // Generate JavaScript code for execution
        try {
            const jsCode = Blockly.JavaScript.workspaceToCode(this.workspace);
            console.log('Generated JavaScript code for interpreter:', jsCode);
            return jsCode;
        } catch (error) {
            console.error('Code generation failed:', error);
            return '';
        }
    }

    setupInterpreterAPIs(interpreter, globalObject) {
        // Add console.log support
        const wrapper = function(text) {
            text = arguments.length ? text : '';
            console.log('🤖 Program output:', String(text));
            return interpreter.createPrimitive(console.log(String(text)));
        };
        interpreter.setProperty(globalObject, 'console',
            interpreter.createObjectProto(interpreter.OBJECT_PROTO));
        interpreter.setProperty(
            interpreter.getProperty(globalObject, 'console'),
            'log', interpreter.createNativeFunction(wrapper));

        // Add Santa command functions
        const executeSantaCommandWrapper = function(command, parameters) {
            console.log('🎅 Executing Santa command:', String(command), String(parameters || ''));
            if (typeof window.executeSantaCommand === 'function') {
                const result = window.executeSantaCommand(String(command), String(parameters || ''));
                return interpreter.createPrimitive(result);
            } else {
                console.log('⚠️ executeSantaCommand not available, simulating:', String(command));
                return interpreter.createPrimitive(true);
            }
        };
        interpreter.setProperty(globalObject, 'executeSantaCommand',
            interpreter.createNativeFunction(executeSantaCommandWrapper));

        // Add sendMessage function  
        const sendMessageWrapper = function(message) {
            console.log('📨 Sending message:', String(message));
            if (typeof window.sendMessage === 'function') {
                const result = window.sendMessage(String(message));
                return interpreter.createPrimitive(result);
            } else {
                console.log('⚠️ sendMessage not available, simulating:', String(message));
                return interpreter.createPrimitive(true);
            }
        };
        interpreter.setProperty(globalObject, 'sendMessage',
            interpreter.createNativeFunction(sendMessageWrapper));

        // Add getSantaTools function for getting available MCP tools
        const getSantaToolsWrapper = function() {
            if (typeof window.getSantaTools === 'function') {
                const tools = window.getSantaTools();
                console.log('🔧 Available Santa tools:', tools.length);
                return interpreter.createPrimitive(JSON.stringify(tools));
            } else {
                console.log('⚠️ getSantaTools not available');
                return interpreter.createPrimitive('[]');
            }
        };
        interpreter.setProperty(globalObject, 'getSantaTools',
            interpreter.createNativeFunction(getSantaToolsWrapper));

        // Add isBluetoothConnected function
        const isBluetoothConnectedWrapper = function() {
            if (typeof window.isBluetoothConnected === 'function') {
                const connected = window.isBluetoothConnected();
                console.log('📡 Bluetooth connected:', connected);
                return interpreter.createPrimitive(connected);
            } else {
                console.log('⚠️ isBluetoothConnected not available');
                return interpreter.createPrimitive(false);
            }
        };
        interpreter.setProperty(globalObject, 'isBluetoothConnected',
            interpreter.createNativeFunction(isBluetoothConnectedWrapper));

        // Add block highlighting support
        const highlightBlockWrapper = function(blockId) {
            if (blockId && this.workspace) {
                this.highlightBlock(String(blockId));
            }
            return interpreter.createPrimitive(true);
        }.bind(this);
        interpreter.setProperty(globalObject, 'highlightBlock',
            interpreter.createNativeFunction(highlightBlockWrapper));

        // Add Math support
        const mathWrapper = interpreter.createObjectProto(interpreter.OBJECT_PROTO);
        interpreter.setProperty(globalObject, 'Math', mathWrapper);
        
        // Math.random
        const mathRandomWrapper = function() {
            return interpreter.createPrimitive(Math.random());
        };
        interpreter.setProperty(mathWrapper, 'random',
            interpreter.createNativeFunction(mathRandomWrapper));
            
        // Math.floor
        const mathFloorWrapper = function(x) {
            return interpreter.createPrimitive(Math.floor(Number(x)));
        };
        interpreter.setProperty(mathWrapper, 'floor',
            interpreter.createNativeFunction(mathFloorWrapper));

        // Add mathRandomInt helper function
        const mathRandomIntWrapper = function(a, b) {
            const min = Number(a);
            const max = Number(b);
            if (min > max) {
                const temp = min;
                min = max;
                max = temp;
            }
            const result = Math.floor(Math.random() * (max - min + 1) + min);
            return interpreter.createPrimitive(result);
        };
        interpreter.setProperty(globalObject, 'mathRandomInt',
            interpreter.createNativeFunction(mathRandomIntWrapper));

        // Add window.LoopTrap support for infinite loop protection
        const windowWrapper = interpreter.createObjectProto(interpreter.OBJECT_PROTO);
        interpreter.setProperty(globalObject, 'window', windowWrapper);
        interpreter.setProperty(windowWrapper, 'LoopTrap',
            interpreter.createPrimitive(1000)); // Allow 1000 iterations
    }

    async runBlockByBlock() {
        if (this.isRunning) {
            console.log('⚠️ Interpreter is already running');
            return;
        }

        const code = this.generateCode();
        if (!code.trim()) {
            console.log('⚠️ No code to execute');
            return;
        }

        console.log('🚀 Starting block-by-block execution...');
        this.isRunning = true;
        this.isPaused = false;

        try {
            // Create interpreter instance with API setup
            this.interpreter = new Interpreter(code, this.setupInterpreterAPIs.bind(this));
            
            // Execute step by step
            while (this.interpreter.step() && this.isRunning) {
                if (this.isPaused) {
                    console.log('⏸️ Execution paused');
                    await this.waitForResume();
                }
                
                // Add delay between steps for visualization
                await this.delay(this.stepDelay);
            }

            console.log('✅ Execution completed');
        } catch (error) {
            console.error('❌ Execution error:', error);
        } finally {
            this.cleanup();
        }
    }

    async runContinuous() {
        if (this.isRunning) {
            console.log('⚠️ Interpreter is already running');
            return;
        }

        const code = this.generateCode();
        if (!code.trim()) {
            console.log('⚠️ No code to execute');
            return;
        }

        console.log('🚀 Starting continuous execution...');
        this.isRunning = true;

        try {
            // Create interpreter instance with API setup
            this.interpreter = new Interpreter(code, this.setupInterpreterAPIs.bind(this));
            
            // Execute all at once
            this.interpreter.run();
            
            console.log('✅ Execution completed');
        } catch (error) {
            console.error('❌ Execution error:', error);
        } finally {
            this.cleanup();
        }
    }

    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            console.log('⏸️ Execution paused');
        }
    }

    resume() {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            console.log('▶️ Execution resumed');
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this.isPaused = false;
            this.cleanup();
            console.log('⏹️ Execution stopped');
        }
    }

    async waitForResume() {
        return new Promise(resolve => {
            const checkResume = () => {
                if (!this.isPaused || !this.isRunning) {
                    resolve();
                } else {
                    setTimeout(checkResume, 100);
                }
            };
            checkResume();
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    highlightBlock(blockId) {
        if (!this.workspace) return;

        // Clear previous highlights
        this.clearHighlights();

        // Highlight current block
        if (blockId) {
            const block = this.workspace.getBlockById(blockId);
            if (block) {
                block.addSelect();
                this.highlightedBlocks.push(blockId);
                this.currentBlock = blockId;
                console.log('🎯 Highlighting block:', blockId);
            }
        }
    }

    clearHighlights() {
        if (!this.workspace) return;

        this.highlightedBlocks.forEach(blockId => {
            const block = this.workspace.getBlockById(blockId);
            if (block) {
                block.removeSelect();
            }
        });
        this.highlightedBlocks = [];
        this.currentBlock = null;
    }

    cleanup() {
        this.clearHighlights();
        this.interpreter = null;
        this.isRunning = false;
        this.isPaused = false;
        this.currentBlock = null;
    }

    setStepDelay(ms) {
        this.stepDelay = Math.max(0, Number(ms) || 500);
        console.log('⏱️ Step delay set to:', this.stepDelay, 'ms');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentBlock: this.currentBlock,
            hasInterpreter: !!this.interpreter
        };
    }
}

// Create global interpreter instance
if (typeof window !== 'undefined') {
    window.xiaozhiInterpreter = new XiaozhiInterpreter();
    
    // Convenience functions for global access
    window.runBlockByBlock = () => window.xiaozhiInterpreter.runBlockByBlock();
    window.runContinuous = () => window.xiaozhiInterpreter.runContinuous();
    window.pauseExecution = () => window.xiaozhiInterpreter.pause();
    window.resumeExecution = () => window.xiaozhiInterpreter.resume();
    window.stopExecution = () => window.xiaozhiInterpreter.stop();
    
    console.log('🎮 Xiaozhi Interpreter initialized with JS-Interpreter support');
}
