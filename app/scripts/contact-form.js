import $ from "jquery/dist/jquery.min.js";

export function initContactForm() {
    const $openBtn = $(".contact-form__open");
    const $closeBtn = $(".contact-form__close");
    const $container = $(".contact-form__hidden");
    const $openFormTrigger = $(".open-contact-form");

    let $focusable = $();
    let $first = $();
    let $last = $();

    function getFocusable() {
        return $container
            .find("a, button, input, textarea, select, [tabindex]")
            .filter(":visible")
            .filter(function () {
                return !$(this).is("[disabled]");
            });
    }

    function refreshFocusable() {
        $focusable = getFocusable();
        $first = $focusable.first();
        $last = $focusable.last();
    }

    function disableFocusables() {
        $container
            .find("a, button, input, textarea, select, [tabindex]")
            .each(function () {
                const $el = $(this);

                if ($el.data("orig-tabindex") === undefined) {
                    $el.data("orig-tabindex", $el.attr("tabindex"));
                }

                $el.attr("tabindex", "-1");
            });
    }

    function enableFocusables() {
        $container
            .find("a, button, input, textarea, select, [tabindex]")
            .each(function () {
                const $el = $(this);
                const original = $el.data("orig-tabindex");

                if (original === undefined || original === null) {
                    $el.removeAttr("tabindex");
                } else {
                    $el.attr("tabindex", original);
                }
            });

        refreshFocusable();
    }

    function trapFocus(e) {
        if (e.key === "Escape") {
            closeForm();
            return;
        }

        if (e.key !== "Tab" || !$focusable.length) return;

        if (e.shiftKey) {
            if (document.activeElement === $first[0]) {
                e.preventDefault();
                $last.focus();
            }
        } else {
            if (document.activeElement === $last[0]) {
                e.preventDefault();
                $first.focus();
            }
        }
    }

    function openForm() {
        $container.attr("aria-hidden", "false");
        $openBtn.attr("aria-expanded", "true").attr("tabindex", "-1");

        enableFocusables();
        refreshFocusable();

        if ($first.length) {
            $first.focus();
        }

        $(document).on("keydown.trap", trapFocus);
    }

    function closeForm() {
        $container.attr("aria-hidden", "true");
        $openBtn.attr("aria-expanded", "false").removeAttr("tabindex");

        $(document).off("keydown.trap");
        disableFocusables();

        $openBtn.focus();
    }

    /* EVENTS */
    $openBtn.on("click", openForm);
    $closeBtn.on("click", closeForm);

    $openFormTrigger.on("click", openForm);

    /* INIT */
    disableFocusables();
}
