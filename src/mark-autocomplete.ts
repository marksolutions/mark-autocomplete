import { LitElement, PropertyValueMap, TemplateResult, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { debounce, filter, get } from 'lodash-es';

type Direction = 'up' | 'down';

const KEY_CODES = {
  LEFT_ARROW: 37,
  RIGHT_ARROW: 39,
  UP_ARROW: 38,
  DOWN_ARROW: 40,
  ENTER: 13,
  ESCAPE: 27,
};

@customElement('mark-autocomplete')
export class MarkAutocomplete<T = unknown> extends LitElement {
  static override styles = [
    css`
      :host {
        display: block;
      }

      .defaultInput {
        width: 100%;
      }

      .suggestions {
        width: 100%;
        position: absolute;
        display: block;
        list-style-type: none;
        margin-top: 4px;
        padding: 0;
        z-index: 10000;
        background: white;
        border-radius: 4px;
        overflow-y: auto;
      }

      .item {
        padding: 0 8px;
      }

      .item div {
        padding: 6px 4px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid silver;
      }

      .item:last-child div {
        padding: 4px;
        border-bottom: none;
      }

      .item:hover {
        background: #eee;
        color: black;
        cursor: pointer;
      }

      .item .item.d-autocomplete {
        line-height: 18px;
        color: #333;
      }

      .item.active {
        background: whitesmoke;
      }

      .suggestions[hidden] {
        display: none;
      }
    `,
  ];

  /**
   * Contains current value.
   */
  @property({ type: String })
  value: string = '';

  /**
   * Property of local data source to as the value property
   */
  @property({ type: String })
  valueExpression: string;

  /**
   * An Item corresponding to the current value.
   */
  @property({ type: Object })
  selectedItem: T;

  /**
   * List of selectable items.
   */
  @property({ type: Array })
  items: T[] = [];

  @property({ type: Array })
  itemsProvider: (query: string) => Promise<T[]>;

  /**
   * `_suggestions` Array with the actual suggestions to display
   */
  @state()
  _items: T[] = [];

  /**
   * Whether suggestions list is opened or not
   */
  @property({ type: Boolean })
  opened: boolean = false;

  /**
   * Max number of suggestions to be displayed without scrolling
   */
  @property({ type: Number })
  maxViewableItems = 7;

  /**
   * Whether or not it will always highlight the first result each time new suggestions are presented.
   */
  @property({ type: Boolean })
  highlightFirst: boolean = false;

  @property({ type: String })
  itemTextProvider: (item: T) => any;

  @state()
  _itemTextProvider: (item: T) => any;

  /**
   * An expression (dot-separated properties) to be applied on Item, to find it's value.
   * When `itemTextProvider` is specified, this is ignored.
   */
  @property({ type: String })
  textExpression: string;

  /**
   * Provides any Block element to represent list items.
   * Integrator listens to the ‘click’ event to know whether the selection is changed or not.
   */
  @property({ type: String })
  renderItem: (item: T, index: number, selected: boolean, activated: boolean, click: (item: T) => void) => TemplateResult;

  /**
   * Indicates the position in the suggestions popup of the currently highlighted element, being `0` the first one,
   * and `this._suggestions.length - 1` the position of the last one.
   */
  @state()
  _currentIndex: number = -1;

  /**
   * This value is used as a base to generate unique individual ids that need to be added to each suggestion for
   * accessibility reasons.
   */
  @state()
  readonly _idItemSeed: string = 'aria-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);

  @state()
  highlightedSuggestion: T;

  _blur = false;
  _mouseEnter = false;

  /**
   * Input element getter
   */
  @query('#defaultInput')
  private contentElement!: HTMLInputElement;

  /**
   * suggestions element getter
   */
  @query('#suggestions')
  private suggestions!: HTMLElement;

  /**
   * Open suggestions.
   */
  open() {
    if (this._items.length) {
      this.opened = true;
    }
  }

  /**
   * Close suggestions.
   */
  close() {
    this.opened = false;
    this._currentIndex = -1;
  }

  /**
   * Debounce the User Interaction events
   */
  override connectedCallback() {
    super.connectedCallback();

    this._computeItemTextProvider();

    this._onUserInteraction = debounce(this._onUserInteraction.bind(this), 100);
  }

  protected override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (_changedProperties.has('textExpression')) {
      this._computeItemTextProvider();
    }

    if (_changedProperties.has('opened') && this.opened && this.contentEditable && this.suggestions) {
      this.suggestions.style.width = this.contentElement.offsetWidth + 'px';
    }
  }

  protected override updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (_changedProperties.has('opened') && this.opened && this._items.length !== 0 && this.highlightFirst) {
      this._currentIndex = 0;
    }
  }

  override render() {
    return html`
      <input
        id="defaultInput"
        class="defaultInput"
        type="text"
        .value="${this.value}"
        autocomplete="off"
        @keydown="${this._handleKeyDown}"
        @keyup=${this._handleKeyUp}
        @focus=${this._handleFocus}
        @blur=${this._handleBlur}
      />
      <div
        id="suggestions"
        class="suggestions"
        ?hidden=${!this.opened}
        @mouseenter=${this._handleItemMouseEnter}
        @mouseleave=${this._handleItemMouseLeave}
      >
        ${this._items.map((item, index) => this._renderItem(item, index))}
      </div>
    `;
  }

  _renderItem(item: T, index: number) {
    const highlighted = this._currentIndex === index;

    if (this.renderItem) {
      return this.renderItem(item, index, false, highlighted, this.autocomplete);
    }

    return html`
      <div
        aria-selected="false"
        class="item ${classMap({ active: highlighted })}"
        id="${this._getSuggestionId(index)}"
        @click=${() => this.autocomplete(item)}
        role="option"
      >
        <div>${this._getItemText(item)}</div>
      </div>
    `;
  }

  /**
   * Autocomplete input with `value`.
   * @param {Object} value
   */
  autocomplete(value: T) {
    this.selectedItem = value;
    this.contentElement.value = this._getItemText(value);
    this._emptyItems();

    this.dispatchEvent(new Event('change'));

    this.close();
  }

  /**
   * Compute label of the item
   * @param {Object | String} item
   * @returns {String} returns string that actually represents in list item
   */
  private _getItemText(item: T): string {
    var text;
    try {
      text = this._itemTextProvider(item);
    } catch (e) {
      text = '';
    }

    if (text) {
      return text;
    }

    if (typeof item === 'string') {
      return item;
    }

    return '';
  }

  /**
   * Empty the list of current suggestions being displayed
   */
  _emptyItems() {
    this._items = [];
  }

  _handleKeyDown(ev: KeyboardEvent) {
    // Prevent up and down from behaving as home and end on some browsers
    if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  _handleKeyUp(event: KeyboardEvent) {
    const keyCode = event.which || event.keyCode;

    switch (keyCode) {
      case KEY_CODES.UP_ARROW:
        event.preventDefault();
        event.stopPropagation();
        this._moveHighlighted('up');
        break;
      case KEY_CODES.DOWN_ARROW:
        event.preventDefault();
        event.stopPropagation();
        this._moveHighlighted('down');
        break;
      case KEY_CODES.ENTER:
        if (this.contentElement.value && !this.opened) {
          this._onUserInteraction();
          return;
        }
        if (this._currentIndex !== -1) {
          this.autocomplete(this._items[this._currentIndex]);
          return;
        }
        break;
      case KEY_CODES.ESCAPE:
        this.close();
        break;
      default:
        this._onUserInteraction();
    }
  }

  _handleFocus() {
    this.dispatchEvent(new CustomEvent('autocomplete-focus', { bubbles: true, composed: true }));
    this._blur = false;
    this._items.length && this.open();
  }

  _handleBlur() {
    this.dispatchEvent(new CustomEvent('autocomplete-blur', { bubbles: true, composed: true }));
    this._blur = true;
    !this._mouseEnter && this.close();
  }

  /**
   * Move the currently highlighted suggestion up or down
   * @param {String} direction direction Possible values are DIRECTION.UP or DIRECTION.DOWN
   * @returns
   */
  _moveHighlighted(direction: Direction) {
    const items = this._items;
    if (items?.length === 0) {
      return;
    }
    if (
      this._currentIndex === -1 ||
      (direction === 'up' && this._currentIndex === 0) ||
      (direction === 'down' && this._currentIndex === this._items.length - 1)
    ) {
      return;
    }
    if (direction === 'up') {
      this._currentIndex--;
    }
    if (direction === 'down') {
      this._currentIndex++;
    }
    const highlightedOption = this._items[this._currentIndex];
    if (items) {
      this._setHighlightedSuggestion(highlightedOption);
    }
  }

  /**
   * Set the currently highlighted suggestion
   * @param {Object} option Data of the highlighted option
   * @param {String} elementId id of the highlighted dom element.
   */
  _setHighlightedSuggestion(option: T) {
    this.highlightedSuggestion = option;
  }

  // Handle mouse change focus to suggestions
  _handleItemMouseEnter() {
    this._mouseEnter = true;
  }

  _handleItemMouseLeave() {
    this._mouseEnter = false;
    this._blur && setTimeout(() => this.close(), 500); // Give user some slack before closing
  }

  /**
   * On User Interaction
   */
  _onUserInteraction() {
    const value = this.contentElement.value;
    this._queryFn(this.items, value);
  }

  async _queryFn(datasource: T[], query: string) {
    let queryResult: T[] = [];

    if (this.itemsProvider) {
      queryResult = await this.itemsProvider(query);
    } else {
      queryResult = this._getQueryResults(datasource, query);
    }

    // TODO - get items based on `itemsProvider` and `items`
    this.suggest(queryResult.slice(0, this.maxViewableItems));
  }

  /**
   * Suggest autocompleting items.
   * @param {Array<String>} suggestions
   */
  suggest(suggestions: T[]) {
    this._items = suggestions || [];
    this._items.length ? this.open() : this.close();
    this.requestUpdate();
  }

  _getQueryResults(items: T[], query: string): T[] {
    if (!query) return [];

    const lowercaseQuery = query.toLowerCase();
    let results = [];

    results = filter(items, item => {
      const itemText = this._getItemText(item).toLowerCase();
      return itemText.includes(lowercaseQuery);
    });

    return results;
  }

  /**
   * Generate a suggestion id for a certain index
   * @param {number} index Position of the element in the suggestions list
   * @returns {string} a unique id based on the _idItemSeed and the position of that element in the suggestions popup
   */
  private _getSuggestionId(index: string | number): string {
    return this._idItemSeed + '-' + index;
  }

  _computeItemTextProvider() {
    if (!this.itemTextProvider && !this.textExpression) {
      this._itemTextProvider = item => item;
      return;
    }

    if (this.textExpression) {
      this._itemTextProvider = item => get(item, `${this.textExpression}`);
      return;
    }

    this._itemTextProvider = this.itemTextProvider;
  }
}

