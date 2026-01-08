// DOM elements
const textInput = document.getElementById('textInput');
const colorsContainer = document.getElementById('colorsContainer');
const colorCount = document.getElementById('colorCount');
const clearBtn = document.getElementById('clearBtn');

// Color extraction regex patterns
// Aggressive matching - captures all possible color formats
const colorPatterns = {
    hex: /(?:#|0x)([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g,
    rgb: /rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi,
    rgba: /rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)/gi,
    hsl: /hsl\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)/gi,
    hsla: /hsla\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)/gi,
    // Aggressive patterns - bare triplets
    bareRgb: /\b(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\b/g,
    bareHsl: /\b(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\b/g
};

// Store extracted colors (deduplicated)
let extractedColors = new Set();

/**
 * Convert 3-digit hex to 6-digit hex
 */
function expandHex(hex) {
    if (hex.length === 3) {
        return hex.split('').map(char => char + char).join('');
    }
    return hex;
}

/**
 * Convert color to RGB
 */
function hexToRgb(hex) {
    // Remove # or 0x prefix
    hex = hex.replace(/^(#|0x)/, '');

    // Expand 3-digit hex to 6-digit
    hex = expandHex(hex);

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b };
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h, s, l) {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/**
 * Parse color string to RGB and get normalized hex
 */
function parseColorToHex(colorString, type, match) {
    let r, g, b;

    if (type === 'hex') {
        let hexValue = match[1];
        hexValue = expandHex(hexValue);
        return '#' + hexValue.toUpperCase();
    } else if (type === 'rgb' || type === 'rgba' || type === 'bareRgb') {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);

        // Validate RGB values
        if (r > 255 || g > 255 || b > 255) return null;

        const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        return '#' + hex;
    } else if (type === 'hsl' || type === 'hsla' || type === 'bareHsl') {
        const h = parseInt(match[1]);
        const s = parseInt(match[2]);
        const l = parseInt(match[3]);

        // Validate HSL values
        if (h > 360 || s > 100 || l > 100) return null;

        const rgb = hslToRgb(h, s, l);
        const hex = ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1).toUpperCase();
        return '#' + hex;
    }

    return null;
}

/**
 * Calculate color brightness (for determining text color)
 */
function getColorBrightness(r, g, b) {
    return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Extract all colors from text (all formats)
 */
function extractColors(text) {
    const colors = new Set();

    // Extract from all color formats
    for (const [type, regex] of Object.entries(colorPatterns)) {
        const matches = text.matchAll(regex);

        for (const match of matches) {
            const hexColor = parseColorToHex(match[0], type, match);
            if (hexColor) {
                colors.add(hexColor);
            }
        }
    }

    return Array.from(colors);
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

/**
 * Create color card with multiple format options
 */
/**
 * Convert RGB to Hex
 */
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Generate color harmonies
 */
function generateHarmonies(h, s, l) {
    const harmonies = {
        complementary: [],
        analogous: [],
        triadic: [],
        tetradic: [],
        monochromatic: []
    };

    // Helper to normalize hue
    const normalizeHue = (hue) => (hue % 360 + 360) % 360;
    // Helper to clamp percentage
    const clamp = (val) => Math.max(0, Math.min(100, val));

    // Complementary: 180deg
    harmonies.complementary.push({ h: normalizeHue(h + 180), s, l });

    // Analogous: -30deg, +30deg
    harmonies.analogous.push({ h: normalizeHue(h - 30), s, l });
    harmonies.analogous.push({ h: normalizeHue(h + 30), s, l });

    // Triadic: +120deg, +240deg
    harmonies.triadic.push({ h: normalizeHue(h + 120), s, l });
    harmonies.triadic.push({ h: normalizeHue(h + 240), s, l });

    // Tetradic (Square): +90, +180, +270
    harmonies.tetradic.push({ h: normalizeHue(h + 90), s, l });
    harmonies.tetradic.push({ h: normalizeHue(h + 180), s, l });
    harmonies.tetradic.push({ h: normalizeHue(h + 270), s, l });

    // Monochromatic: Variations in lightness
    harmonies.monochromatic.push({ h, s, l: clamp(l + 20) });
    harmonies.monochromatic.push({ h, s, l: clamp(l - 20) });

    return harmonies;
}

/**
 * Create color card with multiple format options
 */
function createColorCard(hexColor) {
    const rgb = hexToRgb(hexColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const brightness = getColorBrightness(rgb.r, rgb.g, rgb.b);

    // Determine text color based on brightness
    const textColor = brightness > 128 ? '#000000' : '#FFFFFF';

    // Format strings
    const formats = {
        hex: hexColor,
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
        hsla: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`
    };

    const card = document.createElement('div');
    card.className = 'color-card';
    card.setAttribute('data-color', hexColor);

    card.innerHTML = `
        <div class="color-preview" style="background-color: ${hexColor};">
            <span class="sample-text" style="color: ${textColor};">Sample</span>
        </div>
        <div class="color-info">
            <div class="color-format-item" data-format="${formats.hex}">
                <span class="format-label">HEX</span>
                <span class="format-value">${hexColor}</span>
                <span class="copy-icon">📋</span>
            </div>
            <div class="color-format-item" data-format="${formats.rgb}">
                <span class="format-label">RGB</span>
                <span class="format-value">${rgb.r}, ${rgb.g}, ${rgb.b}</span>
                <span class="copy-icon">📋</span>
            </div>
            <div class="color-format-item" data-format="${formats.hsl}">
                <span class="format-label">HSL</span>
                <span class="format-value">${hsl.h}°, ${hsl.s}%, ${hsl.l}%</span>
                <span class="copy-icon">📋</span>
            </div>
            <div class="color-format-item" data-format="${formats.rgba}">
                <span class="format-label">RGBA</span>
                <span class="format-value">${rgb.r}, ${rgb.g}, ${rgb.b}, 1</span>
                <span class="copy-icon">📋</span>
            </div>
            <div class="color-format-item" data-format="${formats.hsla}">
                <span class="format-label">HSLA</span>
                <span class="format-value">${hsl.h}°, ${hsl.s}%, ${hsl.l}%, 1</span>
                <span class="copy-icon">📋</span>
            </div>
            
            <button class="toggle-harmonies-btn">🎨 View Harmonies</button>
            
            <div class="harmonies-container hidden">
                <!-- Harmonies will be injected here -->
            </div>
        </div>
    `;

    // Add click handlers for each format
    const formatItems = card.querySelectorAll('.color-format-item');
    formatItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const format = item.getAttribute('data-format');
            copyToClipboard(format, item);
        });
    });

    // Add handler for harmonies button
    const harmoniesBtn = card.querySelector('.toggle-harmonies-btn');
    const harmoniesContainer = card.querySelector('.harmonies-container');

    harmoniesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = harmoniesContainer.classList.contains('hidden');

        if (isHidden) {
            // Generate and show harmonies if not already generated
            if (harmoniesContainer.children.length === 0) {
                // Clear any comment nodes or whitespace
                harmoniesContainer.innerHTML = '';
                const harmonies = generateHarmonies(hsl.h, hsl.s, hsl.l);
                renderHarmonies(harmoniesContainer, harmonies);
            }
            harmoniesContainer.classList.remove('hidden');
            harmoniesBtn.textContent = '🎨 Hide Harmonies';
            harmoniesBtn.classList.add('active');
        } else {
            harmoniesContainer.classList.add('hidden');
            harmoniesBtn.textContent = '🎨 View Harmonies';
            harmoniesBtn.classList.remove('active');
        }
    });

    return card;
}

/**
 * Render harmonies into the container
 */
function renderHarmonies(container, harmonies) {
    const createHarmonyRow = (title, colors) => {
        const row = document.createElement('div');
        row.className = 'harmony-row';

        const titleEl = document.createElement('div');
        titleEl.className = 'harmony-title';
        titleEl.textContent = title;
        row.appendChild(titleEl);

        const swatches = document.createElement('div');
        swatches.className = 'harmony-swatches';

        colors.forEach(color => {
            const rgb = hslToRgb(color.h, color.s, color.l);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

            const swatch = document.createElement('div');
            swatch.className = 'harmony-swatch';
            swatch.style.backgroundColor = hex;
            swatch.title = hex;
            swatch.setAttribute('data-color', hex);

            swatch.addEventListener('click', (e) => {
                e.stopPropagation();
                copyToClipboard(hex, swatch);
            });

            swatches.appendChild(swatch);
        });

        row.appendChild(swatches);
        return row;
    };

    container.appendChild(createHarmonyRow('Complementary', harmonies.complementary));
    container.appendChild(createHarmonyRow('Analogous', harmonies.analogous));
    container.appendChild(createHarmonyRow('Triadic', harmonies.triadic));
    container.appendChild(createHarmonyRow('Tetradic', harmonies.tetradic));
    container.appendChild(createHarmonyRow('Monochromatic', harmonies.monochromatic));
}

/**
 * Copy to clipboard
 */
async function copyToClipboard(text, cardElement) {
    try {
        await navigator.clipboard.writeText(text);
        showCopiedToast(text);

        // Add copy animation effect
        cardElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
            cardElement.style.transform = '';
        }, 150);
    } catch (err) {
        console.error('Copy failed:', err);
        // Fallback: use traditional method
        fallbackCopyToClipboard(text);
    }
}

/**
 * Fallback copy method (for older browsers)
 */
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
        showCopiedToast(text);
    } catch (err) {
        console.error('Fallback copy also failed:', err);
    }

    document.body.removeChild(textArea);
}

/**
 * Show copied toast notification
 */
function showCopiedToast(color) {
    // Remove existing toast
    const existingToast = document.querySelector('.copied-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'copied-toast';
    toast.textContent = `Copied: ${color}`;
    document.body.appendChild(toast);

    // Auto remove after 2.3 seconds
    setTimeout(() => {
        toast.remove();
    }, 2300);
}

/**
 * Scroll to and highlight the corresponding color card
 */
function scrollToAndHighlightCard(hexColor) {
    // Find the card with matching color
    const targetCard = document.querySelector(`.color-card[data-color="${hexColor}"]`);

    if (targetCard) {
        // Remove previous highlight
        const previousHighlight = document.querySelector('.color-card.highlight');
        if (previousHighlight) {
            previousHighlight.classList.remove('highlight');
        }

        // Scroll to the card
        targetCard.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });

        // Add highlight class
        targetCard.classList.add('highlight');

        // Remove highlight after 3 seconds
        setTimeout(() => {
            targetCard.classList.remove('highlight');
        }, 3000);
    }
}

/**
 * Get plain text content (remove HTML tags)
 */
function getPlainText() {
    return textInput.textContent || '';
}

/**
 * Save cursor position
 */
function saveCursorPosition() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(textInput);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length;
    }
    return 0;
}

/**
 * Restore cursor position
 */
function restoreCursorPosition(position) {
    const selection = window.getSelection();
    const range = document.createRange();

    let charCount = 0;
    let nodeStack = [textInput];
    let node, foundStart = false;

    while (!foundStart && (node = nodeStack.pop())) {
        if (node.nodeType === Node.TEXT_NODE) {
            const nextCharCount = charCount + node.length;
            if (position <= nextCharCount) {
                range.setStart(node, position - charCount);
                range.setEnd(node, position - charCount);
                foundStart = true;
            }
            charCount = nextCharCount;
        } else {
            let i = node.childNodes.length;
            while (i--) {
                nodeStack.push(node.childNodes[i]);
            }
        }
    }

    if (foundStart) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * Highlight all color codes in text
 */
function highlightColors() {
    const cursorPos = saveCursorPosition();
    const text = getPlainText();

    // If text is empty, don't process
    if (!text.trim()) {
        return;
    }

    // Collect all color matches with their positions
    const allMatches = [];

    for (const [type, regex] of Object.entries(colorPatterns)) {
        // Reset regex lastIndex
        regex.lastIndex = 0;
        const matches = [...text.matchAll(regex)];

        matches.forEach(match => {
            const hexColor = parseColorToHex(match[0], type, match);
            if (hexColor) {
                allMatches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    original: match[0],
                    hex: hexColor,
                    type: type
                });
            }
        });
    }

    // Sort by position
    allMatches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (keep first match)
    const filteredMatches = [];
    let lastEnd = 0;
    for (const match of allMatches) {
        if (match.start >= lastEnd) {
            filteredMatches.push(match);
            lastEnd = match.end;
        }
    }

    // Create highlighted HTML
    let highlightedHTML = '';
    let lastIndex = 0;

    filteredMatches.forEach(match => {
        // Add text before match
        highlightedHTML += escapeHtml(text.substring(lastIndex, match.start));

        // Calculate text color based on brightness
        const rgb = hexToRgb(match.hex);
        const brightness = getColorBrightness(rgb.r, rgb.g, rgb.b);
        const textColor = brightness > 128 ? '#000000' : '#FFFFFF';

        // Add highlighted color code
        highlightedHTML += `<span class="color-highlight color-highlight-${match.type}" style="background-color: ${match.hex}; color: ${textColor};" data-color="${match.hex}">${match.original}</span>`;

        lastIndex = match.end;
    });

    // Add remaining text
    highlightedHTML += escapeHtml(text.substring(lastIndex));

    // Only update if content actually changed
    if (textInput.innerHTML !== highlightedHTML) {
        textInput.innerHTML = highlightedHTML;
        restoreCursorPosition(cursorPos);
    }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Update color display
 */
function updateColorDisplay() {
    const text = getPlainText();
    const colors = extractColors(text);

    // Clear container
    colorsContainer.innerHTML = '';

    if (colors.length === 0) {
        // Show empty state
        colorsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎨</div>
                <p>No colors yet</p>
                <p class="empty-hint">Enter text with color codes on the left</p>
            </div>
        `;
        colorCount.textContent = '0 colors';
    } else {
        // Show color cards
        colors.forEach(color => {
            const card = createColorCard(color);
            colorsContainer.appendChild(card);
        });

        colorCount.textContent = `${colors.length} color${colors.length > 1 ? 's' : ''}`;
    }

    extractedColors = new Set(colors);
}

/**
 * Handle input changes
 */
function handleInput() {
    highlightColors();
    updateColorDisplay();
}

/**
 * Clear input
 */
function clearInput() {
    textInput.textContent = '';
    textInput.innerHTML = '';
    updateColorDisplay();
    textInput.focus();
}

/**
 * Handle paste event (paste plain text only)
 */
function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');

    // Insert plain text
    const selection = window.getSelection();
    if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));

        // Move cursor to end of inserted text
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    // Trigger input handling
    handleInput();
}

// Event listeners
textInput.addEventListener('input', handleInput);
textInput.addEventListener('paste', handlePaste);
clearBtn.addEventListener('click', clearInput);

// Click highlighted color codes to copy and highlight
textInput.addEventListener('click', (e) => {
    if (e.target.classList.contains('color-highlight')) {
        const color = e.target.getAttribute('data-color');
        copyToClipboard(color, e.target);
        scrollToAndHighlightCard(color);
    }
});

// Keyboard shortcuts
textInput.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K to clear
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        clearInput();
    }
});

// Initialize
updateColorDisplay();
