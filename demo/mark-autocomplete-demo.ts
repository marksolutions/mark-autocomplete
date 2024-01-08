import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../src/mark-autocomplete.js';
import { country_list, country_list_with_code } from './utils.js';

@customElement('mark-autocomplete-demo')
export class MarkAutocompleteDemo extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }
    `,
  ];

  render() {
    return html`
      <h5>Country list</h5>
      <mark-autocomplete .items="${country_list}" highlightFirst></mark-autocomplete>

      <h5>Country with code list</h5>
      <mark-autocomplete .items="${country_list_with_code}" .textExpression="${'name'}"></mark-autocomplete>

      <h5>Movies</h5>
      <mark-autocomplete .textExpression="${'title'}" .itemsProvider="${this._getMovies}"></mark-autocomplete>
    `;
  }

  async _getMovies(query) {
    let resJson;
    try {
      const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=6b773e1f59009e9d5efc06c47c2ccd9c&query=${query}`);
      resJson = await response.json();
      console.log(resJson);
    } catch (e) {
      console.error('_getMovies', e);
    }

    return resJson?.results;
  }
}
