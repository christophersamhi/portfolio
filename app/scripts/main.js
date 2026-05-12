import $ from "jquery/dist/jquery.min.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { initContactForm } from "./contact-form.js";
import { initBlockClients } from "./block--clients.js";
import { initBlockCarousel } from "./block--carousel.js";

gsap.registerPlugin(ScrollTrigger);

// Load component
function loadComponent(url, placeholderSelector, callback) {
    return new Promise((resolve, reject) => {
        $.get(url)
            .done((data) => {
                const $content = $(data);

                $(placeholderSelector).replaceWith($content);

                if (typeof callback === "function") {
                    callback($content);
                }

                resolve($content);
            })
            .fail((err) => {
                console.error(`Error loading component: ${url}`, err);
                reject(err);
            });
    });
}

// Animations
function initAnimations() {
    // Animations intro
    const tlIntro = gsap.timeline({
        delay: 0.3,
    });

    tlIntro.fromTo(
        ".block--main__top p",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
    );

    tlIntro.fromTo(
        ".block--main__top__text > span",
        { opacity: 0, y: 20 },
        {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.06,
            ease: "power2.out",
        },
        "-=0.25",
    );

    tlIntro.fromTo(
        ".block--main__bottom",
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
        "-=0.2",
    );

    tlIntro.fromTo(
        ".block--main__top__img",
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" },
        "-=0.35",
    );

    // Animations blocks
    const $blocks = $(".block:not(.block--main)");

    $blocks.each(function () {
        const $block = $(this);

        gsap.fromTo(
            $block,
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: $block[0],
                    start: "top 85%",
                    toggleActions: "play none none none",
                },
            },
        );
    });

    ScrollTrigger.refresh();
}

// Load components
Promise.all([
    loadComponent("./components/header.html", ".header-placeholder"),
    loadComponent("./components/footer.html", ".footer-placeholder"),
    loadComponent(
        "./components/contact-form.html",
        ".contact-form-placeholder",
    ),
    loadComponent("./components/block--main.html", ".block--main-placeholder"),
    loadComponent(
        "./components/block--carousel.html",
        ".block--carousel-placeholder",
    ),
    loadComponent(
        "./components/block--clients.html",
        ".block--clients-placeholder",
    ),
    loadComponent(
        "./components/block--histoire.html",
        ".block--histoire-placeholder",
    ),
    loadComponent(
        "./components/block--equipe.html",
        ".block--equipe-placeholder",
    ),
    loadComponent(
        "./components/block--services.html",
        ".block--services-placeholder",
    ),
])
    .then(() => {
        initContactForm();
        initBlockClients();
        initBlockCarousel();

        $("body").css("opacity", 1);

        initAnimations();

        return true;
    })
    .catch(() => {});
