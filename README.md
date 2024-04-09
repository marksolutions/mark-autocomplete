# `<mark-autocomplete>` [![Published on npm](https://img.shields.io/npm/v/@markai/mark-autocomplete.svg)](https://www.npmjs.com/package/@markai/mark-autocomplete)

The `mark-autocomplete` web component provides a customizable autocomplete input field with suggestions.

## Installation

To use `mark-autocomplete` in your project, you can install it via npm:

```bash
npm i @markai/mark-autocomplete
```

## Usage

Import the component in your JavaScript/TypeScript file:

```javascript
import '@markai/mark-autocomplete';
```

Then, you can use it in your HTML:

```html
<mark-autocomplete></mark-autocomplete>
```

## API

### Properties/Attributes

| Name               | Type                   | Default     | Description                                                                                                                                  |
| ------------------ | ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`            | `string`               | `''`        | Contains the current value of the input field.                                                                                               |
| `valueExpression`  | `string`               | `undefined` | Property of the local data source to use as the value property.                                                                              |
| `items`            | `T[]`                  | `[]`        | List of selectable items.                                                                                                                    |
| `selectedItem`     | `T`                    | `undefined` | An item corresponding to the current value.                                                                                                  |
| `itemsProvider`    | `Promise<T[]>`         | `undefined` | Function to provide items based on a query string.                                                                                           |
| `opened`           | `boolean`              | `false`     | Whether the suggestions list is opened or not.                                                                                               |
| `maxViewableItems` | `number`               | `7`         | Maximum number of suggestions to be displayed without scrolling.                                                                             |
| `highlightFirst`   | `boolean`              | `false`     | Whether or not it will always highlight the first result each time new suggestions are presented.                                            |
| `itemTextProvider` | `(item: T) => string`  | `undefined` | Provides value that represents in list item                                                                                                  |
| `textExpression`   | `string`               | `undefined` | An expression (dot-separated properties) to be applied on Item, to find it's value. When `itemTextProvider` is specified, this is ignored.   |
| `renderItem`       | `() => TemplateResult` | `undefined` | Provides any Block element to represent list items. Integrator listens to the ‘click’ event to know whether the selection is changed or not. |

### Events

| Name     | Description                               |
| -------- | ----------------------------------------- |
| `change` | Triggered when the selected item changes. |

### Methods

| Name      | Description                  |
| --------- | ---------------------------- |
| `open()`  | Opens the suggestions list.  |
| `close()` | Closes the suggestions list. |

## License

- This component is provided under the MIT License.
