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

const container =
    document.getElementById("cards-container");

loadProperties();

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

    renderProperties(data || []);
}

function renderProperties(properties) {

    container.innerHTML = "";

    properties.forEach(property => {

        const card = document.createElement("div");

        card.classList.add("property-card");

        card.style.backgroundImage =
            `url('${property.image || ""}')`;

        card.innerHTML = `
            <div class="plocation">
                <img src="https://res.cloudinary.com/dshmhktwh/image/upload/v1782559375/epingle_oa6i6g.webp" class="location2">
                <p class="namelocation">
                    ${property.location || ""}
                </p>
                <p class="price">
                    ${Number(property.price || 0).toLocaleString()}USD
                </p>
            </div>

            <div class="icons">
                <img src="https://res.cloudinary.com/dshmhktwh/image/upload/v1782559686/bed-solid_z323n3.webp" class="icon">
                <span>${property.bedrooms || 0}</span>

                <img src="https://res.cloudinary.com/dshmhktwh/image/upload/v1782559932/bath-solid_sicpda.webp" class="icon">
                <span>${property.bathrooms || 0}</span>

                <img src="https://res.cloudinary.com/dshmhktwh/image/upload/v1782558602/surface_1_f7zroz.webp" class="icon">
                <span>${property.surface || 0}m²</span>
            </div>
        `;

        card.addEventListener("click", () => {
            window.location.href =
                `property.html?id=${property.id}`;
        });

        container.appendChild(card);
    });

    setupSeeMore();
}
const wrapper = document.querySelector(".testimonials-wrapper");

document.getElementById("nextBtn").addEventListener("click", () => {
    wrapper.scrollBy({
        left: 420,
        behavior: "smooth"
    });
});

document.getElementById("prevBtn").addEventListener("click", () => {
    wrapper.scrollBy({
        left: -420,
        behavior: "smooth"
    });
});
const progressFill = document.querySelector(".progress-fill");

function updateProgress() {

    const maxScroll =
        wrapper.scrollWidth - wrapper.clientWidth;

    const progress =
        (wrapper.scrollLeft / maxScroll) * 100;

    progressFill.style.width = `${progress}%`;
}

wrapper.addEventListener("scroll", updateProgress);

updateProgress();

const seeMoreBtn = document.getElementById("seeMoreBtn");

let expanded = false;

seeMoreBtn.addEventListener("click", () => {
  const cards = document.querySelectorAll(".cards-container .property-card");

  if (!expanded) {
    // SHOW ALL
    cards.forEach(card => {
      card.style.display = "flex";
    });

    seeMoreBtn.textContent = "Show Less Properties";
    expanded = true;

  } else {
    // HIDE AGAIN (after 6)
    cards.forEach((card, index) => {
      if (index >= 6) {
        card.style.display = "none";
      }
    });

    seeMoreBtn.textContent = "See More Properties";
    expanded = false;
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