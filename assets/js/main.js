document.addEventListener("DOMContentLoaded", () => {
  // Get the book form element from the DOM
  const bookForm = document.getElementById("bookForm");
  const searchBookForm = document.getElementById("searchBook");
  const bookFormInputs = document.querySelectorAll("#bookForm input");
  const searchFormInput = document.getElementById("searchBookTitle");

  // Key for storing books in localStorage
  const STORAGE_KEY = "books";

  // Event names for custom events
  const SAVED_EVENT = "book-saved";
  const RENDER_EVENT = "book-render";
  const SHOW_EDIT_FORM_EVENT = "show-edit-form";
  const HIDE_EDIT_FORM_EVENT = "hide-edit-form";

  let books = fetchBooksFromStorage();

  /**
   * Event listener for book form
   */
  bookForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const datasetBookId = bookForm.dataset.bookId ? parseInt(bookForm.dataset.bookId, 10) : null;

    if (datasetBookId) {
      saveEditedBook(datasetBookId);
      delete bookForm.dataset.bookId;
    } else {
      addBookToLibrary();
    }
  });

  /**
   * Event listener for book search form
   */
  searchBookForm.addEventListener("submit", (e) => {
    e.preventDefault();
    searchBooks();
  });

  let debounceTimeout;
  searchFormInput.addEventListener("keydown", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(searchBooks, 300);
  });

  /**
   * Function to search books based on title
   */
  function searchBooks() {
    const searchTitle = searchFormInput.value.toLowerCase();
    const bookCards = document.querySelectorAll("#bookList .card");

    if (searchTitle.trim() === "") {
      bookCards.forEach((card) => {
        card.style.display = "block";
      });
      return;
    }

    bookCards.forEach((card) => {
      const cardText = card.firstChild.textContent.toLowerCase();
      if (cardText.includes(searchTitle)) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }

  /**
   * Function to check if localStorage is available
   */
  function isStorageAvailable() {
    if (typeof Storage === undefined) {
      alert("Browser kamu tidak mendukung local storage.");
      return false;
    }
    return true;
  }

  /**
   * Function to add a new book to the library
   */
  const addBookToLibrary = () => {
    const title = document.getElementById("bookFormTitle").value;
    const author = document.getElementById("bookFormAuthor").value;
    const year = parseInt(document.getElementById("bookFormYear").value);
    const isCompleted = document.getElementById("bookFormIsComplete").checked;

    const id = generateUniqueId();
    const newBook = createBookObject(id, title, author, year, isCompleted);
    books.push(newBook);

    document.dispatchEvent(new Event(RENDER_EVENT));

    saveBookToStorage();
    showToast("Buku berhasil ditambahkan ke rak.");
  };

  /**
   * Function to edit a book in the library
   */
  const editBookInLibrary = (bookId) => {
    if (bookId === null) return;

    const bookTarget = findBook(bookId);

    if (bookTarget) {
      document.getElementById("bookFormTitle").value = bookTarget.title;
      document.getElementById("bookFormAuthor").value = bookTarget.author;
      document.getElementById("bookFormYear").value = bookTarget.year;
      document.getElementById("bookFormIsComplete").checked = bookTarget.isCompleted;

      bookForm.dataset.bookId = bookId;

      document.dispatchEvent(new Event(SHOW_EDIT_FORM_EVENT));
    }
  };

  /**
   * Function to save edited book
   */
  const saveEditedBook = (bookId) => {
    if (!bookId) return;
    const book = findBook(bookId);

    if (book) {
      const title = document.getElementById("bookFormTitle").value;
      const author = document.getElementById("bookFormAuthor").value;
      const year = parseInt(document.getElementById("bookFormYear").value);
      const isCompleted = document.getElementById("bookFormIsComplete").checked;

      book.title = title;
      book.author = author;
      book.year = year;
      book.isCompleted = isCompleted;

      document.dispatchEvent(new Event(RENDER_EVENT));
      document.dispatchEvent(new Event(HIDE_EDIT_FORM_EVENT));

      saveBookToStorage();
      showToast("Perubahan buku berhasil disimpan.");
    }
  };

  /**
   * Function to delete books in the library
   */
  const deleteBookInLibrary = (bookId) => {
    if (bookId == null) return;
    const bookIndex = findBookIndex(bookId);
    const deleteConfirm = confirm("Anda yakin ingin menghapus buku ini ?");

    if (bookIndex !== -1 && deleteConfirm) {
      books.splice(bookIndex, 1);
      saveBookToStorage();
      document.dispatchEvent(new Event(RENDER_EVENT));
      document.dispatchEvent(new Event(HIDE_EDIT_FORM_EVENT));
    }
  };

  /**
   * Function change the book to complete
   */
  const changeBookToComplete = (bookId) => {
    if (bookId == null) return;
    const book = findBook(bookId);

    if (book) {
      book.isCompleted = true;
      saveBookToStorage();
      document.dispatchEvent(new Event(RENDER_EVENT));
      document.dispatchEvent(new Event(HIDE_EDIT_FORM_EVENT));
    }
  };

  /**
   * Function change the book to complete
   */
  const changeBookToInomplete = (bookId) => {
    if (bookId == null) return;
    const book = findBook(bookId);

    if (book) {
      book.isCompleted = false;
      saveBookToStorage(book);
      document.dispatchEvent(new Event(RENDER_EVENT));
      document.dispatchEvent(new Event(HIDE_EDIT_FORM_EVENT));
    }
  };

  /**
   * Function to save a book to localStorage
   */
  const saveBookToStorage = () => {
    if (isStorageAvailable()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
      document.dispatchEvent(new Event(SAVED_EVENT));
    }
  };

  /**
   * Function to fetch books data from localStorage
   */
  function fetchBooksFromStorage() {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    return JSON.parse(serializedData) || [];
  }

  /**
   * Function to create a book element in the DOM
   */
  const createBookElement = (book) => {
    // Title
    const title = document.createElement("h3");
    title.setAttribute("data-testid", "bookItemTitle");
    title.textContent = book.title;

    // Author
    const author = document.createElement("p");
    author.setAttribute("data-testid", "bookItemAuthor");
    author.textContent = `Penulis: ${book.author}`;

    // Year
    const year = document.createElement("p");
    year.setAttribute("data-testid", "bookItemYear");
    year.textContent = `Tahun: ${book.year}`;

    // Button Complete & Incomplete
    const btnCompleteIncomplete = book.isCompleted
      ? createButtonElement("btn-complete", "Belum dibaca")
      : createButtonElement("btn-incomplete", "Selesai dibaca");

    btnCompleteIncomplete.setAttribute("data-testid", "bookItemIsCompleteButton");

    if (book.isCompleted) {
      btnCompleteIncomplete.addEventListener("click", () => {
        changeBookToInomplete(book.id);
      });
    } else {
      btnCompleteIncomplete.addEventListener("click", () => {
        changeBookToComplete(book.id);
      });
    }

    // Button Delete
    const btnDelete = createButtonElement("btn-delete", "Hapus Buku");
    btnDelete.setAttribute("data-testid", "bookItemDeleteButton");
    btnDelete.addEventListener("click", () => {
      deleteBookInLibrary(book.id);
    });

    // Button Edit
    const btnEdit = createButtonElement("btn-edit", "Edit Buku");
    btnEdit.setAttribute("data-testid", "bookItemEditButton");
    btnEdit.addEventListener("click", () => {
      editBookInLibrary(book.id);
    });

    // Additional Buttons Wrapper
    const additionalButtonsWrapper = document.createElement("div");
    additionalButtonsWrapper.appendChild(btnDelete);
    additionalButtonsWrapper.appendChild(btnEdit);

    // WrapButton
    const wrapButton = document.createElement("div");
    wrapButton.classList.add("button-wrapper");
    wrapButton.appendChild(btnCompleteIncomplete);
    wrapButton.appendChild(additionalButtonsWrapper);

    // WrapButton
    const bookCard = document.createElement("div");
    bookCard.classList.add("card");
    bookCard.setAttribute("data-bookid", book.id);

    bookCard.appendChild(title);
    bookCard.appendChild(author);
    bookCard.appendChild(year);
    bookCard.appendChild(wrapButton);

    return bookCard;
  };

  /**
   * Function to create button element
   */
  function createButtonElement(className, textContent) {
    const button = document.createElement("button");
    button.classList.add(className);
    button.textContent = textContent;
    return button;
  }

  /**
   * Function to generate unique ID
   */
  function generateUniqueId() {
    return Date.now();
  }

  /**
   * Function to create book object
   */
  function createBookObject(id, title, author, year, isCompleted) {
    return { id, title, author, year, isCompleted };
  }

  /**
   * Function to find book
   */
  function findBook(bookId) {
    return books?.find((book) => book.id === bookId) || null;
  }

  /**
   * Function to find book index
   */
  function findBookIndex(bookId) {
    return books.findIndex((book) => book.id === bookId);
  }

  /**
   * Custom Event Listeners
   */
  document.addEventListener(SAVED_EVENT, () => {
    bookForm.reset();
    document.dispatchEvent(new Event(RENDER_EVENT));
  });

  document.addEventListener(SHOW_EDIT_FORM_EVENT, () => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const addBookButton = document.createElement("button");
    addBookButton.classList.add("btn-cancel");
    addBookButton.textContent = "Cancel";
    addBookButton.addEventListener("click", () => document.dispatchEvent(new Event(HIDE_EDIT_FORM_EVENT)));

    const submitButton = document.getElementById("bookFormSubmit");
    submitButton.classList.add("btn-save-changes");
    submitButton.textContent = "Simpan Perubahan";

    const headerForm = document.querySelector("main section h2");
    headerForm.classList.add("header-edit");
    headerForm.textContent = "Edit Buku";
    headerForm.appendChild(addBookButton);

    setTimeout(() => {
      const titleInput = document.getElementById("bookFormTitle");
      titleInput.focus();
      titleInput.select();
    }, 300);
  });

  document.addEventListener(HIDE_EDIT_FORM_EVENT, () => {
    const headerForm = document.querySelector("main section h2");
    headerForm.classList.remove("header-edit");
    headerForm.textContent = "Tambah Buku Baru";

    const submitButton = document.getElementById("bookFormSubmit");
    submitButton.textContent = "Masukkan Buku Ke Rak";
    submitButton.classList.remove("btn-save-changes");
    submitButton.innerHTML = "Masukkan Buku Ke Rak <span>Belum Selesai Dibaca</span>";

    delete bookForm.dataset.bookId;
    bookForm.reset();
  });

  document.addEventListener(RENDER_EVENT, () => {
    const incompleteBookList = document.getElementById("incompleteBookList");
    const completeBookList = document.getElementById("completeBookList");

    incompleteBookList.innerHTML = "";
    completeBookList.innerHTML = "";

    books.forEach((book) => {
      const bookElement = createBookElement(book);
      if (!book.isCompleted) {
        incompleteBookList.prepend(bookElement);
      } else {
        completeBookList.prepend(bookElement);
      }
    });
  });

  /**
   * Animations
   */
  bookFormInputs.forEach((bookFormInput) => {
    const bookForm = document.getElementById("bookForm");
    bookFormInput.addEventListener("focus", () => {
      bookForm.classList.add("active");
    });
    bookFormInput.addEventListener("blur", () => {
      bookForm.classList.remove("active");
    });
  });

  function showToast(message) {
    const toastContainer = document.getElementById("toastContainer");

    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hide");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  }

  /**
   * Render book elements if localStorage is available
   */
  if (isStorageAvailable()) {
    document.dispatchEvent(new Event(RENDER_EVENT));
  }
});
