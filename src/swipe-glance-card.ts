/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { LitElement, html, customElement, property, CSSResult, TemplateResult, css, PropertyValues } from "lit-element";
import { ifDefined } from "lit-html/directives/if-defined";

import {
  HomeAssistant,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  relativeTime,
  computeStateDisplay,
  applyThemesOnElement,
  LovelaceCard,
  computeRTLDirection,
} from "custom-card-helpers";

import Swiper from "swiper";

import { SwipeGlanceCardConfig, SwipeGlanceElementConfig } from "./types";
import { actionHandler } from "./action-handler-directive";
import { CARD_VERSION } from "./const";

import { localize } from "./localize/localize";

/* eslint no-console: 0 */
console.info(
  `%c  SWIPE-GLANCE-CARD \n%c  ${localize("common.version")} ${CARD_VERSION}    `,
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray",
);

@customElement("swipe-glance-card")
export class SwipeGlanceCard extends LitElement implements LovelaceCard {
  @property() public hass?: HomeAssistant;
  @property() private _config?: SwipeGlanceCardConfig;
  @property() private _configEntities?: SwipeGlanceElementConfig[];
  @property() private _swiper?: Swiper;
  @property() private _loaded?: boolean;
  @property() private enableSwiper?: boolean;

  public getCardSize(): number {
    // TODO: support custom number of rows
    return this._config!.title ? 2 : 1;
  }

  public setConfig(config: SwipeGlanceCardConfig): void {
    if (!config || !Array.isArray(config.entities)) {
      throw new Error(localize("common.invalid_configuration"));
    }

    this._config = { theme: "default", ...config };

    const entities = config.entities.map((entityConf, index) => {
      if (typeof entityConf === "string") {
        entityConf = { entity: entityConf };
      } else if (typeof entityConf === "object" && !Array.isArray(entityConf)) {
        if (!entityConf.entity) {
          throw new Error(`Entity object at position ${index} is missing entity field.`);
        }
      } else {
        throw new Error(`Invalid entity specified at position ${index}.`);
      }

      return entityConf;
    });

    for (const entity of entities) {
      if (
        (entity.tap_action && entity.tap_action.action === "call-service" && !entity.tap_action.service) ||
        (entity.hold_action && entity.hold_action.action === "call-service" && !entity.hold_action.service)
      ) {
        throw new Error("Missing required property 'service' when tap_action or hold_action is call-service");
      }
    }

    this._configEntities = entities;

    const numEntities = config.entities.length;
    const columns = config.columns || Math.min(numEntities, 5);
    this.style.setProperty("--glance-column-width", `${100 / columns}%`);

    if (numEntities > columns) {
      this.enableSwiper = true;
    }

    if (this.hass) {
      this.requestUpdate();
    }
  }

  public connectedCallback(): void {
    super.connectedCallback();
    if (this._config && this.hass && !this._loaded && this.enableSwiper) {
      this._initialLoad();
    } else if (this._swiper) {
      this._swiper.update();
    }
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (this._config && this.hass && this.isConnected && !this._loaded && this.enableSwiper) {
      this._initialLoad();
    } else if (this._swiper) {
      this._swiper.update();
    }
    const oldHass = changedProperties.get("hass") as HomeAssistant | undefined;
    const oldConfig = changedProperties.get("_config") as SwipeGlanceCardConfig | undefined;

    if (!oldHass || !oldConfig || oldHass.themes !== this.hass!.themes || oldConfig.theme !== this._config!.theme) {
      applyThemesOnElement(this, this.hass!.themes, this._config!.theme);
    }
  }

  protected shouldUpdate(changedProperties: PropertyValues): boolean {
    const oldHass = changedProperties.get("hass") as HomeAssistant | undefined;

    if (
      !this._configEntities ||
      !oldHass ||
      oldHass.themes !== this.hass!.themes ||
      oldHass.language !== this.hass!.language
    ) {
      return true;
    }

    for (const entity of this._configEntities) {
      if (oldHass.states[entity.entity] !== this.hass!.states[entity.entity]) {
        return true;
      }
    }

    return false;
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }

    const { title } = this._config;

    return html`
      <ha-card .header="${title}" class="swiper-container" dir="${ifDefined(computeRTLDirection(this.hass))}">
        <div class="swiper-wrapper">
          ${this._configEntities!.map(entityConf => this.renderEntity(entityConf))}
          ${this._config.parameters === undefined || "pagination" in this._config.parameters
        ? html`
              <div class="swiper-pagination"></div>
                  `
        : ""
      }
          ${this._config.parameters === undefined || "navigation" in this._config.parameters
        ? html`
               <div class="swiper-button-next"></div>
               <div class="swiper-button-prev"></div>
              `
        : ""
      }
          ${this._config.parameters === undefined || "scrollbar" in this._config.parameters
        ? html`
               <div class="swiper-scrollbar"></div>
              `
        : ""
      }
        </div>
      </ha-card>
    `;
  }

  private async _initialLoad(): Promise<Swiper> {
    this._loaded = true;

    await this.updateComplete;

    if (
      this._config!.parameters &&
      "pagination" in this._config!.parameters! &&
      this._config!.parameters!.pagination!.el
    ) {
      this._config!.parameters!.pagination!.el = this.shadowRoot!.querySelector(".swiper-pagination")!;
    }

    if (this._config!.parameters && "navigation" in this._config!.parameters!) {
      if (this._config!.parameters!.navigation!.nextEl) {
        this._config!.parameters!.navigation!.nextEl = this.shadowRoot!.querySelector(".swiper-button-next")!;
      }

      if (this._config!.parameters!.navigation!.prevEl) {
        this._config!.parameters!.navigation!.prevEl = this.shadowRoot!.querySelector(".swiper-button-prev")!;
      }
    }

    if (
      this._config!.parameters &&
      "scrollbar" in this._config!.parameters! &&
      this._config!.parameters!.scrollbar!.el
    ) {
      this._config!.parameters!.scrollbar!.el = this.shadowRoot!.querySelector(".swiper-scrollbar")!;
    }

    this._swiper = new Swiper(this.shadowRoot!.querySelector(".swiper-container"), this._config!.parameters);
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = (ev.currentTarget as any).config as SwipeGlanceElementConfig;
    handleAction(this, this.hass!, config, ev.detail.action!);
  }

  private renderEntity(entityConf: SwipeGlanceElementConfig): TemplateResult {
    const stateObj = this.hass!.states[entityConf.entity];

    if (!stateObj) {
      return html`
        <hui-warning-element label = ${ this.hass!.localize("ui.panel.lovelace.warning.entity_not_found", "entity", entityConf.entity)}>
        </hui-warning-element>
      `;
    }

    const name =
      entityConf.name != undefined
        ? entityConf.name
        : stateObj
          ? stateObj.attributes.friendlyName || stateObj.entity_id
          : "";

    return html`
      <div class="swiper-slide"
        .config = "${entityConf}"
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
      hasHold: hasAction(entityConf.hold_action),
      hasDoubleTap: hasAction(entityConf.double_tap_action),
    })}
        tabindex=${ifDefined(hasAction(entityConf.tap_action) ? 0 : undefined)}
      >
      ${
      this._config!.show_name !== false
        ? html`
              <div class="name">${name}</div>
            `
        : ""
      }
    ${
      this._config!.show_icon !== false
        ? html`
              <state-badge
                .hass=${this.hass}
                .stateObj=${stateObj}
                .overrideIcon=${entityConf.icon}
                .overrideImage=${entityConf.image}
                stateColor
              ></state-badge>
            `
        : ''
      }
    ${
      this._config!.show_state !== false && entityConf.show_state !== false
        ? html`
              <div>
                ${entityConf.show_last_changed
            ? relativeTime(new Date(stateObj.last_changed), this.hass!.localize)
            : computeStateDisplay(this.hass!.localize, stateObj, this.hass!.language)}
              </div>
            `
        : ''
      }
    ${
      this._swiper
        ? html`
            </div>
          `
        : ""
      }
    </div>
      `;
  }

  static get styles(): CSSResult {
    return css`
      .swiper-wrapper {
        display: flex;
        padding: 0 16px 4px;
        flex-wrap: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
      }
      .swiper-wrapper.no-header {
        padding-top: 16px;
      }
      .swider-slide {
        box-sizing: border-box;
        padding: 0 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        margin-bottom: 12px;
        width: var(--glance-column-width, 20%);
      }
      .swider-slide:focus {
        outline: none;
        background: var(--divider-color);
        border-radius: 14px;
        padding: 4px;
        margin: -4px 0;
      }
      .swider-slide div {
        width: 100%;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .name {
        min-height: var(--paper-font-body1_-_line-height, 20px);
      }
      state-badge {
        margin: 8px 0;
      }
      .swiper-pagination-bullet-active {
        background: var(--primary-color);
      }
      .swiper-pagination-progressbar.swiper-pagination-progressbar-fill {
        background: var(--primary-color);
      }
      .swiper-scrollbar-drag {
        background: var(--primary-color);
      }
      .swiper-button-prev {
        background-image: url("data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 27 44'><path d='M0,22L22,0l2.1,2.1L4.2,22l19.9,19.9L22,44L0,22L0,22L0,22z' fill='var(--primary-color)'/></svg>");
      }
      .swiper-button-next {
        background-image: url("data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 27 44'><path d='M27,22L27,22L5,44l-2.1-2.1L22.8,22L2.9,2.1L5,0L27,22L27,22z' fill='var(--primary-color)'/></svg>");
      }
    `;
  }
}
