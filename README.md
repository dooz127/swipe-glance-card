# :point_up_2: Swipe Glance Card

Add a :point_up_2:Swipe Glance Card to your [Home Assistant](https://www.home-assistant.io/) set-up. May be useful for glance and swipe on mobile devices.

## Install

Install `swipe-glance-card.js` as a `module`

```yaml
resources:
  - url: /local/swipe-glance-card.js
    type: module
```

For more information, see Thomas Loven's [Lovelace-Plugins](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins) guide.

## Swipe Glance Card Configuration Variables

The :point_up_2:Swipe Glance Card has the same configuration variables as the default [Lovelace Glance Card](https://www.home-assistant.io/lovelace/glance/#configuration-variables). In addition, the :point_up_2:Swipe Glance Card also include:

| Name     | Type<sup>[1](#footnotes)</sup> | Description                                                                                                                                                                                                                                                                                                 | Notes                                     |
| -------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| type     | **key:value**                  | A [Lovelace custom element](https://developers.home-assistant.io/docs/en/lovelace_custom_card.html) key-value mapping for :point_up_2:Swipe Glance Card                                                                                                                                                     | Must be set to `custom:swipe-glance-card` |
| entities | **key list**                   | A list of [Home Assistant entity](https://developers.home-assistant.io/docs/en/architecture_entities.html) identifiers in the [backend](https://www.home-assistant.io/docs/backend/) to be presented within a :point_up_2:Swipe Glance Card in the [frontend](https://www.home-assistant.io/docs/frontend/) | Must specify at least one valid entity    |

## Options for Entities

Entities have the same options as the default [Lovelace Glance Card](https://www.home-assistant.io/lovelace/glance/#options-for-entities). In addition, the options for Entities also include:

entity_id | **key** | A [Home Assistant entity's](https://developers.home-assistant.io/docs/en/architecture_entities.html) identifier in the [backend](https://www.home-assistant.io/docs/backend/) to be presented as a :point_up_2:Swipe Glance Card in the [frontend](https://www.home-assistant.io/docs/frontend/) | Must be a valid `entity_id` value
name | string | A label for a specified entity in the :point_up_2:Swipe Glance Card | Default value is the specified entity's `entity_id` or `friendly_name`

## Author

- [Duy Nguyen](https://www.github.com/dooz127)

## Acknowledgments

I relied on these persons' repositories for ideas and best practices:

- [Thomas Loven](https://github.com/thomasloven/)
- [Ian T. Rich](https://github.com/iantrich)
- [Bram Kragten](https://github.com/bramkragten)

## License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for more information.
