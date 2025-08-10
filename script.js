'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const colorEditor = document.getElementById('color-editor');
    if (!colorEditor) return;

    const root = document.documentElement;
    const initialColorValues = {};
    let activePanel = null;

    const colorVariables = [
        { name: 'Surface (Background)', var: 'surface-1' },
        { name: 'Surface (Card/Modal)', var: 'surface-2' },
        { name: 'Surface (Interactive)', var: 'surface-3' },
        { name: 'Text (Primary)', var: 'text-primary' },
        { name: 'Text (Secondary)', var: 'text-secondary' },
        { name: 'Accent (Equation)', var: 'accent-equation' },
        { name: 'Accent (Link)', var: 'accent-link' },
    ];

    /**
     * Creates and configures a single color control widget.
     * @param {object} color - The color object with name and CSS variable.
     * @returns {HTMLElement} - The fully constructed color control element.
     */
    function createColorControl(color) {
        const container = document.createElement('div');
        container.className = 'color-control-container';

        const initialL = getComputedStyle(root).getPropertyValue(`--${color.var}-l`).trim();
        const initialC = getComputedStyle(root).getPropertyValue(`--${color.var}-c`).trim();
        const initialH = getComputedStyle(root).getPropertyValue(`--${color.var}-h`).trim();
        
        initialColorValues[color.var] = { l: initialL, c: initialC, h: initialH };

        // **PATH FIX NOTE**: The 'src' path MUST use forward slashes (/), not backslashes (\).
        // Also, ensure the file is named exactly 'icon-chevron-down.svg'.
        container.innerHTML = `
            <div class="color-control-header" data-target-panel="panel-${color.var}">
                <div class="color-swatch" style="background-color: var(--${color.var});"></div>
                <div>
                    <h4>${color.name}</h4>
                    <p class="value-label">
                        oklch(<span class="draggable-value" data-param="l" data-var="${color.var}" data-step="0.1">${initialL}</span>% 
                        <span class="draggable-value" data-param="c" data-var="${color.var}" data-step="0.001">${initialC}</span> 
                        <span class="draggable-value" data-param="h" data-var="${color.var}" data-step="1">${initialH}</span>)
                    </p>
                </div>
                <img src="./images/icons/icon-chevron-down.svg" alt="Toggle panel" class="chevron">
            </div>
            <div class="color-control-panel" id="panel-${color.var}">
                <label class="slider-label" for="l-${color.var}">Lightness</label>
                <input type="range" id="l-${color.var}" min="0" max="100" step="0.1" value="${initialL}">
                <span class="value-label" id="l-val-${color.var}">${initialL}</span>
                
                <label class="slider-label" for="c-${color.var}">Chroma</label>
                <input type="range" id="c-${color.var}" min="0" max="0.37" step="0.001" value="${initialC}">
                <span class="value-label" id="c-val-${color.var}">${initialC}</span>

                <label class="slider-label" for="h-${color.var}">Hue</label>
                <input type="range" id="h-${color.var}" min="0" max="360" step="1" value="${initialH}">
                <span class="value-label" id="h-val-${color.var}">${initialH}</span>
            </div>
        `;

        const lSlider = container.querySelector(`#l-${color.var}`);
        const cSlider = container.querySelector(`#c-${color.var}`);
        const hSlider = container.querySelector(`#h-${color.var}`);

        // This is the updateColor function, defined locally for this control
        const updateColor = () => {
            const l = lSlider.value;
            const c = cSlider.value;
            const h = hSlider.value;

            // Update the CSS variables that control the page's global styles
            root.style.setProperty(`--${color.var}-l`, l);
            root.style.setProperty(`--${color.var}-c`, c);
            root.style.setProperty(`--${color.var}-h`, h);
            
            // **BUG FIX ADDED**: Update the color swatch's background in real-time.
            const swatch = container.querySelector('.color-swatch');
            swatch.style.backgroundColor = `oklch(${l}% ${c} ${h})`;
            
            // Update the text value labels
            container.querySelector(`#l-val-${color.var}`).textContent = parseFloat(l).toFixed(1);
            container.querySelector(`#c-val-${color.var}`).textContent = parseFloat(c).toFixed(3);
            container.querySelector(`#h-val-${color.var}`).textContent = Math.round(h);
            container.querySelector(`.draggable-value[data-param='l']`).textContent = parseFloat(l).toFixed(1);
            container.querySelector(`.draggable-value[data-param='c']`).textContent = parseFloat(c).toFixed(3);
            container.querySelector(`.draggable-value[data-param='h']`).textContent = Math.round(h);
        };

        [lSlider, cSlider, hSlider].forEach(slider => slider.addEventListener('input', updateColor));
        lSlider.addEventListener('dblclick', () => resetSlider(lSlider, 'l'));
        cSlider.addEventListener('dblclick', () => resetSlider(cSlider, 'c'));
        hSlider.addEventListener('dblclick', () => resetSlider(hSlider, 'h'));
        
        container.querySelectorAll('.draggable-value').forEach(el => initializeDraggableValue(el, updateColor));

        const resetSlider = (slider, param) => {
            slider.value = initialColorValues[color.var][param];
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        };
        
        return container;
    }

    /**
     * Initializes the click-and-drag functionality for a value span.
     * @param {HTMLElement} el - The element to make draggable.
     * @param {function} updateCallback - The function to call to update the UI.
     */
    function initializeDraggableValue(el, updateCallback) {
        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const param = el.dataset.param;
            const colorVar = el.dataset.var;
            const slider = document.getElementById(`${param}-${colorVar}`);
            if (!slider) return;

            let startX = e.clientX;
            let startValue = parseFloat(slider.value);

            const handleDrag = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const step = parseFloat(el.dataset.step) * (param === 'l' ? 0.5 : 1); 
                let newValue = startValue + dx * step;

                newValue = Math.max(parseFloat(slider.min), Math.min(parseFloat(slider.max), newValue));
                if (param === 'h') newValue = (newValue % 360 + 360) % 360;
                
                slider.value = newValue;
                updateCallback();
            };

            const stopDrag = () => {
                document.removeEventListener('mousemove', handleDrag);
                document.removeEventListener('mouseup', stopDrag);
                document.body.style.cursor = 'default';
            };

            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
            document.body.style.cursor = 'ew-resize';
        });
    }

    // Initialize all color controls
    colorVariables.forEach(color => {
        const controlElement = createColorControl(color);
        colorEditor.appendChild(controlElement);
    });

    // Use event delegation for toggling panels
    colorEditor.addEventListener('click', (e) => {
        const header = e.target.closest('.color-control-header');
        if (!header) return;

        const targetPanelId = header.dataset.targetPanel;
        const panel = document.getElementById(targetPanelId);
        if (!panel) return;

        if (activePanel && activePanel !== panel) {
            activePanel.classList.remove('active');
            activePanel.previousElementSibling.classList.remove('active');
        }

        panel.classList.toggle('active');
        header.classList.toggle('active');
        activePanel = panel.classList.contains('active') ? panel : null;
    });
});