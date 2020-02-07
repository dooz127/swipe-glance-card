import { HassEntity } from 'home-assistant-js-websocket';
import { computeObjectId } from 'custom-card-helpers';

export const computeStateName = (stateObj: HassEntity): string => {
  return stateObj.attributes.friendly_name === undefined
    ? computeObjectId(stateObj.entity_id).replace(/_/g, ' ')
    : stateObj.attributes.friendly_name || '';
};
