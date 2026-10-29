import { enableValidation, resetValidation } from "../scripts/validation.js";
import "./index.css";
import Api from "../utils/Api.js";

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "1c072b8d-dbd8-43e7-accf-d89011ad1880",
    "Content-Type": "application/json",
  },
});

const validationConfig = {
  formSelector: ".modal__form:not(#delete-card-modal .modal__form)",
  inputSelector: ".modal__input",
  submitButtonSelector: ".modal__submit-btn",
  inactiveButtonClass: "modal__submit-btn_disabled",
  inputErrorClass: "modal__input_type_error",
  errorClass: "modal__error_visible",
};

// Card elements

const cardsList = document.querySelector(".cards__list");

const cardTemplate = document
  .querySelector("#card-template")
  .content.querySelector(".card");

// Edit profile elements

const editProfileBtn = document.querySelector(".profile__edit-btn");
const editProfileModal = document.querySelector("#edit-profile-modal");
const editProfileCloseBtn = editProfileModal.querySelector(".modal__close-btn");
const editProfileForm = editProfileModal.querySelector(".modal__form");

const editProfileNameInput = editProfileModal.querySelector(
  "#profile-name-input",
);

const editProfileDescriptionInput = editProfileModal.querySelector(
  "#profile-description-input",
);

const editProfileSubmitBtn =
  editProfileForm.querySelector(".modal__submit-btn");

// New post elements

const newPostBtn = document.querySelector(".profile__new-post-btn");
const newPostModal = document.querySelector("#new-post-modal");
const newPostCloseBtn = newPostModal.querySelector(".modal__close-btn");

const addCardFormElement = newPostModal.querySelector(".modal__form");
const addCardSubmitBtn = addCardFormElement.querySelector(".modal__submit-btn");

const linkInput = addCardFormElement.querySelector("#card-image-input");
const nameInput = addCardFormElement.querySelector("#card-caption-input");

// Profile elements

const profileNameEl = document.querySelector(".profile__name");
const profileDescriptionEl = document.querySelector(".profile__description");

const profileAvatar = document.querySelector("#profile-avatar");
const profileAvatarBtn = document.querySelector("#profile-avatar-btn");

// Edit avatar elements

const editAvatarModal = document.querySelector("#edit-avatar-modal");
const editAvatarCloseBtn = editAvatarModal.querySelector(".modal__close-btn");
const editAvatarForm = editAvatarModal.querySelector(".modal__form");
const avatarUrlInput = editAvatarModal.querySelector("#avatar-url-input");
const editAvatarSubmitBtn = editAvatarForm.querySelector(".modal__submit-btn");

// Preview elements

const previewModal = document.querySelector("#preview-modal");
const previewImage = previewModal.querySelector(".modal__preview-image");
const previewCaption = previewModal.querySelector(".modal__preview-caption");
const previewCloseBtn = previewModal.querySelector(".modal__close-btn");

// Delete confirmation elements

const deleteCardModal = document.querySelector("#delete-card-modal");
const deleteCardCloseBtn = deleteCardModal.querySelector(".modal__close-btn");
const deleteCardForm = deleteCardModal.querySelector(".modal__form");
const deleteCardSubmitBtn = deleteCardForm.querySelector(".modal__submit-btn");

let cardToDelete = null;

// Modal functions

function closeModalOnEscape(evt) {
  if (evt.key === "Escape") {
    const openedModal = document.querySelector(".modal_is-opened");

    if (openedModal) {
      closeModal(openedModal);
    }
  }
}

function openModal(modal) {
  modal.classList.add("modal_is-opened");
  document.addEventListener("keydown", closeModalOnEscape);
}

function closeModal(modal) {
  modal.classList.remove("modal_is-opened");
  document.removeEventListener("keydown", closeModalOnEscape);

  if (modal === deleteCardModal) {
    cardToDelete = null;
  }
}

const modals = document.querySelectorAll(".modal");

modals.forEach(function (modal) {
  modal.addEventListener("mousedown", function (evt) {
    if (evt.target === modal) {
      closeModal(modal);
    }
  });
});

// Edit profile using API

function handleEditProfileSubmit(evt) {
  evt.preventDefault();

  const newProfileData = {
    name: editProfileNameInput.value,
    about: editProfileDescriptionInput.value,
  };

  editProfileSubmitBtn.textContent = "Saving...";

  api
    .editUserInfo(newProfileData)
    .then((userData) => {
      profileNameEl.textContent = userData.name;
      profileDescriptionEl.textContent = userData.about;

      closeModal(editProfileModal);
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      editProfileSubmitBtn.textContent = "Save";
    });
}

// Edit avatar using API

function handleEditAvatarSubmit(evt) {
  evt.preventDefault();

  editAvatarSubmitBtn.textContent = "Saving...";
  editAvatarSubmitBtn.disabled = true;

  api
    .editAvatar(avatarUrlInput.value)
    .then((userData) => {
      profileAvatar.src = userData.avatar;

      closeModal(editAvatarModal);
      editAvatarForm.reset();
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      editAvatarSubmitBtn.textContent = "Save";
      editAvatarSubmitBtn.disabled = false;
    });
}

// Add cards using API

function handleAddCardSubmit(evt) {
  evt.preventDefault();

  const newCardData = {
    name: nameInput.value,
    link: linkInput.value,
  };

  addCardSubmitBtn.textContent = "Saving...";

  api
    .addCard(newCardData)
    .then((cardData) => {
      const newCardElement = getCardElement(cardData);
      cardsList.prepend(newCardElement);

      addCardFormElement.reset();

      resetValidation(
        addCardFormElement,
        [linkInput, nameInput],
        addCardSubmitBtn,
        validationConfig,
      );

      closeModal(newPostModal);
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      addCardSubmitBtn.textContent = "Create";
    });
}

// Create card elements

function getCardElement(data) {
  const cardElement = cardTemplate.cloneNode(true);

  const cardImage = cardElement.querySelector(".card__image");
  const cardTitle = cardElement.querySelector(".card__title");
  const likeButton = cardElement.querySelector(".card__like-btn");
  const deleteButton = cardElement.querySelector(".card__delete-btn");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardTitle.textContent = data.name;

  likeButton.classList.toggle("card__like-btn_active", Boolean(data.isLiked));

  likeButton.addEventListener("click", function () {
    const isLiked = likeButton.classList.contains("card__like-btn_active");

    likeButton.disabled = true;

    const request = isLiked ? api.unlikeCard(data._id) : api.likeCard(data._id);

    request
      .then((updatedCard) => {
        likeButton.classList.toggle(
          "card__like-btn_active",
          Boolean(updatedCard.isLiked),
        );
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        likeButton.disabled = false;
      });
  });

  deleteButton.addEventListener("click", function () {
    cardToDelete = {
      id: data._id,
      element: cardElement,
    };

    openModal(deleteCardModal);
  });

  cardImage.addEventListener("click", function () {
    previewImage.src = data.link;
    previewImage.alt = data.name;
    previewCaption.textContent = data.name;

    openModal(previewModal);
  });

  return cardElement;
}

// Delete card using API

function handleDeleteCardSubmit(evt) {
  evt.preventDefault();

  if (!cardToDelete) {
    return;
  }

  const { id, element } = cardToDelete;

  deleteCardSubmitBtn.textContent = "Deleting...";
  deleteCardSubmitBtn.disabled = true;

  api
    .removeCard(id)
    .then(() => {
      element.remove();
      closeModal(deleteCardModal);
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      deleteCardSubmitBtn.textContent = "Yes";
      deleteCardSubmitBtn.disabled = false;
    });
}

// Event listeners

editProfileBtn.addEventListener("click", function () {
  editProfileNameInput.value = profileNameEl.textContent;
  editProfileDescriptionInput.value = profileDescriptionEl.textContent;

  resetValidation(
    editProfileForm,
    [editProfileNameInput, editProfileDescriptionInput],
    editProfileSubmitBtn,
    validationConfig,
  );

  openModal(editProfileModal);
});

editProfileCloseBtn.addEventListener("click", function () {
  closeModal(editProfileModal);
});

newPostBtn.addEventListener("click", function () {
  openModal(newPostModal);
});

newPostCloseBtn.addEventListener("click", function () {
  closeModal(newPostModal);
});

// Avatar event listeners

profileAvatarBtn.addEventListener("click", function () {
  avatarUrlInput.value = "";

  resetValidation(
    editAvatarForm,
    [avatarUrlInput],
    editAvatarSubmitBtn,
    validationConfig,
  );

  openModal(editAvatarModal);
});

editAvatarCloseBtn.addEventListener("click", function () {
  closeModal(editAvatarModal);
});

editAvatarForm.addEventListener("submit", handleEditAvatarSubmit);

// Other modal listeners

previewCloseBtn.addEventListener("click", function () {
  closeModal(previewModal);
});

deleteCardCloseBtn.addEventListener("click", function () {
  closeModal(deleteCardModal);
});

// Form submission listeners

editProfileForm.addEventListener("submit", handleEditProfileSubmit);
addCardFormElement.addEventListener("submit", handleAddCardSubmit);
deleteCardForm.addEventListener("submit", handleDeleteCardSubmit);

// Load profile and cards from API

api
  .getAppInfo()
  .then(([userData, cardsData]) => {
    profileNameEl.textContent = userData.name;
    profileDescriptionEl.textContent = userData.about;
    profileAvatar.src = userData.avatar;

    cardsData.forEach((card) => {
      const cardElement = getCardElement(card);
      cardsList.prepend(cardElement);
    });
  })
  .catch((err) => {
    console.error(err);
  });

// Enable form validation

enableValidation(validationConfig);
