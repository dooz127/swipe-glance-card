/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { LitElement, html, customElement, property, CSSResult, TemplateResult, css, PropertyValues } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import { ifDefined } from 'lit-html/directives/if-defined';

import {
  ActionHandlerEvent,
  HomeAssistant,
  LovelaceCard,
  applyThemesOnElement,
  computeObjectId,
  computeRTLDirection,
  computeStateDisplay,
  handleAction,
  hasAction,
  relativeTime,
} from 'custom-card-helpers';

import Swiper from 'swiper';

import { SwipeGlanceCardConfig, SwipeGlanceElementConfig, SwiperParametersConfig, LovelaceElement } from './types';
import { actionHandler } from './action-handler-directive';
import { DEFAULT_NO_COLS, DEFAULT_NO_ROWS, CARD_VERSION } from './const';

import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  SWIPE-GLANCE-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

@customElement('swipe-glance-card')
export class SwipeGlanceCard extends LitElement implements LovelaceCard {
  @property() private _hass?: HomeAssistant;
  @property() private _config?: SwipeGlanceCardConfig;
  @property() private _configEntities?: SwipeGlanceElementConfig[];
  @property() private _swiper?: Swiper;
  @property() private _swiper_parameters?: SwiperParametersConfig;
  @property() private _loaded?: boolean;

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this.shadowRoot!.querySelectorAll('#swiper-wrapper > div > *').forEach((element: unknown) => {
      (element as LovelaceElement).hass = hass;
    });
  }

  public getCardSize(): number {
    // TODO: support custom number of rows
    return this._config && this._config.title ? 2 : 1;
  }

  public setConfig(config: SwipeGlanceCardConfig): void {
    if (!config || !Array.isArray(config.entities)) {
      throw new Error(localize('common.invalid_configuration'));
    }

    this._config = { theme: 'default', ...config };

    const entities = config.entities.map((entityConf, index) => {
      if (typeof entityConf === 'string') {
        entityConf = { entity: entityConf };
      } else if (typeof entityConf === 'object' && !Array.isArray(entityConf)) {
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
        (entity.tap_action && entity.tap_action.action === 'call-service' && !entity.tap_action.service) ||
        (entity.hold_action && entity.hold_action.action === 'call-service' && !entity.hold_action.service)
      ) {
        throw new Error("Missing required property 'service' when tap_action or hold_action is call-service");
      }
    }
    this._configEntities = entities;

    this._swiper_parameters = {
      freeModeSticky: true,
      setWrapperSize: true,
      slidesPerView: config.columns || Math.min(entities.length, DEFAULT_NO_COLS),
      spaceBetween: 10,
      watchOverflow: true,
      ...config.swiper_parameters,
    };

    if (this._hass) {
      this.requestUpdate();
    }
  }

  public connectedCallback(): void {
    super.connectedCallback();
    if (this._config && this._hass && !this._loaded) {
      this._initialLoad();
    } else if (this._swiper) {
      this._swiper.update();
    }
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    const oldHass = changedProperties.get('hass') as HomeAssistant | undefined;
    const oldConfig = changedProperties.get('_config') as SwipeGlanceCardConfig | undefined;

    if (!oldHass || !oldConfig || oldHass.themes !== this._hass!.themes || oldConfig.theme !== this._config!.theme) {
      applyThemesOnElement(this, this._hass!.themes, this._config!.theme);
    }

    if (this._config && this._hass && this.isConnected && !this._loaded) {
      this._initialLoad();
    } else if (this._swiper) {
      this._swiper.update();
    }
  }

  protected shouldUpdate(changedProperties: PropertyValues): boolean {
    const oldHass = changedProperties.get('hass') as HomeAssistant | undefined;

    if (
      !this._configEntities ||
      !oldHass ||
      oldHass.themes !== this._hass!.themes ||
      oldHass.language !== this._hass!.language
    ) {
      return true;
    }

    for (const entity of this._configEntities) {
      if (oldHass.states[entity.entity] !== this._hass!.states[entity.entity]) {
        return true;
      }
    }

    return false;
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this._hass) {
      return html``;
    }

    const { title } = this._config;

    return html`
      <ha-card .header="${title}" class="swiper-container" dir="${ifDefined(computeRTLDirection(this._hass))}">
        <div class="swiper-wrapper ${classMap({ 'no-header': !title })}">
          ${this._configEntities!.map(entityConf => this.renderEntity(entityConf))}
        </div>
        ${this._config._swiper_parameters === undefined || 'pagination' in this._config._swiper_parameters
          ? html`
              <div class="swiper-pagination"></div>
            `
          : ''}
        ${this._config._swiper_parameters === undefined || 'navigation' in this._config._swiper_parameters
          ? html`
              <div class="swiper-button-next"></div>
              <div class="swiper-button-prev"></div>
            `
          : ''}
        ${this._config._swiper_parameters === undefined || 'scrollbar' in this._config._swiper_parameters
          ? html`
              <div class="swiper-scrollbar"></div>
            `
          : ''}
      </ha-card>
    `;
  }

  private async _initialLoad(): Promise<Swiper> {
    this._loaded = true;

    await this.updateComplete;

    if ('pagination' in this._swiper_parameters! && this._swiper_parameters!.pagination!.el) {
      this._swiper_parameters!.pagination!.el = this.shadowRoot!.querySelector('.swiper-pagination')!;
    }

    if (this._swiper_parameters && 'navigation' in this._swiper_parameters!) {
      if (this._swiper_parameters!.navigation!.nextEl) {
        this._swiper_parameters!.navigation!.nextEl = this.shadowRoot!.querySelector('.swiper-button-next')!;
      }

      if (this._swiper_parameters!.navigation!.prevEl) {
        this._swiper_parameters!.navigation!.prevEl = this.shadowRoot!.querySelector('.swiper-button-prev')!;
      }
    }

    if ('scrollbar' in this._swiper_parameters! && this._swiper_parameters!.scrollbar!.el) {
      this._swiper_parameters!.scrollbar!.el = this.shadowRoot!.querySelector('.swiper-scrollbar')!;
    }

    this._swiper = new Swiper(this.shadowRoot!.querySelector('.swiper-container'), this._swiper_parameters);
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    const config = (ev.currentTarget as any).config as SwipeGlanceElementConfig;
    handleAction(this, this._hass!, config, ev.detail.action!);
  }

  private renderEntity(entityConf: SwipeGlanceElementConfig): TemplateResult {
    const stateObj = this._hass!.states[entityConf.entity];

    if (!stateObj) {
      return html`
        <hui-warning-element
          label=${this._hass!.localize('ui.panel.lovelace.warning.entity_not_found', 'entity', entityConf.entity)}
        >
        </hui-warning-element>
      `;
    }

    const name =
      entityConf.name === undefined
        ? stateObj.attributes.friendlyName || computeObjectId(stateObj.entity_id).replace(/_/g, ' ')
        : entityConf.name || '';

    return html`
      <div
        class="swiper-slide"
        .config="${entityConf}"
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(entityConf.hold_action),
          hasDoubleTap: hasAction(entityConf.double_tap_action),
        })}
        tabindex=${ifDefined(hasAction(entityConf.tap_action) ? 0 : undefined)}
      >
        ${this._config!.show_name !== false
          ? html`
              <div class="name">${name}</div>
            `
          : ''}
        ${this._config!.show_icon !== false
          ? html`
              <state-badge
                .hass=${this._hass}
                .stateObj=${stateObj}
                .overrideIcon=${entityConf.icon}
                .overrideImage=${entityConf.image}
                stateColor
              ></state-badge>
            `
          : ''}
        ${this._config!.show_state !== false && entityConf.show_state !== false
          ? html`
              <div>
                ${entityConf.show_last_changed
                  ? relativeTime(new Date(stateObj.last_changed), this._hass!.localize)
                  : computeStateDisplay(this._hass!.localize, stateObj, this._hass!.language)}
              </div>
            `
          : ''}
        ${this._swiper
          ? html`
            </div>
          `
          : ''}
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      .swiper-wrapper {
        display: inline-flex;
        flex-wrap: nowrap;
        --layout-scroll_-_-webkit-overflow-scrolling: touch;
      }
      .swiper-wrapper.no-header {
        padding-top: 16px;
      }
      .swiper-slide {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        margin-bottom: 12px;
      }
      .swiper-slide:focus {
        outline: none;
        background: var(--divider-color);
        border-radius: 14px;
        padding: 4px;
        margin: -4px 0;
      }
      .swiper-slide div {
        width: 100%;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .name {
        min-height: var(--paper-font-body1_-_line-height, 20px);
        text-transform: capitalize;
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
