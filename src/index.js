'use strict';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  deleteDoc,
  doc,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage"
import { getFirebaseConfig } from './firebase-config.js';

async function signIn() {
  var provider = new GoogleAuthProvider();
  await signInWithPopup(getAuth(), provider);
}

function signOutUser() {
  signOut(getAuth());
}

// Saves a new message to the Cloud Firestore.
function saveMessage(messageText) {
  try {
    addDoc(collection(getFirestore(), 'messages'), {
      name: getUserName(),
      uid: getUid(),
      text: messageText,
      profilePicUrl: getProfilePicUrl(),
      timestamp: serverTimestamp()
    });
  }
  catch(error) {
    console.error('Error writing new message to Firebase Database', error);
  }
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!getAuth().currentUser;
}

async function deleteMessage(){
  const msg = await doc(collection(getFirestore(), 'messages'), id);
  return deleteDoc(msg).catch(error => {
    console.error('Error deleting a message from Firebase Database', error);
  })
}

async function editMessage(id, messageText) {
  const msg = await doc(collection(getFirestore(), 'messages'), id);
  return updateDoc(msg, {
    text: messageText,
    timestamp: serverTimestamp()
  }).catch(error => {
    console.error('Error editing a message in Firebase Database', error);
  });
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {
  if (state.unsubMessages != null) {
    state.unsubMessages();
  }

  const recentMessagesQuery = query(collection(getFirestore(), 'messages'), orderBy('timestamp', 'desc'), limit(12));
  
  state.unsubMessages = onSnapshot(recentMessagesQuery, function (snapshot) {
    snapshot.docChanges().forEach(function (change) {
      if (change.type === 'removed') {
        removeMessage(change.doc.id);
      } else {
        var message = change.doc.data();
        displayMessage(change.doc.id, message.timestamp, message.name,
          message.uid, message.text, message.profilePicUrl);
      }
    });
  });
}

// Initiate firebase auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  onAuthStateChanged(getAuth(), authStateObserver);
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
  return getAuth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
  return getAuth().currentUser.displayName;
}

// Returns the signed-in user's uid.
function getUid() {
  let currentUser = getAuth().currentUser;
  return currentUser?.uid;
}

// Triggered when the send new message form is submitted.
function onMessageFormSubmit(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (messageInputElement.value && checkSignedInWithMessage()) {
    saveMessage(messageInputElement.value).then(function () {
      // Clear message text field and re-enable the SEND button.
      toggleButton();
    });
  }
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) { // User is signed in!
    var userName = getUserName();
    // Set the user's profile pic and name.
    userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    userNameElement.classList.remove('is-hidden');
    signOutButtonElement.classList.remove('is-hidden');

    // Hide sign-in button.
    signInButtonElement.classList.add('is-hidden');

    // Enable text input.
    messageInputElement.removeAttribute('disabled');
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.classList.add('is-hidden');
    signOutButtonElement.classList.add('is-hidden');

    // Show sign-in button.
    signInButtonElement.classList.remove('is-hidden');

    // Disable text input.
    messageInputElement.setAttribute('disabled', true);

    // Reload all messages on state change.
    // This is a lazy way to re-paint all message elements
    // with user-specific elements.
    loadMessages();
  }
}

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }
  return false;
}

// Template for messages.
const MESSAGE_TEMPLATE =
  '<figure class="media-left">' +
  '<div><p class="image is-64x64"><img class="pic is-rounded"></p></div></figure>' +
  '<div class="media-content"><div class="content">' +
  '<div class="name"></div>' +
  '<p class="text"></p>' +
  '</div></div>';

// Template for edit button on a message.
const EDIT_BUTTON_TEMPLATE =
  '<button class="button is-ghost is-small">Edit</button></div>';

// Template for edit message form.
const MESSAGE_FORM_TEMPLATE =
  '<div class="field"><p class="control">' +
  '<textarea class="textarea"></textarea></p></div>' +
  '<nav class="level"><div class="level-left"><div class="level-item">' +
  '<button class="button is-info">Submit</button>' +
  '</div></div></nav></div>';

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

// Remove a Message from the UI.
function removeMessage(id) {
  var article = document.getElementById(id);
  // If an element for that message exists we delete it.
  if (article) {
    article.parentNode.removeChild(article);
  }
  if (messageListElement.childElementCount == 0) {
    noMessageElement.classList.remove('is-hidden');
  }
}

function createAndInsertMessage(id, timestamp) {
  const article = document.createElement('article');
  article.classList.add('media')
  article.innerHTML = MESSAGE_TEMPLATE;
  article.setAttribute('id', id);

  // If timestamp is null, assume we've gotten a brand new message.
  // https://stackoverflow.com/a/47781432/4816918
  timestamp = timestamp ? timestamp.toMillis() : Date.now();
  article.setAttribute('timestamp', timestamp);

  // figure out where to insert new message
  const existingMessages = messageListElement.children;
  if (existingMessages.length === 0) {
    messageListElement.appendChild(article);
  } else {
    let messageListNode = existingMessages[0];

    while (messageListNode) {
      const messageListNodeTime = messageListNode.getAttribute('timestamp');

      if (!messageListNodeTime) {
        throw new Error(
          `Child ${messageListNode.id} has no 'timestamp' attribute`
        );
      }

      if (messageListNodeTime < timestamp) {
        break;
      }

      messageListNode = messageListNode.nextSibling;
    }

    messageListElement.insertBefore(article, messageListNode);
  }

  return article;
}

function createAndInsertEditButton(article) {
  const editElement = document.createElement('div');
  editElement.classList.add('media-right');
  editElement.innerHTML = EDIT_BUTTON_TEMPLATE;

  article.appendChild(editElement);
  return article.querySelector('.button');
}

function createEditForm(text) {
  const editForm = document.createElement('form');
  editForm.setAttribute('action', '#'); // disable default form action.
  editForm.innerHTML = MESSAGE_FORM_TEMPLATE;

  // Setup input textbox and preload it with existing message.
  const inputElement = editForm.querySelector('textarea');
  inputElement.value = text;

  return editForm;
}

// Displays a Message in the UI.
function displayMessage(id, timestamp, name, uid, text, picUrl) {
  noMessageElement.classList.add('is-hidden');

  const article = document.getElementById(id) || createAndInsertMessage(id, timestamp);

  // profile picture
  if (picUrl) {
    var pic = article.querySelector('.pic');
    pic.src = addSizeToGoogleProfilePic(picUrl);
  }

  const ts = timestamp ? timestamp.toDate().toLocaleString() : ""
  article.querySelector('.name').innerHTML = `<strong>${name}</strong> <small>${ts}</small>`;

  const messageElement = article.querySelector('.text');
  messageElement.textContent = text;
  // Replace all line breaks by <br>.
  messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');

  // Setup edit button if message is from the signed-in user.
  if (uid && uid === getUid()) {
    const editButton = article.querySelector('.button') || createAndInsertEditButton(article);

    // Setup a tiny helper function that removes the editForm from the UI.
    const closeEditForm = (editForm) => {
      messageElement.classList.remove('is-hidden');
      editForm.remove();
    };

    // If edit button already exists, we want to blow away the existing
    // event listeners. We do this by cloning the existing edit button
    // which, in the process of cloning, wipes away the existing event listeners.
    const clonedEditButton = editButton.cloneNode(true);
    clonedEditButton.addEventListener('click', () => {
      // If edit is already in-progress, back out of edit mode.
      if (messageElement.classList.contains('is-hidden')) {
        // Find the edit from. Should be around the message element.
        const editForm = messageElement.parentNode.querySelector('form');
        if (editForm) {
          closeEditForm(editForm);
        }
        return;
      }

      // Setup form for edit message and disable default submit form action.
      const editForm = createEditForm(text);

      // On form submit, edit/delete the message in the database.
      // Change will trigger a re-display from the subscriber
      // we setup in loadMessages().
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputElement = editForm.querySelector('textarea');
        if (inputElement.value) {
          editMessage(id, inputElement.value).then(() => {
            closeEditForm(editForm);
          });
        } else {
          deleteMessage(id);
        }
      });

      // Insert the edit form and hide the message element.
      messageElement.parentNode.insertBefore(editForm, messageElement);
      messageElement.classList.add('is-hidden');
    });
    // Replace old edit button with the cloned one w/ new event listeners.
    editButton.parentNode.replaceChild(clonedEditButton, editButton);
  } else {
    // Message is not from signed-in user. Remove the edit button if it exists.
    const editButton = article.querySelector('.button');
    if (editButton) {
      editButton.remove();
    }
  }
}

// Enables or disables the submit button depending on the values of the input
// fields.
function toggleButton() {
  if (messageInputElement.value) {
    submitButtonElement.removeAttribute('disabled');
  } else {
    submitButtonElement.setAttribute('disabled', 'true');
  }
}

// Shortcuts to DOM Elements.
const messageListElement = document.getElementById('messages');
const messageFormElement = document.getElementById('message-form');
const messageInputElement = document.getElementById('message');
const submitButtonElement = document.getElementById('submit');
const imageButtonElement = document.getElementById('submitImage');
const userNameElement = document.getElementById('user-name');
const signInButtonElement = document.getElementById('sign-in');
const signOutButtonElement = document.getElementById('sign-out');
const noMessageElement = document.getElementById('no-message');
//const editButtonElement = document.getElementById('edit');

// Saves message on form submit.
messageFormElement.addEventListener('submit', onMessageFormSubmit);
signOutButtonElement.addEventListener('click', signOutUser);
signInButtonElement.addEventListener('click', signIn);

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

// Application states
const state = {
  unsubMessages: null,
};

// Initialize Firebase
const firebaseAppConfig = getFirebaseConfig();
const app = initializeApp(firebaseAppConfig);
initFirebaseAuth();

// We load currently existing chat messages and listen to new ones.
loadMessages();
