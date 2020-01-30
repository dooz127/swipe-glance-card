import { LitElement, html, customElement, property, CSSResult, TemplateResult, css, PropertyValues } from 'lit-element';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  relativeTime,
  computeStateDisplay,
  applyThemesOnElement,
} from 'custom-card-helpers';
import { classMap } from 'lit-html/directives/class-map';
import { ifDefined } from 'lit-html/directives/if-defined';
import { HassEntity } from 'home-assistant-js-websocket';

import { SwipeGlanceCardConfig, SwipeGlanceElementConfig } from './types';
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
export class SwipeGlanceCard extends LitElement {
  @property() public hass?: HomeAssistant;
  @property() private _config?: SwipeGlanceCardConfig;
  @property() private _configEntities?: SwipeGlanceElementConfig[];

  public getCardSize(): number {
    // TODO: support custom number of rows
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._config!.title ? 2 : 1;
  }

  public setConfig(config: SwipeGlanceCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    this._config = { theme: 'default', ...config };
    const entities = this.processConfigEntities<SwipeGlanceElementConfig>(config.entities);

    for (const entity of entities) {
      if (
        (entity.tap_action && entity.tap_action.action === 'call-service' && !entity.tap_action.service) ||
        (entity.hold_action && entity.hold_action.action === 'call-service' && !entity.hold_action.service)
      ) {
        throw new Error('Missing required property "service" when tap_action or hold_action is call-service');
      }

      const columns = config.columns || Math.min(config.entities.length, 5);
      this.style.setProperty('--glance-column-width', `${100 / columns}%`);

      // TODO: support custom number of rows

      this._configEntities = entities;

      if (this.hass) {
        this.requestUpdate();
      }
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }

    const { title } = this._config;

    return html`
      <ha-card .header="${title}">
        <div class="${classMap({ entities: true, 'no-header': !title })}">
          ${this._configEntities!.map(entityConf => this.renderEntity(entityConf))}
        </div>
      </ha-card>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this.hass) {
      return;
    }

    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    const oldConfig = changedProps.get('_config') as SwipeGlanceCardConfig | undefined;

    if (!oldHass || !oldConfig || oldHass.themes !== this.hass.themes || oldConfig.theme !== this._config.theme) {
      applyThemesOnElement(this, this.hass.themes, this._config.theme);
    }
  }

  private _handleAction(ev: ActionHandlerEvent) {
    const config = (ev.currentTarget as any).config as SwipeGlanceElementConfig;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    handleAction(this, this.hass!, config, ev.detail.action!);
  }

  private processConfigEntities<SwipeGlanceElementConfig>(
    entities: Array<SwipeGlanceElementConfig | string>,
  ): SwipeGlanceElementConfig[] {
    if (!entities || !Array.isArray(entities)) {
      throw new Error('Entities need to be an array');
    }

    return entities.map((entityConf, index) => {
      if (typeof entityConf === 'string') {
        // tslint:disable-next-line:no-object-literal-type-assertion
        entityConf = ({ entity: entityConf } as unknown) as SwipeGlanceElementConfig;
      } else if (typeof entityConf === 'object' && !Array.isArray(entityConf)) {
        if (!entityConf.entity) {
          throw new Error(`Entity object at position ${index} is missing entity field.`);
        }
      } else {
        throw new Error(`Invalid entity specified at position ${index}.`);
      }

      return entityConf;
    });
  }

  private renderEntity(entityConf): TemplateResult {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const stateObj = this.hass!.states[entityConf.entity];

    if (!stateObj) {
      return html`
        <hui-warning-element
          label=${this.hass!.localize('ui.panel.lovelace.warning.entity_not_found', 'entity', entityConf.entity)}
        ></hui-warning-element>
      `;
    }

    const name =
      entityConf.name != undefined
        ? entityConf.name
        : stateObj
        ? stateObj.attributes.friendlyName || stateObj.entity_id
        : '';

    return html`
      <div
        class="entity"
        .config="${entityConf}"
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(entityConf.hold_action),
          hasDoubleTap: hasAction(entityConf.double_tap_action),
        })}
        tabindex=${ifDefined(hasAction(entityConf.tap_action) ? '0' : undefined)}
      >
        ${this._config!.show_name !== false
          ? html`
              <div class="name">
                ${'name' in entityConf ? entityConf.name : this.computeStateName(stateObj)}
              </div>
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
    `;
  }

  static get styles(): CSSResult {
    return css`
      .entities {
        display: flex;
        padding: 0 16px 4px;
        flex-wrap: wrap;
      }
      .entities.no-header {
        padding-top: 16px;
      }
      .entity {
        box-sizing: border-box;
        padding: 0 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        margin-bottom: 12px;
        width: var(--glance-column-width, 20%);
      }
      .entity:focus {
        outline: none;
        background: var(--divider-color);
        border-radius: 14px;
        padding: 4px;
        margin: -4px 0;
      }
      .entity div {
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
    `;
  }
}
