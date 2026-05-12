import $ from "jquery/dist/jquery.min.js";
import Swiper from "swiper";
import "swiper/swiper-bundle.css";

export function initBlockClients() {
    // Swiper
    $(".block--clients").each(function () {
        const $block = $(this);
        const $main = $block.find(".swiper--main");
        const $thumbs = $block.find(".swiper--thumbs");
        const $mainWrapper = $main.find(".swiper-wrapper");

        const rootFontSize = parseFloat($("html").css("font-size"));
        const rawValue = $(":root").css("--space-between-sm").trim();
        const remValue = parseFloat(rawValue);
        const spaceBetween = remValue * rootFontSize;

        // Slides main injectés depuis thumbs
        $thumbs.find(".swiper-slide").each(function () {
            const client = $(this).data("client");

            $mainWrapper.append(`
                <div class="swiper-slide">
                    <button>${client}</button>
                </div>
            `);
        });

        // arrows
        $block.find(".block--clients__swiper-container").prepend(`
            <div class="arrows-container">
                <button class="swiper-arrow swiper-arrow--prev"></button>
                <button class="swiper-arrow swiper-arrow--next"></button>
            </div>
        `);

        const totalSlides = $mainWrapper.find(".swiper-slide").length;
        const middleIndex = Math.floor(totalSlides / 2);

        // MAIN SWIPER
        const mainSwiper = new Swiper($main[0], {
            slidesPerView: "auto",
            spaceBetween,
            initialSlide: middleIndex,
            rewind: true,
            breakpoints: {
                0: { direction: "horizontal" },
                600: { direction: "vertical" },
            },
        });

        // THUMBS SWIPER
        const thumbsSwiper = new Swiper($thumbs[0], {
            slidesPerView: 1,
            initialSlide: middleIndex,
            rewind: true,
            breakpoints: {
                0: { direction: "horizontal" },
                600: { direction: "vertical" },
            },
        });

        // Navigation
        $block.on("click", ".swiper-arrow--next", () =>
            thumbsSwiper.slideNext(),
        );
        $block.on("click", ".swiper-arrow--prev", () =>
            thumbsSwiper.slidePrev(),
        );

        mainSwiper.on("slideChange", () => {
            thumbsSwiper.slideTo(mainSwiper.realIndex);
        });

        $main.on("click", "button", function (e) {
            e.preventDefault();
            const index = $(this).closest(".swiper-slide").index();
            thumbsSwiper.slideTo(index);
        });

        function updateActive() {
            const activeIndex = thumbsSwiper.realIndex;
            const $slides = $main.find(".swiper-slide");

            $slides.removeClass("swiper-slide-thumb-active");
            $slides.eq(activeIndex).addClass("swiper-slide-thumb-active");
        }

        thumbsSwiper.on("slideChange", updateActive);

        mainSwiper.update();
        thumbsSwiper.update();
        mainSwiper.slideTo(middleIndex, 0);
        thumbsSwiper.slideTo(middleIndex, 0);
    });
}
