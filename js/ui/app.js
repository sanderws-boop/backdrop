(function() {
    "use strict";

    Studio.UI.App = {
        _initialized: false,

        init: function() {
            if (this._initialized) return;
            this._initialized = true;
            console.log('[Backdrop] Initializing...');

            var canvas = document.getElementById('glcanvas');
            if (!canvas) {
                console.error('[Backdrop] Canvas not found');
                return;
            }

            // Initialize GL Engine
            try {
                Studio.Core.GLEngine.init(canvas);
                console.log('[Backdrop] WebGL2 engine initialized');
            } catch (e) {
                console.error('[Backdrop] WebGL2 init failed:', e);
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;background:#111;font-family:system-ui;flex-direction:column;gap:12px"><h1>WebGL2 Required</h1><p>Your browser does not support WebGL2. Please use a modern browser.</p></div>';
                return;
            }

            // Initialize state with default layer
            Studio.Systems.State.init();
            console.log('[Backdrop] State initialized');

            // Initialize history
            Studio.Systems.History.init();

            // Initialize render pipeline
            Studio.Core.RenderPipeline.init(canvas);
            console.log('[Backdrop] Render pipeline initialized');

            // Initialize UI components (each wrapped individually so one failure doesn't block others)
            var uiComponents = [
                ['Toasts', Studio.UI.Toasts],
                ['Toolbar', Studio.UI.Toolbar],
                ['Shortcuts', Studio.UI.Shortcuts],
                ['ContextMenu', Studio.UI.ContextMenu],
                ['PatternBrowser', Studio.UI.PatternBrowser],
                ['PaletteEditor', Studio.UI.PaletteEditor],
                ['PropertiesPanel', Studio.UI.PropertiesPanel],
                ['TimelineUI', Studio.UI.TimelineUI],
                ['Modals', Studio.UI.Modals],
                ['CommandPalette', Studio.UI.CommandPalette]
            ];
            var uiErrors = 0;
            for (var ci = 0; ci < uiComponents.length; ci++) {
                try {
                    uiComponents[ci][1].init();
                } catch(e) {
                    uiErrors++;
                    console.error('[Backdrop] ' + uiComponents[ci][0] + '.init() failed:', e);
                }
            }
            console.log('[Backdrop] UI initialized' + (uiErrors ? ' (' + uiErrors + ' errors)' : ''));

            // Handle window resize
            var resizeTimeout;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function() {
                    Studio.Events.emit('gl:resize');
                }, 100);
            });

            Studio.Events.on('gl:resize', function() {
                var c = document.getElementById('glcanvas');
                if (c) {
                    c.width = c.clientWidth * (window.devicePixelRatio || 1);
                    c.height = c.clientHeight * (window.devicePixelRatio || 1);
                    Studio.Core.GLEngine.handleResize(c.width, c.height);
                }
            });

            // Initial resize
            canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
            canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);

            // Try restore session
            try {
                if (Studio.Systems.Project.restoreSession()) {
                    console.log('[Backdrop] Session restored');
                }
            } catch(e) {
                console.error('[Backdrop] Session restore error:', e);
            }

            // Auto-save session periodically
            setInterval(function() {
                try { Studio.Systems.Project.saveSession(); } catch(e) {}
            }, 10000);

            // Push initial history state
            Studio.Systems.History.push();

            // Start rendering
            Studio.Core.RenderPipeline.start();
            console.log('[Backdrop] Rendering started');

            // Force all UI panels to sync with current state
            Studio.Events.emit('state:layersChanged');
            Studio.Events.emit('state:layerSelected', Studio.Systems.State.selectedLayerIndex);

            // Show welcome toast
            Studio.UI.Toasts.show('Backdrop loaded — Press ? for shortcuts', 'info', 4000);

            // Build shortcuts overlay content
            var shortcutsContent = document.getElementById('shortcuts-content');
            if (shortcutsContent) {
                shortcutsContent.innerHTML = Studio.UI.Shortcuts.buildHelpContent();
            }
        }
    };

    // Boot when DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        Studio.UI.App.init();
    });
    // Also try immediately in case DOM is already ready
    if (document.readyState !== 'loading') {
        Studio.UI.App.init();
    }
})();
