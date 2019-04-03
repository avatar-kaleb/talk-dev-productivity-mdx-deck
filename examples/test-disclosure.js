import _ from 'lodash';

/**
 * Utils for splitting a column HTML node
 */
export class PageSplittingUtils {
  /**
   * Constructs the page splitting utils for disclosure
   * @param maxHeight
   * @constructor
   */
  constructor({ maxHeight }) {
    this.maxHeight = maxHeight;
    this.MAX_COLUMNS = 3;

    this.currentColumnHeight = 0;
    this.pageIndex = 0;
    this.columnIndex = 0;
    this.pages = this._initializePages();
  }

  /**
   * Add a specific element to the current page and column indexes with id that's used for key
   * @param {Object} element the element to add to current column
   * @param {Number} index the current index of the column to add (used for id)
   */
  _addElementToCurrentColumn(element, index) {
    // eslint-disable-next-lin
    this.pages[this.pageIndex].columns[this.columnIndex].elements.push({
      id: `page-${this.pageIndex}-col-${this.columnIndex}-element-${index}`,
      html: element.outerHTML
    });
  }

  /**
   * Add a new column to the current page and increase the column index
   */
  _addNewColumnToPages() {
    this.columnIndex++;
    this.pages[this.pageIndex].columns.push({
      id: `page-${this.pageIndex}-col-${this.columnIndex}`,
      elements: []
    });
  }

  /**
   * Add a new page and column to the pages array for elements
   */
  _addNewPageAndColumnToPages() {
    this.columnIndex = 0;
    this.pageIndex++;
    this.pages.push({
      id: `page-${this.pageIndex}`,
      columns: [
        {
          id: `page-${this.pageIndex}-col-${this.columnIndex}`,
          elements: []
        }
      ]
    });
  }

  /**
   * When overflow happens while adding elements during page splitting, we must decide if we need
   * a new column or a new page with its first column. This function determines which is necessary
   *
   * When we add either a new column or page with column, we reset column height to 0,
   */
  _addNewColumnOrPageOnOverflow() {
    if (this._canAddNewColumn(this.columnIndex + 1)) {
      this._addNewColumnToPages();
    } else {
      // new page required
      this._addNewPageAndColumnToPages();
    }
    this.currentColumnHeight = 0;
  }

  /**
   * Given an element within a column, compute it's styles and determine the height
   * @param {Node} element - dom node
   * @returns {Number}
   */
  _calculateElementHeight(element) {
    // memo this?
    const elementStyles = window.getComputedStyle(element);
    return (
      parseInt(elementStyles.height) +
      parseInt(elementStyles.marginTop) +
      parseInt(elementStyles.marginBottom)
    );
  }

  /**
   * Determine whether we can add a new column or not based on the max columns property
   * @param {Number} numOfColumns the current number of columns
   */
  _canAddNewColumn(numOfColumns) {
    return numOfColumns < this.MAX_COLUMNS;
  }

  /**
   * Determine if we can fit the current element and next element to the current column by calculating each elements height
   *
   * @param {Node} element current dom node
   * @param {NodeList} elements list of all elements for disclosure
   * @param {Number} index node index
   */
  _canFitCurrentAndNextElement(element, elements, index) {
    // we set nextElementHeight to 0 if current element is last element, bc we know we want to add it to current column
    // this should not happen since we don't end on titles, but let's be defensive :D
    const nextElementHeight =
      index < elements.length ? this._calculateElementHeight(elements[index + 1]) : 0;

    return (
      this.currentColumnHeight + this._calculateElementHeight(element) + nextElementHeight <
      this.maxHeight
    );
  }

  /**
   * Determine if we can add this element to the current column based on its height and the column height being less than
   * the max height allowed per column
   *
   * @param {Node} element Dom node
   */
  _canFitCurrentElement(element) {
    return this.currentColumnHeight + this._calculateElementHeight(element) < this.maxHeight;
  }

  /**
   * Based on the InitialElements element within the pages container, retrieve its child nodes
   * @param {Node} pagesContainer The pages container dom node passed in as a ref from React
   */
  _getElementsFromInitialDiv(pagesContainer) {
    return _.get(pagesContainer.querySelector('#initialElements'), 'childNodes', []);
  }

  /**
   * This function initializes the page splitting pages object to its initial state
   *
   * Top level pages hold columns, which then hold elements. Each has their own id.
   */
  _initializePages() {
    this.pages = [
      {
        id: 'page-0',
        columns: [
          {
            id: 'page-0-column-0',
            elements: []
          }
        ]
      }
    ];
  }

  /**
   * Determines if the current element is a title element or not
   *
   * @param {Node} element Current element from dom
   */
  _isTitleElement(element) {
    return element.className === 'title';
  }

  /**
   * Before starting a new page splitting, reset the column height, page index, and column index to 0.
   */
  _resetIndexesAndColumnHeight() {
    this.currentColumnHeight = 0;
    this.pageIndex = 0;
    this.columnIndex = 0;
  }

  /**
   * This function does the processing for splitting a dom node to create the pages object.
   *
   * For each element in the disclosure, it has a few basic principles:
   * 1. If an element can fit in the current column, and it isnt a title element, then add it
   * 2. If an element can fit in the current column, but it is a title, then first determine if both the current element and
   * the next can fit in the current column - if they both can fit, then add it, else add new column
   * 3. If the current column height has surpassed the max height when potentially adding the current element, add a new column. If the
   * page has the max amount of columns, then add a new page with its first column instead
   *
   * @param {Object} {pagesContainer}
   */
  getPagesColumnsAndElements({ pagesContainer }) {
    this._initializePages();
    this._resetIndexesAndColumnHeight();

    const elements = this._getElementsFromInitialDiv(pagesContainer);
    _.forEach(elements, (element, index) => {
      // note: the if statements here are checking if we need to increase the column or page index based
      // on the principles above, otherwise elements will be pushed to the current element below
      if (this._canFitCurrentElement(element) && this._isTitleElement(element)) {
        if (!this._canFitCurrentAndNextElement(element, elements, index)) {
          this._addNewColumnOrPageOnOverflow();
        }
      } else if (!this._canFitCurrentElement(element)) {
        this._addNewColumnOrPageOnOverflow();
      }

      this.currentColumnHeight += this._calculateElementHeight(element);
      this._addElementToCurrentColumn(element, index);
    });

    return this.pages;
  }
}
