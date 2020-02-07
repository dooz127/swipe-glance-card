/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CSSResult, LitElement, PropertyValues, TemplateResult, css, customElement, html, property } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import { ifDefined } from 'lit-html/directives/if-defined';

import {
  ActionHandlerEvent,
  HomeAssistant,
  LovelaceCard,
  applyThemesOnElement,
  //computeObjectId,
  //computeRTLDirection,
  computeStateDisplay,
  handleAction,
  hasAction,
  relativeTime,
} from 'custom-card-helpers';
import { computeStateName } from './compute-state-name';

import Swiper from 'swiper';
import './swiperStyle.css';

import { SwipeGlanceCardConfig, SwipeGlanceElementConfig, SwiperParametersConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  SWIPE-GLANCE-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

@customElement('swipe-glance-card')
export class SwipeGlanceCard extends LitElement implements LovelaceCard {
  @property() public hass?: HomeAssistant;
  @property() private _config?: SwipeGlanceCardConfig;
  @property() private _configEntities?: SwipeGlanceElementConfig[];
  @property() private _swiper?: Swiper;
  @property() private _swiper_parameters?: SwiperParametersConfig;
  @property() private _loaded?: boolean;
  @property() private _updated?: boolean;

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

    const columns = config.columns || entities.length == 0 ? 5 : Math.min(entities.length, 5);

    this._swiper_parameters = {
      freeModeSticky: true,
      setWrapperSize: true,
      slidesPerView: columns,
      watchOverflow: true,
      ...config.swiper_parameters,
    };

    if (this.hass) {
      this.requestUpdate();
    }
  }

  public connectedCallback(): void {
    super.connectedCallback();

    if (this._config && this.hass && this._updated && !this._loaded) {
      this._initialLoad();
    } else if (this._swiper) {
      this._swiper.update();
    }
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this._updated = true;

    const oldHass = changedProperties.get('hass') as HomeAssistant | undefined;
    const oldConfig = changedProperties.get('_config') as SwipeGlanceCardConfig | undefined;

    if (!oldHass || !oldConfig || oldHass.themes !== this.hass!.themes || oldConfig.theme !== this._config!.theme) {
      applyThemesOnElement(this, this.hass!.themes, this._config!.theme);
    }

    if (this._config && this.hass && this.isConnected && !this._loaded) {
      this._initialLoad();
    } else if (this._swiper) {
      this._swiper.update();
    }
  }

  protected shouldUpdate(changedProperties: PropertyValues): boolean {
    const oldHass = changedProperties.get('hass') as HomeAssistant | undefined;
    const oldSwiper = changedProperties.get('_swiper') as Swiper | undefined;
    const oldSwiperParameters = changedProperties.get('_swiper_parameters') as SwiperParametersConfig | undefined;

    if (
      !this._configEntities ||
      !oldHass ||
      oldHass.themes !== this.hass!.themes ||
      oldHass.language !== this.hass!.language ||
      oldSwiper !== this._swiper ||
      oldSwiperParameters !== this._swiper_parameters
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

    const swiper_parameters = this._swiper_parameters || {};
    const showNavigation = 'navigation' in swiper_parameters;
    const showPagination = 'pagination' in swiper_parameters;
    const showScrollbar = 'scrollbar' in swiper_parameters;

    return html`
      <ha-card .header="${title}">
        <div class="card-content">
          <link rel="stylesheet" href="https://unpkg.com/swiper/css/swiper.min.css" />
          <div class="swiper-container ${classMap({ 'no-header': !title })}">
            <div class="swiper-wrapper ${classMap({ 'swiper-control': showPagination || showScrollbar })}">
              ${this._configEntities!.map(entityConf => this.renderEntity(entityConf))}
            </div>
            ${showNavigation
              ? html`
                  <div class="swiper-button-next"></div>
                  <div class="swiper-button-prev"></div>
                `
              : ''}
            ${showPagination
              ? html`
                  <div class="swiper-pagination"></div>
                `
              : ''}
            ${showScrollbar
              ? html`
                  <div class="swiper-scrollbar"></div>
                `
              : ''}
          </div>
        </div>
      </ha-card>
    `;
  }

  private async _initialLoad(): Promise<Swiper> {
    await this.updateComplete;
    this._loaded = true;

    const haCard = (this.shadowRoot!.querySelector('ha-card') as LitElement) || {};

    const swiper_parameters = this._swiper_parameters || {};

    if ('navigation' in swiper_parameters) {
      if ('nextEl' in swiper_parameters.navigation!) {
        if (swiper_parameters.navigation!.nextEl === null) {
          swiper_parameters.navigation!.nextEl = {};
        }
        swiper_parameters.navigation!.nextEl = haCard.querySelector('.swiper-button-next')!;
      }

      if ('prevEl' in swiper_parameters.navigation!) {
        if (swiper_parameters.navigation!.prevEl === null) {
          swiper_parameters.navigation!.prevEl = {};
        }
        swiper_parameters.navigation!.prevEl = haCard.querySelector('.swiper-button-prev')!;
      }
    }

    if ('pagination' in swiper_parameters) {
      if (swiper_parameters.pagination === null) {
        swiper_parameters.pagination = {};
      }

      if ('el' in swiper_parameters.pagination!) {
        if (swiper_parameters.pagination!.el === null) {
          swiper_parameters.pagination!.el = {};
        }
      }
      swiper_parameters.pagination!.el = haCard.querySelector('.swiper-pagination')!;
    }

    if ('scrollbar' in swiper_parameters) {
      if (swiper_parameters.scrollbar === null) {
        swiper_parameters.scrollbar = {};
      }

      if ('el' in swiper_parameters.scrollbar!) {
        if (swiper_parameters.scrollbar!.el === null) {
          swiper_parameters.scrollbar!.el = {};
        }
      }
      swiper_parameters.scrollbar!.el = haCard.querySelector('.swiper-scrollbar')!;
    }
    this._swiper = new Swiper(haCard.querySelector('.swiper-container'), swiper_parameters);
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    const config = (ev.currentTarget as any).config as SwipeGlanceElementConfig;
    handleAction(this, this.hass!, config, ev.detail.action!);
  }

  private renderEntity(entityConf: SwipeGlanceElementConfig): TemplateResult {
    const stateObj = this.hass!.states[entityConf.entity];

    if (!stateObj) {
      return html`
        <hui-warning-element
          label=${this.hass!.localize('ui.panel.lovelace.warning.entity_not_found', 'entity', entityConf.entity)}
        >
        </hui-warning-element>
      `;
    }

    const name = entityConf.name || computeStateName(stateObj);

    return html`
      <div class="swiper-slide">
        <div
          class="entity"
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
                  .hass=${this.hass}
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
                    ? relativeTime(new Date(stateObj.last_changed), this.hass!.localize)
                    : computeStateDisplay(this.hass!.localize, stateObj, this.hass!.language)}
                </div>
              `
            : ''}
        </div>
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      .swiper-container {
        height: 100%;
        width: 100%;
      }
      .swiper-container.no-header {
        padding-top: 16px;
      }
      .swiper-wrapper.swiper-control {
        padding-bottom: 16px;
      }
      .entity {
        align-items: center;
        box-sizing: border-box;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        margin-bottom: 12px;
        padding: 0 4px;
      }
      .entity:focus {
        background: var(--divider-color);
        border-radius: 14px;
        margin: -4px 0;
        outline: none;
        padding: 4px;
      }
      .entity div {
        overflow: hidden;
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }
      .name {
        min-height: var(--paper-font-body1_-_line-height, 20px);
      }
      state-badge {
        margin: 8px 0;
      }
      .swiper-pagination.swiper-pagination-bullets {
        bottom: 0;
      }
      .swiper-pagination-bullet-active {
        background: var(--primary-color);
      }
      .swiper-pagination-progressbar.swiper-pagination-progressbar-fill {
        background: var(--primary-color);
      }
      .swiper-scrollbar-drag {
        background: var(--primary-color);
        bottom: 0;
      }
      .swiper-button-prev {
        left: 0;
        --swiper-navigation-color: var(--primary-color);
      }
      .swiper-button-next {
        right: 0;
        --swiper-navigation-color: var(--primary-color);
      }
    `;
  }
}
