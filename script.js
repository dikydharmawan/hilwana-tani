const SHEET_ID = "1GOFMf_wKp3xuiXkRlu2bgZfCA7aJl_yszb5iCpY42BU";
const GID_PRODUK = "0";
const GID_ULASAN = "432218498";

let productsData = [];
let currentCategory = "Semua";

async function fetchFromSheet(gid) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
    try {
        const response = await fetch(url);
        const text = await response.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        return json.table.rows;
    } catch (e) {
        console.error("Gagal memuat data:", e);
        return null;
    }
}

function setCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll(".cat-btn").forEach((btn) => {
        const bText = btn.innerText.trim();
        if (bText === cat) btn.classList.add("active");
        else btn.classList.remove("active");
    });
    renderProducts(document.getElementById("search-input").value);
    document.getElementById("katalog").scrollIntoView({
        behavior: "smooth",
    });
}

function renderCategoryNav() {
    const nav = document.getElementById("category-nav");
    const categories = [...new Set(productsData.map((p) => p.category))];
    nav.innerHTML = `<button onclick="setCategory('Semua')" class="cat-btn ${currentCategory === "Semua" ? "active" : ""} whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold transition">Semua</button>`;
    categories.forEach((cat) => {
        nav.innerHTML += `<button onclick="setCategory('${cat}')" class="cat-btn ${currentCategory === cat ? "active" : ""} whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold transition">${cat}</button>`;
    });
}

function createProductCard(p) {
    return `
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition duration-500 group flex flex-col relative">
            <div class="relative aspect-square overflow-hidden bg-gray-50">
                <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
                <div class="absolute top-3 left-3 bg-orange-600 text-white text-[9px] px-2.5 py-1 rounded-lg font-black shadow-lg">SHOPEE</div>
            </div>
            <div class="p-5 flex-grow flex flex-col justify-between">
                <div>
                    <h4 class="text-[13px] font-bold text-gray-800 line-clamp-2 leading-tight mb-3 h-9">${p.name}</h4>
                    <p class="text-lg font-black text-[--earth] mb-5">Rp ${Number(p.price).toLocaleString("id-ID")}</p>
                </div>
                <div class="grid grid-cols-1 gap-2">
                    <a href="${p.link}" target="_blank" class="bg-orange-50 text-orange-600 py-2.5 rounded-2xl text-center font-black text-[10px] tracking-wide hover:bg-orange-600 hover:text-white transition duration-300">DETAIL PRODUK</a>
                    <a href="https://wa.me/6282334205815?text=Halo Admin, stok ini ready: ${p.name}" class="bg-[--primary] text-white py-2.5 rounded-2xl text-center font-black text-[10px] tracking-wide hover:bg-gray-800 transition duration-300 shadow-md">TANYA STOK (WA)</a>
                </div>
            </div>
        </div>`;
}

function renderProducts(filter = "") {
    const container = document.getElementById("product-container");
    container.innerHTML = "";
    const filtered = productsData.filter((p) =>
        p.name.toLowerCase().includes(filter.toLowerCase()),
    );
    if (filtered.length === 0) {
        container.innerHTML =
            '<p class="text-center text-gray-400 py-32 font-medium">Ops! Produk yang Anda cari belum tersedia.</p>';
        return;
    }
    const grouped = {};
    filtered.forEach((p) => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
    });

    const renderSection = (category, products, showMoreBtn) => {
        const section = document.createElement("div");
        section.innerHTML = `
        <div class="flex items-center justify-between mb-10">
            <h3 class="text-xl sm:text-2xl font-black text-gray-900 flex items-center">
                <span class="w-2.5 h-8 bg-[--primary] rounded-full mr-4 shadow-lg shadow-[--primary]/20"></span> ${category}
            </h3>
            ${showMoreBtn ? `<button onclick="setCategory('${category}')" class="text-[10px] font-black text-[--primary] border-2 border-[--primary]/10 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl hover:bg-[--primary] hover:text-white transition duration-300 uppercase tracking-widest">Lihat Semua ${products.length} &rarr;</button>` : ""}
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-8">
            ${products
              .slice(0, currentCategory === "Semua" ? 6 : 999)
              .map((p) => createProductCard(p))
              .join("")}
        </div>`;
        container.appendChild(section);
    };

    if (currentCategory === "Semua") {
        for (const cat in grouped)
            renderSection(cat, grouped[cat], grouped[cat].length > 5);
    } else if (grouped[currentCategory]) {
        renderSection(currentCategory, grouped[currentCategory], false);
    }
}

async function init() {
    const rowsProd = await fetchFromSheet(GID_PRODUK);
    if (rowsProd) {
        productsData = rowsProd
            .map((row) => ({
                name: row.c[1]?.v || "Tanpa Nama",
                price: row.c[2]?.v || 0,
                link: (row.c[3]?.v || "").replace(
                    /alfathtani(\b|$)/,
                    "alfathtani123",
                ),
                image: row.c[4]?.v,
                category: row.c[6]?.v || "Umum",
                aktif: row.c[7]?.v?.toUpperCase() === "YA",
            }))
            .filter((p) => p.aktif);
        renderCategoryNav();
        renderProducts();
    }
    document
        .getElementById("search-input")
        .addEventListener("input", (e) => renderProducts(e.target.value));

    const rowsUlasan = await fetchFromSheet(GID_ULASAN);
    const uBox = document.getElementById("testimonial-list");
    if (rowsUlasan) {
        uBox.innerHTML = "";
        rowsUlasan.forEach((row) => {
            const r = row.c;
            if (r[4]?.v?.toUpperCase() === "YA") {
                const stars = r[2]?.v || 5;
                const date = r[3]?.v || "";
                uBox.innerHTML += `
                            <div class="bg-white p-8 sm:p-12 rounded-[40px] border border-gray-100 shadow-sm relative group hover:shadow-2xl transition-all duration-700 flex flex-col justify-between">
                                <div>
                                    <div class="flex justify-between items-start mb-8">
                                        <div class="text-yellow-400 text-[10px] flex gap-1.5">${'<i class="fas fa-star text-[8px] sm:text-[10px]"></i>'.repeat(stars)}</div>
                                        <span class="text-[8px] sm:text-[10px] font-black text-gray-200 uppercase tracking-tighter sm:tracking-widest">${date}</span>
                                    </div>
                                    <p class="text-gray-700 font-medium italic text-xs sm:text-sm mb-10 leading-relaxed tracking-tight line-clamp-6">"${r[1]?.v}"</p>
                                </div>
                                <div class="flex items-center gap-5">
                                    <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[--primary] to-[#3a6d32] flex items-center justify-center text-white font-black text-xs sm:text-lg shadow-xl">${r[0]?.v?.charAt(0) || "P"}</div>
                                    <div>
                                        <p class="font-black text-gray-900 uppercase text-[10px] sm:text-[12px] tracking-widest">${r[0]?.v}</p>
                                        <p class="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase mt-1">Petani Terverifikasi</p>
                                    </div>
                                </div>
                                <i class="fas fa-quote-right absolute top-10 right-10 text-gray-50 text-4xl sm:text-7xl group-hover:text-[--primary]/5 transition-colors duration-700 pointer-events-none opacity-50"></i>
                            </div>`;
            }
        });
    }
}

// Mobile Menu Toggle logic
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.contains('hidden');
        if (isHidden) {
            mobileMenu.classList.remove('hidden');
            setTimeout(() => {
                mobileMenu.classList.remove('opacity-0', '-translate-y-2');
                menuToggle.querySelector('i').classList.replace('fa-bars', 'fa-times');
            }, 10);
        } else {
            mobileMenu.classList.add('opacity-0', '-translate-y-2');
            menuToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
            setTimeout(() => {
                mobileMenu.classList.add('hidden');
            }, 300);
        }
    });

    // Close menu when clicking links
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('opacity-0', '-translate-y-2');
            menuToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
            setTimeout(() => mobileMenu.classList.add('hidden'), 300);
        });
    });
}


// Scroll to Top Logic
const scrollBtn = document.getElementById('scrollToTop');
if (scrollBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            scrollBtn.classList.remove('opacity-0', 'invisible', 'translate-y-10');
            scrollBtn.classList.add('opacity-100', 'visible', 'translate-y-0');
        } else {
            scrollBtn.classList.add('opacity-0', 'invisible', 'translate-y-10');
            scrollBtn.classList.remove('opacity-100', 'visible', 'translate-y-0');
        }
    });
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

window.onload = init;
