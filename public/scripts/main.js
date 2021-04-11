'use strict';

function signIn() {
  // TODO: Complete this function.
}

function signOut() {
  // TODO: Complete this function.
}

// Saves a new message to the Cloud Firestore.
function saveMessage(messageText) {
  // TODO: Complete this function.
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  // TODO: Complete this function.
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {
  // TODO: Complete this function.
  // Create the query to load the last 12 messages and listen for new ones.
  // var query = firebase.firestore()....

  // Start listening to the query.
  query.onSnapshot(function (snapshot) {
    snapshot.docChanges().forEach(function (change) {
      // TODO
      // Call deleteMessage when message is removed.
      // Call displayMessage when message is added.
    });
  });
}

// Initiate firebase auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
  return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
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
var MESSAGE_TEMPLATE =
  '<figure class="media-left">' +
  '<div><p class="image is-64x64"><img class="pic is-rounded"></p></div></figure>' +
  '<div class="media-content"><div class="content">' +
  '<div class="name"></div>' +
  '<p class="text"></p>' +
  '</div></div>';

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

// Delete a Message from the UI.
function deleteMessage(id) {
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

// Displays a Message in the UI.
function displayMessage(id, timestamp, name, text, picUrl, imageUrl) {
  noMessageElement.classList.add('is-hidden');

  var article = document.getElementById(id) || createAndInsertMessage(id, timestamp);

  // profile picture
  if (picUrl) {
    var pic = article.querySelector('.pic');
    pic.src = addSizeToGoogleProfilePic(picUrl);
  }

  var ts = timestamp ? timestamp.toDate().toLocaleString() : ""
  article.querySelector('.name').innerHTML = `<strong>${name}</strong> <small>${ts}</small>`;

  var messageElement = article.querySelector('.text');
  messageElement.textContent = text;
  // Replace all line breaks by <br>.
  messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
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

// Checks that the Firebase SDK has been correctly setup and configured.
function checkSetup() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
      'Make sure you go through the codelab setup instructions and make ' +
      'sure you are running the codelab using `firebase serve`');
  }
}

// Checks that Firebase has been imported.
checkSetup();

// Shortcuts to DOM Elements.
var messageListElement = document.getElementById('messages');
var messageFormElement = document.getElementById('message-form');
var messageInputElement = document.getElementById('message');
var submitButtonElement = document.getElementById('submit');
var imageButtonElement = document.getElementById('submitImage');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var noMessageElement = document.getElementById('no-message');

// Saves message on form submit.
messageFormElement.addEventListener('submit', onMessageFormSubmit);
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

// initialize Firebase
initFirebaseAuth();

// We load currently existing chat messages and listen to new ones.
loadMessages();