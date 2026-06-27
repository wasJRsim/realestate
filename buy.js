import { createClient }
from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL =
"https://mhtctbzidludbqospnrk.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odGN0YnppZGx1ZGJxb3NwbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODgyOTksImV4cCI6MjA5NzU2NDI5OX0.mB7fLgtIpy5A-dzD3K9skqqYJmckSVsVsimVAPz4yXw";

const supabase =
createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
let rentProperties = [];
async function loadProperties() {

    const { data, error } =
    await supabase
        .from("properties")
        .select("*")
        .eq("propertytype", "Buy");

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if(error){
        console.error(error);
        return;
    }

    rentProperties = data || [];

    applyFilters();
}
// DOM
const container = document.getElementById("propertiesContainer");
const toggleBtn = document.getElementById("toggleMap");
const resetBtn = document.getElementById("resetFilters");
const body = document.body;

// FILTER DOM
const keywordSearch =document.getElementById("keywordSearch");
const priceSelect = document.getElementById("price");
const bedroomsSelect = document.getElementById("bedrooms");
const typeSelect = document.getElementById("typeFilter");

// ---------------- HELPERS ----------------
function escapeHTML(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatPrice(price) {
    const num = Number(price);
    return Number.isFinite(num) ? num.toLocaleString() : escapeHTML(price);
}

function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// MAP
const defaultCenter = [36.75, 3.06];

const map = L.map("map", {
    minZoom: 1.3,
    maxZoom: 19,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0
}).setView(defaultCenter, 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    noWrap: true
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);

// ---------------- DISPLAY ----------------
function display(list) {
    container.innerHTML = "";
    markersLayer.clearLayers();

    if (!list.length) {
        container.innerHTML = `<p class="no-results">No properties match your search.</p>`;
        setTimeout(() => map.invalidateSize(), 200);
        return;
    }

    const bounds = [];

    list.forEach(property => {
        const hasCoords = Number.isFinite(property.lat) && Number.isFinite(property.lng);

        // CARD (always rendered, even if coordinates are missing)
        const card = document.createElement("div");
        card.className = "property-card";

        card.innerHTML = `
            <img src="${property.image}" alt="${escapeHTML(property.location || "Property")}" loading="lazy">
            <div class="property-info">
            <div class="property-info-top>"
            <h1 style="
                color:white;
                font-size: 1.5rem;
                font-weight: 500;
                font-family: "Montserrat",sans-serif;
            ">
               ${escapeHTML(property.titleofproperty || "Unknown")}
            </h1>
            <div class="property-price">${formatPrice(property.price)}<p>USD</p></div>
            </div>
                <div class="property-location">
                <img src="https://res.cloudinary.com/dshmhktwh/image/upload/v1782559375/epingle_oa6i6g.webp" class="location2" style="width:20px; height:20px;">
                ${escapeHTML(property.location || "Unknown")}
                </div>
            <p style="
                color:#e5b769;
                margin-top:5px;
                font-size:14px;
                ">
                ${escapeHTML(property.category || "")}
            </p>

               <div class="property-meta">

                    ${property.bedrooms !== undefined ? `
                        <span class="meta-item">
                            ${escapeHTML(property.bedrooms)}
                            <img src="https://res.cloudinary.com/dshmhktwh/image/upload/v1782559686/bed-solid_z323n3.webp" class="icon" style="width:20px; height:20px;">
                        </span>
                    ` : ""}|

                    ${property.bathrooms !== undefined ? `
                        <span class="meta-item">
                            ${escapeHTML(property.bathrooms)}
                            <img src="https://res.cloudinary.com/dshmhktwh/image/upload/v1782559932/bath-solid_sicpda.webp" class="icon" style="width:20px; height:20px;">
                        </span>
                    ` : ""}|

                    ${property.surface ? `
                        <span class="meta-item">
                            ${escapeHTML(property.surface)}
                            <img src="https://res.cloudinary.com/dshmhktwh/image/upload/v1782558602/surface_1_f7zroz.webp" class="icon" style="width:20px; height:20px;">
                        </span>
                    ` : ""}

                </div>

                <a href="property.html?id=${encodeURIComponent(property.id)}" class="details-btn">
                    Show more details
                </a>
            </div>
        `;

        container.appendChild(card);

        if (!hasCoords) return; // no marker possible, but the card still shows

        bounds.push([property.lat, property.lng]);

        // MARKER
        const icon = L.divIcon({
            className: "custom-price-marker",
            html: `<div class="price-marker">${formatPrice(property.price)}</div>`,
            iconSize: [90, 40]
        });

        const marker = L.marker([property.lat, property.lng], { icon })
            .addTo(markersLayer);

        marker.bindPopup(`
            <div>
                <img src="${property.image}" alt="${escapeHTML(property.location || "Property")}" style="width:100%;height:120px;object-fit:cover;">
                <h3>${escapeHTML(property.location || "")}</h3>
            </div>
        `);

        // CARD -> MAP
        card.addEventListener("click", () => {
            map.flyTo([property.lat, property.lng], 15, { duration: 1.2 });
            marker.openPopup();
        });

        // MARKER -> CARD
        marker.on("click", () => {
            card.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    });

    if (bounds.length) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }

    setTimeout(() => map.invalidateSize(), 200);
}

// ---------------- FILTER SYSTEM ----------------
function applyFilters() {

    let filtered = [...rentProperties];

    const keyword =
        keywordSearch.value.toLowerCase().trim();

    const type =
        typeSelect.value;

    const bedrooms =
        Number(bedroomsSelect.value);

    const price =
        priceSelect.value;

    // KEYWORD SEARCH
    if(keyword){

        filtered = filtered.filter(property => {

            const text = `
                ${property.titleofproperty || ""}
                ${property.location || ""}
                ${property.propertydescription || ""}
                ${property.category || ""}
            `.toLowerCase();

            return text.includes(keyword);
        });
    }

    // TYPE
    if(type){

        filtered = filtered.filter(property =>
            (property.category || "").toLowerCase() ===
            type.toLowerCase()
        );
    }

    // BEDROOMS
    if(bedrooms){

        filtered = filtered.filter(property =>
            Number(property.bedrooms) >= bedrooms
        );
    }

    // PRICE SORT
    if(price === "low"){

        filtered.sort(
            (a,b) => Number(a.price) - Number(b.price)
        );

    } else if(price === "high"){

        filtered.sort(
            (a,b) => Number(b.price) - Number(a.price)
        );
    }

    display(filtered);
}
const debouncedApplyFilters = debounce(
    applyFilters,
    150
);
// ---------------- EVENT LISTENERS ----------------

keywordSearch.addEventListener(
    "input",
    debouncedApplyFilters
);

[
    priceSelect,
    bedroomsSelect,
    typeSelect
].forEach(select => {

    select.addEventListener(
        "change",
        applyFilters
    );

});

// RESET BUTTON
resetBtn.addEventListener("click", () => {

    keywordSearch.value = "";
    priceSelect.value = "";
    bedroomsSelect.value = "";
    typeSelect.value = "";

    applyFilters();

});
// ---------------- MAP TOGGLE ----------------
let mapVisible = true;

toggleBtn.addEventListener("click", () => {
    mapVisible = !mapVisible;

    if (!mapVisible) {
        body.classList.add("map-hidden");
        toggleBtn.textContent = "Show Map";
    } else {
        body.classList.remove("map-hidden");
        toggleBtn.textContent = "Hide Map";
        setTimeout(() => map.invalidateSize(), 200);
    }
});

loadProperties();
const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");

menuToggle.addEventListener("click", () => {
    menu.classList.toggle("active");

    if(menu.classList.contains("active")){
        menuToggle.innerHTML = "✖";
    }else{
        menuToggle.innerHTML = "☰";
    }
});