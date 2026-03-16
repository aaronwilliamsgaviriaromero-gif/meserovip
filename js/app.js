const state = {
    currentView: 'tables', // 'tables', 'pos', 'dashboard', 'inventory'
    mode: 'local', // 'local' or 'tourist'
    colorMode: localStorage.getItem('meserovip_colormode') || 'dark', // 'dark' or 'light'
    cart: [],
    selectedTable: null,
    selectedCategory: 'Todos',
    includeService: true,
    waiterName: localStorage.getItem('meserovip_waiter_name') || 'Juan Delgado',
    pastOrders: JSON.parse(localStorage.getItem('meserovip_orders')) || [],
    vouchers: JSON.parse(localStorage.getItem('meserovip_vouchers')) || []
};

// Default tables (24 tables total)
const defaultTables = [
    // Row 1
    { id: 1, x: 5, y: 10, status: 'available' },
    { id: 2, x: 23, y: 10, status: 'available' },
    { id: 3, x: 41, y: 10, status: 'available' },
    { id: 4, x: 59, y: 10, status: 'available', label: 'VIP 1' },
    { id: 5, x: 77, y: 10, status: 'available', label: 'VIP 2' },
    // Row 2
    { id: 6, x: 5, y: 30, status: 'available' },
    { id: 7, x: 23, y: 30, status: 'available' },
    { id: 8, x: 41, y: 30, status: 'available' },
    { id: 9, x: 59, y: 30, status: 'available' },
    { id: 10, x: 77, y: 30, status: 'available' },
    // Row 3
    { id: 11, x: 5, y: 50, status: 'available' },
    { id: 12, x: 23, y: 50, status: 'available' },
    { id: 13, x: 41, y: 50, status: 'available' },
    { id: 14, x: 59, y: 50, status: 'available' },
    { id: 15, x: 77, y: 50, status: 'available' },
    // Row 4
    { id: 16, x: 5, y: 70, status: 'available' },
    { id: 17, x: 23, y: 70, status: 'available' },
    { id: 18, x: 41, y: 70, status: 'available' },
    { id: 19, x: 59, y: 70, status: 'available' },
    { id: 20, x: 77, y: 70, status: 'available' }
];

// Initialize persistent state
const savedTables = JSON.parse(localStorage.getItem('meserovip_tables')) || [];
const initialTables = defaultTables.map(dt => {
    const st = savedTables.find(t => t.id === dt.id);
    return st ? st : dt;
});
state.tables = initialTables;
state.carts = JSON.parse(localStorage.getItem('meserovip_carts')) || {};

function saveState() {
    localStorage.setItem('meserovip_tables', JSON.stringify(state.tables));
    localStorage.setItem('meserovip_carts', JSON.stringify(state.carts));
    if (window.syncToCloud) window.syncToCloud();
}

// DOM Elements
const viewContainer = document.getElementById('view-container');
const currentViewName = document.getElementById('current-view-name');
const viewSubtitle = document.getElementById('view-subtitle');
const modeToggle = document.getElementById('mode-toggle');
const orderItemsList = document.getElementById('order-items-list');
const orderSubtotal = document.getElementById('order-subtotal');
const orderTotal = document.getElementById('order-total');
const orderService = document.getElementById('order-service');
const clockEl = document.getElementById('clock');
const navItems = document.querySelectorAll('.nav-item');
const waiterNameEl = document.getElementById('waiter-name');
const waiterAvatarEl = document.getElementById('waiter-avatar');
const waiterTrigger = document.getElementById('waiter-profile-trigger');

// ---- Mobile helpers ----
const isMobile = () => window.innerWidth <= 768;

window.toggleCart = () => {
    const sidebar = document.getElementById('order-sidebar');
    const closeBtn = document.getElementById('btn-close-cart');
    if (!sidebar) return;
    const isOpen = sidebar.classList.toggle('open');
    if (closeBtn) closeBtn.style.display = isOpen ? 'flex' : 'none';
};

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = state.cart.reduce((s, i) => s + i.quantity, 0);
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function setupBottomNav() {
    const bottomNavItems = document.querySelectorAll('#bottom-nav .bottom-nav-item[data-view]');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            // Close cart if open
            const sidebar = document.getElementById('order-sidebar');
            if (sidebar) sidebar.classList.remove('open');
            const closeBtn = document.getElementById('btn-close-cart');
            if (closeBtn) closeBtn.style.display = 'none';

            // Update active states in both navs
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));

            const view = item.dataset.view;
            item.classList.add('active');
            const desktopBtn = document.getElementById(`nav-${view}`);
            if (desktopBtn) desktopBtn.classList.add('active');

            renderView(view);
        });
    });
}

// Show/hide close button based on screen size
function updateMobileUI() {
    const closeBtn = document.getElementById('btn-close-cart');
    if (!closeBtn) return;
    if (isMobile()) {
        closeBtn.style.display = document.getElementById('order-sidebar')?.classList.contains('open') ? 'flex' : 'none';
    } else {
        closeBtn.style.display = 'none';
    }
}

window.addEventListener('resize', updateMobileUI);

// Initialize App
function init() {
    updateClock();
    updateWaiterUI();
    applyThemeClasses();
    setInterval(updateClock, 1000);
    renderView(state.currentView);
    setupEventListeners();
    setupBottomNav();
}

function applyThemeClasses() {
    // Keep base theme class and attach light mode if needed
    const lightModeClass = state.colorMode === 'light' ? 'light-mode ' : '';
    document.body.className = `${lightModeClass}theme-${state.mode}`;

    // Update icon
    const icon = document.getElementById('theme-color-icon');
    if (icon) {
        icon.textContent = state.colorMode === 'light' ? 'dark_mode' : 'light_mode';
    }
}


function updateWaiterUI() {
    if (!waiterNameEl || !waiterAvatarEl) return;
    waiterNameEl.textContent = state.waiterName;
    waiterAvatarEl.textContent = state.waiterName
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) || '?';
}

function setupEventListeners() {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderView(item.dataset.view);
        });
    });

    modeToggle.addEventListener('change', (e) => {
        state.mode = e.target.checked ? 'tourist' : 'local';
        state.selectedCategory = 'Todos';
        applyThemeClasses();
        renderView(state.currentView);
    });

    const btnThemeColor = document.getElementById('btn-theme-color');
    if (btnThemeColor) {
        btnThemeColor.addEventListener('click', () => {
            state.colorMode = state.colorMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('meserovip_colormode', state.colorMode);
            applyThemeClasses();

            // Re-render dashboard if active to adjust chart colors
            if (state.currentView === 'dashboard') {
                renderView('dashboard');
            }
        });
    }

    document.body.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'toggle-service') {
            state.includeService = e.target.checked;
            updateCartUI();
        }
    });

    // Make name in sidebar clickable
    if (waiterTrigger) {
        waiterTrigger.style.cursor = 'pointer';
        waiterTrigger.addEventListener('click', editWaiterName);
    }

    document.getElementById('btn-checkout').addEventListener('click', processPayment);

    const btnFinishShift = document.getElementById('btn-finish-shift');
    if (btnFinishShift) {
        btnFinishShift.addEventListener('click', finishShift);
    }
}

async function finishShift() {
    // Check if there are occupied tables
    const occupiedTables = state.tables.filter(t => t.status !== 'available');
    if (occupiedTables.length > 0) {
        const confirmMsg = `Tienes ${occupiedTables.length} mesa(s) aún abiertas. ¿Estás seguro que deseas terminar el turno? Esto cerrará sesión pero guardará las ventas de hoy y cerrará el turno.`;
        if (!confirm(confirmMsg)) return;
    } else {
        if (!confirm('¿Estás seguro que deseas terminar tu turno? Se archivarán las ventas y bauches actuales y empezarás un turno nuevo la próxima vez.')) return;
    }

    const todayOrders = state.pastOrders;
    const todayTotal = todayOrders.reduce((acc, o) => acc + o.total, 0);

    alert(`¡Turno terminado!\n\nMesero: ${state.waiterName}\nTotal de comandas este turno: ${todayOrders.length}\nVentas totales este turno: $${todayTotal.toLocaleString()}`);

    // Archive current shift data
    const historyOrders = JSON.parse(localStorage.getItem('meserovip_orders_history')) || [];
    const historyVouchers = JSON.parse(localStorage.getItem('meserovip_vouchers_history')) || [];
    
    localStorage.setItem('meserovip_orders_history', JSON.stringify([...historyOrders, ...state.pastOrders]));
    localStorage.setItem('meserovip_vouchers_history', JSON.stringify([...historyVouchers, ...state.vouchers]));
    
    // Start fresh for new shift
    state.pastOrders = [];
    state.vouchers = [];
    localStorage.setItem('meserovip_orders', JSON.stringify([]));
    localStorage.setItem('meserovip_vouchers', JSON.stringify([]));
    
    // Clear all tables and carts
    state.tables.forEach(t => t.status = 'available');
    state.carts = {};
    state.cart = [];
    state.selectedTable = null;
    localStorage.setItem('meserovip_tables', JSON.stringify(state.tables));
    localStorage.setItem('meserovip_carts', JSON.stringify(state.carts));
    
    // Reset table active UI text if it's there
    const activeTableEl = document.getElementById('active-table-number');
    if (activeTableEl) activeTableEl.textContent = `Mesa --`;
    updateCartUI();
    
    // Ensure it syncs to the cloud before disconnecting
    if (window.syncToCloud) {
        await window.syncToCloud();
    }

    // Sign out from Firebase
    if (window.firebaseAuth) {
        window.firebaseAuth.signOut().then(() => {
            renderView('tables'); // Will be hidden by auth state observer
        }).catch((error) => {
            console.error('Error al cerrar sesión', error);
        });
    } else {
        renderView('tables');
    }
}

function editWaiterName() {
    const newName = prompt('Ingrese el nombre del mesero:', state.waiterName);
    if (newName && newName.trim() !== '') {
        state.waiterName = newName.trim();
        localStorage.setItem('meserovip_waiter_name', state.waiterName);
        updateWaiterUI();
        // If we are in settings view, refresh it
        if (state.currentView === 'inventory') renderView('inventory');
    }
}

function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderView(view) {
    state.currentView = view;
    const sidebar = document.getElementById('order-sidebar');
    if (sidebar) sidebar.style.display = (view === 'pos') ? 'flex' : 'none';

    // Update Background Image dynamically
    const bgContainer = document.getElementById('bg-image-container');
    if (bgContainer) {
        let bgUrl = '';
        switch (view) {
            case 'tables': bgUrl = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1920'; break;
            case 'pos': bgUrl = 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=1920'; break;
            case 'dashboard': bgUrl = 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=1920'; break;
            case 'inventory': bgUrl = 'https://images.unsplash.com/photo-1582226162125-961ee90436a5?auto=format&fit=crop&q=80&w=1920'; break;
            case 'vouchers': bgUrl = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1920'; break;
        }
        bgContainer.style.backgroundImage = `url('${bgUrl}')`;
    }

    switch (view) {
        case 'tables':
            currentViewName.textContent = 'Gestión de Mesas';
            viewSubtitle.textContent = 'Piso Principal';
            renderTables();
            break;
        case 'pos':
            currentViewName.textContent = 'Registro de Ventas';
            viewSubtitle.textContent = state.mode === 'local' ? 'Menú Local' : 'Menú Turistas (VIP)';
            renderPOS();
            break;
        case 'dashboard':
            currentViewName.textContent = 'Panel de Estadísticas';
            viewSubtitle.textContent = 'Resumen Diario';
            renderDashboard();
            break;
        case 'inventory':
            currentViewName.textContent = 'Panel de Ajustes';
            viewSubtitle.textContent = 'Precios y Perfil';
            renderInventory();
            break;
        case 'vouchers':
            currentViewName.textContent = 'Registro de Bauches';
            viewSubtitle.textContent = 'Suma de Tarjetas';
            renderVouchers();
            break;
    }
}

function renderTables() {
    viewContainer.innerHTML = '';
    const map = document.createElement('div');
    map.className = 'table-map';

    state.tables.forEach(table => {
        const tableEl = document.createElement('div');
        tableEl.className = `table-obj ${table.status}`;
        tableEl.style.left = `${table.x}%`;
        tableEl.style.top = `${table.y}%`;
        tableEl.innerHTML = `<span>${table.label || table.id}</span>`;

        tableEl.onclick = () => {
            state.selectedTable = table;
            state.cart = state.carts[table.id] || [];
            const activeTableEl = document.getElementById('active-table-number');
            if (activeTableEl) activeTableEl.textContent = `Mesa ${table.label || table.id}`;
            updateCartUI();
            renderView('pos');
        };
        map.appendChild(tableEl);
    });
    viewContainer.appendChild(map);
}

function renderPOS() {
    viewContainer.innerHTML = '';
    const posWrapper = document.createElement('div');
    posWrapper.style.width = '100%';

    const currentModeItems = menuData[state.mode];
    const categoryList = ['Todos', ...new Set(currentModeItems.map(item => item.category))];

    // Voice / Text Order Control
    const voiceCtrl = document.createElement('div');
    voiceCtrl.style.display = 'flex';
    voiceCtrl.style.justifyContent = 'space-between';
    voiceCtrl.style.alignItems = 'center';
    voiceCtrl.style.marginBottom = '1rem';
    voiceCtrl.innerHTML = `
        <div style="flex:1; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; border:1px solid var(--border-glass); display:flex; align-items:center; gap:10px; margin-right:10px;">
            <span class="material-icons-outlined" id="input-icon" style="color:var(--text-dim)">search</span>
            <input type="text" id="voice-input-feedback" placeholder="Habla o escribe tu pedido y presiona Enter..." style="background:transparent; border:none; color:var(--text-main); width:100%; outline:none;">
        </div>
        <button id="btn-start-voice" class="btn-primary" style="padding:10px; border-radius:50%; min-width:44px; width:44px; height:44px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; border:none; outline:none;" title="Presiona para hablar">
            <span class="material-icons-outlined" style="pointer-events:none; font-size:1.5rem;">mic</span>
        </button>
    `;

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'category-tabs-container';

    categoryList.forEach(cat => {
        const catItemsCount = (cat === 'Todos') ? currentModeItems.length : currentModeItems.filter(i => i.category === cat).length;
        const tab = document.createElement('div');
        tab.className = `category-tab ${state.selectedCategory === cat ? 'active' : ''}`;
        tab.innerHTML = `${cat} <span style="font-size:0.7rem; opacity:0.6; margin-left:5px">${catItemsCount}</span>`;
        tab.onclick = () => {
            state.selectedCategory = cat;
            renderPOS();
        };
        tabsContainer.appendChild(tab);
    });

    const grid = document.createElement('div');
    grid.className = 'pos-grid';

    const filtered = (state.selectedCategory === 'Todos')
        ? currentModeItems
        : currentModeItems.filter(i => i.category === state.selectedCategory);

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        let imageContent = '';
        if (product.image) {
            imageContent = `
                <div class="product-image-bg" style="background-image: url('${product.image}'); background-size: cover; background-position: center; border-bottom: 1px solid var(--border-glass)"></div>
            `;
        } else {
            imageContent = `
                <div class="product-image-emoji" style="background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
                    <span class="product-emoji">${product.emoji}</span>
                </div>
            `;
        }

        card.innerHTML = `
            ${imageContent}
            <div class="product-info-wrap">
                <div class="product-header">
                    <h3 class="product-name">${product.name}</h3>
                    <span class="product-price">$${product.price ? (product.price / 1000).toFixed(0) + 'K' : '0'}</span>
                </div>
                ${product.desc ? `<p class="product-desc">${product.desc}</p>` : '<div class="product-desc-spacer"></div>'}
                <button class="add-btn">
                    <span class="material-icons-outlined" style="font-size: inherit;">add</span> AGREGAR
                </button>
            </div>
        `;
        card.onclick = () => addToCart(product);
        grid.appendChild(card);
    });

    posWrapper.appendChild(voiceCtrl);
    posWrapper.appendChild(tabsContainer);
    posWrapper.appendChild(grid);
    viewContainer.appendChild(posWrapper);

    // Initialise Speech Recognition Listener
    const btnVoice = voiceCtrl.querySelector('#btn-start-voice');
    const voiceFeedback = voiceCtrl.querySelector('#voice-input-feedback');
    const inputIcon = voiceCtrl.querySelector('#input-icon');

    // Extracted match logic for both voice and text input
    const processOrderText = (speechResult) => {
        // Alias de palabras colombianas para el Nightclub
        speechResult = speechResult.replace(/\bguaro\b/g, 'aguardiente');

        let addedAny = false;

        currentModeItems.forEach(product => {
            const matchName = product.name.toLowerCase();
            const matchWords = matchName.split(' ').filter(w => w.length > 3);

            let isMatch = false;
            if (speechResult.includes(matchName)) isMatch = true;
            else if (matchWords.length > 0 && matchWords.some(w => speechResult.includes(w))) {
                if (matchWords.every(w => speechResult.includes(w))) {
                    isMatch = true;
                }
            }

            if (isMatch) {
                try {
                    let qty = 1;
                    const preText = speechResult.split(matchWords[0] || matchName)[0].trim();
                    const wordsBefore = preText.split(' ');
                    const qtyMatchString = wordsBefore.pop();

                    const wordToNum = { 'un': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10 };

                    if (parseInt(qtyMatchString)) {
                        qty = parseInt(qtyMatchString);
                    } else if (wordToNum[qtyMatchString]) {
                        qty = wordToNum[qtyMatchString];
                    } else if (wordsBefore.length > 0) {
                        const word2 = wordsBefore.pop();
                        if (parseInt(word2)) qty = parseInt(word2);
                        else if (wordToNum[word2]) qty = wordToNum[word2];
                    }

                    addToCart(product, qty);
                    addedAny = true;
                } catch (e) {
                    addToCart(product, 1);
                    addedAny = true;
                }
            }
        });

        if (addedAny) {
            setTimeout(() => { voiceFeedback.value = '¡Pedido agregado con éxito!'; }, 1500);
        } else {
            setTimeout(() => { voiceFeedback.value = 'No encontré ese producto, intenta de nuevo.'; }, 1500);
        }
    };

    if (voiceFeedback) {
        voiceFeedback.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                if (!state.selectedTable) {
                    alert('Selecciona una mesa primero.');
                    return;
                }
                const val = voiceFeedback.value.toLowerCase();
                processOrderText(val);
                setTimeout(() => { if (voiceFeedback.value === '¡Pedido agregado con éxito!' || voiceFeedback.value.includes('No encontré')) voiceFeedback.value = ''; }, 3000);
            }
        });
    }

    if (btnVoice) {
        btnVoice.addEventListener('click', () => {
            if (!state.selectedTable) {
                alert('Selecciona una mesa primero para poder agregar con voz.');
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert("Tu navegador no soporta el reconocimiento de voz. Usa Google Chrome para Android o Safari en iOs 14.5+.");
                return;
            }

            try {
                const recognition = new SpeechRecognition();
                recognition.lang = 'es-ES';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                recognition.onstart = () => {
                    btnVoice.style.background = 'var(--accent)';
                    btnVoice.classList.add('pulse');
                    if (inputIcon) inputIcon.style.color = 'var(--accent)';
                    voiceFeedback.value = 'Escuchando tu pedido...';
                };

                recognition.onresult = (event) => {
                    if (event.results && event.results[0] && event.results[0][0]) {
                        const speechResult = event.results[0][0].transcript.toLowerCase();
                        voiceFeedback.value = speechResult;
                        processOrderText(speechResult);
                    } else {
                        voiceFeedback.value = 'No se entendió el audio.';
                    }
                };

                recognition.onerror = (event) => {
                    console.error('Error de voz:', event.error);
                    if (event.error === 'not-allowed') {
                        voiceFeedback.value = 'Acepta los permisos del micrófono.';
                        alert('Por favor permite el uso del micrófono (icono en la barra superior o configuración de Chrome).');
                    } else {
                        voiceFeedback.value = 'No se escuchó. Intenta otra vez. Error: ' + event.error;
                    }
                    btnVoice.style.background = 'var(--primary)';
                    btnVoice.classList.remove('pulse');
                    if (inputIcon) inputIcon.style.color = 'var(--text-dim)';
                };

                recognition.onend = () => {
                    btnVoice.style.background = 'var(--primary)';
                    btnVoice.classList.remove('pulse');
                    if (inputIcon) inputIcon.style.color = 'var(--text-dim)';
                };

                recognition.start();
            } catch (e) {
                console.error('Fallo al iniciar reconocimiento:', e);
                voiceFeedback.value = 'Intenta presionar de nuevo.';
            }
        });
    }
}

function addToCart(product, qty = 1) {
    if (!state.selectedTable) return alert('Selecciona una mesa primero');

    // Buscar si el producto ya existe en el carrito
    const existingItem = state.cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += parseInt(qty);
    } else {
        const cartId = Date.now() + Math.random().toString(36).substr(2, 9);
        state.cart.push({
            ...product,
            cartId: cartId,
            quantity: parseInt(qty),
            originalPrice: product.price
        });
    }

    // CRITICAL: Update the specific table cart in state
    state.carts[state.selectedTable.id] = state.cart;

    // Mark table as occupied
    const tableIndex = state.tables.findIndex(t => t.id === state.selectedTable.id);
    if (tableIndex !== -1) {
        state.tables[tableIndex].status = 'occupied';
    }
    
    // Save locally and to cloud
    localStorage.setItem('meserovip_carts', JSON.stringify(state.carts));
    localStorage.setItem('meserovip_tables', JSON.stringify(state.tables));
    
    if (window.syncToCloud) {
        window.syncToCloud();
    }
    
    updateCartUI();
}

function updateCartUI() {
    if (!orderItemsList) return;

    if (state.cart.length === 0) {
        orderItemsList.innerHTML = '<div class="empty-cart-msg">No hay productos seleccionados</div>';
        orderSubtotal.textContent = '$0';
        orderService.textContent = '$0';
        orderTotal.textContent = '$0';
        
        // Update Mobile Summary
        const cartBadge = document.getElementById('cart-badge');
        if (cartBadge) {
            cartBadge.style.display = 'none';
        }
        return;
    }

    orderItemsList.innerHTML = '';
    let subtotal = 0;

    state.cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const itemEl = document.createElement('div');
        itemEl.className = 'order-item-row';

        let itemImageHTML = '';
        if (item.image) {
            itemImageHTML = `<div style="min-width: 44px; width: 44px; height: 44px; border-radius: 10px; background-image: url('${item.image}'); background-size: cover; background-position: center; border: 1px solid var(--border-glass);"></div>`;
        } else {
            itemImageHTML = `<div style="min-width: 44px; width: 44px; height: 44px; border-radius: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">${item.emoji}</div>`;
        }

        itemEl.innerHTML = `
            <div style="display: flex; gap: 14px; width: 100%; align-items: center; padding: 4px 0;">
                <div style="position: relative;">
                    ${itemImageHTML}
                    <span style="position: absolute; -top: 8px; -right: 8px; background: var(--accent); color: white; font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 10px; border: 2px solid var(--bg-dark);">${item.quantity}</span>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
                        <span style="font-weight:700; font-size:1rem; color: var(--text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
                        <span style="font-weight:800; color: var(--primary); font-size: 0.95rem;">$${(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.06); padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                            <button onclick="updateQty('${item.cartId}', -1)" style="background: none; border: none; color: var(--text-dim); cursor: pointer; padding: 2px;"><span class="material-icons-outlined" style="font-size: 1.1rem;">remove</span></button>
                            <span style="font-weight: 800; font-size: 0.9rem; min-width: 20px; text-align: center;">${item.quantity}</span>
                            <button onclick="updateQty('${item.cartId}', 1)" style="background: none; border: none; color: var(--text-dim); cursor: pointer; padding: 2px;"><span class="material-icons-outlined" style="font-size: 1.1rem;">add</span></button>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="removeFromCart('${item.cartId}')" style="background: rgba(242, 13, 89, 0.1); border: none; color: var(--accent); cursor: pointer; border-radius: 10px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                                <span class="material-icons-outlined" style="font-size: 1.2rem;">delete_outline</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        orderItemsList.appendChild(itemEl);
    });

    const service = state.includeService ? (subtotal * 0.1) : 0;
    const total = subtotal + service;

    orderSubtotal.textContent = `$${subtotal.toLocaleString()}`;
    orderService.textContent = `$${service.toLocaleString()}`;
    orderTotal.textContent = `$${total.toLocaleString()}`;
    updateCartBadge();
}

window.updateItemPrice = (cartId, newPrice) => {
    const item = state.cart.find(i => i.cartId === cartId);
    if (item) {
        item.price = parseInt(newPrice) || 0;
        if (state.selectedTable) saveState();
        updateCartUI();
    }
};

window.updateQty = (cartId, delta) => {
    const item = state.cart.find(i => i.cartId === cartId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            state.cart = state.cart.filter(i => i.cartId !== cartId);
        }
        if (state.selectedTable) {
            state.carts[state.selectedTable.id] = state.cart;
            if (state.cart.length === 0) {
                const tableIndex = state.tables.findIndex(t => t.id === state.selectedTable.id);
                if (tableIndex !== -1) state.tables[tableIndex].status = 'available';
            }
            saveState();
        }
        updateCartTotalsOnly();
        updateCartUI();
    }
};

function updateCartTotalsOnly() {
    let subtotal = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const service = state.includeService ? (subtotal * 0.1) : 0;
    const total = subtotal + service;

    if (orderSubtotal) orderSubtotal.textContent = `$${subtotal.toLocaleString()}`;
    if (orderService) orderService.textContent = `$${service.toLocaleString()}`;
    if (orderTotal) orderTotal.textContent = `$${total.toLocaleString()}`;
    
    // Update Mobile Nav Badge and Total
    const cartBadge = document.getElementById('cart-badge');
    const bnavCartText = document.querySelector('#bnav-cart span:last-child');
    const totalQty = state.cart.reduce((acc, item) => acc + item.quantity, 0);

    if (cartBadge) {
        if (totalQty > 0) {
            cartBadge.textContent = totalQty;
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }
    }
    
    if (bnavCartText) {
        if (total > 0) {
            bnavCartText.textContent = `$${total.toLocaleString()}`;
            bnavCartText.style.color = 'var(--primary)';
            bnavCartText.style.fontWeight = '800';
        } else {
            bnavCartText.textContent = 'Cuenta';
            bnavCartText.style.color = '';
            bnavCartText.style.fontWeight = '';
        }
    }
}

window.removeFromCart = (cartId) => {
    state.cart = state.cart.filter(i => i.cartId !== cartId);
    if (state.selectedTable) {
        state.carts[state.selectedTable.id] = state.cart;
        if (state.cart.length === 0) {
            const tableIndex = state.tables.findIndex(t => t.id === state.selectedTable.id);
            if (tableIndex !== -1) state.tables[tableIndex].status = 'available';
        }
        saveState();
    }
    updateCartUI();
};

function processPayment() {
    if (state.cart.length === 0) return alert('El carrito está vacío');
    if (!state.selectedTable) return alert('No hay mesa seleccionada');

    const subtotal = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const service = state.includeService ? (subtotal * 0.1) : 0;
    const total = subtotal + service;

    const newOrder = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        table: state.selectedTable ? (state.selectedTable.label || state.selectedTable.id) : '--',
        items: [...state.cart],
        subtotal,
        service,
        total,
        mode: state.mode,
        serviceApplied: state.includeService
    };

    state.pastOrders.push(newOrder);
    localStorage.setItem('meserovip_orders', JSON.stringify(state.pastOrders));
    if (window.syncToCloud) window.syncToCloud();

    // Desocupar la mesa y liberar carrito
    state.cart = [];
    state.carts[state.selectedTable.id] = state.cart;
    const tableIndex = state.tables.findIndex(t => t.id === state.selectedTable.id);
    if (tableIndex !== -1) {
        state.tables[tableIndex].status = 'available';
    }
    saveState();

    let ticket = `¡Venta guardada con éxito!\n\n--- MESA ${newOrder.table} ---\n`;
    newOrder.items.forEach(i => {
        ticket += `${i.quantity}x ${i.name} ... $${(i.price * i.quantity).toLocaleString()}\n`;
    });
    ticket += `--------------------\n`;
    ticket += `Subtotal: $${newOrder.subtotal.toLocaleString()}\n`;
    if (newOrder.serviceApplied) {
        ticket += `Propina (10%): $${newOrder.service.toLocaleString()}\n`;
    }
    ticket += `TOTAL: $${newOrder.total.toLocaleString()}\n`;

    alert(ticket);
    state.selectedTable = null;
    const activeTableEl = document.getElementById('active-table-number');
    if (activeTableEl) activeTableEl.textContent = `Mesa --`;
    updateCartUI();
    renderView('tables');
}

window.getLocalYMD = (dateString = new Date()) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

window.updateDashboardDate = (dateVal) => {
    state.dashboardDate = dateVal;
    renderView('dashboard');
};

function renderDashboard() {
    viewContainer.innerHTML = '';

    if (!state.dashboardDate) state.dashboardDate = getLocalYMD();

    // Chart data for last 7 days ending today
    const chartLabels = [];
    const chartData = [];
    
    // Combine current and archived for the chart
    const archivedOrders = JSON.parse(localStorage.getItem('meserovip_orders_history')) || [];
    const allOrdersChart = [...archivedOrders, ...state.pastOrders];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ymd = getLocalYMD(d);
        chartLabels.push(d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }));
        const daySales = allOrdersChart.filter(o => getLocalYMD(o.timestamp) === ymd).reduce((sum, o) => sum + o.total, 0);
        chartData.push(daySales);
    }

    const filteredOrders = state.pastOrders.filter(o => getLocalYMD(o.timestamp) === state.dashboardDate);
    const totalSales = filteredOrders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = filteredOrders.length;

    const filteredVouchers = state.vouchers.filter(v => getLocalYMD(v.timestamp) === state.dashboardDate);
    const totalVouchers = filteredVouchers.reduce((acc, v) => acc + v.amount, 0);

    const dashboard = document.createElement('div');
    dashboard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
            <h3>Rendimiento Semanal</h3>
        </div>
        <div class="glass" style="padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem; position: relative; height: 350px; background: linear-gradient(145deg, rgba(30,30,36,0.6) 0%, rgba(10,10,12,0.9) 100%); border: 1px solid rgba(242, 13, 89, 0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.05);">
            <canvas id="salesChart"></canvas>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:10px;">
            <h3>Ventas del Día</h3>
            <div style="display:flex; align-items:center; gap:10px;">
                <input type="date" value="${state.dashboardDate}" onchange="updateDashboardDate(this.value)" 
                       style="background:rgba(0,0,0,0.3); color:white; border:1px solid var(--border-glass); padding:8px; border-radius:8px; outline:none; color-scheme: dark;">
                <button class="btn-primary" style="width:auto; padding:8px 16px; background:#f20d59; color:white" onclick="clearOrders()">Borrar Data</button>
            </div>
        </div>
        <div class="dashboard-grid">
            <div class="stat-card glass">
                <span class="stat-label">Total Ventas</span>
                <span class="stat-value">$${totalSales.toLocaleString()}</span>
            </div>
            <div class="stat-card glass">
                <span class="stat-label">Tarjetas (Bauches)</span>
                <span class="stat-value" style="color:var(--primary)">$${totalVouchers.toLocaleString()}</span>
            </div>
            <div class="stat-card glass">
                <span class="stat-label">Comandas</span>
                <span class="stat-value">${totalOrders}</span>
            </div>
        </div>
        <div style="margin-top:2rem">
            <h3>Historial de Órdenes</h3>
            <div class="recent-orders-list" style="margin-top:1rem">
                ${filteredOrders.length === 0 ? '<p style="color:var(--text-dim); text-align:center; padding: 2rem;">No hay ventas este día.</p>' : ''}
                ${filteredOrders.slice().reverse().map(order => `
                    <div class="recent-order-item glass" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 1.2rem;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <p style="font-weight:600">Mesa ${order.table}</p>
                                <p style="font-size:0.8rem; color:var(--text-dim)">${new Date(order.timestamp).toLocaleTimeString()} - ${order.serviceApplied ? 'Con Servicio' : 'Sin Servicio'}</p>
                            </div>
                            <div style="text-align: right;">
                                <p style="font-weight:700; color:var(--primary); margin-bottom: 5px;">$${order.total.toLocaleString()}</p>
                                <div style="display:flex; gap:5px; justify-content:flex-end;">
                                    <button onclick="reopenOrder(${order.id})" style="background:rgba(255,255,255,0.1); border:1px solid var(--border-glass); color:white; border-radius:5px; padding:3px 8px; font-size:0.7rem; cursor:pointer;">Editar</button>
                                    <button onclick="deleteOrder(${order.id})" style="background:rgba(242,13,89,0.1); border:1px solid rgba(242,13,89,0.3); color:var(--accent); border-radius:5px; padding:3px 8px; font-size:0.7rem; cursor:pointer;">Borrar</button>
                                </div>
                            </div>
                        </div>
                        <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px; margin-top: 5px;">
                            ${(order.items || []).map(i => `
                                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px;">
                                    <span style="color:var(--text-main)"><span style="color:var(--primary); font-weight:bold">${i.quantity}x</span> ${i.name}</span>
                                    <span style="color:var(--text-dim)">$${((i.price || 0) * i.quantity).toLocaleString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    viewContainer.appendChild(dashboard);

    // Initialize the chart asynchronously using Chart.js
    setTimeout(() => {
        if (window.Chart) {
            const ctx = document.getElementById('salesChart').getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(242, 13, 89, 0.6)');
            gradient.addColorStop(1, 'rgba(242, 13, 89, 0)');

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Ventas Diarias ($)',
                        data: chartData,
                        fill: true,
                        backgroundColor: gradient,
                        borderColor: 'rgba(242, 13, 89, 1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#13ec5b',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#13ec5b',
                        pointHoverBorderColor: '#fff',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.4 // Makes the line wavy
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: { size: 14, family: "'Outfit', sans-serif" },
                            bodyFont: { size: 16, weight: 'bold', family: "'Outfit', sans-serif" },
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: function (context) {
                                    return '$' + context.parsed.y.toLocaleString();
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: 'rgba(255,255,255,0.7)',
                                font: { family: "'Outfit', sans-serif" },
                                padding: 10,
                                callback: function (value) { return '$' + (value / 1000) + 'k'; }
                            },
                            grid: {
                                color: 'rgba(255,255,255,0.05)',
                                drawBorder: false
                            }
                        },
                        x: {
                            ticks: {
                                color: 'rgba(255,255,255,0.7)',
                                font: { family: "'Outfit', sans-serif" },
                                padding: 10
                            },
                            grid: { display: false, drawBorder: false }
                        }
                    },
                    animation: {
                        y: {
                            duration: 2000,
                            easing: 'easeOutElastic'
                        }
                    }
                }
            });
        }
    }, 50);
}

window.clearOrders = () => {
    const dateToDelete = state.dashboardDate || getLocalYMD();
    const isToday = dateToDelete === getLocalYMD();
    const labelFecha = isToday ? 'de HOY' : `del ${dateToDelete}`;

    if (confirm(`¿Borrar TODAS las ventas ${labelFecha} (incluyendo los turnos archivados)? Los demás días se conservarán.`)) {
        // Clear from active
        state.pastOrders = state.pastOrders.filter(o => getLocalYMD(o.timestamp) !== dateToDelete);
        localStorage.setItem('meserovip_orders', JSON.stringify(state.pastOrders));
        
        // Clear from archive
        const archivedOrders = JSON.parse(localStorage.getItem('meserovip_orders_history')) || [];
        const newArchived = archivedOrders.filter(o => getLocalYMD(o.timestamp) !== dateToDelete);
        localStorage.setItem('meserovip_orders_history', JSON.stringify(newArchived));

        renderView('dashboard');
    }
};

window.deleteOrder = (id) => {
    if (confirm('¿Seguro quieres eliminar esta orden por completo?')) {
        state.pastOrders = state.pastOrders.filter(o => o.id !== id);
        localStorage.setItem('meserovip_orders', JSON.stringify(state.pastOrders));
        if (window.syncToCloud) window.syncToCloud();
        renderView('dashboard');
    }
};

window.reopenOrder = (id) => {
    if (confirm('¿Deseas re-abrir esta cuenta para editarla? Se eliminará de las ventas del día hasta que la vuelvas a cobrar desde el carrito.')) {
        const orderIndex = state.pastOrders.findIndex(o => o.id === id);
        if (orderIndex > -1) {
            const order = state.pastOrders[orderIndex];

            // Remove from past orders
            state.pastOrders.splice(orderIndex, 1);
            localStorage.setItem('meserovip_orders', JSON.stringify(state.pastOrders));
            if (window.syncToCloud) window.syncToCloud();

            // Load into cart
            state.cart = [...order.items];
            state.includeService = order.serviceApplied;

            // Pick an available table to attach this or fallback
            // Try to find the original table to set it if available
            let tableToAssign = state.tables.find(t => (t.label || t.id.toString()) == order.table);
            if (!tableToAssign || tableToAssign.status === 'occupied') {
                // Find first available table
                tableToAssign = state.tables.find(t => t.status === 'available');
            }

            if (tableToAssign) {
                state.selectedTable = tableToAssign;
                tableToAssign.status = 'occupied';
                state.carts[tableToAssign.id] = state.cart;
                saveState();

                const activeTableEl = document.getElementById('active-table-number');
                if (activeTableEl) activeTableEl.textContent = `Mesa ${tableToAssign.label || tableToAssign.id}`;
            }

            document.getElementById('toggle-service').checked = state.includeService;
            updateCartUI();

            renderView('pos');

            // Open cart sidebar on mobile
            const sidebar = document.getElementById('order-sidebar');
            if (sidebar && isMobile()) {
                sidebar.classList.add('open');
                updateMobileUI();
            }
        }
    }
};

function renderInventory() {
    viewContainer.innerHTML = '';

    // Waiter Configuration Section
    const profileSection = document.createElement('div');
    profileSection.className = 'glass';
    profileSection.style.padding = '1.5rem';
    profileSection.style.marginBottom = '2rem';
    profileSection.style.cursor = 'pointer';
    profileSection.innerHTML = `
        <h3 style="margin-bottom:1rem">Configuración del Perfil</h3>
        <p style="color:var(--text-dim); margin-bottom:1rem">Toca aquí o en tu nombre en la barra lateral para cambiar el nombre del mesero.</p>
        <div style="display:flex; gap:15px; align-items:center; background:rgba(255,255,255,0.05); padding:1.5rem; border-radius:12px">
            <div class="user-avatar" style="width:50px; height:50px; font-size:1.2rem">${state.waiterName.substring(0, 2).toUpperCase()}</div>
            <div style="flex:1">
                <p style="font-weight:700; font-size:1.1rem">${state.waiterName}</p>
                <p style="font-size:0.8rem; color:var(--text-dim)">Mesero Senior</p>
            </div>
            <button class="btn-primary" style="width:auto; padding:8px 16px">Editar Nombre</button>
        </div>
    `;
    profileSection.onclick = editWaiterName;

    const items = menuData[state.mode];
    const list = document.createElement('div');
    list.className = 'recent-orders-list';
    list.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
            <h3>Ajuste de Precios (${state.mode.toUpperCase()})</h3>
            <button class="btn-primary" style="width:auto; padding:6px 12px; background:var(--primary); color:#000;" onclick="addNewProduct()">+ Nuevo</button>
        </div>
    `;

    items.forEach(product => {
        const row = document.createElement('div');
        row.className = 'recent-order-item glass';
        row.innerHTML = `
            <div style="flex:1">
                <p style="font-weight:600">${product.name}</p>
                <p style="font-size:0.75rem; color:var(--text-dim)">${product.category}</p>
                <div style="margin-top: 5px; display: flex; align-items: center;">
                    <input type="file" id="img-${product.id}" accept="image/*" style="display:none;" onchange="handleImageUpload(event, '${product.id}')">
                    <button class="btn-primary" style="width:auto; padding:3px 8px; font-size:0.7rem; background:rgba(255,255,255,0.1); border:1px solid var(--border-glass);" onclick="document.getElementById('img-${product.id}').click()">
                        <span class="material-icons-outlined" style="font-size:0.8rem; vertical-align:middle; margin-right:3px;">image</span> Cargar Imagen
                    </button>
                    <span id="img-status-${product.id}" style="font-size:0.7rem; color:var(--primary); margin-left: 5px;">${product.image ? '✓' : ''}</span>
                </div>
            </div>
            <div style="display:flex; gap:10px; align-items:flex-end;">
                <input type="number" id="inp-${product.id}" value="${product.price}" style="width:90px; background:rgba(0,0,0,0.3); color:white; border:1px solid var(--border-glass); padding:5px; border-radius:5px">
                <button class="btn-primary" style="width:auto; padding:5px 10px; font-size:0.8rem" onclick="savePrice('${product.id}')">OK</button>
            </div>
        `;
        list.appendChild(row);
    });

    viewContainer.appendChild(profileSection);
    viewContainer.appendChild(list);
}

window.addNewProduct = () => {
    const name = prompt('Nombre del nuevo producto:');
    if (!name || name.trim() === '') return;

    const category = prompt('Categoría (Ej: Cervezas, Cócteles, Whisky, etc.):', 'Nuevos');
    if (!category) return;

    const priceStr = prompt('Precio (Ej: 15000):', '0');
    if (priceStr === null) return;
    const price = parseInt(priceStr) || 0;

    const newId = state.mode.charAt(0) + Date.now();

    menuData[state.mode].push({
        id: newId,
        name: name.trim(),
        category: category.trim(),
        price: price,
        emoji: '🍽️'
    });

    localStorage.setItem('meserovip_menu', JSON.stringify(menuData));
    alert('Producto agregado exitosamente');
    renderInventory();
};

window.savePrice = (id) => {
    const val = parseInt(document.getElementById(`inp-${id}`).value);
    const item = menuData[state.mode].find(i => i.id === id);
    if (item) {
        item.price = val;
        localStorage.setItem('meserovip_menu', JSON.stringify(menuData));
        alert('Guardado');
    }
};

window.handleImageUpload = (event, id) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                // Resize image to max 400px width/height to save localStorage quota
                const MAX_SIZE = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress as webp or jpeg
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

                const item = menuData[state.mode].find(i => i.id === id);
                if (item) {
                    item.image = dataUrl;
                    try {
                        localStorage.setItem('meserovip_menu', JSON.stringify(menuData));
                        const statusSpan = document.getElementById(`img-${id}`).nextElementSibling.nextElementSibling;
                        if (statusSpan) statusSpan.textContent = '✓ Guardada';
                    } catch (err) {
                        console.error('Error saving image to local storage', err);
                        alert('Error al guardar la imagen. La memoria del navegador podría estar llena.');
                    }
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

function renderVouchers() {
    viewContainer.innerHTML = '';

    const vouchersTotal = state.vouchers.reduce((acc, v) => acc + v.amount, 0);

    const container = document.createElement('div');
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
            <h3>Total Bauches: <span style="color:var(--primary)">$${vouchersTotal.toLocaleString()}</span></h3>
            <button class="btn-primary" style="width:auto; padding:8px 16px; background:var(--primary); color:#000" onclick="document.getElementById('voucher-upload').click()">+ Escanear Bauche</button>
            <input type="file" id="voucher-upload" accept="image/*" capture="environment" style="display:none" onchange="handleVoucherUpload(event)">
        </div>
        <div id="voucher-status" style="margin-bottom: 1rem; color: var(--text-dim); font-size: 0.9rem; font-style: italic;"></div>
        <div class="recent-orders-list" id="vouchers-list">
            ${state.vouchers.length === 0 ? '<p style="color:var(--text-dim); text-align:center; padding: 2rem;">No hay bauches registrados.</p>' : ''}
            ${state.vouchers.slice().reverse().map(v => `
                <div class="recent-order-item glass" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 1.2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <p style="font-weight:600">${new Date(v.timestamp).toLocaleString()}</p>
                            ${v.imageUrl ? `<img src="${v.imageUrl}" style="max-height: 60px; border-radius: 8px; margin-top: 5px; border: 1px solid rgba(255,255,255,0.1)">` : ''}
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <input type="number" id="vamount-${v.id}" value="${v.amount}" style="width:100px; background:rgba(0,0,0,0.3); color:white; border:1px solid var(--border-glass); padding:5px; border-radius:5px; font-weight:bold; font-size:1.1rem; color:var(--primary);">
                            <button class="btn-primary" style="width:auto; padding:5px 10px; font-size:0.8rem; background:rgba(255,255,255,0.1); color:white" onclick="updateVoucherAmount('${v.id}')">OK</button>
                            <button class="btn-primary" style="width:auto; padding:5px 10px; font-size:0.8rem; background:rgba(242, 13, 89, 0.2); color:var(--accent)" onclick="deleteVoucher('${v.id}')">✕</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    viewContainer.appendChild(container);
}

window.handleVoucherUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('voucher-status');
    statusEl.textContent = '⏳ Analizando imagen... por favor espera.';

    // Compressing image for preview
    const reader = new FileReader();
    reader.onload = async function (e) {
        const imageUrl = e.target.result;

        try {
            // Use Tesseract to read text
            const worker = await Tesseract.createWorker('spa');
            const ret = await worker.recognize(imageUrl);
            const text = ret.data.text;
            await worker.terminate();

            // Basic logic: Look for numbers specifically preceded by a dollar sign
            let detectedAmount = 0;
            // Catch $ followed by digits, commas, periods, or spaces
            const numberRegex = /\$\s*([\d.,\s]+)/g;
            let match;
            const amounts = [];
            while ((match = numberRegex.exec(text)) !== null) {
                let rawStr = match[1].trim();
                
                // Si termina exactamente en .00 o ,00 (o cualquier 2 dígitos) los removemos como decimales
                if (/[.,]\d{2}$/.test(rawStr)) {
                    rawStr = rawStr.slice(0, -3);
                }
                
                // Removemos cualquier caracter que no sea un número (puntos, comas, espacios, etc) 
                // para agarrar todo el monto completo sin que parseFloat se confunda.
                let numStr = rawStr.replace(/[^\d]/g, ''); 
                let num = parseFloat(numStr);
                
                if (!isNaN(num) && num > 0) {
                    amounts.push(num);
                }
            }

            // No fallback: We only want amounts explicitly marked with a $ sign

            if (amounts.length > 0) {
                // Usually the total is the largest number, or the last one. Let's pick largest for now
                detectedAmount = Math.max(...amounts);
            }

            const manualAmountStr = prompt('Revisa el monto detectado o ingresa el total manualmente:', detectedAmount || '');
            const finalAmount = parseFloat(manualAmountStr);

            if (!isNaN(finalAmount) && finalAmount > 0) {
                // Resize image slightly for saving
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 300;
                    let width = img.width;
                    let height = img.height;

                    if (width > height && width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    } else if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedUrl = canvas.toDataURL('image/jpeg', 0.6);

                    state.vouchers.push({
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        amount: finalAmount,
                        imageUrl: compressedUrl
                    });
                    localStorage.setItem('meserovip_vouchers', JSON.stringify(state.vouchers));
                    renderVouchers();
                };
                img.src = imageUrl;
            } else {
                statusEl.textContent = '❌ Operación cancelada o monto inválido.';
                setTimeout(() => { if (state.currentView === 'vouchers') renderVouchers(); }, 2000);
            }

        } catch (error) {
            console.error(error);
            statusEl.textContent = '❌ Error al analizar la imagen.';

            // Allow manual entry if OCR fails
            const manualAmountStr = prompt('No se pudo analizar text. Ingresa el total manualmente:');
            const finalAmount = parseFloat(manualAmountStr);
            if (!isNaN(finalAmount) && finalAmount > 0) {
                state.vouchers.push({
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    amount: finalAmount,
                    imageUrl: null
                });
                localStorage.setItem('meserovip_vouchers', JSON.stringify(state.vouchers));
                renderVouchers();
            }
        }
    };
    reader.readAsDataURL(file);
};

window.updateVoucherAmount = (id) => {
    const val = parseFloat(document.getElementById(`vamount-${id}`).value);
    if (!isNaN(val) && val >= 0) {
        const v = state.vouchers.find(v => v.id === id);
        if (v) {
            v.amount = val;
            localStorage.setItem('meserovip_vouchers', JSON.stringify(state.vouchers));
            renderVouchers();
        }
    }
};

window.deleteVoucher = (id) => {
    if (confirm('¿Eliminar este registro de bauche?')) {
        state.vouchers = state.vouchers.filter(v => v.id !== id);
        localStorage.setItem('meserovip_vouchers', JSON.stringify(state.vouchers));
        renderVouchers();
    }
};

// ==========================================
// FIREBASE AUTHENTICATION LOGIC
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDT0Q4UK9ig1Kz7VVenPZnvPe2wQ07gWHE",
    authDomain: "mesero-pro.firebaseapp.com",
    projectId: "mesero-pro",
    storageBucket: "mesero-pro.firebasestorage.app",
    messagingSenderId: "857624551998",
    appId: "1:857624551998:web:9d92c471c1a7297a3d676f",
    measurementId: "G-TL3HC41C10"
};

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    window.firebaseAuth = firebase.auth();
    window.db = firebase.firestore();

    window.syncToCloud = () => {
        if (window.firebaseAuth && window.firebaseAuth.currentUser && window.db) {
            const indicator = document.getElementById('sync-indicator');
            if (indicator) indicator.style.background = '#f20d59'; // Pulse color while syncing
            
            return window.db.collection('userdata').doc(window.firebaseAuth.currentUser.uid).set({
                tables: state.tables,
                carts: state.carts,
                pastOrders: state.pastOrders,
                vouchers: state.vouchers,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                if (indicator) indicator.style.background = '#13ec5b'; // Back to green
            }).catch(err => {
                console.error('Error al sincronizar:', err);
                if (indicator) indicator.style.background = '#ffc107'; // Amber on error
            });
        }
        return Promise.resolve();
    };

    const loginOverlay = document.getElementById('login-overlay');
    const appContainer = document.getElementById('app');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    // Handle Login Form Submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btnLogin = document.getElementById('btn-login');

        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="material-icons-outlined" style="font-size: 1.2rem; margin-right: 8px; vertical-align: bottom;">hourglass_empty</span> Cargando...';
        loginError.style.display = 'none';

        window.firebaseAuth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Success: Observer will handle UI change
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<span class="material-icons-outlined" style="font-size: 1.2rem; margin-right: 8px; vertical-align: bottom;">login</span> Iniciar Sesión';
                loginForm.reset();
            })
            .catch((error) => {
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<span class="material-icons-outlined" style="font-size: 1.2rem; margin-right: 8px; vertical-align: bottom;">login</span> Iniciar Sesión';
                loginError.style.display = 'block';
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    loginError.textContent = 'Credenciales incorrectas.';
                } else {
                    loginError.textContent = 'Asegúrate configurar Firebase. Error: ' + error.message;
                }
            });
    });

    // Handle Google Login
    const btnGoogleLogin = document.getElementById('btn-google-login');
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            loginError.style.display = 'none';
            btnGoogleLogin.disabled = true;
            btnGoogleLogin.innerHTML = 'Cargando...';

            window.firebaseAuth.signInWithPopup(provider)
                .then((result) => {
                    // Success: Observer will handle UI change
                    btnGoogleLogin.disabled = false;
                    btnGoogleLogin.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style="width: 18px; height: 18px;"> Continuar con Google';
                })
                .catch((error) => {
                    btnGoogleLogin.disabled = false;
                    btnGoogleLogin.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style="width: 18px; height: 18px;"> Continuar con Google';
                    loginError.style.display = 'block';
                    loginError.textContent = 'Error con Google: ' + error.message;
                });
        });
    }

    // Authentication State Observer
    window.firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
            // Logged in
            loginOverlay.style.display = 'none';
            appContainer.style.display = 'flex'; // app-container is normally flex in desktop

            // Set user info
            state.waiterName = user.displayName || user.email.split('@')[0] || state.waiterName;
            updateWaiterUI();

            // Initialize App core only once
            if (!window.appInitialized) {
                init();
                window.appInitialized = true;
            }

            // Real-time Firestore Listener
            if (window.db && window.syncListener === undefined) {
                window.syncListener = window.db.collection('userdata').doc(user.uid).onSnapshot((doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        
                        // hasPendingWrites is true if the event was triggered by our own local write
                        if (!doc.metadata.hasPendingWrites) {
                            const tablesStr = JSON.stringify(data.tables);
                            const cartsStr = JSON.stringify(data.carts);
                            
                            // Only update if data actually changed to avoid "deselecting" or resetting UI
                            if (tablesStr !== JSON.stringify(state.tables) || cartsStr !== JSON.stringify(state.carts) || 
                                JSON.stringify(data.pastOrders) !== JSON.stringify(state.pastOrders)) {
                                
                                state.tables = data.tables || state.tables;
                                state.carts = data.carts || state.carts;
                                state.pastOrders = data.pastOrders || state.pastOrders;
                                state.vouchers = data.vouchers || state.vouchers;

                                // Preserve active table reference
                                if (state.selectedTable) {
                                    const newTable = state.tables.find(t => t.id === state.selectedTable.id);
                                    if (newTable) state.selectedTable = newTable;
                                    state.cart = state.carts[state.selectedTable.id] || [];
                                }

                                localStorage.setItem('meserovip_tables', JSON.stringify(state.tables));
                                localStorage.setItem('meserovip_carts', JSON.stringify(state.carts));
                                localStorage.setItem('meserovip_orders', JSON.stringify(state.pastOrders));
                                localStorage.setItem('meserovip_vouchers', JSON.stringify(state.vouchers));

                                // Only refresh UI if in a view that depends on this data
                                // And try to be smart about not kicking the user out of POS
                                if (state.currentView !== 'pos') {
                                    renderView(state.currentView);
                                } else {
                                    // In POS, just update the table dots and the cart sidebar
                                    updateCartUI();
                                }
                                
                                const indicator = document.getElementById('sync-indicator');
                                if (indicator) {
                                    indicator.style.background = '#13ec5b';
                                    indicator.classList.add('pulse');
                                    setTimeout(() => indicator.classList.remove('pulse'), 1000);
                                }
                            }
                        }
                    } else {
                        window.syncToCloud();
                    }
                });
            }
        } else {
            // Logged out
            loginOverlay.style.display = 'flex';
            appContainer.style.display = 'none';
            if (window.syncListener) {
                window.syncListener(); // unsubscribe
                window.syncListener = undefined;
            }
        }
    });

} catch (e) {
    console.error("Firebase no cargó o falta configuración:", e);
    // Fallback: If Firebase SDK wasn't loaded (no internet?) load app normally just in case
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    init();
}
