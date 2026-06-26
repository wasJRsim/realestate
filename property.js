import { createClient }
from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL =
"https://mhtctbzidludbqospnrk.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odGN0YnppZGx1ZGJxb3NwbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODgyOTksImV4cCI6MjA5NzU2NDI5OX0.mB7fLgtIpy5A-dzD3K9skqqYJmckSVsVsimVAPz4yXw";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const params =
    new URLSearchParams(window.location.search);

const propertyId =
    params.get("id");

const container =
    document.getElementById("property-page");

let property = null;

loadProperty();

async function loadProperty(){

    const { data, error } =
        await supabase
            .from("properties")
            .select("*")
            .eq("id", propertyId)
            .single();

    if(error){
        console.error(error);

        container.innerHTML = `
            <h2>Property not found</h2>
        `;
        return;
    }

    property = data;

    window.currentProperty = property;

    renderProperty();
}
let allImages = [];
function renderProperty() {
    

    const gallery = property.gallery || [];
        allImages = [
            property?.image,
            ...(property?.gallery || [])
        ].filter(Boolean);

    container.innerHTML = `
    
    <div class="property-layout">

        <div class="gallery-section">

            <div class="gallery-top">

                <div class="main-image">
                    <img
                        id="mainImage"
                        src="${property.image || ""}"
                        onclick="openViewer('${property.image || ""}')"
                    >
                </div>

                <div class="side-images">
                    ${
                        gallery.slice(0, 2).map(img => `
                          <img
                            src="${img}"
                            onclick="openViewer('${img}')"
                        >
                        `).join("")
                    }
                </div>

            </div>

            <div class="bottom-images">
                ${
                    gallery.slice(2, 6).map(img => `
                        <img
                            src="${img}"
                            onclick="openViewer('${img}')"
                        >
                    `).join("")
                }
            </div>
                <div class="property-header">
                    <h1>${property.titleofproperty || ""}</h1>
                    <h2>${Number(property.price || 0).toLocaleString()}USD</h2>
                     <div class="features-grid">

                    <div class="feature">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <strong>${property.surface || 0}</strong>
                        <img src="surface (1).png" class="icon" style="width:35px; height:35px;">
                    </div>
                    </div>

                    <div class="feature">
                        <div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <strong>${property.bedrooms || 0}</strong>
                                <img src="bed-solid.png" class="icon" style="width:35px; height:35px;">
                            </div>
                        </div>
                    </div>

                    <div class="feature">
                        <div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <strong>${property.bathrooms || 0}</strong>
                                <img src="bath-solid.png" class="icon" style="width:35px; height:35px;">
                            </div>
                        </div>
                    </div>

                </div>

                </div>

            <div class="description-section">

                <h2>Description</h2>

                <p>${property.propertydescription || ""}</p>

            </div>

        </div>

        <div class="sticky-sidebar">

        <button class="share-btn" onclick="shareProperty()">
            <img
                src="https://res.cloudinary.com/dshmhktwh/image/upload/v1782415757/share_hxev08.png"
                alt="Share"
                class="share-icon"
            >
            Share Property
        </button>

            <div class="contact-card">

                <h3>Contact Agent</h3>

                <h4><img src="phone-call.png">Phone number</h4>
                <p><a href="tel:+213654803725">+213 654 803 725</a></p>
                <h4><img src="email.png">Email</h4>
                <p><a href="mailto:Example@gmail.com">Example@gmail.com</a></p>
            </div>

            <a
                class="maps-btn"
                target="_blank"
                href="https://www.google.com/maps/search/${encodeURIComponent(property.address || property.location || "")}"
            >
                <img src="epingle.png" class="location2" style="width:20px; height:20px;">
                View on Map
            </a>

        </div>

    </div>
    `;
}

// ---------------- SHARE FUNCTION----------------
function shareProperty() {

    const property = window.currentProperty;

    if (!property) {
        alert("Property not found!");
        return;
    }

    const shareData = {
        title: property.location || "Property",
        text: property.price || "",
        url: window.location.href
    };

    if (navigator.share) {

        navigator.share(shareData)
            .catch(err => console.log("Share failed:", err));

    } else if (navigator.clipboard) {

        navigator.clipboard.writeText(window.location.href)
            .then(() => alert("Link copied!"))
            .catch(() => alert("Failed to copy link"));

    } else {

        alert("Sharing not supported in this browser.");
    }
}
window.shareProperty = shareProperty;

//-----------------------------------------------------------

let currentImageIndex = 0;
function openViewer(src){

    currentImageIndex = allImages.indexOf(src);

    document.getElementById("viewerImage").src = src;

    document
        .getElementById("imageViewer")
        .classList.add("active");
}
window.openViewer = openViewer;
window.closeViewer = closeViewer;
window.nextImage = nextImage;
window.prevImage = prevImage;
function closeViewer(){

    document
        .getElementById("imageViewer")
        .classList.remove("active");
}

function nextImage(){

    currentImageIndex++;

    if(currentImageIndex >= allImages.length){
        currentImageIndex = 0;
    }

    document.getElementById("viewerImage").src =
        allImages[currentImageIndex];
}

function prevImage(){

    currentImageIndex--;

    if(currentImageIndex < 0){
        currentImageIndex = allImages.length - 1;
    }

    document.getElementById("viewerImage").src =
        allImages[currentImageIndex];
}

document.addEventListener("keydown", (e) => {

    const viewer =
        document.getElementById("imageViewer");

    if(!viewer.classList.contains("active"))
        return;

    if(e.key === "ArrowRight"){
        nextImage();
    }

    if(e.key === "ArrowLeft"){
        prevImage();
    }

    if(e.key === "Escape"){
        closeViewer();
    }

});
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