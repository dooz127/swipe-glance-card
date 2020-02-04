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

import deepcopy from 'deep-clone-simple';

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

  public getCardSize(): number {
    // TODO: support custom number of rows
    return this._config && this._config.title ? 2 : 1;
  }

  public setConfig(config: SwipeGlanceCardConfig): void {
    if (!config || !Array.isArray(config.entities)) {
      throw new Error(localize('common.invalid_configuration'));
    }

    this._config = { theme: 'default', ...deepcopy(config) };

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

    this._swiper_parameters = deepcopy(config.swiper_parameters) || {};

    if (this.hass) {
      this.requestUpdate();
    }
  }

  public connectedCallback(): void {
    super.connectedCallback();
    if (this._config && this.hass && !this._loaded) {
      this._initialLoad();
    } else if (this._swiper) {
      this._swiper.update();
    }
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

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
        <div class="swiper-wrapper ${classMap({ 'no-header': !title })}">
          ${this._configEntities!.map(entityConf => this.renderEntity(entityConf))}
        </div>
      </ha-card>
    `;
  }

  private async _initialLoad(): Promise<Swiper> {
    this._loaded = true;

    await this.updateComplete;

    const columns =
      this._config && this._config.columns
        ? this._config.columns
        : this._configEntities && this._configEntities.length > 0
        ? Math.min(this._configEntities.length, 5)
        : 5;

    this._swiper_parameters = {
      freeModeSticky: true,
      slidesPerView: columns,
      watchOverflow: true,
      ...(this._config ? this._config.swiper_parameters : {}),
    };

    this._swiper = new Swiper(this.shadowRoot!.querySelector('.swiper-container'), this._swiper_parameters);
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
              <div class="state-label">
                ${entityConf.show_last_changed
                  ? relativeTime(new Date(stateObj.last_changed), this.hass!.localize)
                  : computeStateDisplay(this.hass!.localize, stateObj, this.hass!.language)}
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
        --layout-scroll_-_-webkit-overflow-scrolling: touch;
        display: inline-flex;
        flex-wrap: nowrap;
      }
      .swiper-wrapper.no-header {
        padding-top: 16px;
      }
      .swiper-slide {
        align-content: center;
        align-items: center;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        margin-bottom: 12px;
      }
      .swiper-slide:focus {
        background: var(--divider-color);
        border-radius: 14px;
        margin: -4px 0;
        outline: none;
        padding: 4px;
      }
      .swiper-slide div {
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        display: -webkit-box;
        overflow: hidden;
        text-align: center;
        text-overflow: ellipsis;
        padding: 0 10px;
        width: 100%;
      }
      .name {
        margin-top: auto;
        text-transform: capitalize;
      }
      state-badge {
        align-self: center;
      }
      .state-label {
        margin-bottom: auto;
      }
    `;
  }
}
