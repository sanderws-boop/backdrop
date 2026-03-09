(function() {
    "use strict";

    var menuEl = null;

    Studio.UI.ContextMenu = {
        init: function() {
            menuEl = document.createElement('div');
            menuEl.className = 'context-menu';
            menuEl.style.display = 'none';
            document.body.appendChild(menuEl);

            document.addEventListener('click', function() {
                Studio.UI.ContextMenu.hide();
            });
            document.addEventListener('contextmenu', function(e) {
                if (!e.target.closest('.canvas-area')) return;
                e.preventDefault();

                var items = [
                    { label: 'Fullscreen', action: function() { Studio.Events.emit('toolbar:fullscreen'); } },
                    { label: 'Export PNG', action: function() { Studio.Events.emit('modal:export'); } },
                    { type: 'separator' },
                    { label: 'Randomize Seed', action: function() {
                        var layer = Studio.Systems.State.getSelectedLayer();
                        if (layer) {
                            Studio.Systems.State.updateLayerParam(Studio.Systems.State.selectedLayerIndex, 'seed', Math.random() * 1000);
                        }
                    }}
                ];

                if (items.length > 0) {
                    Studio.UI.ContextMenu.show(e.clientX, e.clientY, items);
                }
            });
        },

        show: function(x, y, items) {
            var html = '';
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item.type === 'separator') {
                    html += '<div class="context-menu-separator"></div>';
                } else {
                    html += '<button class="context-menu-item' + (item.disabled ? ' disabled' : '') + '" data-index="' + i + '">' + item.label + '</button>';
                }
            }
            menuEl.innerHTML = html;
            menuEl.style.display = 'block';
            menuEl.style.left = x + 'px';
            menuEl.style.top = y + 'px';

            // Keep in viewport
            var rect = menuEl.getBoundingClientRect();
            if (rect.right > window.innerWidth) menuEl.style.left = (x - rect.width) + 'px';
            if (rect.bottom > window.innerHeight) menuEl.style.top = (y - rect.height) + 'px';

            // Bind clicks
            var btns = menuEl.querySelectorAll('.context-menu-item:not(.disabled)');
            for (var j = 0; j < btns.length; j++) {
                (function(btn) {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        var idx = parseInt(btn.dataset.index, 10);
                        if (items[idx] && items[idx].action) items[idx].action();
                        Studio.UI.ContextMenu.hide();
                    });
                })(btns[j]);
            }
        },

        hide: function() {
            if (menuEl) menuEl.style.display = 'none';
        }
    };
})();
