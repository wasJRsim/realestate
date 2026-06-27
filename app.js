import { createClient }from "https://esm.sh/@supabase/supabase-js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, onAuthStateChanged }from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import imageCompression from "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/+esm";

const SUPABASE_URL =
  "https://mhtctbzidludbqospnrk.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odGN0YnppZGx1ZGJxb3NwbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODgyOTksImV4cCI6MjA5NzU2NDI5OX0.mB7fLgtIpy5A-dzD3K9skqqYJmckSVsVsimVAPz4yXw";

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  let properties = [];

async function loadProperties() {

  const { data, error } =
    await supabase
      .from("properties")
      .select("*")
      .order("id", {
        ascending: false
      });

  if (error) {
    console.error(error);
    return;
  }

  properties = data || [];

  renderProperties();
}
// ---------------- FIREBASE ----------------
const firebaseConfig = {
  apiKey: "AIzaSyBIM45Fatl1g-DrFyEhAfQr_ZHrY8QeCEs",
  authDomain: "mehdi-immobilier.firebaseapp.com",
  projectId: "mehdi-immobilier",
  storageBucket: "mehdi-immobilier.firebasestorage.app",
  messagingSenderId: "304433272697",
  appId: "1:304433272697:web:492a77506792d2ee22c1a8",
  measurementId: "G-WK70H0Y64T"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const allowedAdmins = ["wassimberbache11@gmail.com"];

onAuthStateChanged(auth, (user) => {
  if (!user || !allowedAdmins.includes(user.email)) {
    window.location.href = "login.html";
  }
});


// ---------------- FILES ----------------
let uploadedMainImage = "";
let uploadedGalleryImages = [];
let isUploadingMain = false;
let isUploadingGallery = false;

// ---------------- ELEMENTS ----------------
const mainImageInput = document.getElementById("mainImage");
const galleryInput = document.getElementById("additionalImages");
const addBtn = document.getElementById("addBtn");
const preview = document.getElementById("preview");

// Form fields
const titleofproperty = document.getElementById("titleofproperty");
const locationInput = document.getElementById("location");
const addressInput = document.getElementById("address");
const propertytypeSelect = document.getElementById("propertytype");
const categorySelect = document.getElementById("category"); // optional: Apartment/House/Villa/Studio
const priceInput = document.getElementById("price");
const bedroomsInput = document.getElementById("bedrooms");
const bathroomsInput = document.getElementById("bathrooms");
const surfaceInput = document.getElementById("surface");
const descriptionInput = document.getElementById("propertydescription");

// ---------------- CLOUDINARY ----------------
const CLOUD_NAME = "dshmhktwh";
const UPLOAD_PRESET = "real_estate";

async function uploadImage(file) {
  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  // Compress & convert to WebP
const options = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1800,
  useWebWorker: true,
  fileType: "image/webp",
  initialQuality: 0.85
};

  const compressedFile = await imageCompression(file, options);

  console.log(
    `Original: ${(file.size / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
  );

  const formData = new FormData();
  formData.append("file", compressedFile); // Upload compressed image
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Upload failed");
  }

  return data.secure_url.replace(
      "/upload/",
      "/upload/f_auto,q_auto/"
  );
}
// ---------------- MAIN IMAGE ----------------
if (mainImageInput) {
  mainImageInput.addEventListener("change", async function () {
    const file = this.files[0];
    if (!file) return;

    isUploadingMain = true;
    uploadedMainImage = "";

    try {
      uploadedMainImage = await uploadImage(file);
    renderMainImagePreview();
    } catch (err) {
      console.error(err);
      uploadedMainImage = "";
      alert("Main image upload failed. Please try again.");
    } finally {
      isUploadingMain = false;
    }
  });
}
function renderMainImagePreview() {
  const container = document.getElementById("mainImagePreview");
  if (!container) return;

  if (!uploadedMainImage) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div style="position:relative; display:inline-block;">
      <img src="${uploadedMainImage}" style="width:100%; max-width:300px; border-radius:10px;">
      <button id="removeMainImg" class="remove-gallery" type="button">
        ×
      </button>
    </div>
  `;

  document.getElementById("removeMainImg").onclick = () => {
    uploadedMainImage = "";
    mainImageInput.value = "";
    renderMainImagePreview();
  };
}

// ---------------- GALLERY ----------------
if (galleryInput) {
  galleryInput.addEventListener("change", async function () {
    const files = Array.from(this.files);
    if (!files.length) return;

    isUploadingGallery = true;

    try {
      const newUploads = await Promise.all(files.map(uploadImage));

      uploadedGalleryImages = [
        ...uploadedGalleryImages,
        ...newUploads
      ];

      renderGalleryPreview();
    } catch (err) {
      console.error("Gallery upload error:", err);
      alert("Some gallery images failed to upload. Please try again.");
    } finally {
      isUploadingGallery = false;
    }
  });
}

// ---------------- GEO ----------------
async function getCoordinates(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  );

  const data = await res.json();

  if (!data || data.length === 0) {
    throw new Error("Address not found. Please check it and try again.");
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon)
  };
}

// ---------------- FORM HELPERS ----------------
function resetForm() {
  if(titleofproperty) titleofproperty.value = "";
  if (locationInput) locationInput.value = "";
  if (addressInput) addressInput.value = "";
  if (propertytypeSelect) propertytypeSelect.value = "";
  if (categorySelect) categorySelect.value = "";
  if (priceInput) priceInput.value = "";
  if (bedroomsInput) bedroomsInput.value = "";
  if (bathroomsInput) bathroomsInput.value = "";
  if (surfaceInput) surfaceInput.value = "";
  if (descriptionInput) descriptionInput.value = "";
  if (mainImageInput) mainImageInput.value = "";
  if (galleryInput) galleryInput.value = "";

  uploadedMainImage = "";
  uploadedGalleryImages = [];
  renderMainImagePreview();
  renderGalleryPreview();
}

// ---------------- ADD PROPERTY ----------------
if (addBtn) {
  addBtn.addEventListener("click", async () => {
    if (isUploadingMain || isUploadingGallery) {
      alert("Please wait for images to finish uploading.");
      return;
    }
    const title = titleofproperty.value.trim();
    const location = locationInput.value.trim();
    const propertydescription = descriptionInput.innerHTML.trim();
    const address = addressInput.value.trim();
    const propertytype = propertytypeSelect.value;
    const category = categorySelect ? categorySelect.value : "";
    const priceRaw = priceInput.value.replace(/,/g, ""); // "60000"
    const formattedPrice = Number(priceRaw).toLocaleString("en-US"); // "60,000"
    const bedrooms = Number(bedroomsInput.value) || 0;
    const bathrooms = Number(bathroomsInput.value) || 0;
    const surface = Number(surfaceInput.value) || 0;
   if (
    !title ||
    !location ||
    !address ||
    !propertytype ||
    !category ||
    !priceRaw ||
    !propertydescription
){
      alert("Please fill required fields");
      return;
    }

    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price <= 0) {
      alert("Please enter a valid price");
      return;
    }

    if(!uploadedMainImage){
      alert("Please upload a main image");
      return;
    }

    addBtn.disabled = true;

    try {
      const coords = await getCoordinates(address);

      const property = {
        location,
        price,
        titleofproperty: title,
        bedrooms,
        bathrooms,
        surface,
        address,
        propertytype,
        propertydescription,
        category,
        lat: coords.lat,
        lng: coords.lng,
        image: uploadedMainImage,
        gallery: uploadedGalleryImages
      };

const isEditing = editingPropertyId !== null;

if (isEditing) {

    const { error } = await supabase
        .from("properties")
        .update(property)
        .eq("id", editingPropertyId);

    if (error) {
        throw error;
    }

    await loadProperties();

} else {

    const { error } = await supabase
        .from("properties")
        .insert([property]);

    if (error) {
        throw error;
    }

    await loadProperties();
}

resetForm();

editingPropertyId = null;

addBtn.textContent = "Add Property";

alert(
    isEditing
        ? "Property updated successfully!"
        : "Property added successfully!"
);

} catch (err) {

    console.error(err);

    alert(
        err.message ||
        "Could not process property"
    );

} finally {

    addBtn.disabled = false;
}

});
}
// ---------------- DELETE ----------------
async function deleteProperty(id){
  const { error } =
  await supabase
    .from("properties")
    .delete()
    .eq("id", id);

  if(error){
    console.error(error);
    return;
  }
  await loadProperties();
}
// ---------------- HELPERS ----------------
function escapeHTML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
//--------------------Edit-------------------
let editingPropertyId = null;

function loadPropertyForEdit(property) {

  editingPropertyId = property.id;
  titleofproperty.value = property.titleofproperty ||"";
  locationInput.value = property.location || "";
  addressInput.value = property.address || "";
  propertytypeSelect.value = property.propertytype || "";
  
  if(categorySelect){
    categorySelect.value = property.category || "";
  }

  priceInput.value = property.price || "";
  bedroomsInput.value = property.bedrooms || "";
  bathroomsInput.value = property.bathrooms || "";
  surfaceInput.value = property.surface || "";

  descriptionInput.innerHTML = property.propertydescription || "";

  uploadedMainImage = property.image || "";
  uploadedGalleryImages = property.gallery || [];

  renderGalleryPreview();
  renderMainImagePreview();

  addBtn.textContent = "Update Property";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ---------------- RENDER ----------------
function renderProperties() {
  if (!preview) return;

  preview.innerHTML = "";

  const rentProperties = properties.filter(p => p.propertytype === "Rent");
  const saleProperties = properties.filter(p => p.propertytype === "Buy");

  function createSection(title, items) {

    // Section wrapper
    const section = document.createElement("div");
    section.style.marginBottom = "40px";

    // Title
    const sectionTitle = document.createElement("h2");
    sectionTitle.textContent = title;
    sectionTitle.style.margin = "20px 0";
    sectionTitle.style.fontSize = "20px";
    sectionTitle.style.color = "#1f2937";

    // GRID container 👇 THIS IS THE MAGIC
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
    grid.style.gap = "15px";

    // empty state
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No properties";
      empty.style.color = "#999";
      section.appendChild(sectionTitle);
      section.appendChild(empty);
      preview.appendChild(section);
      return;
    }

    items.forEach(p => {
      const card = document.createElement("div");
      card.style.cursor = "pointer";

      card.addEventListener("click", (e) => {
        if (
            e.target.classList.contains("del") ||
            e.target.classList.contains("edit")
        ) return;
        window.location.href = `property.html?id=${p.id}`;
      });

      card.style.background = "white";
      card.style.borderRadius = "12px";
      card.style.overflow = "hidden";
      card.style.boxShadow = "0 10px 20px rgba(0,0,0,0.08)";

      card.innerHTML = `
        <img src="${p.image}" style="width:100%; height:140px; object-fit:cover;">
        <div style="padding:10px">
         <h2 style="font-size:14px">${escapeHTML(p.titleofproperty)}</h2>
          <h3 style="font-size:14px">${escapeHTML(p.location)}</h3>
          <p style="font-size:13px">${p.price}</p>
          <p style="font-size:12px; color:#666">
            ${p.bedrooms} 🛏 | ${p.bathrooms} 🛁 | ${p.surface} m²
          </p>
          <button class="edit" type="button">Edit</button>
          <button class="del" type="button">Delete</button>
        </div>
      `;

      card.querySelector(".del").addEventListener("click", () => {
        deleteProperty(p.id);
      });
      card.querySelector(".edit").addEventListener("click", (e) => {
        e.stopPropagation();
        loadPropertyForEdit(p);
      });

      grid.appendChild(card);
    });

    section.appendChild(sectionTitle);
    section.appendChild(grid);
    preview.appendChild(section);
  }

  createSection("Properties for Rent", rentProperties);
  createSection("Properties for Sale", saleProperties);
}
loadProperties();

// ---------------- GALLERY PREVIEW ----------------
function renderGalleryPreview() {
  const container = document.getElementById("previewGallery");
  if (!container) return;

  container.innerHTML = "";

  uploadedGalleryImages.forEach((url, index) => {

    const item = document.createElement("div");
    item.className = "gallery-item";

    item.innerHTML = `
      <img src="${url}" alt="Gallery image">

      <button class="remove-gallery" type="button">
        ×
      </button>
    `;

    item.querySelector(".remove-gallery").addEventListener("click", () => {
      uploadedGalleryImages.splice(index, 1);
      renderGalleryPreview();
    });

    container.appendChild(item);
  });
}


function formatText(type) {
    const editor = document.getElementById("propertydescription");
    editor.focus();

    if (type === "bold") {
        document.execCommand("bold");
    }

    else if (type === "italic") {
        document.execCommand("italic");
    }

    else if (type === "highlight") {
        document.execCommand("backColor", false, "#f5e6c8");
    }
}

window.formatText = formatText;

