import React from 'react';
import PropTypes from 'prop-types';
import {Route} from 'react-router-dom';
import * as BooksAPI from './BooksAPI';
import './App.css';
import Library from './Library';
import SearchPage from './SearchPage';
import shelves from './shelves.json';

class BooksApp extends React.Component {
  static childContextTypes = {
    handleMoveBook: PropTypes.func,
    shelves: PropTypes.object,
  };
  componentDidMount() {
    BooksAPI.getAll().then(books => {
      this.setState({books, booksLoaded: true});
    });
  }
  state = {
    books: [],
    lastRespondedCall: '',
    booksLoaded: false,
    query: '',
    searchedBooks: [],
    searchedQuery: '',
  };
  getChildContext() {
    return {handleMoveBook: this.handleMoveBook, shelves};
  }
  handleMoveBook = (e, book) => {
    const shelf = e.target.value;
    // We move the book in API, we don't need to wait for a response.
    BooksAPI.update(book, shelf);
    // We move the book in the state
    this.setState(state => {
      // we change the shelf in Library
      const index = state.books.findIndex(({id}) => book.id === id);
      const books =
        index === -1
          ? // Book is not yet present in our Library (added from /search)
            [...state.books, {...book, shelf}]
          : // Book is already in library, we change his shelf attribute
            [
              ...state.books.slice(0, index),
              {
                ...state.books[index],
                shelf,
              },
              ...state.books.slice(index + 1),
            ];
      // we change the shelf in searched results
      const searchedBookIndex = state.searchedBooks.findIndex(
        ({id}) => book.id === id,
      );
      const searchedBooks =
        searchedBookIndex === -1
          ? // Book is not present in searched items, we don't change anything
            state.searchedBooks
          : // Book is in searched items, we change his shelf attribute
            [
              ...state.searchedBooks.slice(0, searchedBookIndex),
              {
                ...state.searchedBooks[searchedBookIndex],
                shelf,
              },
              ...state.searchedBooks.slice(searchedBookIndex + 1),
            ];

      return {
        books,
        searchedBooks,
      };
    });
  };
  handleQueryChange = e => {
    const query = e.target.value;
    const time = new Date();
    this.setState({query});
    BooksAPI.search(query, 20).then(books => {
      this.setState(state => {
        // we record the result if we didn't get a more recent response already
        if (time > state.lastRespondedCall) {
          // We reset the shelf field according to books in the library because the search api response is cached: https://github.com/udacity/reactnd-issues/issues/78
          const searchedBooks = (Array.isArray(books)
            ? books
            : []).map(searchedBook => {
            const bookInLibrary = state.books.find(
              ({id}) => id === searchedBook.id,
            );
            const shelf = bookInLibrary ? bookInLibrary.shelf : 'none';
            return {
              ...searchedBook,
              shelf,
            };
          });
          return {
            lastRespondedCall: time,
            searchedBooks,
            searchedQuery: query,
          };
        } else {
          return {};
        }
      });
    });
  };

  render() {
    const {
      books,
      booksLoaded,
      query,
      searchedBooks,
      searchedQuery,
    } = this.state;
    if (booksLoaded)
      return (
        <div className="app">
          <Route
            path="/search"
            render={() =>
              <SearchPage
                books={searchedBooks}
                onQueryChange={this.handleQueryChange}
                query={query}
                searchedQuery={searchedQuery}
              />}
          />
          <Route exact path="/" render={() => <Library books={books} />} />
        </div>
      );
    return <div className="loader">Loading...</div>;
  }
}

export default BooksApp;
