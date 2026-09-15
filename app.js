import { waitlistConfig } from './config.js';
import { submitWaitlist } from './waitlist-client.js';
const $ = selector => document.querySelector(selector);
const sessionKey = 'forehead-waitlist:joined:v1';
function showConfirmation(focus = true) {
  $('#signup-screen').hidden = true;
  $('#welcome-screen').hidden = false;
  if (focus) $('#welcome-title').focus({ preventScroll: true });
}
$('#waitlist-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const button = $('#join');
  if (button.disabled) return;
  button.disabled = true;
  button.textContent = 'Joining…';
  $('#form-status').textContent = '';
  try {
    await submitWaitlist({ email: $('#email').value, consent: true, website: $('#website').value }, { config: waitlistConfig });
    $('#email').value = '';
    try { sessionStorage.setItem(sessionKey, 'true'); } catch { /* Confirmation works without storage. */ }
    showConfirmation();
  } catch (error) {
    $('#form-status').textContent = error.message || 'Could not connect. Please try again.';
  } finally {
    button.disabled = false;
    button.textContent = 'Join the waitlist';
  }
});
$('#privacy-open').addEventListener('click', () => $('#privacy').showModal());
$('#privacy-close').addEventListener('click', () => $('#privacy').close());
$('#privacy').addEventListener('click', event => {
  if (event.target !== $('#privacy')) return;
  const rect = event.target.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close();
});
try {
  const oldSession = JSON.parse(sessionStorage.getItem('forehead-waitlist:ad:v2') || 'null');
  if (sessionStorage.getItem(sessionKey) === 'true' || oldSession?.joined === true) showConfirmation(false);
} catch { /* Start at signup when storage is unavailable. */ }