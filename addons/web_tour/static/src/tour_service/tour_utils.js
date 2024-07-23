/** @odoo-module **/
import * as hoot from "@odoo/hoot-dom";
import { markup } from "@odoo/owl";
import { _t } from "@web/core/l10n/translation";
import { session } from "@web/session";
import { utils } from "@web/core/ui/ui_service";

/**
 * Calls the given `func` then returns/resolves to `true`
 * if it will result to unloading of the page.
 * @param {(...args: any[]) => void} func
 * @param  {any[]} args
 * @returns {boolean | Promise<boolean>}
 */
export function callWithUnloadCheck(func, ...args) {
    let willUnload = false;
    const beforeunload = () => (willUnload = true);
    window.addEventListener("beforeunload", beforeunload);
    const result = func(...args);
    if (result instanceof Promise) {
        return result.then(() => {
            window.removeEventListener("beforeunload", beforeunload);
            return willUnload;
        });
    } else {
        window.removeEventListener("beforeunload", beforeunload);
        return willUnload;
    }
}

/**
 * @param {HTMLElement} element
 * @returns {HTMLElement | null}
 */
export function getScrollParent(element) {
    if (!element) {
        return null;
    }
    if (element.scrollHeight > element.clientHeight) {
        return element;
    } else {
        return getScrollParent(element.parentNode);
    }
}

export const stepUtils = {
    _getHelpMessage(functionName, ...args) {
        return `Generated by function tour utils ${functionName}(${args.join(", ")})`;
    },

    addDebugHelp(helpMessage, step) {
        if (typeof step.debugHelp === "string") {
            step.debugHelp = step.debugHelp + "\n" + helpMessage;
        } else {
            step.debugHelp = helpMessage;
        }
        return step;
    },

    editionEnterpriseModifier(step) {
        step.edition = "enterprise";
        return step;
    },

    mobileModifier(step) {
        step.isActive = ["mobile"];
        return step;
    },

    showAppsMenuItem() {
        return {
            isActive: ["auto", "community"],
            trigger: ".o_navbar_apps_menu button:enabled",
            position: "bottom",
            run: "click",
        };
    },

    toggleHomeMenu() {
        return {
            isActive: ["enterprise"],
            trigger: ".o_main_navbar .o_menu_toggle",
            content: markup(_t("Click on the <i>Home icon</i> to navigate across apps.")),
            position: "bottom",
            run: "click",
        };
    },

    autoExpandMoreButtons() {
        return {
            isActive: ["auto"],
            content: `autoExpandMoreButtons`,
            trigger: ".o-form-buttonbox",
            run() {
                const more = hoot.queryFirst(".o-form-buttonbox .o_button_more");
                if (more) {
                    hoot.click(more);
                }
            },
        };
    },

    goBackBreadcrumbsMobile(description) {
        return [
            {
                isActive: ["mobile"],
                trigger: ".o_back_button",
                content: description,
                position: "bottom",
                run: "click",
            },
        ];
    },

    goToAppSteps(dataMenuXmlid, description) {
        return [
            this.showAppsMenuItem(),
            {
                isActive: ["community"],
                trigger: `.o_app[data-menu-xmlid="${dataMenuXmlid}"]`,
                content: description,
                position: "right",
                run: "click",
            },
            {
                isActive: ["enterprise"],
                trigger: `.o_app[data-menu-xmlid="${dataMenuXmlid}"]`,
                content: description,
                position: "bottom",
                run: "click",
            },
        ].map((step) =>
            this.addDebugHelp(this._getHelpMessage("goToApp", dataMenuXmlid, description), step)
        );
    },

    statusbarButtonsSteps(innerTextButton, description, trigger) {
        const steps = [];
        if (trigger) {
            steps.push({
                isActive: ["auto", "mobile"],
                trigger,
            });
        }
        steps.push(
            {
                isActive: ["auto", "mobile"],
                trigger: ".o_statusbar_buttons",
                run: (actions) => {
                    const node = hoot.queryFirst(
                        ".o_statusbar_buttons .btn.dropdown-toggle:contains(Action)"
                    );
                    if (node) {
                        hoot.click(node);
                    }
                },
            },
            {
                trigger: `.o_statusbar_buttons button:enabled:contains('${innerTextButton}'), .dropdown-item button:enabled:contains('${innerTextButton}')`,
                content: description,
                position: "bottom",
                run: "click",
            }
        );
        return steps.map((step) =>
            this.addDebugHelp(
                this._getHelpMessage("statusbarButtonsSteps", innerTextButton, description),
                step
            )
        );
    },

    mobileKanbanSearchMany2X(modalTitle, valueSearched) {
        return [
            {
                isActive: ["mobile"],
                trigger: `.o_control_panel_navigation .btn .fa-search`,
                position: "bottom",
                run: "click",
            },
            {
                isActive: ["mobile"],
                trigger: ".o_searchview_input",
                position: "bottom",
                run: `edit ${valueSearched}`,
            },
            {
                isActive: ["mobile"],
                trigger: ".dropdown-menu.o_searchview_autocomplete",
            },
            {
                isActive: ["mobile"],
                trigger: ".o_searchview_input",
                position: "bottom",
                run: "press Enter",
            },
            {
                isActive: ["mobile"],
                trigger: `.o_kanban_record:contains('${valueSearched}')`,
                position: "bottom",
                run: "click",
            },
        ].map((step) =>
            this.addDebugHelp(
                this._getHelpMessage("mobileKanbanSearchMany2X", modalTitle, valueSearched),
                step
            )
        );
    },
    /**
     * Utility steps to save a form and wait for the save to complete
     */
    saveForm() {
        return [
            {
                isActive: ["auto"],
                content: "save form",
                trigger: ".o_form_button_save:enabled",
                run: "click",
            },
            {
                isActive: ["auto"],
                content: "wait for save completion",
                trigger: ".o_form_readonly, .o_form_saved",
            },
        ];
    },
    /**
     * Utility steps to cancel a form creation or edition.
     *
     * Supports creation/edition from either a form or a list view (so checks
     * for both states).
     */
    discardForm() {
        return [
            {
                isActive: ["auto"],
                content: "discard the form",
                trigger: ".o_form_button_cancel",
                run: "click",
            },
            {
                isActive: ["auto"],
                content: "wait for cancellation to complete",
                trigger:
                    ".o_view_controller.o_list_view, .o_form_view > div > div > .o_form_readonly, .o_form_view > div > div > .o_form_saved",
            },
        ];
    },

    waitIframeIsReady() {
        return {
            content: "Wait until the iframe is ready",
            trigger: `iframe[is-ready=true]:iframe html`,
        };
    },
};

/**
 * Check if a step is active dependant on step.isActive property
 * Note that when step.isActive is not defined, the step is active by default.
 * When a step is not active, it's just skipped and the tour continues to the next step.
 * @param {import("./tour_service").TourStep} step
 * @param {import("./tour_service").TourMode} mode TourMode manual means onboarding tour
 */
export function isActive(step, mode) {
    const isSmall = utils.isSmall();
    const standardKeyWords = ["enterprise", "community", "mobile", "desktop", "auto", "manual"];
    const isActiveArray = Array.isArray(step.isActive) ? step.isActive : [];
    if (isActiveArray.length === 0) {
        return true;
    }
    const selectors = isActiveArray.filter((key) => !standardKeyWords.includes(key));
    if (selectors.length) {
        // if one of selectors is not found, step is skipped
        for (const selector of selectors) {
            const el = hoot.queryFirst(selector);
            if (!el) {
                return false;
            }
        }
    }
    const checkMode =
        isActiveArray.includes(mode) ||
        (!isActiveArray.includes("manual") && !isActiveArray.includes("auto"));
    const edition = (session.server_version_info || "").at(-1) === "e" ? "enterprise" : "community";
    const checkEdition =
        isActiveArray.includes(edition) ||
        (!isActiveArray.includes("enterprise") && !isActiveArray.includes("community"));
    const onlyForMobile = isActiveArray.includes("mobile") && isSmall;
    const onlyForDesktop = isActiveArray.includes("desktop") && !isSmall;
    const checkDevice =
        onlyForMobile ||
        onlyForDesktop ||
        (!isActiveArray.includes("mobile") && !isActiveArray.includes("desktop"));
    return checkEdition && checkDevice && checkMode;
}
