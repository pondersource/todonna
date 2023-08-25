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
const todonnaVersion = '0.1.0';

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

document.getElementById('update-button').addEventListener('click', updateServiceWorker);
