// Mobile Navigation
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");
const navOverlay = document.getElementById("navOverlay");

function toggleMobileNav() {
    hamburger.classList.toggle("active");
    mobileNav.classList.toggle("active");
    navOverlay.classList.toggle("active");
    document.body.style.overflow = mobileNav.classList.contains("active")
        ? "hidden"
        : "";
}

hamburger.addEventListener("click", toggleMobileNav);
navOverlay.addEventListener("click", toggleMobileNav);

// Close mobile nav when clicking on a link
const mobileNavLinks = document.querySelectorAll(".mobile-nav a");
mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
        toggleMobileNav();
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    });
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
}, observerOptions);

document.querySelectorAll(".fade-in").forEach((el) => {
    observer.observe(el);
});

// Navigation background on scroll
let lastScrollY = window.scrollY;
const nav = document.querySelector("nav");

window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 100) {
        nav.style.background = "rgba(26, 15, 26, 0.95)";
        nav.style.backdropFilter = "blur(20px)";
        nav.style.borderBottom = "1px solid rgba(255, 107, 53, 0.2)";
    } else {
        nav.style.background = "rgba(26, 15, 26, 0.9)";
        nav.style.borderBottom = "1px solid rgba(255, 107, 53, 0.1)";
    }

    lastScrollY = currentScrollY;
});

// Parallax effect for floating shapes
window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;
    const shapes = document.querySelectorAll(".shape");

    shapes.forEach((shape, index) => {
        const rate = scrolled * (0.1 + index * 0.05);
        shape.style.transform = `translateY(${rate}px) rotate(${rate}deg)`;
    });
});

// Interactive hover effects for project cards
document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-15px) rotateX(5deg)";
    });

    card.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0) rotateX(0)";
    });
});

// Typing animation for hero text (alternative approach)
const heroTitle = document.querySelector(".hero h1");
const originalText = heroTitle.textContent;

function typeWriter() {
    heroTitle.textContent = "";
    let i = 0;

    function type() {
        if (i < originalText.length) {
            heroTitle.textContent += originalText.charAt(i);
            i++;
            setTimeout(type, 100);
        }
    }

    setTimeout(type, 1000);
}

// Uncomment to enable typing animation
//typeWriter();
