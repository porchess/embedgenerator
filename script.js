document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const embedTitle = document.getElementById('embed-title');
    const embedDescription = document.getElementById('embed-description');
    const embedColor = document.getElementById('embed-color');
    const embedColorText = document.getElementById('embed-color-text');
    const embedColorSlider = document.getElementById('embed-color-slider');
    
    // Remove any extra elements in the color picker area
    if (embedColorSlider) {
        embedColorSlider.style.display = 'none'; // Hide the slider if it exists
    }
    
    // Remove any gray dots that might be created by the color picker
    const colorSection = embedColor.closest('.form-group');
    if (colorSection) {
        const extraDots = colorSection.querySelectorAll('span.color-dot, div.color-dot');
        extraDots.forEach(dot => dot.remove());
    }
    
    const authorName = document.getElementById('author-name');
    const authorIcon = document.getElementById('author-icon');
    const largeImage = document.getElementById('large-image');
    const thumbnail = document.getElementById('thumbnail');
    const footerText = document.getElementById('footer-text');
    const footerIcon = document.getElementById('footer-icon');
    const timestamp = document.getElementById('timestamp');
    const fieldsContainer = document.getElementById('fields-container');
    const addFieldButton = document.getElementById('add-field');
    const clearAllButton = document.getElementById('clear-all');
    const generateJsonButton = document.getElementById('generate-json');
    const copyJsonButton = document.getElementById('copy-json');
    const jsonCode = document.getElementById('json-code');
    
    // Preview elements
    const embedPreview = document.getElementById('embed-preview');
    const previewSidebar = embedPreview.querySelector('.embed-sidebar');
    const previewAuthorName = embedPreview.querySelector('.embed-author-name');
    const previewAuthorIcon = embedPreview.querySelector('.embed-author-icon');
    const previewTitle = embedPreview.querySelector('.embed-title');
    const previewDescription = embedPreview.querySelector('.embed-description');
    const previewFields = embedPreview.querySelector('.embed-fields');
    const previewImage = embedPreview.querySelector('.embed-image img');
    const previewThumbnail = embedPreview.querySelector('.embed-thumbnail img');
    const previewFooterText = embedPreview.querySelector('.embed-footer-text');
    const previewFooterIcon = embedPreview.querySelector('.embed-footer-icon');
    const previewTimestamp = embedPreview.querySelector('.embed-footer-timestamp');
    
    // New elements for dropdowns and adding embeds
    const addButton = document.getElementById('add-button');
    const addDropdown = document.getElementById('add-dropdown');
    const addEmbedButton = document.getElementById('add-embed-button');

    const optionsButton = document.getElementById('options-button');
    const optionsDropdown = document.getElementById('options-dropdown');

    // New elements
    const webhookUrl = document.getElementById('webhook-url');
    const messageContent = document.getElementById('message-content');
    const webhookName = document.getElementById('webhook-name');
    const webhookAvatar = document.getElementById('webhook-avatar');

    // Keep track of embed count
    let embedCount = 1;

    // --- animated collapsible handler (kept) ---
    document.querySelectorAll('.section-toggle').forEach(btn => {
        // Skip the Message wrapper toggle as it's handled separately
        if (btn.closest('.message-wrapper') && btn.parentElement.tagName === 'H2' && 
            !btn.closest('.embed-group') && !btn.closest('.editor-section > .section-content')) {
            return;
        }
        
        const content = btn.closest('.editor-section').querySelector('.section-content');
        // already collapsed in HTML, just rotate icon
        btn.classList.add('rotated');
        btn.addEventListener('click', (e) => {
            // Stop event from bubbling to prevent affecting parent collapsibles
            e.stopPropagation();
            
            const collapsed = content.classList.toggle('collapsed');
            btn.classList.toggle('rotated', collapsed);
            
            // Ensure embed action buttons remain visible when toggling
            const embedActions = btn.closest('.editor-section')?.querySelector('.embed-actions');
            if (embedActions) {
                embedActions.style.display = 'flex';
            }
        });
    });
    
    // Initialize the Message 1 toggle button, but don't collapse by default
    const messageToggle = document.querySelector('.message-wrapper > h2 > .section-toggle');
    const messageWrapperContent = document.querySelector('.message-wrapper-content');
    
    if (messageToggle && messageWrapperContent) {
        messageToggle.addEventListener('click', (e) => {
            // Stop event from bubbling
            e.stopPropagation();
            
            const collapsed = messageWrapperContent.classList.toggle('collapsed');
            messageToggle.classList.toggle('rotated', collapsed);
            
            // This is the key fix - don't affect the state of embeds inside
        });
    }
    
    // Update character counts (modified for new position)
    function updateCharCount(input, counter) {
        const max = input.getAttribute('maxlength');
        counter.textContent = `${input.value.length}/${max}`;
    }
    
    document.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(input => {
        const parent = input.parentElement;
        const counter = parent.querySelector('.character-count');
        if (counter) {
            input.addEventListener('input', () => updateCharCount(input, counter));
            updateCharCount(input, counter);
        }
    });
    
    // Color input sync with slider
    embedColor.addEventListener('input', function() {
        embedColorText.value = this.value;
        
        // Convert hex to HSL to update the slider
        const hex = this.value.substring(1);
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        let h = 0;
        if (max !== min) {
            const d = max - min;
            if (max === r) {
                h = (g - b) / d + (g < b ? 6 : 0);
            } else if (max === g) {
                h = (b - r) / d + 2;
            } else {
                h = (r - g) / d + 4;
            }
            h *= 60;
        }
        
        embedColorSlider.value = h;
        updatePreview();
    });
    
    embedColorText.addEventListener('input', function() {
        if (/^#[0-9A-F]{6}$/i.test(this.value)) {
            embedColor.value = this.value;
            updatePreview();
        }
    });
    
    // Add field functionality
    let fieldCount = 0;
    
    addFieldButton.addEventListener('click', function() {
        addField();
    });
    
    function addField(name = '', value = '', inline = false) {
        const fieldId = `field-${fieldCount++}`;
        const fieldEditor = document.createElement('div');
        fieldEditor.classList.add('field-editor');
        fieldEditor.dataset.fieldId = fieldId;
        
        fieldEditor.innerHTML = `
            <div class="field-name">
                <label for="${fieldId}-name">Field Name</label>
                <input type="text" id="${fieldId}-name" class="form-control" maxlength="256" value="${name}">
                <span class="character-count">${name.length}/256</span>
            </div>
            <div class="field-value">
                <label for="${fieldId}-value">Field Value</label>
                <textarea id="${fieldId}-value" class="form-control" maxlength="1024">${value}</textarea>
                <span class="character-count">${value.length}/1024</span>
            </div>
            <div class="field-inline">
                <input type="checkbox" id="${fieldId}-inline" ${inline ? 'checked' : ''} hidden>
                <label for="${fieldId}-inline" class="inline-icon" title="Toggle inline">
                    <i class="fas fa-align-justify"></i>
                </label>
                <button class="delete-field" data-field-id="${fieldId}" title="Delete field">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        fieldsContainer.appendChild(fieldEditor);
        
        // Add event listeners
        fieldEditor.querySelector(`#${fieldId}-name`).addEventListener('input', updatePreview);
        fieldEditor.querySelector(`#${fieldId}-value`).addEventListener('input', updatePreview);
        fieldEditor.querySelector(`#${fieldId}-inline`).addEventListener('change', updatePreview);
        
        // Character count update
        const nameInput = fieldEditor.querySelector(`#${fieldId}-name`);
        const nameCounter = fieldEditor.querySelector('.field-name .character-count');
        nameInput.addEventListener('input', () => updateCharCount(nameInput, nameCounter));
        
        const valueInput = fieldEditor.querySelector(`#${fieldId}-value`);
        const valueCounter = fieldEditor.querySelector('.field-value .character-count');
        valueInput.addEventListener('input', () => updateCharCount(valueInput, valueCounter));
        
        // Delete button
        fieldEditor.querySelector('.delete-field').addEventListener('click', function() {
            fieldsContainer.removeChild(fieldEditor);
            updatePreview();
        });
        
        updatePreview();
    }
    
    // Add input event listeners for preview updates
    [embedTitle, embedDescription, authorName, authorIcon, 
     largeImage, thumbnail, footerText, footerIcon, timestamp].forEach(input => {
        if (input) input.addEventListener('input', updatePreview);
    });
    
    // Update preview function
    function updatePreview() {
        // Clear the existing preview
        const discordPreview = document.querySelector('.discord-preview');
        discordPreview.innerHTML = '';
        
        // Process each message
        document.querySelectorAll('.message-wrapper').forEach((messageWrapper, msgIndex) => {
            // Get message content
            const msgContentId = msgIndex === 0 ? 'message-content' : `message-${msgIndex+1}-content`;
            const msgContentEl = document.getElementById(msgContentId);
            
            // Create message container if content exists
            if (msgContentEl && msgContentEl.value) {
                const messageContainer = document.createElement('div');
                messageContainer.classList.add('discord-message-content');
                messageContainer.textContent = msgContentEl.value;
                discordPreview.appendChild(messageContainer);
            }
            
            // Process embeds in this message
            messageWrapper.querySelectorAll('.embed-group').forEach((embedGroup, embedIndex) => {
                // Create embed container
                const embedContainer = document.createElement('div');
                embedContainer.classList.add('discord-embed');
                
                // Get embed elements IDs
                const titleId = embedIndex === 0 && msgIndex === 0 ? 'embed-title' : 
                                `${msgIndex === 0 ? '' : 'message-' + (msgIndex+1) + '-'}embed-${embedIndex+1}-title`;
                const descriptionId = embedIndex === 0 && msgIndex === 0 ? 'embed-description' : 
                                     `${msgIndex === 0 ? '' : 'message-' + (msgIndex+1) + '-'}embed-${embedIndex+1}-description`;
                const colorId = embedIndex === 0 && msgIndex === 0 ? 'embed-color' : 
                               `${msgIndex === 0 ? '' : 'message-' + (msgIndex+1) + '-'}embed-${embedIndex+1}-color`;
                const largeImageId = embedIndex === 0 && msgIndex === 0 ? 'large-image' :
                                   `${msgIndex === 0 ? '' : 'message-' + (msgIndex+1) + '-'}embed-${embedIndex+1}-large-image`;
                const thumbnailId = embedIndex === 0 && msgIndex === 0 ? 'thumbnail' :
                                  `${msgIndex === 0 ? '' : 'message-' + (msgIndex+1) + '-'}embed-${embedIndex+1}-thumbnail`;
                const authorNameId = embedIndex === 0 && msgIndex === 0 ? 'author-name' :
                                   `${msgIndex === 0 ? '' : 'message-' + (msgIndex+1) + '-'}embed-${embedIndex+1}-author-name`;
                const authorIconId = embedIndex === 0 && msgIndex === 0 ? 'author-icon' :
                                   `${msgIndex === 0 ? '' : 'message-' + (msgIndex+1) + '-'}embed-${embedIndex+1}-author-icon`;
                const footerTextId = embedIndex === 0 && msgIndex === 0 ? 'footer-text' :
                                   `${msgIndex === 0 ? '' : 'message-' + (msgIndex+1) + '-'}embed-${embedIndex+1}-footer-text`;
                const footerIconId = embedIndex === 0 && msgIndex === 0 ? 'footer-icon' :
                                   `${msgIndex === 0 ? '' : 'message-' + (msgIndex+1) + '-'}embed-${embedIndex+1}-footer-icon`;
                const timestampId = embedIndex === 0 && msgIndex === 0 ? 'timestamp' :
                                  `${msgIndex === 0 ? '' : 'message-' + (msgIndex+1) + '-'}embed-${embedIndex+1}-timestamp`;
                
                // Lookup elements or use default values for first embed
                let embedColor = document.getElementById(colorId);
                let largeImageEl = document.getElementById(largeImageId);
                let thumbnailEl = document.getElementById(thumbnailId);
                let authorNameEl = document.getElementById(authorNameId);
                let authorIconEl = document.getElementById(authorIconId);
                let footerTextEl = document.getElementById(footerTextId);
                let footerIconEl = document.getElementById(footerIconId);
                let timestampEl = document.getElementById(timestampId);
                
                if (!embedColor && embedIndex === 0 && msgIndex === 0) embedColor = document.getElementById('embed-color');
                
                // Create embed structure
                embedContainer.innerHTML = `
                    <div class="embed-sidebar" style="background-color: ${embedColor ? embedColor.value : '#2b2d31'}"></div>
                    <div class="embed-content">
                        <div class="embed-author">
                            <img class="embed-author-icon" src="">
                            <span class="embed-author-name"></span>
                        </div>
                        <div class="embed-title"></div>
                        <div class="embed-description"></div>
                        <div class="embed-fields"></div>
                        <div class="embed-image">
                            <img src="" alt="">
                        </div>
                        <div class="embed-footer">
                            <img class="embed-footer-icon" src="">
                            <span class="embed-footer-text"></span>
                            <span class="embed-footer-timestamp"></span>
                        </div>
                    </div>
                    <div class="embed-thumbnail">
                        <img src="" alt="">
                    </div>
                `;
                
                // Update embed content
                const embedContent = embedContainer.querySelector('.embed-content');
                
                // Title and description
                const titleEl = document.getElementById(titleId);
                const descriptionEl = document.getElementById(descriptionId);
                
                if (titleEl && titleEl.value) {
                    embedContent.querySelector('.embed-title').textContent = titleEl.value;
                    embedContent.querySelector('.embed-title').style.display = 'block';
                } else {
                    embedContent.querySelector('.embed-title').style.display = 'none';
                }
                
                if (descriptionEl && descriptionEl.value) {
                    embedContent.querySelector('.embed-description').textContent = descriptionEl.value;
                    embedContent.querySelector('.embed-description').style.display = 'block';
                } else {
                    embedContent.querySelector('.embed-description').style.display = 'none';
                }
                
                // Author
                if (authorNameEl && authorNameEl.value) {
                    embedContainer.querySelector('.embed-author-name').textContent = authorNameEl.value;
                    embedContainer.querySelector('.embed-author').style.display = 'flex';
                    
                    if (authorIconEl && authorIconEl.value) {
                        embedContainer.querySelector('.embed-author-icon').src = authorIconEl.value;
                        embedContainer.querySelector('.embed-author-icon').style.display = 'inline-block';
                    } else {
                        embedContainer.querySelector('.embed-author-icon').style.display = 'none';
                    }
                } else {
                    embedContainer.querySelector('.embed-author').style.display = 'none';
                }
                
                // Images - properly handle missing URLs
                if (largeImageEl && largeImageEl.value) {
                    embedContainer.querySelector('.embed-image img').src = largeImageEl.value;
                    embedContainer.querySelector('.embed-image').style.display = 'block';
                } else {
                    embedContainer.querySelector('.embed-image').style.display = 'none';
                }
                
                if (thumbnailEl && thumbnailEl.value) {
                    embedContainer.querySelector('.embed-thumbnail img').src = thumbnailEl.value;
                    embedContainer.querySelector('.embed-thumbnail').style.display = 'block';
                } else {
                    embedContainer.querySelector('.embed-thumbnail').style.display = 'none';
                }
                
                // Footer
                if ((footerTextEl && footerTextEl.value) || (footerIconEl && footerIconEl.value) || (timestampEl && timestampEl.value)) {
                    embedContainer.querySelector('.embed-footer').style.display = 'flex';
                    
                    if (footerTextEl && footerTextEl.value) {
                        embedContainer.querySelector('.embed-footer-text').textContent = footerTextEl.value;
                    }
                    
                    if (footerIconEl && footerIconEl.value) {
                        embedContainer.querySelector('.embed-footer-icon').src = footerIconEl.value;
                        embedContainer.querySelector('.embed-footer-icon').style.display = 'inline-block';
                    } else {
                        embedContainer.querySelector('.embed-footer-icon').style.display = 'none';
                    }
                    
                    if (timestampEl && timestampEl.value) {
                        const date = new Date(timestampEl.value);
                        embedContainer.querySelector('.embed-footer-timestamp').textContent = date.toLocaleString();
                        embedContainer.querySelector('.embed-footer-timestamp').style.display = 'inline';
                    } else {
                        embedContainer.querySelector('.embed-footer-timestamp').style.display = 'none';
                    }
                } else {
                    embedContainer.querySelector('.embed-footer').style.display = 'none';
                }
                
                // Always add the embed to preview, even if empty
                discordPreview.appendChild(embedContainer);
            });
        });
        
        // Generate JSON
        generateJson();
        updateEmbedBorders();
    }
    
    // Generate JSON function
    function generateJson() {
        // Create the base webhook data object
        const webhookData = {
            // Include message content if present
            content: messageContent.value || null,
            
            // Include existing embeds array
            embeds: []
        };
        
        // Add username and avatar_url if provided
        if (webhookName.value) {
            webhookData.username = webhookName.value;
        }
        
        if (webhookAvatar.value) {
            webhookData.avatar_url = webhookAvatar.value;
        }
        
        // Process each embed group
        document.querySelectorAll('.embed-group').forEach((embedGroup, index) => {
            const titleId = index === 0 ? 'embed-title' : `embed-${index+1}-title`;
            const descriptionId = index === 0 ? 'embed-description' : `embed-${index+1}-description`;
            const colorId = index === 0 ? 'embed-color' : `embed-${index+1}-color`;
            
            const titleEl = document.getElementById(titleId);
            const descriptionEl = document.getElementById(descriptionId);
            const colorEl = document.getElementById(colorId);
            
            if (!titleEl) return; // Skip if elements don't exist
            
            const embedData = {
                title: titleEl.value || undefined,
                description: descriptionEl.value || undefined,
                color: colorEl.value ? parseInt(colorEl.value.replace('#', ''), 16) : undefined,
            };
            
            // Process author fields for this embed
            const authorNameId = index === 0 ? 'author-name' : `embed-${index+1}-author-name`;
            const authorIconId = index === 0 ? 'author-icon' : `embed-${index+1}-author-icon`;
            
            const authorNameEl = document.getElementById(authorNameId);
            const authorIconEl = document.getElementById(authorIconId);
            
            if (authorNameEl && authorNameEl.value) {
                embedData.author = {
                    name: authorNameEl.value,
                    icon_url: authorIconEl && authorIconEl.value ? authorIconEl.value : undefined
                };
            }
            
            // Process image fields for this embed
            const largeImageId = index === 0 ? 'large-image' : `embed-${index+1}-large-image`;
            const thumbnailId = index === 0 ? 'thumbnail' : `embed-${index+1}-thumbnail`;
            
            const largeImageEl = document.getElementById(largeImageId);
            const thumbnailEl = document.getElementById(thumbnailId);
            
            if (largeImageEl && largeImageEl.value) {
                embedData.image = { url: largeImageEl.value };
            }
            
            if (thumbnailEl && thumbnailEl.value) {
                embedData.thumbnail = { url: thumbnailEl.value };
            }
            
            // Process footer fields for this embed
            const footerTextId = index === 0 ? 'footer-text' : `embed-${index+1}-footer-text`;
            const footerIconId = index === 0 ? 'footer-icon' : `embed-${index+1}-footer-icon`;
            const timestampId = index === 0 ? 'timestamp' : `embed-${index+1}-timestamp`;
            
            const footerTextEl = document.getElementById(footerTextId);
            const footerIconEl = document.getElementById(footerIconId);
            const timestampEl = document.getElementById(timestampId);
            
            if ((footerTextEl && footerTextEl.value) || (footerIconEl && footerIconEl.value)) {
                embedData.footer = {
                    text: footerTextEl && footerTextEl.value ? footerTextEl.value : undefined,
                    icon_url: footerIconEl && footerIconEl.value ? footerIconEl.value : undefined
                };
            }
            
            if (timestampEl && timestampEl.value) {
                embedData.timestamp = new Date(timestampEl.value).toISOString();
            }
            
            // Add fields to this embed
            const fieldContainer = index === 0 ? fieldsContainer : 
                embedGroup.querySelector('.fields-container');
                
            if (fieldContainer) {
                const fields = [];
                fieldContainer.querySelectorAll('.field-editor').forEach(fieldEditor => {
                    const nameInput = fieldEditor.querySelector('input[id$="-name"]');
                    const valueInput = fieldEditor.querySelector('textarea[id$="-value"]');
                    const inlineCheckbox = fieldEditor.querySelector('input[id$="-inline"]');
                    
                    if (nameInput && nameInput.value && valueInput && valueInput.value) {
                        fields.push({
                            name: nameInput.value,
                            value: valueInput.value,
                            inline: inlineCheckbox ? inlineCheckbox.checked : false
                        });
                    }
                });
                
                if (fields.length > 0) {
                    embedData.fields = fields;
                }
            }
            
            // Add this embed to the embeds array
            webhookData.embeds.push(embedData);
        });
        
        // Update the JSON output
        jsonCode.textContent = JSON.stringify(webhookData, null, 2);
        
        // Apply syntax highlighting
        highlightJson();
    }
    
    // Функция для подсветки синтаксиса JSON
    function highlightJson() {
        const jsonText = jsonCode.textContent;
        
        // Basic JSON syntax highlighting with regex
        const highlighted = jsonText
            .replace(/"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?/g, match => {
                const isKey = /:$/.test(match);
                return `<span class="json-${isKey ? 'key' : 'string'}">${match}</span>`;
            })
            .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
            .replace(/\bnull\b/g, '<span class="json-null">null</span>')
            .replace(/\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g, '<span class="json-number">$1</span>')
            .replace(/([{}\[\]:,])/g, '<span class="json-punctuation">$1</span>');
        
        // Replace content with highlighted version (safe because we're using textContent to get raw JSON)
        jsonCode.innerHTML = highlighted;
    }

    /* ---------- file‑upload buttons ---------- */
    document.querySelectorAll('.file-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const linkedInput = btn.previousElementSibling; // текстовое поле URL
            const pick = document.createElement('input');
            pick.type = 'file';
            pick.accept = 'image/*';
            pick.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                linkedInput.value = url;
                linkedInput.dispatchEvent(new Event('input')); // обновить превью
            });
            pick.click();
        });
    });

    /* ---------- download JSON (save‑as) ---------- */
    function showDownloadToast() {
        const toast = document.getElementById('download-toast');
        if (!toast) {
            // Create toast if it doesn't exist
            const newToast = document.createElement('div');
            newToast.id = 'download-toast';
            newToast.className = 'toast-notification';
            document.body.appendChild(newToast);
            return showDownloadToast(); // Call again now that element exists
        }
        
        // Set content with success icon
        toast.innerHTML = '<i class="fas fa-check-circle"></i> JSON downloaded successfully';
        
        // Show with animation
        toast.classList.add('show');
        
        // Hide after animation completes
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    generateJsonButton.addEventListener('click', async () => {
        generateJson();
        const blob = new Blob([jsonCode.textContent], { type: 'application/json' });
        const defaultName = (embedTitle.value.trim() || 'embed') + '.json';

        // пытаемся использовать File System Access API
        if (window.showSaveFilePicker) {
            try {
                const handle = await showSaveFilePicker({
                    suggestedName: defaultName,
                    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                showDownloadToast();
                return;                         // успешно сохранено
            } catch (e) {
                // Esc / Cancel → AbortError (или SecurityError в Safari)
                if (e?.name === 'AbortError' || e?.name === 'SecurityError') return;
                // другие ошибки — перейдём к fallback‑загрузке
            }
        }

        // Fallback‑скачивание только если не было отмены
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = defaultName;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(link.href);
        link.remove();
        showDownloadToast();
    });
    
    // Replace the Clear All button functionality
    clearAllButton.addEventListener('click', function() {
        // Show confirmation toast
        const confirmClearToast = document.getElementById('confirm-clear-toast');
        confirmClearToast.classList.add('show');
        
        // Handle confirmation buttons
        const confirmYesBtn = document.getElementById('confirm-clear-yes');
        const confirmNoBtn = document.getElementById('confirm-clear-no');
        
        // Yes button - clear everything
        confirmYesBtn.addEventListener('click', function clearHandler() {
            // Remove all embeds except the first one
            const embedGroups = document.querySelectorAll('.embed-group');
            for (let i = 1; i < embedGroups.length; i++) {
                embedGroups[i].remove();
            }
            
            // Clear fields in the first embed
            embedTitle.value = '';
            embedDescription.value = '';
            embedColor.value = '#2b2d31';
            embedColorText.value = '#2b2d31';
            authorName.value = '';
            authorIcon.value = '';
            largeImage.value = '';
            thumbnail.value = '';
            footerText.value = '';
            footerIcon.value = '';
            timestamp.value = '';
            fieldsContainer.innerHTML = '';
            
            // Reset embed count
            embedCount = 1;
            
            // Update preview
            updatePreview();
            updateAllCharCounts();
            
            // Hide the confirmation toast
            confirmClearToast.classList.remove('show');
            
            // Remove event listeners to prevent multiple executions
            confirmYesBtn.removeEventListener('click', clearHandler);
            confirmNoBtn.removeEventListener('click', cancelHandler);
        });
        
        // No button - cancel
        confirmNoBtn.addEventListener('click', function cancelHandler() {
            confirmClearToast.classList.remove('show');
            
            // Remove event listeners to prevent multiple executions
            confirmYesBtn.removeEventListener('click', clearHandler);
            confirmNoBtn.removeEventListener('click', cancelHandler);
        });
        
        // Also close when clicking outside
        document.addEventListener('click', function closeHandler(e) {
            if (!confirmClearToast.contains(e.target) && e.target !== clearAllButton) {
                confirmClearToast.classList.remove('show');
                document.removeEventListener('click', closeHandler);
            }
        });
    });
    
    function updateAllCharCounts() {
        document.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(input => {
            const counter = input.nextElementSibling;
            if (counter && counter.classList.contains('character-count')) {
                updateCharCount(input, counter);
            }
        });
    }
    
    // Copy JSON button
    copyJsonButton.addEventListener('click', function() {
        navigator.clipboard.writeText(jsonCode.textContent).then(() => {
            // Show toast notification instead of alert
            copyToast.classList.add('show');
            
            // Hide after 2 seconds
            setTimeout(() => {
                copyToast.classList.remove('show');
            }, 2000);
        });
    });

    // JSON Copy button in JSON Output section
    const jsonCopyBtn = document.querySelector('.json-copy-btn');
    const copyToast = document.getElementById('copy-toast');

    jsonCopyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(jsonCode.textContent).then(() => {
            // Show toast notification
            copyToast.classList.add('show');
            
            // Hide after 2 seconds
            setTimeout(() => {
                copyToast.classList.remove('show');
            }, 2000);
        });
    });

    // JSON Edit functionality
    const jsonEditBtn = document.querySelector('.json-edit-btn');
    const jsonModalOverlay = document.getElementById('json-modal-overlay');
    const jsonEditor = document.getElementById('json-editor');
    const jsonError = document.getElementById('json-error');
    const jsonSaveBtn = document.getElementById('json-save');
    const jsonCancelBtn = document.getElementById('json-cancel');
    const modalCloseBtn = document.querySelector('.modal-close');

    // Open modal with current JSON
    jsonEditBtn.addEventListener('click', function() {
        // Format JSON nicely in the editor
        const formattedJson = JSON.stringify(JSON.parse(jsonCode.textContent), null, 2);
        jsonEditor.value = formattedJson;
        
        // Clear previous errors
        jsonError.textContent = '';
        jsonError.classList.remove('show');
        
        // Show modal
        jsonModalOverlay.classList.add('show');
    });

    // Close modal handlers
    function closeJsonModal() {
        jsonModalOverlay.classList.remove('show');
    }

    jsonCancelBtn.addEventListener('click', closeJsonModal);
    modalCloseBtn.addEventListener('click', closeJsonModal);

    // Close when clicking outside the modal
    jsonModalOverlay.addEventListener('click', function(e) {
        if (e.target === jsonModalOverlay) {
            closeJsonModal();
        }
    });

    // Save JSON and update UI
    jsonSaveBtn.addEventListener('click', function() {
        try {
            // Attempt to parse JSON to validate it
            const newData = JSON.parse(jsonEditor.value);
            
            // Check if it has the correct structure
            if (!newData.embeds || !Array.isArray(newData.embeds) || newData.embeds.length === 0) {
                throw new Error("JSON must contain an 'embeds' array with at least one embed object");
            }
            
            const embed = newData.embeds[0];
            
            // Update form fields
            if (embed.title) {
                embedTitle.value = embed.title;
            } else {
                embedTitle.value = '';
            }
            
            if (embed.description) {
                embedDescription.value = embed.description;
            } else {
                embedDescription.value = '';
            }
            
            if (embed.color) {
                const hexColor = '#' + embed.color.toString(16).padStart(6, '0');
                embedColor.value = hexColor;
                embedColorText.value = hexColor;
            } else {
                embedColor.value = '#2b2d31';
                embedColorText.value = '#2b2d31';
            }
            
            // Author
            if (embed.author && embed.author.name) {
                authorName.value = embed.author.name;
                authorIcon.value = embed.author.icon_url || '';
            } else {
                authorName.value = '';
                authorIcon.value = '';
            }
            
            // Images
            largeImage.value = embed.image ? embed.image.url || '' : '';
            thumbnail.value = embed.thumbnail ? embed.thumbnail.url || '' : '';
            
            // Footer
            if (embed.footer) {
                footerText.value = embed.footer.text || '';
                footerIcon.value = embed.footer.icon_url || '';
            } else {
                footerText.value = '';
                footerIcon.value = '';
            }
            
            // Timestamp
            if (embed.timestamp) {
                const date = new Date(embed.timestamp);
                // Format as yyyy-MM-ddThh:mm
                const localDatetime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
                timestamp.value = localDatetime;
            } else {
                timestamp.value = '';
            }
            
            // Fields
            fieldsContainer.innerHTML = '';
            if (embed.fields && Array.isArray(embed.fields)) {
                embed.fields.forEach(field => {
                    if (field.name && field.value) {
                        addField(field.name, field.value, field.inline || false);
                    }
                });
            }
            
            // Update preview
            updatePreview();
            updateAllCharCounts();
            
            // Close modal
            closeJsonModal();
            
        } catch (error) {
            // Show error message
            jsonError.textContent = `Error: ${error.message}`;
            jsonError.classList.add('show');
        }
    });

    // Calendar button functionality
    const calendarButton = document.querySelector('.calendar-button');
    if (calendarButton) {
        calendarButton.addEventListener('click', function() {
            timestamp.showPicker();
        });
    }
    
    // Add dropdown menu functionality
    addButton.addEventListener('click', function(e) {
        e.stopPropagation();
        addDropdown.classList.toggle('show');
        optionsDropdown.classList.remove('show'); // Close other dropdown if open
    });

    optionsButton.addEventListener('click', function(e) {
        e.stopPropagation();
        optionsDropdown.classList.toggle('show');
        addDropdown.classList.remove('show'); // Close other dropdown if open
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        addDropdown.classList.remove('show');
        optionsDropdown.classList.remove('show');
    });

    // Prevent dropdown close when clicking inside
    addDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    optionsDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Add new embed functionality
    addEmbedButton.addEventListener('click', function() {
        embedCount++;
        
        // Create a new embed section with action buttons
        const embedGroup = document.createElement('div');
        embedGroup.classList.add('editor-section', 'embed-group');
        
        // Generate unique IDs for this embed's elements
        const embedId = `embed-${embedCount}`;
        
        // Set up the HTML structure
        embedGroup.innerHTML = `
            <h2>Embed ${embedCount}
                <div class="embed-actions">
                    <button class="embed-duplicate-btn" title="Duplicate embed"><i class="fas fa-copy"></i></button>
                    <button class="embed-delete-btn" title="Delete embed"><i class="fas fa-trash"></i></button>
                </div>
                <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
            </h2>
            <div class="section-content collapsed">
                <!-- Clone the contents of the first embed -->
                <div class="editor-section">
                    <h2>Основные настройки</h2>
                    <div class="form-group">
                        <label for="${embedId}-title">Title</label>
                        <span class="character-count">0/256</span>
                        <input type="text" id="${embedId}-title" maxlength="256" class="form-control embed-title-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="${embedId}-description">Description</label>
                        <span class="character-count">0/4096</span>
                        <textarea id="${embedId}-description" class="form-control embed-description-input" maxlength="4096"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="${embedId}-color">Sidebar Color</label>
                        <input type="color" id="${embedId}-color" class="form-control color-input embed-color-input" value="#2b2d31">
                        <input type="text" id="${embedId}-color-text" class="form-control embed-color-text-input" value="#2b2d31">
                    </div>
                </div>
                
                <!-- Add other sections (author, images, etc.) similar to the first embed -->
                <!-- Each should have unique IDs and use the embed-specific class names -->
                
                <div class="editor-section">
                    <h2>Fields
                        <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
                    </h2>
                    <div class="section-content collapsed">
                        <div class="fields-container"></div>
                        <button class="add-field-button add-button">Add Field</button>
                    </div>
                </div>
            </div>
        `;
        
        // Insert the new embed before the actions div
        const actionsDiv = document.querySelector('.actions');
        actionsDiv.parentNode.insertBefore(embedGroup, actionsDiv);
        
        // Set up event handlers for the new embed
        setupEmbedHandlers(embedGroup, embedId);
        
        // Initialize collapsible sections
        const toggleBtn = embedGroup.querySelector('.section-toggle');
        const content = toggleBtn.closest('.editor-section').querySelector('.section-content');
        toggleBtn.classList.add('rotated');
        toggleBtn.addEventListener('click', () => {
            const collapsed = content.classList.toggle('collapsed');
            toggleBtn.classList.toggle('rotated', collapsed);
        });
        
        // Hide the dropdown after adding the embed
        addDropdown.classList.remove('show');
        
        // Ensure embed action buttons remain visible
        const embedActions = embedGroup.querySelector('.embed-actions');
        if (embedActions) {
            embedActions.style.display = 'flex';
        }
        
        // Update the preview immediately after adding a new embed
        updatePreview();
    });
    
    function setupEmbedHandlers(embedGroup, embedId) {
        // Set up field adding functionality
        const addFieldBtn = embedGroup.querySelector('.add-field-button');
        const fieldsContainer = embedGroup.querySelector('.fields-container');
        
        addFieldBtn.addEventListener('click', function() {
            addFieldToEmbed(fieldsContainer, embedId);
        });
        
        // Set up color input sync
        const colorInput = embedGroup.querySelector(`#${embedId}-color`);
        const colorTextInput = embedGroup.querySelector(`#${embedId}-color-text`);
        
        colorInput.addEventListener('input', function() {
            colorTextInput.value = this.value;
            updatePreview(); // Update this to handle multiple embeds
        });
        
        colorTextInput.addEventListener('input', function() {
            if (/^#[0-9A-F]{6}$/i.test(this.value)) {
                colorInput.value = this.value;
                updatePreview(); // Update this to handle multiple embeds
            }
        });
        
        // Add character count handlers for all inputs
        embedGroup.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(input => {
            const parent = input.parentElement;
            const counter = parent.querySelector('.character-count');
            if (counter) {
                input.addEventListener('input', () => updateCharCount(input, counter));
                updateCharCount(input, counter);
            }
        });
    }

    function addFieldToEmbed(fieldsContainer, embedId) {
        // Similar to the original addField function, but with embed-specific IDs
        const fieldId = `${embedId}-field-${Date.now()}`;
        const fieldEditor = document.createElement('div');
        fieldEditor.classList.add('field-editor');
        
        fieldEditor.innerHTML = `
            <div class="field-name">
                <label for="${fieldId}-name">Field Name</label>
                <input type="text" id="${fieldId}-name" class="form-control" maxlength="256" value="">
                <span class="character-count">0/256</span>
            </div>
            <div class="field-value">
                <label for="${fieldId}-value">Field Value</label>
                <textarea id="${fieldId}-value" class="form-control" maxlength="1024"></textarea>
                <span class="character-count">0/1024</span>
            </div>
            <div class="field-inline">
                <input type="checkbox" id="${fieldId}-inline" hidden>
                <label for="${fieldId}-inline" class="inline-icon" title="Toggle inline">
                    <i class="fas fa-align-justify"></i>
                </label>
                <button class="delete-field" title="Delete field">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        fieldsContainer.appendChild(fieldEditor);
        
        // Add event listeners for input fields
        const nameInput = fieldEditor.querySelector(`#${fieldId}-name`);
        const nameCounter = fieldEditor.querySelector('.field-name .character-count');
        nameInput.addEventListener('input', () => updateCharCount(nameInput, nameCounter));
        
        const valueInput = fieldEditor.querySelector(`#${fieldId}-value`);
        const valueCounter = fieldEditor.querySelector('.field-value .character-count');
        valueInput.addEventListener('input', () => updateCharCount(valueInput, valueCounter));
        
        // Delete button
        fieldEditor.querySelector('.delete-field').addEventListener('click', function() {
            fieldsContainer.removeChild(fieldEditor);
            updatePreview(); // Update this to handle multiple embeds
        });
        
        updatePreview();
    }

    // Add character count listener for new fields
    if (messageContent) {
        const messageCounter = messageContent.parentElement.querySelector('.character-count');
        messageContent.addEventListener('input', () => updateCharCount(messageContent, messageCounter));
        updateCharCount(messageContent, messageCounter);
        
        // Also update preview when message content changes
        messageContent.addEventListener('input', updatePreview);
    }
    
    if (webhookName) {
        const nameCounter = webhookName.parentElement.querySelector('.character-count');
        webhookName.addEventListener('input', () => updateCharCount(webhookName, nameCounter));
        updateCharCount(webhookName, nameCounter);
        
        // Also update preview when webhook name changes
        webhookName.addEventListener('input', updatePreview);
    }
    
    if (webhookAvatar) {
        // Add file upload functionality
        const avatarFileButton = webhookAvatar.nextElementSibling;
        if (avatarFileButton && avatarFileButton.classList.contains('file-button')) {
            avatarFileButton.addEventListener('click', () => {
                const pick = document.createElement('input');
                pick.type = 'file';
                pick.accept = 'image/*';
                pick.addEventListener('change', e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    webhookAvatar.value = url;
                    webhookAvatar.dispatchEvent(new Event('input'));
                });
                pick.click();
            });
        }
        
        // Update preview when webhook avatar changes
        webhookAvatar.addEventListener('input', updatePreview);
    }

    // Add WebhookURL validation and Send button functionality
    const webhookUrlInput = document.getElementById('webhook-url');
    const sendWebhookBtn = document.getElementById('send-webhook');

    // Function to validate webhook URL
    function validateWebhookUrl(url) {
        // Basic Discord webhook URL validation
        const webhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
        return webhookRegex.test(url);
    }

    // Update send button state when webhook URL changes
    webhookUrlInput.addEventListener('input', function() {
        const isValid = validateWebhookUrl(this.value.trim());
        sendWebhookBtn.disabled = !isValid;
    });

    // Send webhook function
    sendWebhookBtn.addEventListener('click', async function() {
        const webhookUrl = webhookUrlInput.value.trim();
        
        if (!validateWebhookUrl(webhookUrl)) {
            alert("Please enter a valid Discord webhook URL");
            return;
        }
        
        // Show loading state
        const originalText = sendWebhookBtn.innerHTML;
        sendWebhookBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        sendWebhookBtn.disabled = true;
        
        try {
            // Generate the current JSON payload
            generateJson();
            const webhookData = JSON.parse(jsonCode.textContent);
            
            // Send data to webhook
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(webhookData)
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            
            // Show success toast
            const copyToast = document.getElementById('copy-toast');
            copyToast.innerHTML = '<i class="fas fa-check"></i> Webhook sent successfully';
            copyToast.classList.add('show');
            
            setTimeout(() => {
                copyToast.classList.remove('show');
                // Reset toast content back after hiding
                setTimeout(() => {
                    copyToast.innerHTML = '<i class="fas fa-check"></i> JSON copied to clipboard';
                }, 300);
            }, 2000);
            
        } catch (error) {
            alert(`Failed to send webhook: ${error.message}`);
        } finally {
            // Reset button state
            sendWebhookBtn.innerHTML = originalText;
            sendWebhookBtn.disabled = false;
        }
    });

    // Initialize preview
    updatePreview();

    // Message count tracking
    let messageCount = 1;

    // Add message functionality
    const addMessageButton = document.getElementById('add-message');

    addMessageButton.addEventListener('click', function() {
        messageCount++;
        
        // Create a new message wrapper
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message-wrapper', 'editor-section');
        
        // Generate unique IDs for this message's elements
        const messageId = `message-${messageCount}`;
        
        // Set up the HTML structure for the new message with action buttons
        messageWrapper.innerHTML = `
            <h2>Message ${messageCount}
                <div class="message-actions">
                    <button class="message-duplicate-btn" title="Duplicate message"><i class="fas fa-copy"></i></button>
                    <button class="message-delete-btn" title="Delete message"><i class="fas fa-trash"></i></button>
                </div>
                <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
            </h2>
            <div class="message-wrapper-content collapsed">
                <!-- Message content field -->
                <div class="message-content-container">
                    <label for="${messageId}-content">Content</label>
                    <span class="character-count">0/2000</span>
                    <textarea id="${messageId}-content" class="form-control" maxlength="2000" placeholder="Message content"></textarea>
                </div>
                
                <!-- Initial embed for this message with all sections and action buttons -->
                <div class="editor-section embed-group">
                    <h2>Embed 1
                        <div class="embed-actions">
                            <button class="embed-duplicate-btn" title="Duplicate embed"><i class="fas fa-copy"></i></button>
                            <button class="embed-delete-btn" title="Delete embed"><i class="fas fa-trash"></i></button>
                        </div>
                        <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
                    </h2>
                    <div class="section-content collapsed">
                        <!-- Author section -->
                        <div class="editor-section">
                            <h2>Author
                                <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
                            </h2>
                            <div class="section-content collapsed">
                                <div class="form-group">
                                    <label for="${messageId}-author-name">Name</label>
                                    <span class="character-count">0/256</span>
                                    <input type="text" id="${messageId}-author-name" class="form-control" maxlength="256">
                                </div>
                                <div class="form-group">
                                    <label for="${messageId}-author-icon">Icon URL</label>
                                    <input type="text" id="${messageId}-author-icon" class="form-control">
                                    <button class="file-button"><i class="fas fa-upload"></i></button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Basic settings section -->
                        <div class="editor-section">
                            <h2>Основные настройки</h2>
                            <div class="form-group">
                                <label for="${messageId}-embed-title">Title</label>
                                <span class="character-count">0/256</span>
                                <input type="text" id="${messageId}-embed-title" maxlength="256" class="form-control">
                            </div>
                            
                            <div class="form-group">
                                <label for="${messageId}-embed-description">Description</label>
                                <span class="character-count">0/4096</span>
                                <textarea id="${messageId}-embed-description" class="form-control" maxlength="4096"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="${messageId}-embed-color">Sidebar Color</label>
                                <input type="color" id="${messageId}-embed-color" class="form-control color-input" value="#2b2d31">
                                <input type="text" id="${messageId}-embed-color-text" class="form-control" value="#2b2d31">
                            </div>
                        </div>
                        
                        <!-- Images section -->
                        <div class="editor-section">
                            <h2>Images
                                <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
                            </h2>
                            <div class="section-content collapsed">
                                <div class="form-group">
                                    <label for="${messageId}-large-image">Large Image URL</label>
                                    <input type="text" id="${messageId}-large-image" class="form-control">
                                    <button class="file-button"><i class="fas fa-upload"></i></button>
                                </div>
                                <div class="form-group">
                                    <label for="${messageId}-thumbnail">Thumbnail URL</label>
                                    <input type="text" id="${messageId}-thumbnail" class="form-control">
                                    <button class="file-button"><i class="fas fa-upload"></i></button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer section -->
                        <div class="editor-section">
                            <h2>Footer
                                <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
                            </h2>
                            <div class="section-content collapsed">
                                <div class="form-group">
                                    <label for="${messageId}-footer-text">Text</label>
                                    <span class="character-count">0/2048</span>
                                    <input type="text" id="${messageId}-footer-text" class="form-control" maxlength="2048">
                                </div>
                                <div class="form-group">
                                    <label for="${messageId}-footer-icon">Icon URL</label>
                                    <input type="text" id="${messageId}-footer-icon" class="form-control">
                                    <button class="file-button"><i class="fas fa-upload"></i></button>
                                </div>
                                <div class="form-group">
                                    <label for="${messageId}-timestamp">Timestamp</label>
                                    <input type="datetime-local" id="${messageId}-timestamp" class="form-control">
                                    <button class="calendar-button"><i class="fas fa-calendar-alt"></i></button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Fields section -->
                        <div class="editor-section">
                            <h2>Fields
                                <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
                            </h2>
                            <div class="section-content collapsed">
                                <div id="${messageId}-fields-container" class="fields-container"></div>
                                <button class="${messageId}-add-field add-field-button add-button">Add Field</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Actions for this message -->
                <div class="actions">
                    <div class="dropdown-container">
                        <button class="action-button primary bold-button ${messageId}-add-button"><i class="fas fa-plus"></i> Add <i class="fas fa-caret-down"></i></button>
                        <div class="dropdown-menu ${messageId}-add-dropdown">
                            <button class="dropdown-item ${messageId}-add-embed-button"><i class="fas fa-plus-circle"></i> Embed</button>
                        </div>
                    </div>
                    
                    <div class="dropdown-container">
                        <button class="action-button bold-button ${messageId}-options-button"><i class="fas fa-cog"></i> Options <i class="fas fa-caret-down"></i></button>
                        <div class="dropdown-menu ${messageId}-options-dropdown">
                            <button class="dropdown-item ${messageId}-clear-all"><i class="fas fa-trash"></i> Clear All</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert the new message before the Add Message button
        addMessageButton.parentNode.insertBefore(messageWrapper, addMessageButton);
        
        // Set up event handlers for the new message
        setupMessageHandlers(messageWrapper, messageId);
        
        // Setup action buttons for the embed
        const firstEmbed = messageWrapper.querySelector('.embed-group');
        // attach full realtime handlers to the initial embed of the new message
        setupEmbedInMessageHandlers(firstEmbed, `${messageId}-embed-1`); // <─ key fix
        setupEmbedActionButtons(firstEmbed); // keep buttons visible
        
        // Make sure the toggle button is rotated since content is collapsed
        const messageToggle = messageWrapper.querySelector('.section-toggle');
        if (messageToggle) {
            messageToggle.classList.add('rotated');
        }
        
        // Update the preview immediately after adding a new message
        updatePreview();
    });

    function setupMessageHandlers(messageWrapper, messageId) {
        // Set up collapsible toggle
        const messageToggle = messageWrapper.querySelector('.section-toggle');
        const messageWrapperContent = messageWrapper.querySelector('.message-wrapper-content');
        
        if (messageToggle && messageWrapperContent) {
            messageToggle.addEventListener('click', (e) => {
                // Stop event from bubbling
                e.stopPropagation();
                
                const collapsed = messageWrapperContent.classList.toggle('collapsed');
                messageToggle.classList.toggle('rotated', collapsed);
                
                // Don't affect the state of embeds inside
            });
        }
        
        // Set up character count handlers for content textarea
        const contentTextarea = messageWrapper.querySelector(`#${messageId}-content`);
        const contentCounter = contentTextarea.parentElement.querySelector('.character-count');
        contentTextarea.addEventListener('input', () => updateCharCount(contentTextarea, contentCounter));
        updateCharCount(contentTextarea, contentCounter);
        
        // Set up color input sync
        const colorInput = messageWrapper.querySelector(`#${messageId}-embed-color`);
        const colorTextInput = messageWrapper.querySelector(`#${messageId}-embed-color-text`);
        
        if (colorInput && colorTextInput) {
            colorInput.addEventListener('input', function() {
                colorTextInput.value = this.value;
                updatePreview(); // Update preview when color changes
            });
            
            colorTextInput.addEventListener('input', function() {
                if (/^#[0-9A-F]{6}$/i.test(this.value)) {
                    colorInput.value = this.value;
                    updatePreview(); // Update preview when color changes
                }
            });
        }
        
        // Set up other input event listeners for preview
        messageWrapper.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', updatePreview);
            
            // Set up character count handlers
            const parent = input.parentElement;
            const counter = parent.querySelector('.character-count');
            if (counter && input.hasAttribute('maxlength')) {
                input.addEventListener('input', () => updateCharCount(input, counter));
                updateCharCount(input, counter);
            }
        });
        
        // Set up add field button
        const addFieldBtn = messageWrapper.querySelector(`.${messageId}-add-field`);
        const fieldsContainer = messageWrapper.querySelector(`.${messageId}-fields-container`);
        
        if (addFieldBtn && fieldsContainer) {
            addFieldBtn.addEventListener('click', function() {
                addFieldToMessage(fieldsContainer, messageId);
            });
        }
        
        // Set up section toggles within this message
        messageWrapper.querySelectorAll('.section-toggle').forEach(btn => {
            // Skip the main message toggle
            if (btn === messageToggle) return;
            
            const parent = btn.closest('.editor-section');
            if (parent) {
                const content = parent.querySelector('.section-content');
                if (content) {
                    btn.classList.add('rotated');
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const collapsed = content.classList.toggle('collapsed');
                        btn.classList.toggle('rotated', collapsed);
                    });
                }
            }
        });
        
        // Set up dropdown menus
        const addBtn = messageWrapper.querySelector(`.${messageId}-add-button`);
        const optionsBtn = messageWrapper.querySelector(`.${messageId}-options-button`);
        const addDropdownMenu = messageWrapper.querySelector(`.${messageId}-add-dropdown`);
        const optionsDropdownMenu = messageWrapper.querySelector(`.${messageId}-options-dropdown`);
        
        if (addBtn && addDropdownMenu) {
            addBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                addDropdownMenu.classList.toggle('show');
                if (optionsDropdownMenu) optionsDropdownMenu.classList.remove('show');
            });
        }
        
        if (optionsBtn && optionsDropdownMenu) {
            optionsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                optionsDropdownMenu.classList.toggle('show');
                if (addDropdownMenu) addDropdownMenu.classList.remove('show');
            });
        }
        
        // Add embed button
        const addEmbedBtn = messageWrapper.querySelector(`.${messageId}-add-embed-button`);
        if (addEmbedBtn) {
            addEmbedBtn.addEventListener('click', function() {
                addEmbedToMessage(messageWrapper, messageId);
            });
        }
    }

    function addFieldToMessage(fieldsContainer, messageId) {
        const fieldId = `${messageId}-field-${Date.now()}`;
        const fieldEditor = document.createElement('div');
        fieldEditor.classList.add('field-editor');
        
        fieldEditor.innerHTML = `
            <div class="field-name">
                <label for="${fieldId}-name">Field Name</label>
                <input type="text" id="${fieldId}-name" class="form-control" maxlength="256" value="">
                <span class="character-count">0/256</span>
            </div>
            <div class="field-value">
                <label for="${fieldId}-value">Field Value</label>
                <textarea id="${fieldId}-value" class="form-control" maxlength="1024"></textarea>
                <span class="character-count">0/1024</span>
            </div>
            <div class="field-inline">
                <input type="checkbox" id="${fieldId}-inline" hidden>
                <label for="${fieldId}-inline" class="inline-icon" title="Toggle inline">
                    <i class="fas fa-align-justify"></i>
                </label>
                <button class="delete-field" title="Delete field">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        fieldsContainer.appendChild(fieldEditor);
        
        // Add event listeners for input fields
        const nameInput = fieldEditor.querySelector(`#${fieldId}-name`);
        const nameCounter = fieldEditor.querySelector('.field-name .character-count');
        nameInput.addEventListener('input', () => updateCharCount(nameInput, nameCounter));
        nameInput.addEventListener('input', updatePreview);
        
        const valueInput = fieldEditor.querySelector(`#${fieldId}-value`);
        const valueCounter = fieldEditor.querySelector('.field-value .character-count');
        valueInput.addEventListener('input', () => updateCharCount(valueInput, valueCounter));
        valueInput.addEventListener('input', updatePreview);
        
        // Inline checkbox
        const inlineCheckbox = fieldEditor.querySelector(`#${fieldId}-inline`);
        inlineCheckbox.addEventListener('change', updatePreview);
        
        // Delete button
        fieldEditor.querySelector('.delete-field').addEventListener('click', function() {
            fieldsContainer.removeChild(fieldEditor);
            updatePreview();
        });
        
        updatePreview();
    }

    function addEmbedToMessage(messageWrapper, messageId) {
        // Get all embeds in this message
        const embeds = messageWrapper.querySelectorAll('.embed-group');
        const embedCount = embeds.length + 1;
        
        // Create a new embed group
        const embedGroup = document.createElement('div');
        embedGroup.classList.add('editor-section', 'embed-group');
        
        // Generate unique IDs for this embed's elements
        const embedUniqueId = `${messageId}-embed-${embedCount}`;
        
        // Set up the HTML structure with all necessary sections and action buttons
        embedGroup.innerHTML = `
            <h2>Embed ${embedCount}
                <div class="embed-actions">
                    <button class="embed-duplicate-btn" title="Duplicate embed"><i class="fas fa-copy"></i></button>
                    <button class="embed-delete-btn" title="Delete embed"><i class="fas fa-trash"></i></button>
                </div>
                <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
            </h2>
            <div class="section-content collapsed">
                <!-- Author section -->
                <div class="editor-section">
                    <h2>Author
                        <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
                    </h2>
                    <div class="section-content collapsed">
                        <div class="form-group">
                            <label for="${embedUniqueId}-author-name">Name</label>
                            <span class="character-count">0/256</span>
                            <input type="text" id="${embedUniqueId}-author-name" class="form-control" maxlength="256">
                        </div>
                        <div class="form-group">
                            <label for="${embedUniqueId}-author-icon">Icon URL</label>
                            <input type="text" id="${embedUniqueId}-author-icon" class="form-control">
                            <button class="file-button"><i class="fas fa-upload"></i></button>
                        </div>
                    </div>
                </div>
                
                <!-- Basic settings section -->
                <div class="editor-section">
                    <h2>Основные настройки</h2>
                    <div class="form-group">
                        <label for="${embedUniqueId}-title">Title</label>
                        <span class="character-count">0/256</span>
                        <input type="text" id="${embedUniqueId}-title" maxlength="256" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label for="${embedUniqueId}-description">Description</label>
                        <span class="character-count">0/4096</span>
                        <textarea id="${embedUniqueId}-description" class="form-control" maxlength="4096"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="${embedUniqueId}-color">Sidebar Color</label>
                        <input type="color" id="${embedUniqueId}-color" class="form-control color-input" value="#2b2d31">
                        <input type="text" id="${embedUniqueId}-color-text" class="form-control" value="#2b2d31">
                    </div>
                </div>
                
                <!-- Images section -->
                <div class="editor-section">
                    <h2>Images
                        <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
                    </h2>
                    <div class="section-content collapsed">
                        <div class="form-group">
                            <label for="${embedUniqueId}-large-image">Large Image URL</label>
                            <input type="text" id="${embedUniqueId}-large-image" class="form-control">
                            <button class="file-button"><i class="fas fa-upload"></i></button>
                        </div>
                        <div class="form-group">
                            <label for="${embedUniqueId}-thumbnail">Thumbnail URL</label>
                            <input type="text" id="${embedUniqueId}-thumbnail" class="form-control">
                            <button class="file-button"><i class="fas fa-upload"></i></button>
                        </div>
                    </div>
                </div>
                
                <!-- Footer section -->
                <div class="editor-section">
                    <h2>Footer
                        <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
                    </h2>
                    <div class="section-content collapsed">
                        <div class="form-group">
                            <label for="${embedUniqueId}-footer-text">Text</label>
                            <span class="character-count">0/2048</span>
                            <input type="text" id="${embedUniqueId}-footer-text" class="form-control" maxlength="2048">
                        </div>
                        <div class="form-group">
                            <label for="${embedUniqueId}-footer-icon">Icon URL</label>
                            <input type="text" id="${embedUniqueId}-footer-icon" class="form-control">
                            <button class="file-button"><i class="fas fa-upload"></i></button>
                        </div>
                        <div class="form-group">
                            <label for="${embedUniqueId}-timestamp">Timestamp</label>
                            <input type="datetime-local" id="${embedUniqueId}-timestamp" class="form-control">
                            <button class="calendar-button"><i class="fas fa-calendar-alt"></i></button>
                        </div>
                    </div>
                </div>
                
                <!-- Fields section -->
                <div class="editor-section">
                    <h2>Fields
                        <button class="section-toggle"><i class="fas fa-chevron-down"></i></button>
                    </h2>
                    <div class="section-content collapsed">
                        <div id="${embedUniqueId}-fields-container" class="fields-container"></div>
                        <button class="${embedUniqueId}-add-field add-field-button add-button">Add Field</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add the new embed before the actions div
        const actionsDiv = messageWrapper.querySelector('.actions');
        messageWrapper.querySelector('.message-wrapper-content').insertBefore(embedGroup, actionsDiv);
        
        // Set up handlers for the new embed
        setupEmbedInMessageHandlers(embedGroup, embedUniqueId);
        
        // Hide the dropdown after adding the embed
        const addDropdownMenu = messageWrapper.querySelector(`.${messageId}-add-dropdown`);
        if (addDropdownMenu) {
            addDropdownMenu.classList.remove('show');
        }
        
        // Ensure embed action buttons remain visible
        const embedActions = embedGroup.querySelector('.embed-actions');
        if (embedActions) {
            embedActions.style.display = 'flex';
        }
        
        // Update the preview immediately after adding a new embed
        updatePreview();
    }

    function setupEmbedInMessageHandlers(embedGroup, embedUniqueId) {
        // Set up collapsible sections
        const toggleBtn = embedGroup.querySelector('.section-toggle');
        const content = toggleBtn.closest('.editor-section').querySelector('.section-content');
        toggleBtn.classList.add('rotated');
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const collapsed = content.classList.toggle('collapsed');
            toggleBtn.classList.toggle('rotated', collapsed);
        });
        
        // Set up nested collapsible sections
        embedGroup.querySelectorAll('.section-toggle').forEach(btn => {
            if (btn === toggleBtn) return;
            
            const parent = btn.closest('.editor-section');
            if (parent) {
                const nestedContent = parent.querySelector('.section-content');
                if (nestedContent) {
                    btn.classList.add('rotated');
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const collapsed = nestedContent.classList.toggle('collapsed');
                        btn.classList.toggle('rotated', collapsed);
                    });
                }
            }
        });
        
        // Set up character count handlers
        embedGroup.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(input => {
            const parent = input.parentElement;
            const counter = parent.querySelector('.character-count');
            if (counter) {
                input.addEventListener('input', () => updateCharCount(input, counter));
                updateCharCount(input, counter);
            }
        });
        
        // Add input event listeners for preview updates
        embedGroup.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', updatePreview);
        });
        
        // Set up color input sync
        const colorInput = embedGroup.querySelector(`#${embedUniqueId}-color`);
        const colorTextInput = embedGroup.querySelector(`#${embedUniqueId}-color-text`);
        
        if (colorInput && colorTextInput) {
            colorInput.addEventListener('input', function() {
                colorTextInput.value = this.value;
                updatePreview();
            });
            
            colorTextInput.addEventListener('input', function() {
                if (/^#[0-9A-F]{6}$/i.test(this.value)) {
                    colorInput.value = this.value;
                    updatePreview();
                }
            });
        }
        
        // Set up add field button
        const addFieldBtn = embedGroup.querySelector(`.${embedUniqueId}-add-field`);
        const fieldsContainer = embedGroup.querySelector(`.${embedUniqueId}-fields-container`);
        
        if (addFieldBtn && fieldsContainer) {
            addFieldBtn.addEventListener('click', function() {
                addFieldToMessage(fieldsContainer, embedUniqueId);
            });
        }
        
        // Set up calendar button functionality
        const calendarButton = embedGroup.querySelector(`[id="${embedUniqueId}-timestamp"]`)?.nextElementSibling;
        const timestampInput = embedGroup.querySelector(`#${embedUniqueId}-timestamp`);
        
        if (calendarButton && timestampInput) {
            calendarButton.addEventListener('click', function() {
                timestampInput.showPicker();
            });
        }
        
        // Set up file upload buttons
        embedGroup.querySelectorAll('.file-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const linkedInput = btn.previousElementSibling; // текстовое поле URL
                const pick = document.createElement('input');
                pick.type = 'file';
                pick.accept = 'image/*';
                pick.addEventListener('change', e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    linkedInput.value = url;
                    linkedInput.dispatchEvent(new Event('input')); // обновить превью
                });
                pick.click();
            });
        });
    }

    // Setup action buttons for Message blocks
    function setupMessageActionButtons(messageWrapper) {
        // Removed individual duplicate and delete event listeners (global delegation now handles these actions)
    }
    
    // Setup action buttons for Embed blocks
    function setupEmbedActionButtons(embedGroup) {
        // Removed individual duplicate and delete event listeners (global delegation now handles these actions)
    }
    
    /* --------- helpers --------- */
    function showDisabledToast(text) {
        const toast = document.getElementById('copy-toast');
        toast.innerHTML = `<i class="fas fa-info-circle"></i> ${text}`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    /* -------------- DUPLICATE MESSAGE -------------- */
    function duplicateMessage() {
        /* duplication disabled */
        showDisabledToast('Message duplication is disabled');
    }

    /* -------------- DUPLICATE EMBED -------------- */
    function duplicateEmbed() {
        /* duplication disabled */
        showDisabledToast('Embed duplication is disabled');
    }

    /* -------------- helpers -------------- */
    function reDispatchInputs(root) {
        root.querySelectorAll('input, textarea, select').forEach(el => {
            const evt = new Event(el.type === 'checkbox' ? 'change' : 'input', { bubbles: true });
            el.dispatchEvent(evt);
        });
    }

    // Delete a message block
    function deleteMessage(messageWrapper) {
        const messages = document.querySelectorAll('.message-wrapper');
        if (messages.length === 1) {
            const copyToast = document.getElementById('copy-toast');
            const originalToastContent = copyToast.innerHTML;
            
            copyToast.innerHTML = '<i class="fas fa-info-circle"></i> At least one message is required';
            copyToast.classList.add('show');
            
            setTimeout(() => {
                copyToast.classList.remove('show');
                setTimeout(() => {
                    copyToast.innerHTML = originalToastContent;
                }, 300);
            }, 2000);
            
            return;
        }
        
        messageWrapper.remove();
        
        const remainingMessages = document.querySelectorAll('.message-wrapper');
        remainingMessages.forEach((msg, index) => {
            const title = msg.querySelector('h2');
            title.childNodes[0].nodeValue = `Message ${index + 1} `;
        });
        
        messageCount = remainingMessages.length;
        updatePreview();
    }
    
    // Delete an embed block
    function deleteEmbed(embedGroup) {
        const parentMessage = embedGroup.closest('.message-wrapper-content');
        const embedsInMessage = parentMessage.querySelectorAll('.embed-group');
        
        if (embedsInMessage.length > 1) {
            embedGroup.remove();
            
            const remainingEmbeds = parentMessage.querySelectorAll('.embed-group');
            remainingEmbeds.forEach((embed, index) => {
                const title = embed.querySelector('h2');
                title.childNodes[0].nodeValue = `Embed ${index + 1} `;
            });
        } else {
            const copyToast = document.getElementById('copy-toast');
            copyToast.innerHTML = '<i class="fas fa-info-circle"></i> At least one embed is required';
            copyToast.classList.add('show');
            
            setTimeout(() => {
                copyToast.classList.remove('show');
                setTimeout(() => {
                    copyToast.innerHTML = '<i class="fas fa-check"></i> JSON copied to clipboard';
                }, 300);
            }, 2000);
        }
        
        updatePreview();
    }
    
    function getEmbedIdPrefix(embedGroup) {
        const anyInput = embedGroup.querySelector('input[id], textarea[id]');
        if (anyInput) {
            const id = anyInput.id;
            const parts = id.split('-');
            parts.pop();
            return parts.join('-');
        }
        return '';
    }
    
    // New function to update embed borders with their respective colors
    function updateEmbedBorders() {
        // Update borders for all embed groups
        document.querySelectorAll('.embed-group').forEach(embedGroup => {
            // Find the color input within this embed group
            const colorInput = embedGroup.querySelector('input[type="color"]');
            if (colorInput) {
                // Apply the color to the left border of the embed group
                embedGroup.style.borderLeft = `4px solid ${colorInput.value}`;
                // Add a subtle background to make the border more visible
                embedGroup.style.backgroundColor = `${colorInput.value}10`;
            }
        });
    }
    
    // Update embed borders when the page loads
    updateEmbedBorders();
    
    // Extend updatePreview function to also update embed borders
    const originalUpdatePreview = updatePreview;
    updatePreview = function() {
        originalUpdatePreview();
        updateEmbedBorders();
    };

    /* ---------- GLOBAL LIVE‑PREVIEW DELEGATION ---------- */
    // Any edit (typing, color pick, checkbox, etc.) inside the editor container
    // triggers an immediate preview refresh – works for dynamic duplicates too.
    ['input', 'change'].forEach(evt =>
        document.addEventListener(evt, e => {
            if (e.target.closest('.editor-container')) updatePreview();
        })
    );

    setupMessageActionButtons(document.querySelector('.message-wrapper'));
    setupEmbedActionButtons(document.querySelector('.embed-group'));

    /* ----------  GLOBAL  CLICK  DELEGATION  ---------- */
    document.addEventListener('click', e => {
        /* helper to find closest element with given selector */
        const closest = sel => e.target.closest(sel);

        /* message duplicate / delete */
        if (closest('.message-duplicate-btn')) {                 // ← keeps button, no action
            duplicateMessage();                                  // now shows toast only
            return;
        }
        if (closest('.message-delete-btn')) {
            const msg = closest('.message-wrapper');
            if (msg) deleteMessage(msg);
            return;
        }

        /* embed duplicate / delete */
        if (closest('.embed-duplicate-btn')) {                   // ← keeps button, no action
            duplicateEmbed();                                    // now shows toast only
            return;
        }
        if (closest('.embed-delete-btn')) {
            const emb = closest('.embed-group');
            if (emb) deleteEmbed(emb);
            return;
        }

        /* dropdown toggles (Add / Options) */
        const ddToggle = closest('.action-button');
        if (ddToggle && ddToggle.nextElementSibling?.classList.contains('dropdown-menu')) {
            e.stopPropagation();
            const menu = ddToggle.nextElementSibling;
            menu.classList.toggle('show');
            /* close other open menus */
            document.querySelectorAll('.dropdown-menu.show').forEach(m => {
                if (m !== menu) m.classList.remove('show');
            });
            return;
        }

        /* add‑embed inside dropdown */
        if (closest('.dropdown-item')?.className.includes('add-embed-button')) {
            const msg = closest('.message-wrapper');
            if (msg) {
                const prefix = msg.querySelector('h2').textContent.match(/Message (\d+)/)[1];
                addEmbedToMessage(msg, `message-${prefix}`);
            }
            return;
        }

        /* Options items — just forward click to original global buttons */
        if (closest('.dropdown-item')?.className.includes('clear-all'))      clearAllButton.click();
        if (closest('.dropdown-item')?.className.includes('copy-json'))     copyJsonButton.click();
        if (closest('.dropdown-item')?.className.includes('generate-json')) generateJsonButton.click();
    });

    // Global event listener to close all dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        // Close all dropdowns when clicking anywhere on the document
        // unless the click is on a dropdown toggle button
        if (!e.target.closest('.dropdown-container')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    // Close any open modal/toast on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const jsonModal = document.getElementById('json-modal-overlay');
            if (jsonModal && jsonModal.classList.contains('show')) {
                jsonModal.classList.remove('show');
                return;
            }
            const clearToast = document.getElementById('confirm-clear-toast');
            if (clearToast && clearToast.classList.contains('show')) {
                clearToast.classList.remove('show');
            }
        }
    });
});
