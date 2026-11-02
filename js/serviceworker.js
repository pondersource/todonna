/*
 * Todonna App
 * Copyright (C) 2023 yPhil
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const todonnaVersion = '0.1.4';
let deferredPrompt;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

function updateServiceWorker() {
    const updateMessages = document.getElementById('update-messages');
    updateMessages.textContent = 'Checking if a new version is available...';
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update().then(() => {
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({action: 'skipWaiting'});
                    registration.addEventListener('updatefound', () => {
                        updateMessages.textContent = 'New version available';
                    });
                } else {
                    updateMessages.textContent = 'No new version available';
                }
            }).catch(error => {
                updateMessages.textContent = 'Error occurred while updating service worker: ' + error;
                console.log('Error occurred while updating service worker: ', error);
            });
        }).catch(error => {
            updateMessages.textContent = 'Service worker is not ready: ' + error;
            console.log('Service worker is not ready: ', error);
        });
    } else {
        updateMessages.textContent = 'Service worker is not supported by the browser.';
        console.log('Service worker is not supported by the browser.');
    }
}


window.addEventListener('beforeinstallprompt', (e) => {
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update the install UI to notify the user app can be installed
    document.querySelector('#install-button').style.display = 'block';
});

window.addEventListener('appinstalled', (evt) => {
  // App was installed
  document.querySelector('#install-button').textContent = 'Uninstall';
  document.querySelector('#install-button').title = 'Uninstall Todonna';
  document.querySelector('#update-button').disabled = false;
});

document.querySelector('#install-button').addEventListener('click', (e) => {
    // If the app is installed, uninstall it
    if (window.matchMedia('(display-mode: standalone)').matches) {
        window.navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
          }
        });
        e.target.textContent = 'Install';
        e.target.title = 'Install Todonna';
    } else {
        // Show the prompt
        if (!deferredPrompt) {
            document.getElementById('update-messages').textContent = 'Use your browser menu to install Todonna or add it to your home screen.';
            return;
        }
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
        });
    }
});

document.getElementById('update-button').addEventListener('click', updateServiceWorker);

// Check if the app is already installed
if (window.matchMedia('(display-mode: standalone)').matches) {
  document.querySelector('#install-button').textContent = 'Uninstall';
  document.querySelector('#install-button').title = 'Uninstall Todonna';
  document.querySelector('#update-button').disabled = false;
} else {
  document.querySelector('#update-button').disabled = true;
}
